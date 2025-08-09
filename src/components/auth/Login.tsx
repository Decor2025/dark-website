import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  set,
} from 'firebase/database';
import { Eye, EyeOff } from 'lucide-react';
import uploadGooglePhoto from './helper';

const auth = getAuth();
const db = getDatabase();

const Login = () => {
  const navigate = useNavigate();

  type Step = 'email' | 'login' | 'signup_name' | 'signup_password' | 'verify_email';
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [tempEmailError, setTempEmailError] = useState('');
  const [userExists, setUserExists] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleDisplayName, setGoogleDisplayName] = useState('');

  async function isDisposableEmail(email: string) {
    try {
      const domain = email.split('@')[1];
      const res = await fetch(`https://open.kickbox.com/v1/disposable/${domain}`);
      const data = await res.json();
      return data.disposable;
    } catch {
      return false;
    }
  }

  const checkEmailExists = async (email: string) => {
    const q = query(ref(db, 'users'), orderByChild('email'), equalTo(email.trim().toLowerCase()));
    const snapshot = await get(q);
    return snapshot.exists();
  };

  const saveUserToDB = async (user: FirebaseUser, name: string) => {
    let cloudinaryImageUrl = '';
    try {
      if (user.photoURL) {
        cloudinaryImageUrl = await uploadGooglePhoto(user.photoURL);
      }
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      cloudinaryImageUrl = user.photoURL || '';
    }

    const userData = {
      displayName: name,
      uid: user.uid,
      email: user.email,
      profileImage: cloudinaryImageUrl,
      createdAt: new Date().toISOString(),
    };

    await set(ref(db, `users/${user.uid}`), userData);
  };

  const pollEmailVerification = (user: FirebaseUser) => {
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        setEmailVerified(true);
        clearInterval(interval);
        navigate('/');
      }
    }, 3000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setTempEmailError('');
    setLoading(true);

    if (!email.includes('@')) {
      setEmailError('Please enter a valid email.');
      setLoading(false);
      return;
    }

    const disposable = await isDisposableEmail(email);
    if (disposable) {
      setTempEmailError('Temporary/disposable emails are not allowed.');
      setLoading(false);
      return;
    }

    try {
      const exists = await checkEmailExists(email);
      setUserExists(exists);
      if (exists) setStep('login');
      else setStep('signup_name');
    } catch {
      setEmailError('Failed to check email. Try again.');
    }
    setLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (!auth.currentUser?.emailVerified) {
        setLoginError('Please verify your email before logging in.');
        await signOut(auth);
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignupNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!displayName.trim()) {
      setSignupError('Please enter your name.');
      return;
    }
    setStep('signup_password');
  };

  const handleSignupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (signupPassword.length < 6) {
      setSignupError('Password should be at least 6 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      const newUserCredential = await createUserWithEmailAndPassword(auth, email, signupPassword);
      await sendEmailVerification(newUserCredential.user);
      await saveUserToDB(newUserCredential.user, displayName);
      setVerificationSent(true);
      setStep('verify_email');
      pollEmailVerification(newUserCredential.user);
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setSignupError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setEmail(user.email || '');
      setGoogleUser(user);

      const exists = await checkEmailExists(user.email || '');

      if (exists) {
        navigate('/');
      } else {
        setGoogleDisplayName(user.displayName || '');
        setShowGoogleModal(true);
      }
    } catch (err: any) {
      setSignupError(err.message || 'Google Sign-in failed');
    }
    setLoading(false);
  };

  const handleGoogleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleDisplayName.trim()) {
      setSignupError('Please enter your name.');
      return;
    }
    if (!googleUser) return;
    setSignupError('');
    setLoading(true);

    try {
      await saveUserToDB(googleUser, googleDisplayName);
      setShowGoogleModal(false);
      navigate('/');
    } catch (err: any) {
      setSignupError(err.message || 'Failed to save user data.');
    }
    setLoading(false);
  };

  const handleGoogleModalCancel = async () => {
    if (auth.currentUser) await signOut(auth);
    setShowGoogleModal(false);
    setGoogleUser(null);
    setGoogleDisplayName('');
  };

  // Animate form container fade/slide on step change
  // We'll use Tailwind transition + opacity + translate-y
  // This requires key to remount div on step change for transition

  const VerificationStep = () => (
    <div className="text-center space-y-4">
      <p className="text-lg font-semibold">
        Verification email sent to <strong>{email}</strong>.
      </p>
      <p>Please check your inbox and verify your email.</p>
      {emailVerified ? (
        <p className="text-green-600 font-semibold">Email verified! Redirecting...</p>
      ) : (
        <p className="text-gray-600 italic">Waiting for verification...</p>
      )}
      <button
        className="mt-4 underline text-blue-600"
        onClick={() => {
          setStep('email');
          setEmail('');
          setPassword('');
          setDisplayName('');
          setSignupPassword('');
          setConfirmPassword('');
          setVerificationSent(false);
          setEmailVerified(false);
        }}
      >
        Cancel and start over
      </button>
    </div>
  );

  const GoogleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Confirm Your Name</h2>
        <form onSubmit={handleGoogleModalSubmit} className="space-y-4">
          <input
            type="text"
            value={googleDisplayName}
            onChange={(e) => setGoogleDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            placeholder="Your full name"
            required
            autoFocus
          />
          {signupError && <p className="text-red-600 text-sm">{signupError}</p>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleGoogleModalCancel}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const GoogleSignInButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex justify-center items-center space-x-2 py-3 border rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
    >
      <img
        src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754724780/gm6n2dnvsxtwspjot4p3.png"
        alt="Google"
        className="h-5 w-5"
      />
      <span className="font-medium text-gray-700">Continue with Google</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-block">
          <img
            src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754572073/eold8lngapg8mqff7pti.png"
            alt="Decor Drapes Instyle"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">Decor Drapes Instyle</h1>
          <p className="text-sm text-gray-500 mt-1">Elegant Interiors. Effortlessly.</p>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        {/* Google always visible on top */}
        <GoogleSignInButton />

        {/* Divider with OR */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-400 text-sm select-none">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Form container with fade & slide animation on step change */}
        <div
          key={step} // remount div to retrigger animation on step change
          className="transition-all duration-500 ease-in-out opacity-0 translate-y-4 animate-fade-in"
          style={{ animationFillMode: 'forwards' }}
        >
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
                {tempEmailError && <p className="text-red-600 text-sm mt-1">{tempEmailError}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="text-sm text-gray-700 mb-2">
                Signed in as <strong>{email}</strong>{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline ml-2"
                  onClick={() => {
                    setStep('email');
                    setEmail('');
                    setPassword('');
                    setLoginError('');
                  }}
                >
                  Change
                </button>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute top-10 right-4 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {loginError && <p className="text-red-600 text-sm mt-1">{loginError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {step === 'signup_name' && (
            <form onSubmit={handleSignupNameSubmit} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                />
                {signupError && <p className="text-red-600 text-sm mt-1">{signupError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                Continue
              </button>
            </form>
          )}

          {step === 'signup_password' && (
            <form onSubmit={handleSignupPasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signupPassword"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                {signupError && <p className="text-red-600 text-sm mt-1">{signupError}</p>}
              </div>

              <button
                type="button"
                className="text-gray-500 underline mb-2"
                onClick={() => {
                  setStep('signup_name');
                  setSignupError('');
                }}
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {step === 'verify_email' && <VerificationStep />}
        </div>
      </div>

      {showGoogleModal && <GoogleModal />}
    </div>
  );
};

export default Login;

