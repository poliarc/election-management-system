import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { login } from "../../../store/authSlice";
import { useState } from "react";
import toast from "react-hot-toast";
import { Image, Video, FileText } from "lucide-react";
import VersionDisplay from "../../../components/VersionDisplay";

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

interface Props {
  feature?: "Content" | "Poster" | "Video";
}

export default function SocialMediaLoginPage({ feature = "Content" }: Props) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const identifier = watch("identifier");

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(login(data)).unwrap();
      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err?.message || "Invalid credentials");
    }
  };

  const getFeatureIcon = () => {
    switch (feature) {
      case "Poster":
        return <Image className="w-5 h-5 text-white" />;
      case "Video":
        return <Video className="w-5 h-5 text-white" />;
      default:
        return <FileText className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900 my-4">
      {/* Left Side - Animated Image/Illustration Section (Exact Match to Login.tsx) */}
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
              Creative Studio
            </h1>
            <p className="text-xl text-white/80 animate-slide-up delay-200">
              Create, design, and broadcast impactful Posters, Content, and Videos for your campaign.
            </p>

            {/* Decorative Elements */}
            <div className="flex gap-4 pt-8 animate-slide-up delay-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                <span className="text-sm">Poster</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm">Video</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-10 right-10 w-20 h-20 border-4 border-white/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 border-4 border-white/20 rounded-full animate-float delay-500"></div>
      </div>

      {/* Right Side - Login Form (Exact Match to Login.tsx) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Brand & Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sign in to continue to your account
            </p>
          </div>

          {/* Requested Highlighted Message Card */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 text-sm flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/20">
              {getFeatureIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {feature} Creation Access
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                  {feature}
                </span>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
                Please log in to your account to create, edit, and generate Content, Posters, and Videos.
              </p>
            </div>
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
                    placeholder="you@example.com or +917367934567"
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-12 pr-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 hover:border-gray-300 text-sm"
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
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-12 pr-12 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 hover:border-gray-300 text-sm"
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
                disabled={loading || !identifier || !watch("password")}
                className="w-full relative overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none group cursor-pointer"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Continue</span>
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
          </div>

          {/* Version display */}
          <div className="mt-8 text-center">
            <VersionDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}

