#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://localhost:3000";

function printHelp() {
  console.log(`ManDev local agent CLI

Usage:
  mandev track [options]

Options:
  --base-url <url>   ManDev base URL (default: ${DEFAULT_BASE_URL})
  --token <token>    Agent token (fallback: MANDEV_AGENT_TOKEN)
  --cwd <path>       Working directory (default: current directory)
  --note <text>      Optional snapshot note
  --json             Print raw JSON response
  --help             Show this help

Examples:
  mandev track
  mandev track --note "Working on login redirect fix"
  MANDEV_AGENT_TOKEN=dev-token mandev track
`);
}

export function parseMandevArgv(argv) {
  const args = [...argv];
  const options = {
    command: null,
    baseUrl: DEFAULT_BASE_URL,
    token: process.env.MANDEV_AGENT_TOKEN?.trim() || null,
    cwd: process.cwd(),
    note: null,
    json: false,
    help: false,
  };

  if (args.length === 0) {
    options.help = true;
    return options;
  }

  options.command = args.shift() ?? null;

  while (args.length > 0) {
    const current = args.shift();
    if (!current) {
      continue;
    }

    if (current === "--help" || current === "-h") {
      options.help = true;
      continue;
    }

    if (current === "--json") {
      options.json = true;
      continue;
    }

    if (current === "--base-url") {
      options.baseUrl = args.shift() ?? options.baseUrl;
      continue;
    }

    if (current === "--token") {
      options.token = args.shift() ?? null;
      continue;
    }

    if (current === "--cwd") {
      options.cwd = args.shift() ?? options.cwd;
      continue;
    }

    if (current === "--note") {
      options.note = args.shift() ?? null;
      continue;
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return options;
}

function formatSuccess(payload) {
  const projectLabel = `${payload.project.name} / ${payload.project.slug}`;
  const branch = payload.snapshot.branch ?? "unknown";
  const commit = payload.snapshot.latestCommitHash ?? "unknown";
  const changedFiles = payload.snapshot.changedFilesCount ?? 0;
  const snapshot = payload.snapshot.createdAt ?? payload.snapshot.id;

  return [
    `Captured work progress for ${projectLabel}`,
    `Branch: ${branch}`,
    `Commit: ${commit}`,
    `Changed files: ${changedFiles}`,
    `Snapshot: ${snapshot}`,
  ].join("\n");
}

function formatFailure(error, code) {
  if (code) {
    return `${error} (${code})`;
  }
  return error;
}

async function runTrack(options) {
  if (!options.token) {
    throw new Error(
      "Missing agent token. Set MANDEV_AGENT_TOKEN or pass --token.",
    );
  }

  const endpoint = new URL("/api/work-progress/capture", options.baseUrl);
  const body = {
    cwd: options.cwd,
  };

  if (options.note) {
    body.note = options.note;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach ManDev API";
    throw new Error(
      `ManDev app is not reachable at ${options.baseUrl}. ${message}`,
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("ManDev API returned a non-JSON response.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(
      formatFailure(
        payload.error ?? "Work progress capture failed.",
        payload.code,
      ),
    );
  }

  return payload;
}

async function main(argv) {
  const options = parseMandevArgv(argv);

  if (options.help || !options.command) {
    printHelp();
    return options.help ? 0 : 1;
  }

  if (options.command !== "track") {
    console.error(`Unknown command: ${options.command}`);
    printHelp();
    return 1;
  }

  try {
    const payload = await runTrack(options);
    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(formatSuccess(payload));
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const exitCode = await main(process.argv.slice(2));
  process.exit(exitCode);
}
