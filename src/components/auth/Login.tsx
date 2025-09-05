import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  set,
  update,
} from 'firebase/database';
import { Eye, EyeOff } from 'lucide-react';

// Initialize Firebase with your config
import { database as db, auth } from "../../config/firebase";
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  redirect_uri: window.location.origin + '/auth/login'
});

// Add proper error mapping
function firebaseErrorToMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already in use.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No user found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    case 'auth/api-key-not-valid':
      return 'Authentication error. Please check your Firebase configuration.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const Login = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<
    'email' | 'login' | 'forgot_password' | 'signup_name' | 'signup_password' | 'verify_email'
  >('email');

  const [email, setEmail] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [tempEmailError, setTempEmailError] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  const [loading, setLoading] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showGoogleError, setShowGoogleError] = useState('');

  // Check if redirect result exists
  useEffect(() => {
    setLoading(true);
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await handleGoogleUser(result.user);
          navigate("/profile");
        }
      })
      .catch((err) => {
        const errorMessage = firebaseErrorToMessage(err.code || "");
        setShowGoogleError(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Add this useEffect hook near your other useEffect hooks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
      if (user && user.emailVerified) {
        navigate('/profile');
      }
    });

  return () => unsubscribe();
}, [navigate]);

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

  const saveUserToDB = async (user: User, name: string) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      // User already exists, update only lastLogin
      await update(userRef, {
        lastLogin: new Date().toISOString()
      });
    } else {
      // Create new user entry
      const userData = {
        displayName: name || user.displayName || '',
        uid: user.uid,
        email: user.email,
        profileImage: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      await set(userRef, userData);
    }
  };

  const handleGoogleUser = async (user: User) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const updates: any = {
        lastLogin: new Date().toISOString()
      };
      
      // Only update displayName if it's empty and we have a value from Google
      if ((!userData.displayName || userData.displayName === '') && user.displayName) {
        updates.displayName = user.displayName;
      }
      
      // Only update profileImage if it's empty and we have a value from Google
      if ((!userData.profileImage || userData.profileImage === '') && user.photoURL) {
        updates.profileImage = user.photoURL;
      }
      
      // Update only the fields that need updating
      if (Object.keys(updates).length > 1) { // More than just lastLogin
        await update(userRef, updates);
      }
    } else {
      // Create new user entry
      const userData = {
        displayName: user.displayName || '',
        uid: user.uid,
        email: user.email,
        profileImage: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      await set(userRef, userData);
    }
  };

  const pollEmailVerification = (user: User) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          setEmailVerified(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
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
    } catch (error) {
      console.error('Error checking email:', error);
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
      navigate('/profile');
    } catch (err: any) {
      setLoginError(firebaseErrorToMessage(err.code || ''));
    }
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setLoading(true);
    if (!email || !email.includes('@')) {
      setForgotPasswordError('Please enter a valid email.');
      setLoading(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSuccess('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setForgotPasswordError(firebaseErrorToMessage(err.code || ''));
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
      const newUser = await createUserWithEmailAndPassword(auth, email, signupPassword);
      await sendEmailVerification(newUser.user);
      await saveUserToDB(newUser.user, displayName);
      setVerificationSent(true);
      setStep('verify_email');
      pollEmailVerification(newUser.user);
    } catch (err: any) {
      setSignupError(firebaseErrorToMessage(err.code || ''));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleError("");
    setLoading(true);
    try {
      await signInWithRedirect(auth, provider); // <--- Changed from Popup
    } catch (err: any) {
      const errorMessage = firebaseErrorToMessage(err.code || "");
      setShowGoogleError(errorMessage);
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

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
        className="mt-4 text-blue-600"
        onClick={() => navigate('/')}
      >
        Verify later
      </button>
    </div>
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

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

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 md:p-8 lg:p-8 space-y-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex justify-center items-center gap-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          disabled={loading}
        >
          <img
            src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754730922/goypyiizaob8qcc6luzj.png"
            alt="Google"
            className="h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-700">
            {loading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>
        {showGoogleError && (
          <p className="text-red-600 text-center mt-1">{showGoogleError}</p>
        )}

        <div className="flex items-center space-x-4 my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

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
              />
              <button
                type="button"
                className="absolute top-10 right-4 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {loginError && <p className="text-red-600 text-sm mt-1">{loginError}</p>}
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                  setStep('forgot_password');
                }}
              >
                Forgot password?
              </button>
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

        {step === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your email to reset password
              </label>
              <input
                type="email"
                id="forgotEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email"
              />
              {forgotPasswordError && <p className="text-red-600 text-sm mt-1">{forgotPasswordError}</p>}
              {forgotPasswordSuccess && <p className="text-green-600 text-sm mt-1">{forgotPasswordSuccess}</p>}
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-sm text-gray-600 hover:underline"
                onClick={() => {
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                  setPassword('');
                  setLoginError('');
                  setStep('login');
                }}
              >
                Back to login
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending reset email...' : 'Send Reset Email'}
            </button>
          </form>
        )}

        {step === 'signup_name' && (
          <>
            <div className="text-sm text-gray-700 mb-4">
              Creating account for <strong>{email}</strong>{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline ml-2"
                onClick={() => {
                  setStep('email');
                  setEmail('');
                  setDisplayName('');
                  setSignupPassword('');
                  setConfirmPassword('');
                  setSignupError('');
                }}
              >
                Change
              </button>
            </div>

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
          </>
        )}

        {step === 'signup_password' && (
          <>
            <div className="text-sm text-gray-700 mb-4">
              Creating account for <strong>{email}</strong>{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline ml-2"
                onClick={() => {
                  setStep('signup_name');
                  setSignupError('');
                }}
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignupPasswordSubmit} className="space-y-6">
              <div className="relative">
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
                />
                <button
                  type="button"
                  className="absolute top-10 right-4 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
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
          </>
        )}

        {step === 'verify_email' && <VerificationStep />}
      </div>
    </div>
  );
};

export default Login;