// Ensure environment variables are available in Vitest regardless of runtime.
// 1) Load .env via dotenv (Vitest runs with environment: 'node')
// 2) If running under Bun, merge Bun.env => process.env (Node env doesn't see Bun.env by default)

// Load .env using dotenv to support running tests with Node-like environment
import 'dotenv/config';

// Try to merge Bun.env into process.env (if available)
// @ts-ignore
const maybeBun: any = typeof Bun !== 'undefined' ? Bun : undefined;
if (maybeBun?.env) {
    for (const [k, v] of Object.entries(
        maybeBun.env as Record<string, string>
    )) {
        if (process.env[k] === undefined && v != null) {
            process.env[k] = String(v);
        }
    }
}

// Nothing else to export; this file runs for its side effects
