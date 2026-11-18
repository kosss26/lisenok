// Writes assets/voice-lines.json (key -> text) for tools/make-voice.py.
import { writeFileSync } from "node:fs";
import { voiceLines } from "../src/content/voice.ts";

const lines = voiceLines();
writeFileSync("assets/voice-lines.json", JSON.stringify(lines, null, 1) + "\n");
console.log(Object.keys(lines).length, "lines");
