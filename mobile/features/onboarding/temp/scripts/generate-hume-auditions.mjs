import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const outputDir = path.join(root, "features/onboarding/temp/generated/hume");

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

const auditionText = `Before memory had words,
it had taste.

Before recipes,
there was flame.

Someone fed you.

Brioela begins where language ends:
in the taste your body remembers
before your mind does.`;

const voicePrompts = [
  "A warm, ancient, intimate cinematic narrator. Low, close, sacred, and unhurried. Speaks like telling an old truth to one person in a quiet room. Breathes naturally between lines. Not theatrical, not a trailer voice, not an ad, not robotic.",
  "A mature, gentle storyteller with a deep warm voice. Ancient and intimate. Speaks slowly, with quiet certainty and natural pauses, like remembering something sacred with the listener.",
  "A soft low cinematic voice, close to the ear, warm and textured. Calm, human, slightly breathy, emotionally restrained, never dramatic, never commercial.",
];

await mkdir(outputDir, { recursive: true });

const generatedAt = new Date().toISOString().replace(/[:.]/g, "-");

for (let index = 0; index < voicePrompts.length; index += 1) {
  const description = voicePrompts[index];
  const response = await fetch("https://api.hume.ai/v0/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hume-Api-Key": apiKey,
    },
    body: JSON.stringify({
      utterances: [
        {
          text: auditionText,
          description,
          speed: 0.86,
          trailing_silence: 0.8,
        },
      ],
      format: { type: "mp3" },
      num_generations: 1,
      split_utterances: true,
      temperature: 0.72,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hume request ${index + 1} failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const generation = result.generations?.[0];
  if (!generation?.audio) {
    throw new Error(`Hume request ${index + 1} returned no audio`);
  }

  const baseName = `hume-audition-${index + 1}-${generatedAt}`;
  await writeFile(path.join(outputDir, `${baseName}.mp3`), Buffer.from(generation.audio, "base64"));
  await writeFile(
    path.join(outputDir, `${baseName}.metadata.json`),
    JSON.stringify(
      {
        provider: "hume",
        generated_at: new Date().toISOString(),
        audition_index: index + 1,
        description,
        text: auditionText,
        duration: generation.duration,
        generation_id: generation.generation_id,
        request_id: result.request_id,
      },
      null,
      2
    )
  );

  console.log(`Generated ${path.join(outputDir, `${baseName}.mp3`)}`);
}
