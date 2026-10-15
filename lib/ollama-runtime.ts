import { spawn } from "node:child_process";

export interface OllamaReadinessOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  spawnProcess?: (command: string, args: string[], options: { detached: boolean; stdio: "ignore"; windowsHide: boolean }) => { unref?: () => void };
  pollAttempts?: number;
  pollDelayMs?: number;
  platform?: NodeJS.Platform;
}

export interface OllamaReadinessResult {
  ready: boolean;
  started: boolean;
  endpoint: string;
}

let startupPromise: Promise<OllamaReadinessResult> | null = null;

export function isLocalOllamaBase(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.port === "11434";
  } catch {
    return false;
  }
}

export function ollamaTagsEndpoint(baseUrl = process.env.TYPHOON_OCR_BASE_URL || "http://127.0.0.1:11434/v1"): string {
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}/api/tags`;
  } catch {
    return "http://127.0.0.1:11434/api/tags";
  }
}

async function probe(endpoint: string, fetcher: typeof fetch): Promise<boolean> {
  try {
    const response = await fetcher(endpoint, { signal: AbortSignal.timeout(2_000) });
    return response.ok;
  } catch {
    return false;
  }
}

/** Ensure the local Ollama daemon is reachable before an OCR request. */
export async function ensureOllamaReady(options: OllamaReadinessOptions = {}): Promise<OllamaReadinessResult> {
  const endpoint = ollamaTagsEndpoint(options.baseUrl);
  const fetcher = options.fetcher || fetch;
  if (!isLocalOllamaBase(options.baseUrl || process.env.TYPHOON_OCR_BASE_URL || "http://127.0.0.1:11434/v1")) {
    return { ready: true, started: false, endpoint };
  }
  if (startupPromise) return startupPromise;

  const run = (async () => {
    // Keep the initial probe inside the shared promise. This prevents two
    // concurrent OCR requests from both observing a cold daemon and spawning
    // duplicate `ollama serve` processes.
    if (await probe(endpoint, fetcher)) return { ready: true, started: false, endpoint };
    const spawnProcess = options.spawnProcess || ((command, args, spawnOptions) => spawn(command, args, spawnOptions));
    try {
      const child = spawnProcess("ollama", ["serve"], { detached: true, stdio: "ignore", windowsHide: true });
      child.unref?.();
    } catch {
      // The probe below gives the caller the same actionable error whether
      // Ollama was missing from PATH or failed to start for another reason.
    }
    const attempts = options.pollAttempts ?? 12;
    const delayMs = options.pollDelayMs ?? 500;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await probe(endpoint, fetcher)) return { ready: true, started: true, endpoint };
      if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error("OLLAMA_NOT_READY");
  })();
  startupPromise = run.finally(() => { startupPromise = null; });
  return startupPromise;
}
