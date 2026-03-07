import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppSelector } from "../store/hooks";
import { sendOtp, verifyOtpAndResetPasswordPhone } from "../services/passwordResetApi";

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneNumber = useMemo(() => (user?.contactNo || "").trim(), [user?.contactNo]);

  const maskedPhone = useMemo(() => {
    if (!phoneNumber) return "";
    if (phoneNumber.length <= 4) return phoneNumber;
    return `${"*".repeat(Math.max(0, phoneNumber.length - 4))}${phoneNumber.slice(-4)}`;
  }, [phoneNumber]);

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please enter new password and confirm password");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$_\-*#])[A-Za-z\d@$_\-*#]{8,}$/;

    if (!strongPassword.test(newPassword)) {
      toast.error(
        "Password must be 8+ chars with uppercase, lowercase, number & special char"
      );
      return false;
    }

    return true;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      toast.error("Registered phone number not found");
      return;
    }

    if (!validatePasswords()) return;

    try {
      setLoading(true);
      await sendOtp({ identifier: phoneNumber });
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!otp.trim()) {
      toast.error("Please enter OTP");
      return;
    }

    if (!validatePasswords()) return;

    try {
      setLoading(true);

      await verifyOtpAndResetPasswordPhone({
        identifier: phoneNumber,
        otp: otp.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      toast.success("Password updated successfully");
      navigate(-1);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-6">

      <div className="mx-auto max-w-xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Update Password
            </h1>
            <p className="text-sm text-slate-600">
              Change your account password securely
            </p>
          </div>

          {/* <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Back
          </button> */}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {/* Phone Info */}
          <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            OTP will be sent to:{" "}
            <span className="font-semibold">{maskedPhone || "Not available"}</span>
          </div>

          <div className="space-y-3">

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

                {/* <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button> */}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Send OTP */}
            <button
              onClick={handleSendOtp}
              disabled={loading || !phoneNumber}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Please wait..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>

            {/* OTP Section */}
            {otpSent && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enter OTP
                  </label>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6 digit OTP"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <button
                  onClick={handleVerifyAndUpdate}
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Verify OTP & Update Password"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

