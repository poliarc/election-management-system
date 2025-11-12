import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/authSlice";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const firstName = (user?.name || "User").split(" ")[0];
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=ffffff&color=111827&bold=true`;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <div className="container-page flex items-center justify-between py-3">
        <div className="font-semibold" aria-label="Current level">
          {user?.role || "Dashboard"}
        </div>
        <div className="flex items-center gap-3" ref={menuRef}>
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm hover:shadow transition text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  Hello, <span className="font-medium">{firstName}</span>
                </span>
                <svg
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    open ? "rotate-180" : "rotate-0"
                  }`}
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-9 w-9 rounded-full ring-1 ring-gray-200 object-cover"
                />
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  <NavLink
                    to="/admin/profile"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                        isActive
                          ? "bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                      ].join(" ")
                    }
                  >
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    My Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      setOpen(false);
                      dispatch(logout());
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M9 12h10m0 0-3-3m3 3-3 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
