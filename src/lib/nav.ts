/**
 * Minimal client-side navigation (History API) so any component can move
 * between the app and /docs without prop drilling or a router dependency.
 */
const NAVIGATE_EVENT = "spendry:navigate";

/** Go to an in-app path. `replace` swaps the current history entry (used for redirects). */
export function navigate(to: string, options?: { replace?: boolean }) {
  const url = new URL(to, window.location.origin);
  const next = url.pathname + url.search + url.hash;
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (next !== current) {
    if (options?.replace) window.history.replaceState(null, "", next);
    else window.history.pushState(null, "", next);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (!options?.replace) window.scrollTo(0, 0);
}

/** Subscribe to path changes (back/forward and navigate()). Returns an unsubscribe function. */
export function subscribePath(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAVIGATE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAVIGATE_EVENT, callback);
  };
}

/** True for a plain left click, so modified clicks (new tab, etc.) keep the browser default. */
export function isPlainClick(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
