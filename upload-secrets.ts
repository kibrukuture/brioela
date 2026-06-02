import * as dotenv from "dotenv";
import { spawnSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ENV_FILE = "api/.env";
const EXECUTE_MODE = process.argv[2] === "execute";

// Check if .env file exists
if (!existsSync(ENV_FILE)) {
  console.error(`Error: ${ENV_FILE} not found`);
  process.exit(1);
}

console.log(`Reading environment variables from ${ENV_FILE}...`);
console.log("");

// Parse .env file using dotenv
const envConfig = dotenv.config({ path: ENV_FILE });

if (envConfig.error) {
  console.error("Error parsing .env file:", envConfig.error);
  process.exit(1);
}

const parsed = envConfig.parsed;

if (!parsed) {
  console.error("No environment variables found");
  process.exit(1);
}

// Get all keys from parsed config
const keys = Object.keys(parsed);
const COUNT = keys.length;

if (EXECUTE_MODE) {
  console.log("========================================");
  console.log("UPLOADING SECRETS");
  console.log("========================================");
  console.log("");

  let successCount = 0;
  let failCount = 0;

  keys.forEach((key, index) => {
    const value = parsed[key];

    console.log(`[${index + 1}/${COUNT}] Uploading ${key}...`);

    try {
      // Write value to a temporary file to avoid shell escaping issues
      const tmpFile = join(
        tmpdir(),
        `wrangler-secret-${Date.now()}-${Math.random()}.txt`,
      );
      writeFileSync(tmpFile, value, "utf-8");

      // Use the temporary file as input to wrangler
      const result = spawnSync("wrangler", ["secret", "put", key], {
        cwd: "api",
        input: value,
        stdio: ["pipe", "inherit", "inherit"],
        encoding: "utf-8",
      });

      // Clean up temp file
      try {
        unlinkSync(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (result.status === 0) {
        console.log("  ✓ Success");
        successCount++;
      } else {
        console.log("  ✗ Failed");
        failCount++;
      }
    } catch (error) {
      console.log("  ✗ Failed");
      console.error("  Error:", error);
      failCount++;
    }

    console.log("");
  });

  console.log("========================================");
  console.log("UPLOAD COMPLETE");
  console.log("========================================");
  console.log(`Total secrets: ${COUNT}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
} else {
  // Preview mode
  keys.forEach((key, index) => {
    const value = parsed[key];
    const valueLength = value.length;
    const lineCount = value.split("\n").length;

    console.log(`[${index + 1}] Found: ${key}`);
    console.log(`    Value length: ${valueLength} chars`);
    if (lineCount > 1) {
      console.log(`    Lines: ${lineCount} (multiline value)`);
      console.log(`    Preview: ${value.substring(0, 50)}...`);
    }
    console.log(`    Command: wrangler secret put ${key}`);
    console.log("");
  });

  console.log("=========================================");
  console.log("REVIEW THE ABOVE COMMANDS");
  console.log("=========================================");
  console.log(`Total secrets found: ${COUNT}`);
  console.log("");
  console.log(
    "If everything looks correct, run this script with 'execute' argument:",
  );
  console.log("  bun upload-secrets.ts execute");
}

console.log("");
