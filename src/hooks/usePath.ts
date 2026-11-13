import { useSyncExternalStore } from "react";
import { subscribePath } from "@/lib/nav";

/** The current URL pathname, updated on back/forward and on navigate(). */
export function usePath(): string {
  return useSyncExternalStore(
    subscribePath,
    () => window.location.pathname,
    () => "/",
  );
}
