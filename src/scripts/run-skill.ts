#!/usr/bin/env node

import * as net from "node:net";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "../utils/args.js";

const STATE_PATH = process.env["GENSHIN_STATE"] ?? "/tmp/genshin-skills.json";

interface StateFile {
  pid: number;
  socketPath: string;
  startedAt: string;
}

function readState(): StateFile {
  if (!fs.existsSync(STATE_PATH)) {
    console.error("Browser not running. Start it first:\n  node <SKILL_DIR>/dist/scripts/start-browser.js &");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as StateFile;
}

function sendCommand(socketPath: string, command: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = net.createConnection(socketPath, () => {
      conn.write(JSON.stringify(command) + "\n");
    });

    let buffer = "";
    conn.on("data", (chunk) => {
      buffer += chunk.toString();
      const newlineIdx = buffer.indexOf("\n");
      if (newlineIdx !== -1) {
        const line = buffer.slice(0, newlineIdx);
        conn.end();
        resolve(line);
      }
    });

    conn.on("error", (err) => {
      reject(new Error(`Cannot connect to browser: ${err.message}`));
    });

    conn.setTimeout(180_000, () => {
      conn.destroy();
      reject(new Error("Timed out waiting for response"));
    });
  });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { command: skillName, flags } = parseArgs(argv);

  if (!skillName) {
    console.error("Usage: run-skill <skill_name> [--key value ...]");
    process.exit(1);
  }

  const state = readState();
  const outputFile = flags["outputFile"] as string | undefined;
  // Remove outputFile from flags before sending
  delete flags["outputFile"];

  const raw = await sendCommand(state.socketPath, {
    command: "run",
    skillName,
    args: flags,
  });

  const result = JSON.parse(raw) as {
    content?: string;
    image?: { data: string; mimeType: string };
    success?: boolean;
    error?: string;
  };

  // Write binary data to file if requested
  if (outputFile && result.image?.data) {
    const outPath = path.resolve(outputFile);
    fs.writeFileSync(outPath, Buffer.from(result.image.data, "base64"));
    console.error(`Image written to ${outPath}`);
    // Remove base64 from JSON output to keep stdout clean
    delete result.image;
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.error || result.success === false) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
