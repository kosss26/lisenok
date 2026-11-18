// Writes assets/voice-lines.json (key -> text) for tools/make-voice.py.
import { writeFileSync } from "node:fs";
import { voiceLines, voiceSpeakers } from "../src/content/voice.ts";

const lines = voiceLines();
writeFileSync("assets/voice-lines.json", JSON.stringify(lines, null, 1) + "\n");
console.log(Object.keys(lines).length, "lines");
writeFileSync("assets/voice-speakers.json", JSON.stringify(voiceSpeakers(), null, 1) + "\n");
