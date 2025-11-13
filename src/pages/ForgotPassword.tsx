import { useEffect, useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";

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
  const [step, setStep] = useState<"entry" | "otp" | "reset" | "success">(
    "entry"
  );
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    if (resendCooldown > 0) {
      t = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [resendCooldown]);

  const maskIdentifier = (id: string) => {
    if (!id) return "";
    if (/@/.test(id)) {
      const [local, domain] = id.split("@");
      const start = local.slice(0, Math.min(2, local.length));
      return `${start}****@${domain}`;
    }
    return id.replace(/.*(\d{4})$/, "****$1");
  };

  const sendOtp = async () => {
    setError("");
    const parsed = identifierSchema.safeParse(identifier);
    if (!parsed.success) {
      const msg =
        parsed.error?.issues?.[0]?.message || "Enter a valid identifier";
      setError(msg);
      return;
    }

    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generated);
    setOtpSentTo(maskIdentifier(identifier));
    setResendCooldown(30);
    // eslint-disable-next-line no-console
    console.info("[demo] OTP for", identifier, "=", generated);
    setSending(false);
    setStep("otp");
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    await new Promise((r) => setTimeout(r, 500));
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generated);
    // eslint-disable-next-line no-console
    console.info("[demo] Resent OTP =", generated);
  };

  const verify = async () => {
    setError("");
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 500));
    if (otpInput.trim() === otp) {
      setStep("reset");
    } else {
      setError("Invalid OTP. Please try again.");
    }
    setVerifying(false);
  };

  const update = async () => {
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setUpdating(true);
    await new Promise((r) => setTimeout(r, 800));
    setUpdating(false);
    setStep("success");
    // After a short delay, redirect to login automatically
    setTimeout(() => navigate(ROUTES.LOGIN), 2000);
  };

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
              Welcome to
              <br />
              Poliarc Services
            </h1>
            <p className="text-xl text-white/80 animate-slide-up delay-200">
              Secure password reset for your account
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Reset your password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Follow the steps to reset your password
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-8 transform hover:shadow-3xl transition-all duration-300">
            {/* Entry */}
            {step === "entry" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Enter your email or phone number and we'll send a one-time
                  code (OTP).
                </p>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or +15551234567"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                />
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={sendOtp}
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "Sending…" : "Send OTP"}
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
                    {otpSentTo}
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
                    onClick={verify}
                    disabled={verifying}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {verifying ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button
                    onClick={resend}
                    disabled={resendCooldown > 0}
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
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  type="password"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                />
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={update}
                    disabled={updating}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? "Updating…" : "Update password"}
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
            © {new Date().getFullYear()} Poliarc Services Pvt Ltd. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
