import { ASSET_VERSIONS } from "./asset-versions";

/** "/voice/hi.mp3" → "/voice/hi.mp3?v=1a2b3c4d" (cache-busting for the immutable media cache). */
export function asset(path: string) {
  const folder = path.split("/")[1];
  const v = ASSET_VERSIONS[folder];
  return v ? `${path}?v=${v}` : path;
}
export const art = (name: string) => asset(`/art/${name}.webp`);
export const voiceUrl = (key: string) => asset(`/voice/${key}.mp3`);
export const sfxUrl = (name: string) => asset(`/sfx/${name}.mp3`);
