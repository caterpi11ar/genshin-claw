#!/usr/bin/env node

import * as net from "node:net";
import * as fs from "node:fs";

const STATE_PATH = process.env["GENSHIN_STATE"] ?? "/tmp/genshin-skills.json";

interface StateFile {
  pid: number;
  socketPath: string;
  startedAt: string;
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

    conn.setTimeout(5_000, () => {
      conn.destroy();
      reject(new Error("Timed out waiting for shutdown response"));
    });
  });
}

async function main(): Promise<void> {
  if (!fs.existsSync(STATE_PATH)) {
    console.log("Browser is not running.");
    return;
  }

  let state: StateFile;
  try {
    state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as StateFile;
  } catch {
    console.log("Invalid state file. Removing it.");
    fs.unlinkSync(STATE_PATH);
    return;
  }

  try {
    const raw = await sendCommand(state.socketPath, { command: "shutdown" });
    const result = JSON.parse(raw) as { status: string };
    console.log(`Browser shutting down (status: ${result.status})`);
  } catch {
    // Process may already be dead — clean up
    console.log("Browser process not responding. Cleaning up state.");
    try {
      fs.unlinkSync(STATE_PATH);
    } catch {
      // already gone
    }
    try {
      fs.unlinkSync(state.socketPath);
    } catch {
      // already gone
    }
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
