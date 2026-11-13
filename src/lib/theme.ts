/**
 * Colour theme store. The choice lives in localStorage and is applied as
 * `data-theme` on <html>; index.html applies it before first paint.
 * Dark is the default so the app keeps its original look until a user picks light.
 */

export type Theme = "dark" | "light";

export const THEMES: readonly Theme[] = ["dark", "light"];

const STORAGE_KEY = "spendry-theme";
const META_COLOR: Record<Theme, string> = { dark: "#0d1b2f", light: "#f6f4ef" };

const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

function read(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage can be blocked (private mode, embedded frames); fall through.
  }
  return "dark";
}

let current: Theme = read();

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[theme]);
}

function set(theme: Theme, persist: boolean) {
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Not persisted; the choice still applies for this session.
    }
  }
  if (theme === current) {
    apply(theme);
    return;
  }
  current = theme;
  apply(theme);
  listeners.forEach((l) => l());
}

export function setTheme(theme: Theme) {
  set(theme, true);
}

export function getTheme(): Theme {
  return current;
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  apply(current);
  // Keep other open tabs in step.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && isTheme(e.newValue)) set(e.newValue, false);
  });
}
