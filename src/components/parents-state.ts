import { useSyncExternalStore } from "react";

let open = false;
const subs = new Set<() => void>();
const set = (v: boolean) => {
  open = v;
  subs.forEach((s) => s());
};
export const openParents = () => set(true);
export const closeParents = () => set(false);
export const useParentsOpen = () =>
  useSyncExternalStore(
    (s) => {
      subs.add(s);
      return () => subs.delete(s);
    },
    () => open,
    () => false,
  );
