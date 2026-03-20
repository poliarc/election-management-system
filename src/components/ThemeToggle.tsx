import { useEffect } from "react";

export function ThemeToggle() {
  // Apply stored/system theme preference once on mount
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    window.document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Component intentionally renders nothing
  return null;
}
