import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const outputDir = path.join(root, "features/onboarding/temp/generated/section-narration/hume");

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

const description =
  "Warm ancient intimate cinematic narrator. Low close sacred voice. Speak as if telling one old truth to one person in darkness. Slow, restrained, human breath, long natural pauses. No advertisement tone. No social media tone. No theatrical trailer. Let silence carry meaning.";

const sections = [
  {
    id: "01-before-memory",
    text: "Before memory had words,\nit had taste.",
    trailing_silence: 2.2,
  },
  {
    id: "02-people-in-pot",
    text: "A people could live\ninside a pot.",
    trailing_silence: 2.8,
  },
  {
    id: "03-someone-fed-you",
    text: "Someone fed you.",
    trailing_silence: 3.2,
  },
  {
    id: "04-brioela-begins",
    text:
      "Brioela begins where language ends:\nin the taste your body remembers\nbefore your mind does.",
    trailing_silence: 2.8,
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
      description: index === 0 ? description : undefined,
      speed: 0.8,
      trailing_silence: section.trailing_silence,
    })),
    format: { type: "mp3" },
    num_generations: 1,
    split_utterances: false,
    strip_headers: false,
    temperature: 0.7,
  }),
});

if (!response.ok) {
  throw new Error(`Hume section request failed: ${response.status} ${await response.text()}`);
}

const result = await response.json();
const generation = result.generations?.[0];
if (!generation?.audio) {
  throw new Error("Hume section request returned no generation audio");
}

const generatedAt = new Date().toISOString().replace(/[:.]/g, "-");
const baseName = `hume-sections-${generatedAt}`;

await writeFile(path.join(outputDir, `${baseName}.full.mp3`), Buffer.from(generation.audio, "base64"));
await writeFile(
  path.join(outputDir, `${baseName}.metadata.json`),
  JSON.stringify(
    {
      provider: "hume",
      generated_at: new Date().toISOString(),
      description,
      speed: 0.8,
      temperature: 0.7,
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
for (const section of sections) {
  console.log(`Section target ${section.id}`);
}
