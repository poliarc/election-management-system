import { useEffect, useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  resetPassword,
  resetState,
  setError,
  decrementCooldown,
} from "../store/passwordResetSlice";

// identifier validation same as Login
const identifierSchema = z
  .string()
  .min(3, "Identifier required")
  .refine(
    (v) =>
      /@/.test(v)
        ? z.string().email().safeParse(v).success
        : /^\+?\d{10,15}$/.test(v),
    "Enter a valid email address or phone number"
  );

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { step, identifier: storedIdentifier, maskedIdentifier, loading, error, resendCooldown, resetToken } =
    useAppSelector((state) => state.passwordReset);

  const [identifier, setIdentifier] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Reset state when component mounts
    dispatch(resetState());
  }, [dispatch]);

  useEffect(() => {
    let t: number | undefined;
    if (resendCooldown > 0) {
      t = window.setTimeout(() => dispatch(decrementCooldown()), 1000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [resendCooldown, dispatch]);

  const handleSendOtp = async () => {
    dispatch(setError(null));
    const parsed = identifierSchema.safeParse(identifier);
    if (!parsed.success) {
      const msg =
        parsed.error?.issues?.[0]?.message || "Enter a valid identifier";
      dispatch(setError(msg));
      return;
    }

    dispatch(sendOtp(identifier));
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    dispatch(resendOtp(storedIdentifier));
  };

  const handleVerifyOtp = async () => {
    dispatch(setError(null));
    if (!otpInput.trim()) {
      dispatch(setError("Please enter the OTP"));
      return;
    }
    dispatch(verifyOtp({ identifier: storedIdentifier, otp: otpInput }));
  };

  const handleResetPassword = async () => {
    dispatch(setError(null));
    if (newPassword.length < 6) {
      dispatch(setError("Password must be at least 6 characters"));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(setError("Passwords do not match"));
      return;
    }
    dispatch(
      resetPassword({
        identifier: storedIdentifier,
        otp: otpInput,
        newPassword,
        confirmPassword,
        resetToken: resetToken || undefined,
      })
    );
  };

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Animated Image/Illustration Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-ping"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md space-y-6 animate-fade-in">
            {/* Logo/Icon */}
            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 animate-bounce-slow">
              <svg
                className="w-12 h-12"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold leading-tight animate-slide-up">
              Password Recovery
            </h1>
            <p className="text-xl text-white/80 animate-slide-up delay-200">
              Secure and quick password reset for your account
            </p>

            {/* Decorative Elements */}
            <div className="flex gap-4 pt-8 animate-slide-up delay-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                <span className="text-sm">Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm">Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-10 right-10 w-20 h-20 border-4 border-white/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 border-4 border-white/20 rounded-full animate-float delay-500"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Brand */}
          <div className="text-center mb-8">
            {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">P</span>
            </div> */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reset your password
            </h1>

          </div>

          {/* Card */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-8 transform hover:shadow-3xl transition-all duration-300">
            {/* Entry */}
            {step === "entry" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Enter your email id or phone number to get OTP for password reset.
                </p>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or +917551234567"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                />
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Sending…" : "Send OTP"}
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            )}

            {/* OTP */}
            {step === "otp" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  OTP sent to{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {maskedIdentifier}
                  </strong>
                  . Enter it below.
                </p>
                <input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                />
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend OTP"}
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reset */}
            {step === "reset" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Create a new password for your account.
                </p>
                <div className="relative">
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    type={showNewPassword ? "text" : "password"}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 pr-12 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showNewPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 pr-12 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Updating…" : "Update password"}
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success */}
            {step === "success" && (
              <div className="space-y-3 text-center">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  Your password has been reset successfully. Redirecting to
                  login…
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Go to login now
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()}. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
