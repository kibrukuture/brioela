import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const outputDir = path.join(root, "features/onboarding/temp/generated/section-narration/hume-dynamic-story");

function readEnvValue(contents, key) {
  const line = contents
    .split("\n")
    .find((candidate) => candidate.trim().startsWith(`${key}=`));

  if (!line) return undefined;
  const raw = line.slice(line.indexOf("=") + 1).trim();
  return raw.replace(/^["']|["']$/g, "");
}

const envContents = await readFile(envPath, "utf8");
const apiKey = process.env.HUME_AI_API_KEY ?? readEnvValue(envContents, "HUME_AI_API_KEY");

if (!apiKey) throw new Error("Missing HUME_AI_API_KEY in mobile/.env");

const baseVoice =
  "Warm ancient intimate cinematic narrator. Human, textured, close to the ear. The voice can rise and fall like a real storyteller, but never becomes an ad, trailer, or robotic read.";

const sections = [
  {
    id: "01-memory-taste",
    text: "Before memory had words,\nit had taste.",
    description: "Very low, almost whispered, ancient opening. Slow, grave, intimate.",
    speed: 0.78,
    trailing_silence: 2.2,
  },
  {
    id: "02-recipes-flame",
    text: "Before recipes,\nthere was flame.",
    description: "Warmer now, a small rise of wonder on flame. Still restrained.",
    speed: 0.8,
    trailing_silence: 1.8,
  },
  {
    id: "03-maps-smoke",
    text: "Before maps,\nthere was smoke.",
    description: "Airy and spacious, like watching smoke climb in silence.",
    speed: 0.8,
    trailing_silence: 1.8,
  },
  {
    id: "04-names-hands",
    text: "Before names,\nthere were hands.",
    description: "A little louder and more grounded. Reverent, as if naming something holy.",
    speed: 0.82,
    trailing_silence: 1.6,
  },
  {
    id: "05-hands-work",
    text: "Hands that washed.\nHands that cut.\nHands that stirred\nuntil hunger became home.",
    description: "Rhythmic, tactile, gently building. Land home with warmth and release.",
    speed: 0.84,
    trailing_silence: 3.4,
  },
  {
    id: "06-people-pot",
    text: "A people could live\ninside a pot.",
    description: "Slow and awed. Let this feel huge, cultural, and quiet.",
    speed: 0.76,
    trailing_silence: 3.2,
  },
  {
    id: "07-place-smell",
    text: "A place could rise\nfrom a smell.",
    description: "Soft wonder, more breath, like a room appearing from memory.",
    speed: 0.8,
    trailing_silence: 2.2,
  },
  {
    id: "08-voice-bite",
    text: "A voice could return\nthrough a bite.",
    description: "Quieter, haunted but not sad. Hold back emotion until bite.",
    speed: 0.78,
    trailing_silence: 2.6,
  },
  {
    id: "09-someone-fed-you",
    text: "Someone fed you.",
    description: "Bare, direct, deeply human. Almost no performance. Let silence do the work.",
    speed: 0.72,
    trailing_silence: 3.8,
  },
  {
    id: "10-love-body",
    text: "And before you knew\nwhat love was called,\nyour body knew\nwhat love felt like.",
    description: "Tender and rising. More feeling, but controlled. Resolve on felt like.",
    speed: 0.82,
    trailing_silence: 2.6,
  },
  {
    id: "11-door-room-hands",
    text: "One taste opens the door.\nOne breath brings back the room.\nOne bite returns the hands\nthat held you.",
    description: "Cinematic rise. Three waves, each stronger. Finish intimate and protected.",
    speed: 0.84,
    trailing_silence: 2.6,
  },
  {
    id: "12-brioela-begins",
    text: "Brioela begins where language ends:\nin the taste your body remembers\nbefore your mind does.",
    description: "Final truth. Certain, warm, resolved. Stronger voice, then soften at the end.",
    speed: 0.8,
    trailing_silence: 3.0,
  },
];

await mkdir(outputDir, { recursive: true });

const response = await fetch("https://api.hume.ai/v0/tts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hume-Api-Key": apiKey,
  },
  body: JSON.stringify({
    utterances: sections.map((section, index) => ({
      text: section.text,
      description: index === 0 ? `${baseVoice} ${section.description}` : section.description,
      speed: section.speed,
      trailing_silence: section.trailing_silence,
    })),
    format: { type: "mp3" },
    num_generations: 1,
    split_utterances: false,
    strip_headers: false,
    temperature: 0.78,
  }),
});

if (!response.ok) {
  throw new Error(`Hume dynamic story request failed: ${response.status} ${await response.text()}`);
}

const result = await response.json();
const generation = result.generations?.[0];
if (!generation?.audio) {
  throw new Error("Hume dynamic story request returned no generation audio");
}

const generatedAt = new Date().toISOString().replace(/[:.]/g, "-");
const baseName = `hume-dynamic-story-${generatedAt}`;

await writeFile(path.join(outputDir, `${baseName}.full.mp3`), Buffer.from(generation.audio, "base64"));
await writeFile(
  path.join(outputDir, `${baseName}.metadata.json`),
  JSON.stringify(
    {
      provider: "hume",
      generated_at: new Date().toISOString(),
      baseVoice,
      temperature: 0.78,
      generation_id: generation.generation_id,
      duration: generation.duration,
      request_id: result.request_id,
      sections,
    },
    null,
    2
  )
);

const snippetGroups = generation.snippets ?? [];
for (let index = 0; index < sections.length; index += 1) {
  const group = snippetGroups[index] ?? [];
  const firstSnippet = group[0];
  if (!firstSnippet?.audio) continue;

  const section = sections[index];
  await writeFile(
    path.join(outputDir, `${baseName}.${section.id}.mp3`),
    Buffer.from(firstSnippet.audio, "base64")
  );
}

console.log(`Generated ${path.join(outputDir, `${baseName}.full.mp3`)}`);
console.log(`Generated ${path.join(outputDir, `${baseName}.metadata.json`)}`);
