/** Screen changes: a short crossfade (View Transitions API), a zoom toward the resident when a
 * stop opens. Browsers without the API just switch screens (and get a CSS fade-in). */
const reduced = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export const viewTransitions = () =>
  typeof document !== "undefined" && "startViewTransition" in document && !reduced();

let clear = 0;
/** The next screen change zooms in toward this element (the tapped resident). */
export function zoomFrom(el: Element) {
  if (!viewTransitions()) return;
  const r = el.getBoundingClientRect();
  const root = document.documentElement;
  root.style.setProperty("--vt-x", `${Math.round(r.left + r.width / 2)}px`);
  root.style.setProperty("--vt-y", `${Math.round(r.top + r.height / 2)}px`);
  root.dataset.vt = "zoom";
  window.clearTimeout(clear);
  clear = window.setTimeout(() => delete root.dataset.vt, 900);
}
