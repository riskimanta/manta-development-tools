#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://localhost:3000";
export const DEFAULT_WATCH_INTERVAL_SECONDS = 300;
export const MIN_WATCH_INTERVAL_SECONDS = 30;

function printHelp() {
  console.log(`ManDev local agent CLI

Usage:
  mandev track [options]

Options:
  --watch            Poll for work progress changes on an interval
  --interval <sec>   Watch polling interval in seconds (default: ${DEFAULT_WATCH_INTERVAL_SECONDS})
  --min-interval <sec>
                     Minimum allowed watch interval (default: ${MIN_WATCH_INTERVAL_SECONDS})
  --base-url <url>   ManDev base URL (default: ${DEFAULT_BASE_URL})
  --token <token>    Agent token (fallback: MANDEV_AGENT_TOKEN)
  --cwd <path>       Working directory (default: current directory)
  --note <text>      Optional snapshot note
  --json             Print raw JSON response
  --help             Show this help

Examples:
  mandev track
  mandev track --watch
  mandev track --watch --interval 60
  mandev track --note "Working on login redirect fix"
  MANDEV_AGENT_TOKEN=dev-token mandev track
`);
}

export function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

export function resolveWatchIntervalSeconds(interval, minInterval) {
  const resolvedMinInterval = parsePositiveInteger(
    minInterval,
    "Minimum interval",
  );
  if (resolvedMinInterval < MIN_WATCH_INTERVAL_SECONDS) {
    throw new Error(
      `Minimum interval must be at least ${MIN_WATCH_INTERVAL_SECONDS} seconds.`,
    );
  }

  const resolvedInterval = parsePositiveInteger(interval, "Interval");
  if (resolvedInterval < resolvedMinInterval) {
    throw new Error(
      `Interval must be at least ${resolvedMinInterval} seconds.`,
    );
  }

  return {
    intervalSeconds: resolvedInterval,
    minIntervalSeconds: resolvedMinInterval,
  };
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
    watch: false,
    interval: DEFAULT_WATCH_INTERVAL_SECONDS,
    minInterval: MIN_WATCH_INTERVAL_SECONDS,
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

    if (current === "--watch") {
      options.watch = true;
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

    if (current === "--interval") {
      options.interval = args.shift() ?? options.interval;
      continue;
    }

    if (current === "--min-interval") {
      options.minInterval = args.shift() ?? options.minInterval;
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

function formatSkipped() {
  return "No changes detected. Skipped snapshot.";
}

function formatFailure(error, code) {
  if (code) {
    return `${error} (${code})`;
  }
  return error;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
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
    dedupe: Boolean(options.dedupe),
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

function printTrackResult(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (payload.skipped) {
    console.log(formatSkipped());
    return;
  }

  console.log(formatSuccess(payload));
}

async function runWatch(options) {
  const { intervalSeconds } = resolveWatchIntervalSeconds(
    options.interval,
    options.minInterval,
  );

  console.log(`Watching work progress for: ${options.cwd}`);
  console.log(`ManDev base URL: ${options.baseUrl}`);
  console.log(`Polling interval: ${intervalSeconds}s`);
  console.log("Duplicate snapshots will be skipped when Git state is unchanged.");

  let stopping = false;

  const handleStop = () => {
    if (stopping) {
      return;
    }
    stopping = true;
    console.log("\nStopped watch mode.");
    process.exit(0);
  };

  process.on("SIGINT", handleStop);
  process.on("SIGTERM", handleStop);

  const trackOptions = {
    ...options,
    dedupe: true,
  };

  while (!stopping) {
    const payload = await runTrack(trackOptions);
    printTrackResult(payload, options.json);

    if (stopping) {
      break;
    }

    await sleep(intervalSeconds * 1000);
  }
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
    if (options.watch) {
      await runWatch(options);
      return 0;
    }

    const payload = await runTrack({ ...options, dedupe: false });
    printTrackResult(payload, options.json);
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
