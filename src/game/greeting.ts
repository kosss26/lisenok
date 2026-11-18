/** The map greets once per launch (with the child's name when it is set). */
export const greeting = { done: false, afterIntro: false };
export function markGreeted(afterIntro: boolean) {
  greeting.done = false;
  greeting.afterIntro = afterIntro;
}
