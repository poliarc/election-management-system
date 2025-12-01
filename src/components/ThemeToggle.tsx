import { useEffect } from "react";

export function ThemeToggle() {
  // Force light mode only - remove dark class if it exists
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Component no longer renders anything - dark mode is disabled
  return null;
}
