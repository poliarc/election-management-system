import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/authSlice";
import { useLocation } from "react-router-dom";
import RoleRedirect from "../routes/RoleRedirect";
import { useState } from "react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { token, loading, error } = useAppSelector((s) => s.auth);
  useLocation(); // reserved for future redirect back logic
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [showPassword, setShowPassword] = useState(false);

  if (token) {
    // If already logged in, redirect to role dashboard
    return <RoleRedirect />;
  }

  const onSubmit = (data: FormData) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          {/* <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            R
          </div> */}
          <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 backdrop-blur dark:bg-gray-900/70 shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  {/* Mail icon */}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6h16v12H4z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                </span>
                <input
                  type="email"
                  {...register("email")}
                  autoComplete="username"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  {/* Lock icon */}
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
                  placeholder="Your password"
                  className="w-full rounded-lg border border-gray-300/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s: boolean) => !s)}
                  className="absolute inset-y-0 right-2 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 shadow-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Poliarc Services Pvt Ltd. All rights
          reserved.
        </p>
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
