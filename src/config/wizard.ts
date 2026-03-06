import { readFile, writeFile } from "node:fs/promises";
import { PATHS, ensureStateDir, initStateDir, readEnvFile } from "./paths.js";
import {
  PROVIDER_PRESETS,
  CUSTOM_PROVIDER_VALUE,
  type ProviderPreset,
} from "./presets.js";

const PLACEHOLDER_KEYS = ["your-api-key-here", "sk-xxx", ""];

export async function isModelConfigured(): Promise<boolean> {
  const env = await readEnvFile();
  const apiKey = env["MIDSCENE_MODEL_API_KEY"] ?? "";
  const baseUrl = env["MIDSCENE_MODEL_BASE_URL"] ?? "";
  const modelName = env["MIDSCENE_MODEL_NAME"] ?? "";

  if (!apiKey || PLACEHOLDER_KEYS.includes(apiKey)) return false;
  if (!baseUrl || !modelName) return false;
  return true;
}

function maskKey(key: string): string {
  if (key.length <= 4) return "****";
  return "****" + key.slice(-4);
}

export async function runSetupWizard(): Promise<void> {
  // Dynamic import to keep startup fast for non-wizard paths
  const { select, input, password, confirm } = await import(
    "@inquirer/prompts"
  );

  try {
    // Welcome banner
    console.log();
    console.log("\x1b[36m  giclaw — AI Agent for Genshin Impact\x1b[0m");
    console.log("\x1b[2m  Let's configure your vision model.\x1b[0m");
    console.log();

    // 1. Select provider
    const providerChoices = [
      ...PROVIDER_PRESETS.map((p) => ({
        name: p.label,
        value: p.value,
      })),
      { name: "Custom / Other", value: CUSTOM_PROVIDER_VALUE },
    ];

    const providerValue = await select({
      message: "Select model provider:",
      choices: providerChoices,
    });

    const preset: ProviderPreset | undefined = PROVIDER_PRESETS.find(
      (p) => p.value === providerValue,
    );

    // 2. Base URL
    const baseUrl = await input({
      message: "Base URL:",
      default: preset?.baseUrl,
      validate: (val: string) => {
        if (!val) return "Base URL is required";
        if (!/^https?:\/\//.test(val)) return "Must start with http:// or https://";
        return true;
      },
    });

    // 3. API Key
    const apiKey = await password({
      message: "API Key:",
      validate: (val: string) => {
        if (!val) return "API key is required";
        if (PLACEHOLDER_KEYS.includes(val)) return "Please enter a real API key";
        return true;
      },
    });

    // 4. Model Name
    const modelName = await input({
      message: "Model name:",
      default: preset?.modelName,
      validate: (val: string) => (val ? true : "Model name is required"),
    });

    // 5. Model Family
    const modelFamily = await input({
      message: "Model family:",
      default: preset?.family,
      validate: (val: string) => (val ? true : "Model family is required"),
    });

    // 6. Summary & confirm
    console.log();
    console.log("\x1b[1mConfiguration summary:\x1b[0m");
    console.log(`  Provider:     ${preset?.label ?? "Custom"}`);
    console.log(`  Base URL:     ${baseUrl}`);
    console.log(`  API Key:      ${maskKey(apiKey)}`);
    console.log(`  Model Name:   ${modelName}`);
    console.log(`  Model Family: ${modelFamily}`);
    console.log();

    const ok = await confirm({ message: "Save this configuration?" });
    if (!ok) {
      console.log("Setup cancelled.");
      return;
    }

    // 7. Write .env — preserve non-model variables
    await ensureStateDir();

    const MODEL_KEYS = new Set([
      "MIDSCENE_MODEL_NAME",
      "MIDSCENE_MODEL_BASE_URL",
      "MIDSCENE_MODEL_API_KEY",
      "MIDSCENE_MODEL_FAMILY",
    ]);

    let existingLines: string[] = [];
    try {
      const raw = await readFile(PATHS.envPath, "utf-8");
      existingLines = raw.split("\n");
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Keep lines that are not model-related key=value pairs
    const preserved = existingLines.filter((line) => {
      const trimmed = line.trim();
      // Keep comments and blank lines that are not in the model section header
      if (!trimmed || trimmed.startsWith("#")) return true;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return true;
      const key = trimmed.slice(0, eqIdx).trim();
      return !MODEL_KEYS.has(key);
    });

    // Remove the "# Vision model configuration" header if present since we'll re-add it
    const filteredPreserved = preserved.filter(
      (line) => line.trim() !== "# Vision model configuration",
    );

    // Build new model block
    const modelBlock = [
      "# Vision model configuration",
      `MIDSCENE_MODEL_NAME=${modelName}`,
      `MIDSCENE_MODEL_BASE_URL=${baseUrl}`,
      `MIDSCENE_MODEL_API_KEY=${apiKey}`,
      `MIDSCENE_MODEL_FAMILY=${modelFamily}`,
    ];

    // Combine: model block first, then preserved lines
    const finalLines = [...modelBlock, "", ...filteredPreserved];

    // Trim trailing blank lines and ensure single trailing newline
    while (finalLines.length > 0 && finalLines[finalLines.length - 1]!.trim() === "") {
      finalLines.pop();
    }
    const envContent = finalLines.join("\n") + "\n";

    await writeFile(PATHS.envPath, envContent, "utf-8");

    // 8. Ensure config.json exists
    await initStateDir();

    // 9. Success message
    console.log();
    console.log("\x1b[32mConfiguration saved to " + PATHS.envPath + "\x1b[0m");
    console.log();
    console.log("Next steps:");
    console.log("  giclaw run --dry-run   Validate configuration");
    console.log("  giclaw run             Run tasks once");
    console.log("  giclaw daemon          Start daemon mode");
    console.log();
  } catch (err) {
    // Handle Ctrl+C from @inquirer/prompts
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ExitPromptError"
    ) {
      console.log("\nSetup cancelled.");
      return;
    }
    throw err;
  }
}
