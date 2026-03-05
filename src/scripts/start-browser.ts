#!/usr/bin/env node

import * as net from "node:net";
import * as fs from "node:fs";
import * as path from "node:path";
import { SessionManager } from "../core/session-manager.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { SkillRunner } from "../core/skill-runner.js";
import { allSkills } from "../skills/index.js";
import { logger } from "../utils/logger.js";

const SOCKET_PATH = process.env["GENSHIN_SOCKET"] ?? "/tmp/genshin-skills.sock";
const STATE_PATH = process.env["GENSHIN_STATE"] ?? "/tmp/genshin-skills.json";

interface RunCommand {
  command: "run";
  skillName: string;
  args: Record<string, unknown>;
}

interface ShutdownCommand {
  command: "shutdown";
}

interface HealthCommand {
  command: "health";
}

type Command = RunCommand | ShutdownCommand | HealthCommand;

// --- Setup ---

const sessionManager = new SessionManager();
const registry = new SkillRegistry();
const runner = new SkillRunner();

registry.registerAll(allSkills);
const ctx = sessionManager.buildContext();

// Clean stale socket file
if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}

// --- Socket server ---

const server = net.createServer((conn) => {
  let buffer = "";

  conn.on("data", (chunk) => {
    buffer += chunk.toString();

    // Protocol: newline-delimited JSON
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.trim()) {
        void handleMessage(conn, line.trim());
      }
    }
  });

  conn.on("error", (err) => {
    logger.warn(`Connection error: ${err.message}`);
  });
});

async function handleMessage(conn: net.Socket, raw: string): Promise<void> {
  let cmd: Command;
  try {
    cmd = JSON.parse(raw) as Command;
  } catch {
    respond(conn, { error: "Invalid JSON" });
    return;
  }

  switch (cmd.command) {
    case "run": {
      const skill = registry.get(cmd.skillName);
      if (!skill) {
        respond(conn, { error: `Unknown skill: ${cmd.skillName}` });
        return;
      }
      const result = await runner.run(skill, cmd.args ?? {}, ctx);
      respond(conn, result);
      return;
    }
    case "health": {
      respond(conn, {
        status: "ok",
        pid: process.pid,
        skills: registry.getAll().length,
        uptime: process.uptime(),
      });
      return;
    }
    case "shutdown": {
      respond(conn, { status: "shutting_down" });
      void shutdown();
      return;
    }
    default: {
      respond(conn, { error: `Unknown command: ${(cmd as { command: string }).command}` });
    }
  }
}

function respond(conn: net.Socket, data: unknown): void {
  try {
    conn.write(JSON.stringify(data) + "\n");
  } catch {
    // connection may have closed
  }
}

// --- State file ---

function writeStateFile(): void {
  const state = {
    pid: process.pid,
    socketPath: path.resolve(SOCKET_PATH),
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function removeStateFile(): void {
  try {
    fs.unlinkSync(STATE_PATH);
  } catch {
    // already gone
  }
}

// --- Lifecycle ---

let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("Shutting down...");
  await sessionManager.closeAll();
  server.close();
  try {
    fs.unlinkSync(SOCKET_PATH);
  } catch {
    // already gone
  }
  removeStateFile();
  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

// --- Start ---

server.listen(SOCKET_PATH, () => {
  writeStateFile();
  logger.info(`Browser server listening on ${SOCKET_PATH}`);
  logger.info(`${registry.getAll().length} skills registered`);
});
