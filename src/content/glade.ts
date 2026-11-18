/**
 * Лесная полянка — free play after the forest is done. Every PRACTICE tasks the child finds
 * something on the glade (a word picture, named by its word clip); finds are kept in the album.
 */
export const FINDS = [
  { id: "grib", pic: "mushroom", name: "Гриб" },
  { id: "shishka", pic: "cone", name: "Шишка" },
  { id: "oreh", pic: "nut", name: "Орех" },
  { id: "romashka", pic: "daisy", name: "Ромашка" },
  { id: "babochka", pic: "butterfly", name: "Бабочка" },
  { id: "pero", pic: "feather", name: "Перо" },
  { id: "strekoza", pic: "dragonfly", name: "Стрекоза" },
  { id: "mak", pic: "poppy", name: "Мак" },
  { id: "gnezdo", pic: "nest", name: "Гнездо" },
  { id: "rakushka", pic: "seashell", name: "Ракушка" },
  { id: "zhuk", pic: "beetle", name: "Жук" },
  { id: "podsolnuh", pic: "sunflower", name: "Подсолнух" },
] as const;
export type FindId = (typeof FINDS)[number]["id"];

/** the next find: the first one not found yet, then round and round again */
export function nextFind(have: Record<string, number>) {
  const missing = FINDS.find((f) => !have[f.id]);
  if (missing) return missing;
  const min = Math.min(...FINDS.map((f) => have[f.id] ?? 0));
  return FINDS.find((f) => (have[f.id] ?? 0) === min)!;
}
