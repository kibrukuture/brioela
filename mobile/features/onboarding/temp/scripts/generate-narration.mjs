import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const promptPath = path.join(root, 'features/onboarding/temp/prompts/narration.prompt.md');
const outputDir = path.join(root, 'features/onboarding/temp/generated');

function readEnvValue(contents, key) {
  const line = contents
    .split('\n')
    .find((candidate) => candidate.trim().startsWith(`${key}=`));

  if (!line) return undefined;
  const raw = line.slice(line.indexOf('=') + 1).trim();
  return raw.replace(/^['"]|['"]$/g, '');
}

function extractSpokenScript(markdown) {
  const marker = '## Spoken Script';
  const start = markdown.indexOf(marker);
  if (start === -1) throw new Error('Missing Spoken Script section');

  const afterMarker = markdown.slice(start);
  const fenceStart = afterMarker.indexOf('```text');
  if (fenceStart === -1) throw new Error('Missing spoken script text fence');

  const scriptStart = fenceStart + '```text'.length;
  const fenceEnd = afterMarker.indexOf('```', scriptStart);
  if (fenceEnd === -1) throw new Error('Missing spoken script closing fence');

  return afterMarker.slice(scriptStart, fenceEnd).trim();
}

const envContents = await readFile(envPath, 'utf8');
const apiKey = process.env.ELEVENLABS_API_KEY ?? readEnvValue(envContents, 'ELEVENLABS_API_KEY');
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? readEnvValue(envContents, 'ELEVENLABS_VOICE_ID');

if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY in mobile/.env');
if (!voiceId) throw new Error('Missing ELEVENLABS_VOICE_ID in mobile/.env');

const prompt = await readFile(promptPath, 'utf8');
const text = extractSpokenScript(prompt);

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.38,
        similarity_boost: 0.82,
        style: 0.35,
        speed: 0.9,
        use_speaker_boost: true,
      },
    }),
  }
);

if (!response.ok) {
  throw new Error(`ElevenLabs request failed: ${response.status} ${await response.text()}`);
}

const result = await response.json();
const audioBuffer = Buffer.from(result.audio_base64, 'base64');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const baseName = `narration-${timestamp}`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, `${baseName}.mp3`), audioBuffer);
await writeFile(
  path.join(outputDir, `${baseName}.timestamps.json`),
  JSON.stringify(
    {
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
      text,
      alignment: result.alignment,
      normalized_alignment: result.normalized_alignment,
    },
    null,
    2
  )
);
await writeFile(
  path.join(outputDir, `${baseName}.metadata.json`),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      voice_id: voiceId,
      output_format: 'mp3_44100_128',
      settings: {
        stability: 0.38,
        similarity_boost: 0.82,
        style: 0.35,
        speed: 0.9,
        use_speaker_boost: true,
      },
    },
    null,
    2
  )
);

console.log(`Generated ${path.join(outputDir, `${baseName}.mp3`)}`);
console.log(`Generated ${path.join(outputDir, `${baseName}.timestamps.json`)}`);
console.log(`Generated ${path.join(outputDir, `${baseName}.metadata.json`)}`);
