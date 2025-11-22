import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login, logout } from "../store/authSlice";
import { useLocation, Link } from "react-router-dom";
import RoleRedirect from "../routes/RoleRedirect";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Accept either a valid email or a phone number (+ optional country code, 10-15 digits)
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

const schema = z.object({
  identifier: identifierSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { accessToken, loading, error } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [showPassword, setShowPassword] = useState(false);
  const [previousAccessToken, setPreviousAccessToken] = useState<string | null>(null);

  // Check for force logout parameter
  const searchParams = new URLSearchParams(location.search);
  const forceLogout = searchParams.get('logout') === 'true';

  // Force logout if parameter is present
  if (forceLogout && accessToken) {
    dispatch(logout());
    // Remove the logout parameter from URL
    window.history.replaceState({}, '', '/login');
  }

  // Show success toast when login is successful
  useEffect(() => {
    if (accessToken && accessToken !== previousAccessToken && !forceLogout) {
      toast.success("Login successful");
      setPreviousAccessToken(accessToken);
    }
  }, [accessToken, previousAccessToken, forceLogout]);

  if (accessToken && !forceLogout) {
    // If already logged in, redirect to role dashboard
    return <RoleRedirect />;
  }

  const onSubmit = (data: FormData) => {
    dispatch(login(data));
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
              Secure, fast, and reliable authentication for your organization
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue to your account
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-8 transform hover:shadow-3xl transition-all duration-300">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200 transition-colors">
                  Email or Phone
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16v4H4z" />
                      <path d="M4 12h10v8H4z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    {...register("identifier")}
                    autoComplete="username"
                    placeholder="you@example.com or +15551234567"
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-12 pr-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 hover:border-gray-300"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1 animate-shake">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-12 pr-12 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s: boolean) => !s)}
                    className="absolute inset-y-0 right-3 px-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1 animate-shake">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-shake">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
            </div>
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

// ## Mock Credentials Available:
// - `admin@demo.io / password` → Admin role
// - `state@demo.io / password` → State role
// - `district@demo.io / password` → District role
// - `assembly@demo.io / password` → Assembly role
// - `block@demo.io / password` → Block role
// - `mandal@demo.io / password` → Mandal role
// - `pc@demo.io / password` → PollingCenter role
// - `booth@demo.io / password` → Booth role
// - Any other email → Karyakarta role (default)
