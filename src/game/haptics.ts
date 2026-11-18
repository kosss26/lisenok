/**
 * A light buzz on a right answer or when a piece snaps into place — only where the browser
 * supports it (Android Chrome; iPhone Safari has no vibration API) and never with reduced motion.
 */
export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
