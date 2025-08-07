import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
} from 'firebase/database';
import { Eye, EyeOff } from 'lucide-react';

const auth = getAuth();
const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New states for forgot password
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Google Sign-in error:', error);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('email'), equalTo(email.trim().toLowerCase()));
    const snapshot = await get(q);
    return snapshot.exists();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setStep(2);
      } else {
        setEmailError('No account found with this email.');
      }
    } catch {
      setEmailError('Could not check email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password submit handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetMessage('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      setResetError(error.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo & Branding */}
      <div className="text-center mb-8">
        <img src="https://res.cloudinary.com/ds6um53cx/image/upload/v1754572073/eold8lngapg8mqff7pti.png" alt="Decor Drapes Instyle" className="h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Decor Drapes Instyle</h1>
        <p className="text-sm text-gray-500 mt-1">Elegant Interiors. Effortlessly.</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex justify-center items-center gap-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="h-5 w-5"
          />
          <span className="text-sm font-medium text-gray-700">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        {/* Step 1: Email */}
        {step === 1 && !forgotPasswordMode && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
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

        {/* Step 2: Password */}
        {step === 2 && !forgotPasswordMode && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="text-sm text-gray-700">
              Signed in as <span className="font-medium">{email}</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setEmailError('');
                  setPassword('');
                  setLoginError('');
                }}
                className="text-blue-600 hover:underline ml-2"
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
                autoFocus
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-10 right-4 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {loginError && <p className="text-red-600 text-sm mt-1">{loginError}</p>}
            </div>

            {/* Forgot Password link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(true);
                  setResetEmail(email || ''); // prefills with current email if any
                  setResetMessage('');
                  setResetError('');
                }}
                className="text-blue-600 hover:underline text-sm"
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

        {/* Forgot Password Mode */}
        {forgotPasswordMode && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your email to reset password
              </label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {resetError && <p className="text-red-600 text-sm mt-1">{resetError}</p>}
              {resetMessage && <p className="text-green-600 text-sm mt-1">{resetMessage}</p>}
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {resetLoading ? 'Sending reset email...' : 'Send reset email'}
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setResetError('');
                  setResetMessage('');
                }}
                className="text-blue-600 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
