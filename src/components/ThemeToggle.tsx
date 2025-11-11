import { useAppDispatch, useAppSelector } from "../store/hooks";
import { toggleTheme } from "../store/authSlice";
import { useEffect } from "react";

export function ThemeToggle() {
  const theme = useAppSelector((s) => s.auth.theme);
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="rounded-md border px-3 py-2 text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600"
    >
      {theme === "light" ? "Dark Mode" : "Light Mode"}
    </button>
  );
}
