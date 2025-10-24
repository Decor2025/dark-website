import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  signInWithPopup,
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
import { Eye, EyeOff, Check, X } from 'lucide-react';

import { database as db, auth } from "../../config/firebase";
const provider = new GoogleAuthProvider();

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

// Password validation function
const validatePasswordStrength = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const isValid = requirements.minLength && requirements.hasUpperCase && requirements.hasLowerCase;
  const isStrong = Object.values(requirements).every(Boolean);

  return {
    requirements,
    isValid,
    isStrong,
    score: Object.values(requirements).filter(Boolean).length,
  };
};

// Compact password strength indicator
const CompactPasswordStrength = ({ password }: { password: string }) => {
  const validation = validatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">Strength:</span>
        <span className={`text-xs font-medium ${
          validation.isStrong ? 'text-green-600' :
          validation.isValid ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {validation.isStrong ? 'Strong' :
           validation.isValid ? 'Good' :
           'Weak'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            validation.isStrong ? 'bg-green-500 w-full' :
            validation.isValid ? 'bg-yellow-500 w-3/4' :
            'bg-red-500 w-1/3'
          }`}
        />
      </div>
    </div>
  );
};

// Compact password requirements - only shows when requirements aren't met
const CompactPasswordRequirements = ({ password, showAll = false }: { password: string; showAll?: boolean }) => {
  const validation = validatePasswordStrength(password);

  // Don't show anything if password is empty or all requirements are met
  if (!password || (validation.isValid && !showAll)) return null;

  const requiredMet = [
    validation.requirements.minLength,
    validation.requirements.hasUpperCase,
    validation.requirements.hasLowerCase,
  ].every(Boolean);

  // Only show detailed requirements if the basic ones aren't met
  if (!requiredMet || showAll) {
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
        <div className="grid grid-cols-1 gap-1">
          <RequirementItem
            met={validation.requirements.minLength}
            text="8+ characters"
          />
          <RequirementItem
            met={validation.requirements.hasUpperCase}
            text="Uppercase letter"
          />
          <RequirementItem
            met={validation.requirements.hasLowerCase}
            text="Lowercase letter"
          />
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Check size={12} className="mr-1 text-gray-400" />
            Numbers & special chars recommended
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center">
    <div className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center mr-2 ${
      met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
    }`}>
      {met ? <Check size={10} /> : <X size={10} />}
    </div>
    <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-600'}`}>
      {text}
    </span>
  </div>
);

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
  const [showPasswordGuide, setShowPasswordGuide] = useState(false);

  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  const [loading, setLoading] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [showGoogleError, setShowGoogleError] = useState('');

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          // User is logged in and verified, redirect to profile
          navigate('/profile');
        } else {
          // If user is logged in but not verified, keep them on login page
          setAuthChecked(true);
        }
      } else {
        setAuthChecked(true);
      }
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  const saveUserToDB = async (user: User, name: string, createdWith: 'email' | 'gmail') => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      // User already exists, update only lastLogin
      await update(userRef, {
        lastLogin: new Date().toISOString()
      });
    } else {
      // Create new user entry with createdWith field
      const userData = {
        displayName: name || user.displayName || '',
        uid: user.uid,
        email: user.email,
        profileImage: '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        createdWith: createdWith, // Add this field
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
      // Create new user entry with createdWith: 'gmail'
      const userData = {
        displayName: user.displayName || '',
        uid: user.uid,
        email: user.email,
        profileImage: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        createdWith: 'gmail', // Set createdWith for Google users
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

    // Validate password strength
    const validation = validatePasswordStrength(signupPassword);

    if (!validation.isValid) {
      setSignupError('Please meet the minimum password requirements to continue.');
      setShowPasswordGuide(true); // Show guide if requirements aren't met
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
      await saveUserToDB(newUser.user, displayName, 'email'); // createdWith: 'email'
      setVerificationSent(true);
      setStep('verify_email');
      pollEmailVerification(newUser.user);
    } catch (err: any) {
      setSignupError(firebaseErrorToMessage(err.code || ''));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setShowGoogleError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await handleGoogleUser(result.user); // createdWith: 'gmail' is set in handleGoogleUser
      navigate('/profile');
    } catch (err: any) {
      const errorMessage = firebaseErrorToMessage(err.code || '');
      setShowGoogleError(errorMessage);
      console.error('Google sign-in error:', err);
    }
    setLoading(false);
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
                  setShowPasswordGuide(false);
                }}
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignupPasswordSubmit} className="space-y-4">
              <div className="relative">
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signupPassword"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  onFocus={() => setShowPasswordGuide(true)}
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

                {/* Compact strength indicator - always shows when typing */}
                <CompactPasswordStrength password={signupPassword} />
              </div>

              {/* Compact requirements - only shows when focused or requirements not met */}
              <CompactPasswordRequirements
                password={signupPassword}
                showAll={showPasswordGuide || signupError.includes('requirements')}
              />

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
              </div>

              {signupError && <p className="text-red-600 text-sm mt-1">{signupError}</p>}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="text-gray-500 underline"
                  onClick={() => {
                    setStep('signup_name');
                    setSignupError('');
                    setShowPasswordGuide(false);
                  }}
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'verify_email' && <VerificationStep />}
      </div>
    </div>
  );
};

export default Login;
