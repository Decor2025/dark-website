import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getAuth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

export default function ResetPassword() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [emailSent, setEmailSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setVerifiedEmail(email);
          setError("");
        })
        .catch(() => {
          setError("Invalid or expired password reset link.");
        });
    } else {
      setOobCode(null);
      setVerifiedEmail(null);
      setError("");
    }
  }, [searchParams, auth]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/reset-password",
        handleCodeInApp: true,
      });
      setMessage("Password reset email sent! Please check your inbox.");
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!oobCode) {
      setError("Invalid password reset code.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Password reset successful! You can now login with your new password.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-normal mb-6 text-center text-gray-900">
          Reset Password
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 font-medium">{error}</p>
        )}

        {oobCode && verifiedEmail ? (
          <>
            <p className="mb-6 text-center text-gray-700 text-base">
              Reset password for{" "}
              <strong className="text-blue-600">{verifiedEmail}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-gray-700 font-normal text-sm"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-1 text-gray-700 font-normal text-sm"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <p className="text-xs text-gray-600 mt-1 mb-3 leading-tight">
                Your password must be at least 6 characters and include a mix
                of letters, numbers, and special characters for better security.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4 text-center text-gray-700 text-base">
              Forgot your password? Enter your email below to receive a reset
              link.
            </p>
            {!emailSent ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1 text-gray-700 font-normal text-sm"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <p className="text-center text-green-600 font-medium text-sm">
                Password reset email sent! Please check your inbox.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
