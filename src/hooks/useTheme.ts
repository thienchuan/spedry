import { useCallback, useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeTheme } from "@/lib/theme";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme);
  const toggle = useCallback(() => setTheme(getTheme() === "dark" ? "light" : "dark"), []);
  return { theme, setTheme: setTheme, toggle };
}
