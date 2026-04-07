"use client";

import { useState } from "react";

type Theme = "dark" | "light";

const storageKey = "dripfi-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined" && document.documentElement.dataset.theme === "light") {
      return "light";
    }

    return "dark";
  });

  function updateTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {}
  }

  return (
    <div className="theme-toggle">
      <button
        type="button"
        onClick={() => updateTheme("dark")}
        className={`theme-toggle-option ${theme === "dark" ? "theme-toggle-option-active" : ""}`}
        aria-pressed={theme === "dark"}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => updateTheme("light")}
        className={`theme-toggle-option ${theme === "light" ? "theme-toggle-option-active" : ""}`}
        aria-pressed={theme === "light"}
      >
        Light
      </button>
    </div>
  );
}
