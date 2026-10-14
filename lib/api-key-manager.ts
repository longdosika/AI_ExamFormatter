/**
 * Provider API Key Manager with Multi-Key Pool & Fallback Rotation
 * Supports primary key + backup keys (API#2, API#3) or delimited key lists
 * to seamlessly recover when an individual key encounters quota or rate limit exhaustion.
 */

export type ProviderType = "gemini" | "google-vision" | "typhoon";

export interface KeyPoolSummary {
  provider: ProviderType;
  configuredCount: number;
  hasBackups: boolean;
  maskedKeys: string[];
}

/**
 * Extract and deduplicate an ordered list of API keys for the given provider.
 * Supports:
 * - Primary: PROVIDER_API_KEY
 * - Numbered backups: PROVIDER_API_KEY_2, PROVIDER_API_KEY_3, PROVIDER_API_KEY_4
 * - Delimited list: PROVIDER_API_KEYS (separated by commas, semicolons, or newlines)
 * - Provider-specific aliases (e.g. GOOGLE_PICKER_API_KEY, OPENTYPHOON_API_KEY)
 */
export function getProviderApiKeys(provider: ProviderType, env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates: (string | undefined)[] = [];

  switch (provider) {
    case "gemini": {
      candidates.push(env.GEMINI_API_KEY);
      candidates.push(env.GEMINI_API_KEY_1);
      candidates.push(env.GEMINI_API_KEY_2);
      candidates.push(env.GEMINI_API_KEY_3);
      candidates.push(env.GEMINI_API_KEY_4);
      if (env.GEMINI_API_KEYS) {
        candidates.push(...env.GEMINI_API_KEYS.split(/[,;\n]/));
      }
      break;
    }
    case "google-vision": {
      candidates.push(env.GOOGLE_VISION_API_KEY);
      candidates.push(env.GOOGLE_VISION_API_KEY_1);
      candidates.push(env.GOOGLE_VISION_API_KEY_2);
      candidates.push(env.GOOGLE_VISION_API_KEY_3);
      candidates.push(env.GOOGLE_VISION_API_KEY_4);
      if (env.GOOGLE_VISION_API_KEYS) {
        candidates.push(...env.GOOGLE_VISION_API_KEYS.split(/[,;\n]/));
      }
      // Common Google project key fallback
      candidates.push(env.GOOGLE_PICKER_API_KEY);
      break;
    }
    case "typhoon": {
      candidates.push(env.TYPHOON_OCR_API_KEY);
      candidates.push(env.TYPHOON_OCR_API_KEY_1);
      candidates.push(env.TYPHOON_OCR_API_KEY_2);
      candidates.push(env.TYPHOON_OCR_API_KEY_3);
      candidates.push(env.TYPHOON_OCR_API_KEY_4);
      candidates.push(env.OPENTYPHOON_API_KEY);
      if (env.TYPHOON_OCR_API_KEYS) {
        candidates.push(...env.TYPHOON_OCR_API_KEYS.split(/[,;\n]/));
      }
      break;
    }
  }

  const seen = new Set<string>();
  const keys: string[] = [];

  for (const raw of candidates) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    keys.push(trimmed);
  }

  return keys;
}

/** Check if an error message or status is a quota, rate-limit, or temporary provider exhaustion error. */
export function isQuotaOrRateLimitError(error: unknown, status?: number): boolean {
  if (status === 429 || status === 503 || status === 502) return true;
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  if (/429|503|502/.test(message)) return true;
  if (/RESOURCE_EXHAUSTED/i.test(message)) return true;
  if (/quota/i.test(message)) return true;
  if (/rate\s*limit/i.test(message)) return true;
  if (/exceeded your current quota/i.test(message)) return true;
  if (/Resource has been exhausted/i.test(message)) return true;

  // Google 403 quota or blocked
  if (status === 403 && /quota|limit|blocked/i.test(message)) return true;

  return false;
}

/** Mask an API key for safe logging (e.g. "AIza...KYUE" or "AQ.A...2iYQ") */
export function maskApiKey(key: string): string {
  if (!key) return "(empty)";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/** Get summary of configured keys for health check / telemetry without leaking secrets */
export function getKeyPoolSummary(provider: ProviderType, env: NodeJS.ProcessEnv = process.env): KeyPoolSummary {
  const keys = getProviderApiKeys(provider, env);
  return {
    provider,
    configuredCount: keys.length,
    hasBackups: keys.length > 1,
    maskedKeys: keys.map(maskApiKey),
  };
}

/**
 * Execute an asynchronous operation with automatic key rotation across the provider's key pool.
 * If the current key triggers a quota/rate-limit error and backup keys exist, automatically
 * retries with the next available key.
 */
export async function executeWithKeyRotation<T>(
  provider: ProviderType,
  operation: (apiKey: string, keyIndex: number, totalKeys: number) => Promise<T>,
  options?: {
    customShouldRotate?: (err: unknown) => boolean;
    onKeyRotated?: (fromIndex: number, toIndex: number, error: unknown) => void;
    env?: NodeJS.ProcessEnv;
  }
): Promise<{ result: T; keyIndex: number; totalKeys: number; usedKey: string }> {
  const keys = getProviderApiKeys(provider, options?.env);
  if (!keys.length) {
    const errorName = provider === "gemini"
      ? "GEMINI_NOT_CONFIGURED"
      : provider === "google-vision"
      ? "GOOGLE_VISION_NOT_CONFIGURED"
      : "TYPHOON_NOT_CONFIGURED";
    throw new Error(errorName);
  }

  let lastError: unknown = null;
  const shouldRotate = options?.customShouldRotate || isQuotaOrRateLimitError;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const result = await operation(key, i, keys.length);
      return { result, keyIndex: i, totalKeys: keys.length, usedKey: key };
    } catch (err) {
      lastError = err;
      const canRotate = i < keys.length - 1 && shouldRotate(err);
      if (canRotate) {
        options?.onKeyRotated?.(i, i + 1, err);
        console.warn(
          `[ApiKeyManager] ${provider} key #${i + 1} (${maskApiKey(key)}) quota/rate limited. Switching to backup key #${i + 2}...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
