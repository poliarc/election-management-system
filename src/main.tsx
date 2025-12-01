import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./index.css";
import App from "./App.tsx";

// Force light mode only - remove dark class and set light theme
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");
document.documentElement.style.colorScheme = "light";
localStorage.setItem("theme", "light");

// Continuously monitor and prevent dark mode from being applied
const enforceLightMode = () => {
  if (document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.remove("dark");
  }
  if (!document.documentElement.classList.contains("light")) {
    document.documentElement.classList.add("light");
  }
  if (document.documentElement.style.colorScheme !== "light") {
    document.documentElement.style.colorScheme = "light";
  }
};

// Run enforcement immediately and on any DOM changes
enforceLightMode();
const observer = new MutationObserver(enforceLightMode);
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class", "style"],
});

// Also check periodically as a fallback
setInterval(enforceLightMode, 100);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
