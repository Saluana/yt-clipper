This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **.test.ts, dist, data-layer, foundations, queue-layer
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
packages/
  api/
    src/
      index.ts
    package.json
    tsconfig.json
  common/
    src/
      config.ts
      env.ts
      errors.ts
      index.ts
      logger.ts
      metrics.ts
      redact.ts
      state.ts
      time.ts
    tests/
      common.test.js
    package.json
    tsconfig.json
  contracts/
    src/
      ambient.d.ts
      index.d.ts
      index.d.ts.map
      index.js
      index.ts
      openapi.d.ts
      openapi.d.ts.map
      openapi.js
      openapi.ts
      schemas.d.ts
      schemas.d.ts.map
      schemas.js
      schemas.ts
      types.d.ts
      types.d.ts.map
      types.js
      types.ts
    package.json
    tsconfig.json
  data/
    drizzle/
      meta/
        _journal.json
        0000_snapshot.json
      0000_jazzy_post.sql
    src/
      db/
        connection.ts
        repos.ts
        schema.ts
      scripts/
        bootstrap-storage.ts
        cleanup.ts
        seed.ts
      api-keys.ts
      cleanup.ts
      index.ts
      repo.ts
      storage.ts
    drizzle.config.ts
    package.json
    README.md
    tsconfig.json
  queue/
    src/
      dlq-consumer.ts
      index.ts
      pgboss.ts
      types.ts
    package.json
    README.md
    tsconfig.json
  worker/
    src/
      index.ts
    package.json
    tsconfig.json
planning/
  data-layer/
    design.md
    requirements.md
    tasks.md
  foundations/
    design.md
    requirements.md
    tasks.md
  queue-layer/
    design.md
    requirements.md
    tasks.md
  design.md
  journey.md
  layers.md
  requirements.md
.env.example
.gitignore
CLAUDE.md
drizzle.config.ts
index.ts
package.json
README.md
tsconfig.json
vitest.config.ts
vitest.setup.ts
```

# Files

## File: packages/api/package.json
````json
{
    "name": "@clipper/api",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json",
        "dev": "bun --hot src/index.ts"
    },
    "dependencies": {
        "@clipper/common": "*",
        "@clipper/contracts": "*",
        "@clipper/data": "*",
        "@clipper/queue": "*",
        "@elysiajs/cors": "^1.3.3",
        "elysia": "^1.3.8",
        "zod": "^3.23.8"
    },
    "devDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/api/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
````

## File: packages/common/src/config.ts
````typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(10),
    QUEUE_URL: z.string().url().optional(),
    ENABLE_YTDLP: z.boolean().default(false),
    CLIP_MAX_DURATION_SEC: z.number().int().positive().default(120),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(
    env: Record<string, string | undefined> = process.env
): AppConfig {
    const parsed = ConfigSchema.safeParse({
        ...env,
        ENABLE_YTDLP: env.ENABLE_YTDLP === 'true',
        CLIP_MAX_DURATION_SEC: env.CLIP_MAX_DURATION_SEC
            ? Number(env.CLIP_MAX_DURATION_SEC)
            : undefined,
    });
    if (!parsed.success) {
        const details = parsed.error.flatten();
        const redacted = Object.fromEntries(
            Object.entries(env).map(([k, v]) => [
                k,
                k.includes('KEY') ? '***' : v,
            ])
        );
        throw new Error(
            'Invalid configuration: ' +
                JSON.stringify({ details, env: redacted })
        );
    }
    return parsed.data;
}
````

## File: packages/common/src/env.ts
````typescript
/**
 * Robust env access that prefers Bun.env (if present) and falls back to process.env.
 * This avoids jank when running under Bun vs Vitest's node environment.
 */
export function readEnv(key: string): string | undefined {
    // @ts-ignore
    const bunEnv =
        typeof Bun !== 'undefined'
            ? (Bun.env as Record<string, string | undefined>)
            : undefined;
    return bunEnv?.[key] ?? process.env[key];
}

export function requireEnv(key: string): string {
    const val = readEnv(key);
    if (val == null || val === '') {
        throw new Error(`Missing required env: ${key}`);
    }
    return val;
}

export function readIntEnv(
    key: string,
    defaultValue?: number
): number | undefined {
    const v = readEnv(key);
    if (v == null || v === '') return defaultValue;
    const n = Number(v);
    if (Number.isNaN(n)) return defaultValue;
    return n;
}
````

## File: packages/common/src/metrics.ts
````typescript
export type MetricLabels = Record<string, string | number>;

export interface Metrics {
    inc(name: string, value?: number, labels?: MetricLabels): void;
    observe(name: string, value: number, labels?: MetricLabels): void;
}

export class InMemoryMetrics implements Metrics {
    counters = new Map<string, number>();
    histograms = new Map<string, number[]>();
    inc(name: string, value = 1, labels?: MetricLabels) {
        const key = keyWithLabels(name, labels);
        this.counters.set(key, (this.counters.get(key) ?? 0) + value);
    }
    observe(name: string, value: number, labels?: MetricLabels) {
        const key = keyWithLabels(name, labels);
        const arr = this.histograms.get(key) ?? [];
        arr.push(value);
        this.histograms.set(key, arr);
    }
}

export const noopMetrics: Metrics = {
    inc() {},
    observe() {},
};

function keyWithLabels(name: string, labels?: MetricLabels) {
    if (!labels) return name;
    const parts = Object.entries(labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
    return `${name}{${parts}}`;
}
````

## File: packages/common/src/redact.ts
````typescript
// Simple secret redaction utilities for logs and error messages.
// - Redacts API tokens in common places (Authorization headers, query params)
// - Redacts our ck_<id>_<secret> API key format
// - Redacts object properties whose keys look sensitive (token, secret, key, password)

const SENSITIVE_KEY_REGEX =
    /^(?:authorization|password|pass|secret|token|api[_-]?key|key)$/i;

function redactString(input: string): string {
    let out = input;
    // Bearer tokens
    out = out.replace(
        /Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi,
        'Bearer [REDACTED]'
    );
    // Query params like ?apikey=...&token=...
    out = out.replace(
        /([?&](?:api|apikey|token|key|secret)=)([^&#\s]+)/gi,
        '$1[REDACTED]'
    );
    // Our API key format: ck_<uuid>_<base64url>
    out = out.replace(
        /\bck_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([A-Za-z0-9_-]+)\b/gi,
        (_m, id) => `ck_${id}_[REDACTED]`
    );
    return out;
}

function redactArray(arr: unknown[]): unknown[] {
    return arr.map((v) => redactSecrets(v));
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = Array.isArray(obj) ? {} : {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEY_REGEX.test(k)) {
            out[k] = '[REDACTED]';
            continue;
        }
        out[k] = redactSecrets(v);
    }
    return out;
}

export function redactSecrets<T = unknown>(value: T): T {
    if (value == null) return value;
    if (typeof value === 'string') return redactString(value) as unknown as T;
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (value instanceof Error) {
        const e = value as Error;
        const copy = new Error(redactString(e.message));
        (copy as any).name = e.name;
        (copy as any).stack = e.stack ? redactString(e.stack) : undefined;
        return copy as unknown as T;
    }
    if (Array.isArray(value)) return redactArray(value) as unknown as T;
    if (typeof value === 'object')
        return redactObject(value as any) as unknown as T;
    return value;
}

// Convenience for explicit string redaction when needed
export function redactText(text: string): string {
    return redactString(text);
}
````

## File: packages/common/src/state.ts
````typescript
import type { JobStatus } from '@clipper/contracts';
import { ServiceError } from './errors';

export type Transition = {
    from: JobStatus;
    to: JobStatus;
    at: string;
    reason?: string;
};

const allowed: Record<JobStatus, JobStatus[]> = {
    queued: ['processing'],
    processing: ['done', 'failed'],
    done: [],
    failed: [],
};

export function transition(
    current: JobStatus,
    to: JobStatus,
    reason?: string
): Transition {
    if (current === to && (to === 'done' || to === 'failed')) {
        return { from: current, to, at: new Date().toISOString(), reason };
    }
    const next = allowed[current] || [];
    if (!next.includes(to)) {
        throw new ServiceError(
            'INVALID_STATE',
            `Invalid transition ${current} -> ${to}`
        );
    }
    return { from: current, to, at: new Date().toISOString(), reason };
}
````

## File: packages/common/src/time.ts
````typescript
export function parseTimecode(tc: string): number {
    const m = tc.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!m) throw new Error('Invalid timecode');
    const [hh, mm, ss, ms] = [
        Number(m[1]),
        Number(m[2]),
        Number(m[3]),
        m[4] ? Number(m[4].padEnd(3, '0')) : 0,
    ];
    return hh * 3600 + mm * 60 + ss + ms / 1000;
}

export function formatTimecode(seconds: number): string {
    const sign = seconds < 0 ? '-' : '';
    const s = Math.abs(seconds);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    const ms = Math.round((s - Math.floor(s)) * 1000);
    const core = `${hh.toString().padStart(2, '0')}:${mm
        .toString()
        .padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    return ms
        ? `${sign}${core}.${ms.toString().padStart(3, '0')}`
        : `${sign}${core}`;
}

export function validateRange(
    startTc: string,
    endTc: string,
    opts: { maxDurationSec: number }
) {
    const start = parseTimecode(startTc);
    const end = parseTimecode(endTc);
    if (!(start < end))
        return { ok: false as const, reason: 'start_not_before_end' };
    if (end - start > opts.maxDurationSec)
        return { ok: false as const, reason: 'duration_exceeds_cap' };
    return { ok: true as const, startSec: start, endSec: end };
}
````

## File: packages/common/tests/common.test.js
````javascript
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config';
import { parseTimecode, formatTimecode, validateRange } from '../src/time';
import { transition } from '../src/state';
describe('config loader', () => {
    it('loads valid config', () => {
        const cfg = loadConfig({
            NODE_ENV: 'test',
            LOG_LEVEL: 'debug',
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_ANON_KEY: 'aaaaaaaaaa',
            ENABLE_YTDLP: 'true',
            CLIP_MAX_DURATION_SEC: '120',
        });
        expect(cfg.ENABLE_YTDLP).toBe(true);
        expect(cfg.CLIP_MAX_DURATION_SEC).toBe(120);
    });
    it('throws on invalid config', () => {
        expect(() => loadConfig({})).toThrow();
    });
});
describe('time utils', () => {
    it('parses and formats timecode', () => {
        const s = parseTimecode('00:00:01.250');
        expect(s).toBeCloseTo(1.25, 3);
        expect(formatTimecode(s)).toBe('00:00:01.250');
    });
    it('validates range with cap', () => {
        const ok = validateRange('00:00:00', '00:00:10', { maxDurationSec: 15 });
        expect(ok.ok).toBe(true);
        const bad = validateRange('00:00:10', '00:00:09', { maxDurationSec: 15 });
        expect(bad.ok).toBe(false);
    });
});
describe('state machine', () => {
    it('allows valid transitions', () => {
        const t = transition('queued', 'processing');
        expect(t.from).toBe('queued');
        expect(t.to).toBe('processing');
    });
    it('rejects invalid transitions', () => {
        expect(() => transition('queued', 'done')).toThrow();
    });
});
````

## File: packages/common/package.json
````json
{
    "name": "@clipper/common",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json"
    },
    "dependencies": {
        "@clipper/contracts": "*",
        "zod": "^3.23.8"
    },
    "devDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/common/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
  "declaration": true,
  "declarationMap": true,
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/contracts/src/ambient.d.ts
````typescript
declare module 'zod-to-openapi';
````

## File: packages/contracts/src/index.d.ts
````typescript
export type { SourceType, JobStatus, CreateJobInput as CreateJobInputType, JobRecord, } from './types';
export * as Schemas from './schemas';
export { maybeGenerateOpenApi } from './openapi';
//# sourceMappingURL=index.d.ts.map
````

## File: packages/contracts/src/index.d.ts.map
````
{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["index.ts"],"names":[],"mappings":"AAAA,YAAY,EACR,UAAU,EACV,SAAS,EACT,cAAc,IAAI,kBAAkB,EACpC,SAAS,GACZ,MAAM,SAAS,CAAC;AAEjB,OAAO,KAAK,OAAO,MAAM,WAAW,CAAC;AACrC,OAAO,EAAE,oBAAoB,EAAE,MAAM,WAAW,CAAC"}
````

## File: packages/contracts/src/index.js
````javascript
export * as Schemas from './schemas';
export { maybeGenerateOpenApi } from './openapi';
````

## File: packages/contracts/src/index.ts
````typescript
export type {
    SourceType,
    JobStatus,
    CreateJobInput as CreateJobInputType,
    JobRecord,
} from './types';

export * as Schemas from './schemas';
export { maybeGenerateOpenApi } from './openapi';
````

## File: packages/contracts/src/openapi.d.ts
````typescript
export declare function maybeGenerateOpenApi(): Promise<any | null>;
//# sourceMappingURL=openapi.d.ts.map
````

## File: packages/contracts/src/openapi.d.ts.map
````
{"version":3,"file":"openapi.d.ts","sourceRoot":"","sources":["openapi.ts"],"names":[],"mappings":"AAIA,wBAAsB,oBAAoB,IAAI,OAAO,CAAC,GAAG,GAAG,IAAI,CAAC,CAmBhE"}
````

## File: packages/contracts/src/openapi.js
````javascript
// Optional OpenAPI generator: only use when env flag ENABLE_OPENAPI === 'true'
// We avoid importing 'zod-to-openapi' types at compile time to keep it optional.
import { z } from 'zod';
export async function maybeGenerateOpenApi() {
    if (process.env.ENABLE_OPENAPI !== 'true')
        return null;
    const { OpenAPIGenerator, extendZodWithOpenApi } = (await import('zod-to-openapi'));
    extendZodWithOpenApi(z);
    const S = await import('./schemas');
    const registry = new OpenAPIGenerator({
        CreateJobInput: S.CreateJobInput,
        JobRecord: S.JobRecord,
    }, '3.0.0');
    return registry.generateDocument({
        openapi: '3.0.0',
        info: { title: 'Clipper API', version: '1.0.0' },
        paths: {},
    });
}
````

## File: packages/contracts/src/openapi.ts
````typescript
// Optional OpenAPI generator: only use when env flag ENABLE_OPENAPI === 'true'
// We avoid importing 'zod-to-openapi' types at compile time to keep it optional.
import { z } from 'zod';

export async function maybeGenerateOpenApi(): Promise<any | null> {
    if (process.env.ENABLE_OPENAPI !== 'true') return null;
    const { OpenAPIGenerator, extendZodWithOpenApi } = (await import(
        'zod-to-openapi'
    )) as any;
    extendZodWithOpenApi(z as any);
    const S = await import('./schemas');
    const registry = new OpenAPIGenerator(
        {
            CreateJobInput: S.CreateJobInput,
            JobRecord: S.JobRecord,
        },
        '3.0.0'
    );
    return registry.generateDocument({
        openapi: '3.0.0',
        info: { title: 'Clipper API', version: '1.0.0' },
        paths: {},
    });
}
````

## File: packages/contracts/src/schemas.d.ts
````typescript
import { z } from 'zod';
export declare const timecode: z.ZodString;
export declare const SourceType: z.ZodEnum<["upload", "youtube"]>;
export declare const JobStatus: z.ZodEnum<["queued", "processing", "done", "failed"]>;
export declare const CreateJobInput: z.ZodEffects<z.ZodObject<{
    sourceType: z.ZodEnum<["upload", "youtube"]>;
    youtubeUrl: z.ZodOptional<z.ZodString>;
    uploadKey: z.ZodOptional<z.ZodString>;
    start: z.ZodString;
    end: z.ZodString;
    withSubtitles: z.ZodDefault<z.ZodBoolean>;
    burnSubtitles: z.ZodDefault<z.ZodBoolean>;
    subtitleLang: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"auto">, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    sourceType: "upload" | "youtube";
    start: string;
    end: string;
    withSubtitles: boolean;
    burnSubtitles: boolean;
    youtubeUrl?: string | undefined;
    uploadKey?: string | undefined;
    subtitleLang?: string | undefined;
}, {
    sourceType: "upload" | "youtube";
    start: string;
    end: string;
    youtubeUrl?: string | undefined;
    uploadKey?: string | undefined;
    withSubtitles?: boolean | undefined;
    burnSubtitles?: boolean | undefined;
    subtitleLang?: string | undefined;
}>, {
    sourceType: "upload" | "youtube";
    start: string;
    end: string;
    withSubtitles: boolean;
    burnSubtitles: boolean;
    youtubeUrl?: string | undefined;
    uploadKey?: string | undefined;
    subtitleLang?: string | undefined;
}, {
    sourceType: "upload" | "youtube";
    start: string;
    end: string;
    youtubeUrl?: string | undefined;
    uploadKey?: string | undefined;
    withSubtitles?: boolean | undefined;
    burnSubtitles?: boolean | undefined;
    subtitleLang?: string | undefined;
}>;
export declare const JobRecord: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["queued", "processing", "done", "failed"]>;
    progress: z.ZodNumber;
    resultVideoKey: z.ZodOptional<z.ZodString>;
    resultSrtKey: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "queued" | "processing" | "done" | "failed";
    id: string;
    progress: number;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    error?: string | undefined;
    resultVideoKey?: string | undefined;
    resultSrtKey?: string | undefined;
}, {
    status: "queued" | "processing" | "done" | "failed";
    id: string;
    progress: number;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    error?: string | undefined;
    resultVideoKey?: string | undefined;
    resultSrtKey?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map
````

## File: packages/contracts/src/schemas.d.ts.map
````
{"version":3,"file":"schemas.d.ts","sourceRoot":"","sources":["schemas.ts"],"names":[],"mappings":"AAAA,OAAO,EAAE,CAAC,EAAE,MAAM,KAAK,CAAC;AAGxB,eAAO,MAAM,QAAQ,aAEoD,CAAC;AAE1E,eAAO,MAAM,UAAU,kCAAgC,CAAC;AACxD,eAAO,MAAM,SAAS,uDAAqD,CAAC;AAE5E,eAAO,MAAM,cAAc;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;EA4BrB,CAAC;AAEP,eAAO,MAAM,SAAS;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;EAUpB,CAAC"}
````

## File: packages/contracts/src/schemas.js
````javascript
import { z } from 'zod';
export const timecode = z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/, 'Expected HH:MM:SS(.ms)');
export const SourceType = z.enum(['upload', 'youtube']);
export const JobStatus = z.enum(['queued', 'processing', 'done', 'failed']);
export const CreateJobInput = z
    .object({
    sourceType: SourceType,
    youtubeUrl: z.string().url().optional(),
    uploadKey: z.string().min(1).optional(),
    start: timecode,
    end: timecode,
    withSubtitles: z.boolean().default(false),
    burnSubtitles: z.boolean().default(false),
    subtitleLang: z
        .union([z.literal('auto'), z.string().min(2)])
        .optional(),
})
    .superRefine((val, ctx) => {
    if (val.sourceType === 'upload' && !val.uploadKey) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'uploadKey required for sourceType=upload',
            path: ['uploadKey'],
        });
    }
    if (val.sourceType === 'youtube' && !val.youtubeUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'youtubeUrl required for sourceType=youtube',
            path: ['youtubeUrl'],
        });
    }
});
export const JobRecord = z.object({
    id: z.string().uuid(),
    status: JobStatus,
    progress: z.number().min(0).max(100),
    resultVideoKey: z.string().optional(),
    resultSrtKey: z.string().optional(),
    error: z.string().optional(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
````

## File: packages/contracts/src/schemas.ts
````typescript
import { z } from 'zod';
import type { CreateJobInput as CreateJobInputType } from './types';

export const timecode = z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/, 'Expected HH:MM:SS(.ms)');

export const SourceType = z.enum(['upload', 'youtube']);
export const JobStatus = z.enum(['queued', 'processing', 'done', 'failed']);

export const CreateJobInput = z
    .object({
        sourceType: SourceType,
        youtubeUrl: z.string().url().optional(),
        uploadKey: z.string().min(1).optional(),
        start: timecode,
        end: timecode,
        withSubtitles: z.boolean().default(false),
        burnSubtitles: z.boolean().default(false),
        subtitleLang: z
            .union([z.literal('auto'), z.string().min(2)])
            .optional(),
    })
    .superRefine((val: CreateJobInputType, ctx) => {
        if (val.sourceType === 'upload' && !val.uploadKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'uploadKey required for sourceType=upload',
                path: ['uploadKey'],
            });
        }
        if (val.sourceType === 'youtube' && !val.youtubeUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'youtubeUrl required for sourceType=youtube',
                path: ['youtubeUrl'],
            });
        }
    });

export const JobRecord = z.object({
    id: z.string().uuid(),
    status: JobStatus,
    progress: z.number().min(0).max(100),
    resultVideoKey: z.string().optional(),
    resultSrtKey: z.string().optional(),
    error: z.string().optional(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
````

## File: packages/contracts/src/types.d.ts
````typescript
export type SourceType = 'upload' | 'youtube';
export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';
export interface CreateJobInput {
    sourceType: SourceType;
    youtubeUrl?: string;
    uploadKey?: string;
    start: string;
    end: string;
    withSubtitles: boolean;
    burnSubtitles: boolean;
    subtitleLang?: 'auto' | string;
}
export interface JobRecord {
    id: string;
    status: JobStatus;
    progress: number;
    resultVideoKey?: string;
    resultSrtKey?: string;
    error?: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=types.d.ts.map
````

## File: packages/contracts/src/types.d.ts.map
````
{"version":3,"file":"types.d.ts","sourceRoot":"","sources":["types.ts"],"names":[],"mappings":"AAAA,MAAM,MAAM,UAAU,GAAG,QAAQ,GAAG,SAAS,CAAC;AAC9C,MAAM,MAAM,SAAS,GAAG,QAAQ,GAAG,YAAY,GAAG,MAAM,GAAG,QAAQ,CAAC;AAEpE,MAAM,WAAW,cAAc;IAC3B,UAAU,EAAE,UAAU,CAAC;IACvB,UAAU,CAAC,EAAE,MAAM,CAAC;IACpB,SAAS,CAAC,EAAE,MAAM,CAAC;IACnB,KAAK,EAAE,MAAM,CAAC;IACd,GAAG,EAAE,MAAM,CAAC;IACZ,aAAa,EAAE,OAAO,CAAC;IACvB,aAAa,EAAE,OAAO,CAAC;IACvB,YAAY,CAAC,EAAE,MAAM,GAAG,MAAM,CAAC;CAClC;AAED,MAAM,WAAW,SAAS;IACtB,EAAE,EAAE,MAAM,CAAC;IACX,MAAM,EAAE,SAAS,CAAC;IAClB,QAAQ,EAAE,MAAM,CAAC;IACjB,cAAc,CAAC,EAAE,MAAM,CAAC;IACxB,YAAY,CAAC,EAAE,MAAM,CAAC;IACtB,KAAK,CAAC,EAAE,MAAM,CAAC;IACf,SAAS,EAAE,MAAM,CAAC;IAClB,SAAS,EAAE,MAAM,CAAC;IAClB,SAAS,EAAE,MAAM,CAAC;CACrB"}
````

## File: packages/contracts/src/types.js
````javascript
export {};
````

## File: packages/contracts/src/types.ts
````typescript
export type SourceType = 'upload' | 'youtube';
export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface CreateJobInput {
    sourceType: SourceType;
    youtubeUrl?: string;
    uploadKey?: string; // Supabase path
    start: string; // HH:MM:SS(.ms)
    end: string; // HH:MM:SS(.ms)
    withSubtitles: boolean;
    burnSubtitles: boolean;
    subtitleLang?: 'auto' | string;
}

export interface JobRecord {
    id: string;
    status: JobStatus;
    progress: number; // 0..100
    resultVideoKey?: string;
    resultSrtKey?: string;
    error?: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
````

## File: packages/contracts/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
  "noEmit": false,
  "allowImportingTsExtensions": false
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/data/drizzle/meta/_journal.json
````json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1754753175413,
      "tag": "0000_jazzy_post",
      "breakpoints": true
    }
  ]
}
````

## File: packages/data/drizzle/meta/0000_snapshot.json
````json
{
  "id": "0e54daa7-b43f-43d3-ab3a-2b02cc196952",
  "prevId": "00000000-0000-0000-0000-000000000000",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.api_keys": {
      "name": "api_keys",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "key_hash": {
          "name": "key_hash",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "revoked": {
          "name": "revoked",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "last_used_at": {
          "name": "last_used_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.job_events": {
      "name": "job_events",
      "schema": "",
      "columns": {
        "job_id": {
          "name": "job_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "ts": {
          "name": "ts",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "data": {
          "name": "data",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {
        "idx_job_events_job_id_ts": {
          "name": "idx_job_events_job_id_ts",
          "columns": [
            {
              "expression": "job_id",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "ts",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {
        "job_events_job_id_jobs_id_fk": {
          "name": "job_events_job_id_jobs_id_fk",
          "tableFrom": "job_events",
          "tableTo": "jobs",
          "columnsFrom": [
            "job_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "cascade",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.jobs": {
      "name": "jobs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "job_status",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true,
          "default": "'queued'"
        },
        "progress": {
          "name": "progress",
          "type": "integer",
          "primaryKey": false,
          "notNull": true,
          "default": 0
        },
        "source_type": {
          "name": "source_type",
          "type": "source_type",
          "typeSchema": "public",
          "primaryKey": false,
          "notNull": true
        },
        "source_key": {
          "name": "source_key",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "source_url": {
          "name": "source_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "start_sec": {
          "name": "start_sec",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "end_sec": {
          "name": "end_sec",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "with_subtitles": {
          "name": "with_subtitles",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "burn_subtitles": {
          "name": "burn_subtitles",
          "type": "boolean",
          "primaryKey": false,
          "notNull": true,
          "default": false
        },
        "subtitle_lang": {
          "name": "subtitle_lang",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "result_video_key": {
          "name": "result_video_key",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "result_srt_key": {
          "name": "result_srt_key",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "error_code": {
          "name": "error_code",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "error_message": {
          "name": "error_message",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp with time zone",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {
        "idx_jobs_status_created_at": {
          "name": "idx_jobs_status_created_at",
          "columns": [
            {
              "expression": "status",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            },
            {
              "expression": "created_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        },
        "idx_jobs_expires_at": {
          "name": "idx_jobs_expires_at",
          "columns": [
            {
              "expression": "expires_at",
              "isExpression": false,
              "asc": true,
              "nulls": "last"
            }
          ],
          "isUnique": false,
          "concurrently": false,
          "method": "btree",
          "with": {}
        }
      },
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {
    "public.job_status": {
      "name": "job_status",
      "schema": "public",
      "values": [
        "queued",
        "processing",
        "done",
        "failed"
      ]
    },
    "public.source_type": {
      "name": "source_type",
      "schema": "public",
      "values": [
        "upload",
        "youtube"
      ]
    }
  },
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}
````

## File: packages/data/drizzle/0000_jazzy_post.sql
````sql
CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('upload', 'youtube');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "job_events" (
	"job_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"source_type" "source_type" NOT NULL,
	"source_key" text,
	"source_url" text,
	"start_sec" integer NOT NULL,
	"end_sec" integer NOT NULL,
	"with_subtitles" boolean DEFAULT false NOT NULL,
	"burn_subtitles" boolean DEFAULT false NOT NULL,
	"subtitle_lang" text,
	"result_video_key" text,
	"result_srt_key" text,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_job_events_job_id_ts" ON "job_events" USING btree ("job_id","ts");--> statement-breakpoint
CREATE INDEX "idx_jobs_status_created_at" ON "jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_expires_at" ON "jobs" USING btree ("expires_at");
````

## File: packages/data/src/scripts/bootstrap-storage.ts
````typescript
import { createClient } from '@supabase/supabase-js';
import { readEnv } from '@clipper/common';

export type BootstrapOptions = {
    url?: string;
    serviceRoleKey?: string;
    bucket: string;
    createPrefixes?: boolean; // creates sources/.keep and results/.keep
};

export async function bootstrapStorage(opts: BootstrapOptions) {
    const url = opts.url ?? readEnv('SUPABASE_URL');
    const key = opts.serviceRoleKey ?? readEnv('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = opts.bucket;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SERVICE_ROLE');
    if (!bucket) throw new Error('Missing bucket name');

    const supabase = createClient(url, key);

    // Ensure bucket exists
    const { data: buckets, error: listErr } =
        await supabase.storage.listBuckets();
    if (listErr) throw new Error(`listBuckets failed: ${listErr.message}`);
    const exists = (buckets ?? []).some((b) => b.name === bucket);
    if (!exists) {
        const { error } = await supabase.storage.createBucket(bucket, {
            public: false,
        });
        if (error && !String(error.message).includes('already exists')) {
            throw new Error(`createBucket failed: ${error.message}`);
        }
    }

    // Optionally create prefix keep files
    if (opts.createPrefixes) {
        const mk = async (path: string) =>
            supabase.storage
                .from(bucket)
                .upload(path, new Blob([new Uint8Array(0)]), {
                    upsert: true,
                    contentType: 'application/octet-stream',
                })
                .then(({ error }) => {
                    if (
                        error &&
                        !String(error.message).includes('already exists')
                    )
                        throw new Error(
                            `upload ${path} failed: ${error.message}`
                        );
                });
        await mk('sources/.keep');
        await mk('results/.keep');
    }
}

// CLI entry
if (import.meta.main) {
    const bucket = readEnv('SUPABASE_STORAGE_BUCKET');
    bootstrapStorage({
        bucket: bucket!,
        createPrefixes: true,
    })
        .then(() => {
            console.log('Storage bootstrap complete');
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
````

## File: packages/data/src/scripts/cleanup.ts
````typescript
import { cleanupExpiredJobs } from '../cleanup';
import { createSupabaseStorageRepo } from '../storage';
import { readEnv, readIntEnv } from '@clipper/common';
import { createLogger } from '@clipper/common/src/logger';

const DRY_RUN =
    (readEnv('CLEANUP_DRY_RUN') ?? 'true').toLowerCase() !== 'false';
const BATCH = readIntEnv('CLEANUP_BATCH_SIZE', 100) ?? 100;
const RATE_DELAY = readIntEnv('CLEANUP_RATE_LIMIT_MS', 0) ?? 0;
const USE_STORAGE =
    (readEnv('CLEANUP_STORAGE') ?? 'true').toLowerCase() === 'true';

async function main() {
    const logger = createLogger((readEnv('LOG_LEVEL') as any) ?? 'info');
    const storage = USE_STORAGE
        ? (() => {
              try {
                  return createSupabaseStorageRepo();
              } catch {
                  return null;
              }
          })()
        : null;
    const res = await cleanupExpiredJobs({
        dryRun: DRY_RUN,
        batchSize: BATCH,
        rateLimitDelayMs: RATE_DELAY,
        storage,
        logger,
    });
    logger.info('cleanup finished', res as any);
}

if (import.meta.main) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
````

## File: packages/data/src/scripts/seed.ts
````typescript
import { createDb } from '../db/connection';
import { jobs } from '../db/schema';

export async function seedMinimal() {
    const db = createDb();
    const id = crypto.randomUUID();
    await db.insert(jobs).values({
        id,
        status: 'queued',
        progress: 0,
        sourceType: 'upload',
        startSec: 0,
        endSec: 5,
        withSubtitles: false,
        burnSubtitles: false,
    });
    console.log('Seeded job:', id);
}

if (import.meta.main) {
    seedMinimal().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
````

## File: packages/data/src/api-keys.ts
````typescript
import { createDb } from './db/connection';
import { apiKeys } from './db/schema';
import { eq } from 'drizzle-orm';

export interface ApiKeyRecord {
    id: string;
    name: string;
    revoked: boolean;
    createdAt: string;
    lastUsedAt?: string;
}

export interface ApiKeysRepository {
    issue(name: string): Promise<{ id: string; name: string; token: string }>;
    verify(token: string): Promise<ApiKeyRecord | null>;
    revoke(id: string): Promise<void>;
}

function ensureBunPassword() {
    const bun: any = (globalThis as any).Bun;
    if (!bun?.password) {
        throw new Error('BUN_PASSWORD_UNAVAILABLE: Bun.password is required');
    }
    return bun.password as {
        hash: (pw: string | ArrayBufferView, opts?: any) => Promise<string>;
        verify: (
            pw: string | ArrayBufferView,
            hash: string
        ) => Promise<boolean>;
    };
}

function generateTokenParts() {
    const id = crypto.randomUUID();
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const secret = Buffer.from(bytes).toString('base64url');
    return { id, secret };
}

function packToken(id: string, secret: string) {
    return `ck_${id}_${secret}`;
}

function unpackToken(token: string): { id: string; secret: string } | null {
    if (!token.startsWith('ck_')) return null;
    const parts = token.split('_');
    if (parts.length < 3) return null;
    const id = parts[1]!;
    const secret = parts.slice(2).join('_');
    if (!id || !secret) return null;
    return { id, secret };
}

export class DrizzleApiKeysRepo implements ApiKeysRepository {
    constructor(private readonly db = createDb()) {}

    async issue(
        name: string
    ): Promise<{ id: string; name: string; token: string }> {
        const { id, secret } = generateTokenParts();
        const token = packToken(id, secret);
        const bunPwd = ensureBunPassword();
        const hash = await bunPwd.hash(secret);
        await this.db
            .insert(apiKeys)
            .values({ id, name, keyHash: hash, revoked: false });
        return { id, name, token };
    }

    async verify(token: string): Promise<ApiKeyRecord | null> {
        const parsed = unpackToken(token);
        if (!parsed) return null;
        const [rec] = await this.db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.id, parsed.id))
            .limit(1);
        if (!rec || rec.revoked) return null;
        const bunPwd = ensureBunPassword();
        const ok = await bunPwd.verify(parsed.secret, rec.keyHash);
        if (!ok) return null;
        await this.db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, rec.id));
        return {
            id: rec.id,
            name: rec.name,
            revoked: rec.revoked,
            createdAt: rec.createdAt.toISOString(),
            lastUsedAt: rec.lastUsedAt?.toISOString(),
        };
    }

    async revoke(id: string): Promise<void> {
        await this.db
            .update(apiKeys)
            .set({ revoked: true })
            .where(eq(apiKeys.id, id));
    }
}
````

## File: packages/data/src/storage.ts
````typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readEnv } from '@clipper/common';
import { readFile as nodeReadFile } from 'node:fs/promises';

export const storageKeys = {
    source: (jobId: string, ext: string) =>
        `sources/${jobId}/source.${ext.replace(/^\./, '')}`,
    resultVideo: (jobId: string) => `results/${jobId}/clip.mp4`,
    resultSrt: (jobId: string) => `results/${jobId}/clip.srt`,
};

export interface StorageRepo {
    upload(localPath: string, key: string, contentType?: string): Promise<void>;
    sign(key: string, ttlSec?: number): Promise<string>;
    remove(key: string): Promise<void>;
}

export type SupabaseStorageOptions = {
    url?: string;
    serviceRoleKey?: string;
    bucket?: string;
    defaultTtlSec?: number; // default 600 (10 minutes)
};

export function createSupabaseStorageRepo(
    opts: SupabaseStorageOptions = {}
): StorageRepo {
    const url = opts.url ?? readEnv('SUPABASE_URL');
    const key = opts.serviceRoleKey ?? readEnv('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = opts.bucket ?? readEnv('SUPABASE_STORAGE_BUCKET');
    const ttlStr = readEnv('SIGNED_URL_TTL_SEC');
    const defaultTtlSec = opts.defaultTtlSec ?? (ttlStr ? Number(ttlStr) : 600);

    if (!url || !key || !bucket) {
        throw new Error(
            'Supabase storage not configured: require SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET'
        );
    }

    const client = createClient(url, key);
    return new SupabaseStorageRepo(client, bucket, defaultTtlSec);
}

class SupabaseStorageRepo implements StorageRepo {
    constructor(
        private readonly supabase: SupabaseClient,
        private readonly bucket: string,
        private readonly defaultTtlSec: number
    ) {}

    async upload(
        localPath: string,
        key: string,
        contentType?: string
    ): Promise<void> {
        const bun: any = (globalThis as any).Bun;
        let blob: Blob;
        const type = contentType ?? guessContentType(key);
        if (bun?.file) {
            const file = bun.file(localPath);
            if (!(await file.exists())) {
                throw new Error(`FILE_NOT_FOUND: ${localPath}`);
            }
            blob = new Blob([await file.arrayBuffer()], { type });
        } else {
            const data = await nodeReadFile(localPath);
            blob = new Blob([data], { type });
        }
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(key, blob, { upsert: true, contentType: blob.type });
        if (error) throw new Error(`STORAGE_UPLOAD_FAILED: ${error.message}`);
    }

    async sign(key: string, ttlSec?: number): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(this.bucket)
            .createSignedUrl(key, ttlSec ?? this.defaultTtlSec);
        if (error || !data?.signedUrl)
            throw new Error(
                `STORAGE_SIGN_FAILED: ${error?.message ?? 'unknown'}`
            );
        return data.signedUrl;
    }

    async remove(key: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .remove([key]);
        if (error) throw new Error(`STORAGE_REMOVE_FAILED: ${error.message}`);
    }
}

function guessContentType(key: string): string {
    const lower = key.toLowerCase();
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mkv')) return 'video/x-matroska';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.srt')) return 'application/x-subrip';
    if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
    if (lower.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
}
````

## File: packages/data/drizzle.config.ts
````typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    strict: true,
});
````

## File: packages/data/README.md
````markdown
# @clipper/data

Data layer (Drizzle + Postgres) and Supabase Storage helpers.

## Prereqs

-   Bun loads `.env` automatically
-   Required envs:
    -   DATABASE_URL (for Postgres)
    -   SUPABASE_URL
    -   SUPABASE_SERVICE_ROLE_KEY
    -   SUPABASE_STORAGE_BUCKET (optional; bootstrap can create and use it)

## Migrations

-   Generate from schema:
    -   bun run --cwd packages/data db:generate
-   Apply to DB:
    -   bun run --cwd packages/data db:push

## Seed

-   Minimal seed inserts a queued job:
    -   bun run --cwd packages/data db:seed

## Storage Bootstrap

-   Ensures bucket exists and creates `sources/.keep` and `results/.keep`:
    -   bun run --cwd packages/data storage:bootstrap

## Tests

-   Run the full suite from repo root:
    -   bunx vitest -c vitest.config.ts
````

## File: packages/data/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false
  },
  "include": ["src"]
}
````

## File: packages/queue/src/index.ts
````typescript
export * from './types';
export * from './pgboss';
export * from './dlq-consumer';
````

## File: packages/queue/package.json
````json
{
    "name": "@clipper/queue",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json"
    },
    "dependencies": {
        "pg-boss": "^10.0.0",
        "@clipper/common": "*"
    },
    "devDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/queue/README.md
````markdown
# @clipper/queue

Queue abstraction and pg-boss adapter for yt-clipper.

## Usage

```ts
import { PgBossQueueAdapter, startDlqConsumer } from '@clipper/queue';

const queue = new PgBossQueueAdapter({
    connectionString: process.env.DATABASE_URL!,
});
await queue.start();
await queue.publish({ jobId: '123', priority: 'normal' });
await queue.consume(async ({ jobId }) => {
    // process job
});

// DLQ consumer
const stop = await startDlqConsumer();
// call await stop() on shutdown
```

## Env

-   DATABASE_URL
-   PG_BOSS_SCHEMA (default pgboss)
-   QUEUE_NAME (default clips)
-   QUEUE_VISIBILITY_SEC (default 90)
-   QUEUE_MAX_ATTEMPTS (default 3)
-   QUEUE_CONCURRENCY (default 4)

## Notes

-   Bun auto-loads .env; no dotenv required.
-   Throw in a consumer to trigger retry; successful completion returns normally.
-   DLQ messages are logged with level=error; integrate alerting in dlq-consumer.ts.
````

## File: packages/worker/package.json
````json
{
    "name": "@clipper/worker",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json",
        "dev": "bun --hot src/index.ts"
    },
    "dependencies": {
        "@clipper/common": "*",
        "@clipper/contracts": "*",
        "@clipper/data": "*",
        "@clipper/queue": "*"
    },
    "devDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/worker/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { 
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["src"]
}
````

## File: planning/data-layer/design.md
````markdown
<!-- artifact_id: 9a9c2ee0-3bc3-4b34-b54b-1e2bb0ef1d5f -->

# Data Layer — Design (Supabase + Drizzle)

## Overview

Implement a minimal, scalable schema on Supabase Postgres with type-safe access via Drizzle. Provide repository functions for API and workers, enforce clean state transitions, and enable efficient cleanup and observability.

---

## Architecture

```mermaid
flowchart LR
  API[Elysia API] -->|create, get, sign| Repo[Repositories]
  Worker[Worker Runtime] -->|claim, update, log| Repo
  Repo -->|SQL| PG[(Supabase Postgres)]
  Repo -->|sign, put, delete| Storage[(Supabase Storage)]
```

Components:

-   Schema (SQL/Drizzle): tables, indexes, enums.
-   Repositories: typed CRUD + transitions (transactional where needed).
-   Storage client: helper to build canonical keys and sign URLs.

---

## Schema (Drizzle pseudo-code)

```ts
import {
    pgEnum,
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    boolean,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';

export const jobStatus = pgEnum('job_status', [
    'queued',
    'processing',
    'done',
    'failed',
]);

export const jobs = pgTable(
    'jobs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        status: jobStatus('status').notNull().default('queued'),
        priority: varchar('priority', { length: 16 })
            .notNull()
            .default('normal'),
        shard: integer('shard').notNull().default(0),
        sourceType: varchar('source_type', { length: 16 }).notNull(), // 'upload' | 'youtube'
        sourceKey: varchar('source_key', { length: 512 }),
        sourceUrl: varchar('source_url', { length: 1024 }),
        startSec: integer('start_sec').notNull(),
        endSec: integer('end_sec').notNull(),
        withSubtitles: boolean('with_subtitles').notNull().default(false),
        burnSubtitles: boolean('burn_subtitles').notNull().default(false),
        subtitleLang: varchar('subtitle_lang', { length: 16 }).default('auto'),
        // progress & attempts
        progress: integer('progress').notNull().default(0), // 0..100
        attempts: integer('attempts').notNull().default(0),
        lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
        // results
        resultVideoKey: varchar('result_video_key', { length: 512 }),
        resultSrtKey: varchar('result_srt_key', { length: 512 }),
        // errors
        errorCode: varchar('error_code', { length: 64 }),
        errorMessage: text('error_message'),
        // bookkeeping
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
    },
    (t) => ({
        byStatusCreated: index('idx_jobs_status_created_at').on(
            t.status,
            t.createdAt
        ),
        byExpiresAt: index('idx_jobs_expires_at').on(t.expiresAt),
    })
);

export const jobEvents = pgTable(
    'job_events',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        jobId: uuid('job_id')
            .notNull()
            .references(() => jobs.id, { onDelete: 'cascade' }),
        ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
        type: varchar('type', { length: 64 }).notNull(),
        data: jsonb('data').$type<Record<string, unknown>>(),
    },
    (t) => ({
        byJobTs: index('idx_job_events_job_id_ts').on(t.jobId, t.ts),
    })
);

export const apiKeys = pgTable(
    'api_keys',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 128 }).notNull(),
        keyHash: varchar('key_hash', { length: 128 }).notNull(), // bcrypt/argon2 hash
        scopes: varchar('scopes', { length: 256 }).default(''),
        rateLimitPerMin: integer('rate_limit_per_min').default(60),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
    },
    (t) => ({
        byKeyActive: index('idx_api_keys_active').on(t.keyHash, t.revokedAt),
    })
);
```

Notes:

-   Keep enum for `status` to enforce valid states.
-   Optional `api_keys` table only if ADMIN_ENABLED + API key auth is turned on.
-   use Buns built in hashing

---

## Storage Layout

-   Bucket `sources` (private): `sources/{jobId}/source.ext`.
-   Bucket `results` (private): `results/{jobId}/clip.mp4`, `results/{jobId}/clip.srt`.
-   Signed URL TTL: 5–15 minutes (configurable).

Helper (TS):

```ts
export const storageKeys = {
    source: (jobId: string, ext: string) => `sources/${jobId}/source.${ext}`,
    resultVideo: (jobId: string) => `results/${jobId}/clip.mp4`,
    resultSrt: (jobId: string) => `results/${jobId}/clip.srt`,
};
```

---

## Repository Interfaces

```ts
export interface ServiceResult<T> {
    ok: boolean;
    data?: T;
    code?: string;
    message?: string;
}

export interface JobsRepo {
    create(input: Partial<InsertJob>): Promise<ServiceResult<Job>>;
    get(id: string): Promise<ServiceResult<Job | null>>;
    update(id: string, patch: Partial<UpdateJob>): Promise<ServiceResult<Job>>;
    listByStatus(
        status: JobStatus,
        limit: number
    ): Promise<ServiceResult<Job[]>>;
    transition(
        id: string,
        next: JobStatus,
        patch?: Partial<UpdateJob>,
        event?: JobEventInput
    ): Promise<ServiceResult<Job>>;
}

export interface JobEventsRepo {
    add(event: JobEventInput): Promise<ServiceResult<void>>;
    list(jobId: string, limit?: number): Promise<ServiceResult<JobEvent[]>>;
}

export interface StorageRepo {
    upload(localPath: string, key: string): Promise<ServiceResult<void>>;
    sign(key: string, ttlSec?: number): Promise<ServiceResult<string>>;
    remove(key: string): Promise<ServiceResult<void>>;
}
```

Transactional pattern:

```ts
// within a tx: update jobs + insert job_events
await db.transaction(async (tx) => {
    await tx
        .update(jobs)
        .set({ status: next, updatedAt: sql`now()` })
        .where(eq(jobs.id, id));
    await tx
        .insert(jobEvents)
        .values({ jobId: id, type: 'transition', data: { next } });
});
```

---

## Error Handling

-   Use `ServiceResult` for all repo methods; map DB/storage failures to codes like `DB_CONFLICT`, `NOT_FOUND`, `STORAGE_SIGN_FAILED`.
-   Avoid leaking DSNs, keys, or bucket names in error messages.

---

## Migration Strategy

-   Use Drizzle migrations checked into VCS.
-   Forward-only; include safe defaults and indexes.
-   Local bootstrap script creates buckets `sources`, `results` if missing.

---

## Testing Strategy

-   Unit tests: repositories with a local Postgres (Docker) and a mocked Supabase Storage client.
-   Integration tests: create job → event → transition → sign URL happy path.
-   Cleanup tests: insert expired rows → run cleanup → verify cascades and storage deletes.

---

## Performance Considerations

-   Index-only hot paths: `(status, created_at)` for dashboards and cleanup; `expires_at` for TTL scans.
-   Keep `job_events` append-only; avoid wide rows in `jobs`.
-   Defer table partitioning until real load justifies it; design schemas to be partition-ready.
````

## File: planning/data-layer/requirements.md
````markdown
<!-- artifact_id: 2b6c8b68-9f56-4c5b-9e5a-1b7c3a1d297e -->

# Data Layer — Requirements (Supabase + Drizzle)

## Introduction

Define the persistent data model and storage contracts for the YouTube/File clipper. Provide durable job state, append-only observability, optional API key management, and storage buckets for sources and results. The layer must be simple to adopt locally, scale in production, and expose clear TypeScript types via Drizzle.

---

## Functional Requirements

### 1. Job Persistence

-   User Story: As an API, I want to create a job row when a request is received, so that workers can process it asynchronously.
-   Acceptance Criteria:
    -   WHEN a valid job is created, THEN the system SHALL insert into `jobs` with status=`queued`, timestamps, and an optional `expires_at`.
    -   WHEN a worker claims a job, THEN the system SHALL update status to `processing`, increment `attempts` when appropriate, and record `last_heartbeat_at` periodically.
    -   WHEN processing finishes, THEN the system SHALL update status to `done|failed`, persist result keys or error fields, and set `expires_at`.

### 2. Job Events (Observability)

-   User Story: As an operator, I want an append-only event stream per job, so that I can trace progress and diagnose failures.
-   Acceptance Criteria:
    -   WHEN a state transition or progress update occurs, THEN the system SHALL insert into `job_events(job_id, ts, type, data)`.
    -   WHEN events are queried by `job_id`, THEN the system SHALL return them ordered by time with an index-supported plan.

### 3. Optional API Keys

-   User Story: As an admin, I want to manage API keys with scopes and rate limits, so that I can control access.
-   Acceptance Criteria:
    -   WHEN a key is created, THEN the system SHALL store a non-recoverable hash and metadata (owner, scopes, limits).
    -   WHEN a key is revoked, THEN the system SHALL prevent further use and record `revoked_at`.

### 4. Indices & Retention

-   User Story: As a DBA, I want efficient status and expiration queries, so that hot paths stay fast and data is cleaned automatically.
-   Acceptance Criteria:
    -   WHEN querying by `(status, created_at)`, THEN the system SHALL use a supporting index.
    -   WHEN selecting by `expires_at < now()`, THEN the system SHALL use a supporting index.
    -   WHEN cleanup runs, THEN the system SHALL delete expired rows and cascade-delete `job_events`.

### 5. Storage Buckets

-   User Story: As a worker, I want standard storage locations, so that uploads and results are predictable.
-   Acceptance Criteria:
    -   IF `sources` bucket is missing, THEN setup SHALL define it (private by default).
    -   IF `results` bucket is missing, THEN setup SHALL define it (private by default).
    -   WHEN results are requested, THEN the system SHALL issue signed URLs with short TTLs.

### 6. Type-safe Access (Drizzle)

-   User Story: As a developer, I want typed models and repositories, so that I can avoid runtime shape errors.
-   Acceptance Criteria:
    -   WHEN building the project, THEN Drizzle types SHALL match the schema.
    -   WHEN using repositories, THEN CRUD operations SHALL be typed and unit-tested.

### 7. Migrations & Seeds

-   User Story: As a maintainer, I want idempotent migrations and minimal seed data, so that devs can bootstrap quickly.
-   Acceptance Criteria:
    -   WHEN running migrations on a fresh DB, THEN all tables, types, and indexes SHALL be created with no errors.
    -   WHEN migrating a non-empty DB, THEN changes SHALL be forward-only and backward-safe where possible.

### 8. Error Handling & Consistency

-   User Story: As an engineer, I want consistent error envelopes from the data layer, so that callers can handle failures deterministically.
-   Acceptance Criteria:
    -   WHEN repository operations fail, THEN the layer SHALL return `{ ok: false, code, message }` without leaking secrets.
    -   WHEN transactions are needed (e.g., state transition + event), THEN the layer SHALL commit atomically or not at all.

### 9. Security & Compliance

-   User Story: As a security lead, I need secrets and PII protected, so that the system complies with best practices.
-   Acceptance Criteria:
    -   WHEN storing keys, THEN only hashes SHALL be stored (no raw tokens).
    -   WHEN signing URLs, THEN TTL SHALL be configurable and short by default.
    -   WHEN querying by user-provided input, THEN the layer SHALL use parameterized queries.

### 10. Performance & Scale

-   User Story: As a performance engineer, I want predictable query plans under load, so that SLOs are met.
-   Acceptance Criteria:
    -   WHEN listing recent jobs by status, THEN P95 query latency SHALL be low on realistic volumes (indexes in place).
    -   WHEN event volume is high, THEN inserts into `job_events` SHALL remain append-only and index-friendly.

---

## Non-Functional Requirements

-   Use Supabase Postgres for durability; Drizzle for schema/types/migrations.
-   Idempotent repository methods where safe (e.g., upsert on replays).
-   Support local development with a `.env`-driven DSN.
-   Document setup for buckets and DB migrations.
-   Prefer simple primitives first (no partitions initially); leave room for partitioning later.

---

## Out of Scope (for this layer)

-   Queue mechanics and worker orchestration (covered in Queue/Worker layers).
-   FFmpeg/ASR implementation details (covered in Media/ASR layers).
````

## File: planning/foundations/design.md
````markdown
artifact_id: 8a25df5e-5b35-4d3f-b3b1-2c2cd35a47af

# Foundations (Contracts & Utilities) — Design

## Overview

The Foundations layer provides two internal packages used by all other layers:

-   @clipper/contracts: domain types and Zod schemas (optionally emitting OpenAPI)
-   @clipper/common: configuration loading, structured logging, error envelopes, time utilities, and a job state machine

This design aligns with the layer plan in `planning/layers.md` and defines clear interfaces that upstream code can consume immediately.

## Architecture

```mermaid
flowchart LR
  subgraph Contracts[@clipper/contracts]
    Types[TS Types]
    Zod[Zod Schemas]
    OA[(OpenAPI JSON?)]
  end

  subgraph Common[@clipper/common]
    Cfg[Config Loader]
    Log[Logger]
    Err[Error Envelope + ServiceResult]
    Time[Time Utils]
    FSM[Job State Machine]
  end

  API[API Service]
  Worker[Worker Runtime]
  Queue[Queue Layer]
  Data[Data Layer]

  Types --> API
  Types --> Worker
  Types --> Queue
  Types --> Data
  Zod --> API
  Zod --> Worker
  OA --> API

  Cfg --> API
  Cfg --> Worker
  Log --> API
  Log --> Worker
  Err --> API
  Err --> Worker
  Time --> API
  Time --> Worker
  FSM --> Worker
```

### Core Components

-   Contracts: `types.ts`, `schemas.ts`, optional `openapi.ts` to generate OpenAPI from Zod.
-   Common: `config.ts`, `logger.ts`, `errors.ts` (ServiceError/Result), `time.ts`, `state.ts` (job FSM), plus barrel exports.

## Components and Interfaces

### Contracts

TypeScript types mirror what is outlined in `planning/layers.md`.

```ts
// @clipper/contracts/src/types.ts
export type SourceType = 'upload' | 'youtube';
export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface CreateJobInput {
    sourceType: SourceType;
    youtubeUrl?: string;
    uploadKey?: string; // Supabase path
    start: string; // HH:MM:SS(.ms)
    end: string; // HH:MM:SS(.ms)
    withSubtitles: boolean;
    burnSubtitles: boolean;
    subtitleLang?: 'auto' | string;
}

export interface JobRecord {
    id: string;
    status: JobStatus;
    progress: number; // 0..100
    resultVideoKey?: string;
    resultSrtKey?: string;
    error?: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
```

```ts
// @clipper/contracts/src/schemas.ts
import { z } from 'zod';

export const timecode = z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/, 'Expected HH:MM:SS(.ms)');

export const SourceType = z.enum(['upload', 'youtube']);
export const JobStatus = z.enum(['queued', 'processing', 'done', 'failed']);

export const CreateJobInput = z
    .object({
        sourceType: SourceType,
        youtubeUrl: z.string().url().optional(),
        uploadKey: z.string().min(1).optional(),
        start: timecode,
        end: timecode,
        withSubtitles: z.boolean().default(false),
        burnSubtitles: z.boolean().default(false),
        subtitleLang: z
            .union([z.literal('auto'), z.string().min(2)])
            .optional(),
    })
    .superRefine((val, ctx) => {
        if (val.sourceType === 'upload' && !val.uploadKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'uploadKey required for sourceType=upload',
                path: ['uploadKey'],
            });
        }
        if (val.sourceType === 'youtube' && !val.youtubeUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'youtubeUrl required for sourceType=youtube',
                path: ['youtubeUrl'],
            });
        }
    });

export const JobRecord = z.object({
    id: z.string().uuid(),
    status: JobStatus,
    progress: z.number().min(0).max(100),
    resultVideoKey: z.string().optional(),
    resultSrtKey: z.string().optional(),
    error: z.string().optional(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
```

```ts
// @clipper/contracts/src/openapi.ts (optional)
// If enabled, emit OpenAPI JSON based on Zod schemas using zod-to-openapi.
import { OpenAPIGenerator, extendZodWithOpenApi } from 'zod-to-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);
import * as S from './schemas';

export function generateOpenApi() {
    const registry = new OpenAPIGenerator(
        {
            CreateJobInput: S.CreateJobInput,
            JobRecord: S.JobRecord,
        },
        '3.0.0'
    );
    return registry.generateDocument({
        openapi: '3.0.0',
        info: { title: 'Clipper API', version: '1.0.0' },
        paths: {},
    });
}
```

### Common

```ts
// @clipper/common/src/config.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(10),
    QUEUE_URL: z.string().url().optional(), // e.g., Postgres connection
    ENABLE_YTDLP: z.boolean().default(false),
    CLIP_MAX_DURATION_SEC: z.number().int().positive().default(120),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
    const parsed = ConfigSchema.safeParse({
        ...env,
        ENABLE_YTDLP: env.ENABLE_YTDLP === 'true',
        CLIP_MAX_DURATION_SEC: env.CLIP_MAX_DURATION_SEC
            ? Number(env.CLIP_MAX_DURATION_SEC)
            : undefined,
    });
    if (!parsed.success) {
        const details = parsed.error.flatten();
        const redacted = Object.fromEntries(
            Object.entries(env).map(([k, v]) => [
                k,
                k.includes('KEY') ? '***' : v,
            ])
        );
        throw new Error(
            'Invalid configuration: ' +
                JSON.stringify({ details, env: redacted })
        );
    }
    return parsed.data;
}
```

```ts
// @clipper/common/src/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
    level: LogLevel;
    with(fields: Record<string, unknown>): Logger;
    debug(msg: string, fields?: Record<string, unknown>): void;
    info(msg: string, fields?: Record<string, unknown>): void;
    warn(msg: string, fields?: Record<string, unknown>): void;
    error(msg: string, fields?: Record<string, unknown>): void;
}

function emit(
    level: LogLevel,
    base: Record<string, unknown>,
    msg: string,
    fields?: Record<string, unknown>
) {
    const line = {
        level,
        ts: new Date().toISOString(),
        msg,
        ...base,
        ...fields,
    };
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(line));
}

export function createLogger(
    level: LogLevel = 'info',
    base: Record<string, unknown> = {}
): Logger {
    return {
        level,
        with(additional) {
            return createLogger(level, { ...base, ...additional });
        },
        debug(msg, fields) {
            if (['debug'].includes(level)) emit('debug', base, msg, fields);
        },
        info(msg, fields) {
            if (['debug', 'info'].includes(level))
                emit('info', base, msg, fields);
        },
        warn(msg, fields) {
            if (['debug', 'info', 'warn'].includes(level))
                emit('warn', base, msg, fields);
        },
        error(msg, fields) {
            emit('error', base, msg, fields);
        },
    };
}
```

```ts
// @clipper/common/src/errors.ts
export type ServiceErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'INTERNAL'
    | 'INVALID_STATE'
    | 'VALIDATION_FAILED';

export interface ErrorEnvelope {
    code: ServiceErrorCode;
    message: string;
    details?: unknown;
    correlationId?: string;
}

export class ServiceError extends Error {
    constructor(
        public code: ServiceErrorCode,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: ErrorEnvelope };
export type ServiceResult<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
    return { ok: true, value };
}
export function err(
    code: ServiceErrorCode,
    message: string,
    details?: unknown,
    correlationId?: string
): Err {
    return { ok: false, error: { code, message, details, correlationId } };
}

export function fromException(e: unknown, correlationId?: string): Err {
    if (e instanceof ServiceError) {
        return err(e.code, e.message, e.details, correlationId);
    }
    const message = e instanceof Error ? e.message : String(e);
    return err('INTERNAL', message, undefined, correlationId);
}
```

```ts
// @clipper/common/src/time.ts
export function parseTimecode(tc: string): number {
    const m = tc.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!m) throw new Error('Invalid timecode');
    const [hh, mm, ss, ms] = [
        Number(m[1]),
        Number(m[2]),
        Number(m[3]),
        m[4] ? Number(m[4]) : 0,
    ];
    return hh * 3600 + mm * 60 + ss + ms / 1000;
}

export function formatTimecode(seconds: number): string {
    const sign = seconds < 0 ? '-' : '';
    const s = Math.abs(seconds);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    const ms = Math.round((s - Math.floor(s)) * 1000);
    const core = `${hh.toString().padStart(2, '0')}:${mm
        .toString()
        .padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    return ms
        ? `${sign}${core}.${ms.toString().padStart(3, '0')}`
        : `${sign}${core}`;
}

export function validateRange(
    startTc: string,
    endTc: string,
    opts: { maxDurationSec: number }
) {
    const start = parseTimecode(startTc);
    const end = parseTimecode(endTc);
    if (!(start < end))
        return { ok: false as const, reason: 'start_not_before_end' };
    if (end - start > opts.maxDurationSec)
        return { ok: false as const, reason: 'duration_exceeds_cap' };
    return { ok: true as const, startSec: start, endSec: end };
}
```

```ts
// @clipper/common/src/state.ts
import { JobStatus } from '@clipper/contracts/types';
import { ServiceError } from './errors';

export type Transition = {
    from: JobStatus;
    to: JobStatus;
    at: string;
    reason?: string;
};

const allowed: Record<JobStatus, JobStatus[]> = {
    queued: ['processing'],
    processing: ['done', 'failed'],
    done: [],
    failed: [],
};

export function transition(
    current: JobStatus,
    to: JobStatus,
    reason?: string
): Transition {
    if (current === to && (to === 'done' || to === 'failed')) {
        return { from: current, to, at: new Date().toISOString(), reason };
    }
    const next = allowed[current] || [];
    if (!next.includes(to)) {
        throw new ServiceError(
            'INVALID_STATE',
            `Invalid transition ${current} -> ${to}`
        );
    }
    return { from: current, to, at: new Date().toISOString(), reason };
}
```

## Data Models

No persistence is introduced in Foundations. The `JobRecord` type matches the Data Layer plan; DB schema will be defined in the Data layer using Drizzle. The state transition object is designed for easy persistence into a `job_events` table later.

## Error Handling

-   ServiceError carries a stable code; conversion helpers produce a consistent envelope.
-   Config loader validates early and redacts secrets when throwing.
-   Logger avoids leaking sensitive values; callers should pass non-sensitive fields.

## Testing Strategy

-   Unit tests: time parsing/formatting/validation, config loader happy/invalid paths, state machine allowed/invalid transitions, schema validation for CreateJobInput and JobRecord.
-   Integration smoke: round-trip validation of example payloads; optional OpenAPI generation if flag enabled.
-   Performance: micro-bench parsing timecodes and schema validation to ensure negligible overhead.

## Assumptions

-   TypeScript 5.x, ESM modules, Bun runtime supported.
-   Zod for schema validation; optional zod-to-openapi for OpenAPI emission.
-   No external logging deps; console JSON is sufficient at this stage.
````

## File: planning/foundations/requirements.md
````markdown
artifact_id: 6d6b1b64-8f54-48b9-9c94-3da68b0e8fd2

# Foundations (Contracts & Utilities) — Requirements

## Introduction

The Foundations layer establishes shared contracts (TypeScript types + Zod schemas) and common utilities (config loader, logger, error envelope, time utils, and a job state machine). It must be lightweight, dependency-minimal, and reusable across API, Worker, Queue, and Data layers.

Primary goals:

-   Single source of truth for request/response and domain types
-   Strict validation and consistent error envelopes
-   Deterministic job state transitions
-   Reliable env/config loading and time parsing utilities

Success criteria (DoD): Types compile, schemas validate, and example payloads round-trip.

## Requirements

### R1. Contracts package (`@clipper/contracts`)

As a developer, I want shared domain types and Zod schemas, so that all services can rely on a single source of truth.

Acceptance Criteria:

-   WHEN a service imports `CreateJobInput`, `JobRecord`, `JobStatus`, `SourceType` THEN it SHALL compile without type errors.
-   WHEN a service validates `CreateJobInput` with Zod THEN valid inputs SHALL pass and invalid inputs (e.g., malformed timecodes, start >= end) SHALL fail with descriptive issues.
-   WHEN a `JobRecord` is serialized and parsed with its schema THEN it SHALL round-trip without loss.
-   IF OpenAPI generation is enabled via env flag THEN the package SHALL emit an OpenAPI JSON that matches the Zod schemas; otherwise it SHALL skip without impacting runtime.

### R2. Common package (`@clipper/common`) — Config Loader

As an operator, I want a typed, validated configuration loader, so that services fail fast and run with safe defaults.

Acceptance Criteria:

-   WHEN the process starts with required env vars present THEN `loadConfig()` SHALL return a typed config object.
-   IF a required env var is missing or invalid THEN `loadConfig()` SHALL throw a descriptive error before the app starts listening/processing.
-   WHEN optional envs are absent THEN defaults SHALL be applied as specified in the schema.
-   WHEN `NODE_ENV` is `test` THEN the loader SHALL allow test-safe defaults and override patterns.

### R3. Common package — Logger

As a developer, I want structured logs with correlation support, so that I can trace requests and jobs.

Acceptance Criteria:

-   WHEN `logger.with({ jobId })` is used THEN subsequent logs SHALL include the `jobId` field.
-   WHEN `LOG_LEVEL` is set THEN the logger SHALL respect it (e.g., debug|info|warn|error).
-   WHEN logging errors via helper THEN it SHALL include message, code, and cause stack (if present) without leaking secrets.

### R4. Common package — Error Envelope

As a client or service, I want a consistent error envelope, so that I can handle errors deterministically.

Acceptance Criteria:

-   WHEN an error occurs THEN responses (or internal results) SHALL use `{ code, message, details?, correlationId? }`.
-   WHEN converting exceptions to envelopes THEN known `ServiceError` codes SHALL map to stable `code` strings and HTTP statuses (for API layer use).
-   WHEN using `ServiceResult` helpers THEN consumers SHALL be able to pattern-match success or error without throwing.

### R5. Common package — Time Utilities

As a developer, I want reliable time parsing/formatting utilities for clip ranges, so that inputs are validated and safe.

Acceptance Criteria:

-   WHEN parsing `HH:MM:SS(.ms)` THEN `parseTimecode()` SHALL return seconds as a number within precision tolerance.
-   WHEN formatting seconds THEN `formatTimecode()` SHALL output `HH:MM:SS.mmm` (no trailing ms if 0).
-   WHEN validating a clip range THEN `validateRange(start, end, { maxDurationSec })` SHALL ensure `start < end` and duration <= cap, returning typed results.

### R6. Common package — Job State Machine

As a worker service, I want a strict job state machine, so that invalid transitions are prevented and events are clear.

Acceptance Criteria:

-   GIVEN states `queued → processing → done|failed` THEN only these transitions SHALL be permitted; all others SHALL be rejected with a specific error code.
-   WHEN a transition occurs THEN a transition object `{ from, to, at, reason? }` SHALL be produced for persistence/audit.
-   WHEN the same terminal state is re-applied idempotently THEN the transition helper SHALL treat it as a no-op success.

### R7. Developer Experience & Packaging

As a contributor, I want packages that are easy to import, test, and version, so that development is fast and reliable.

Acceptance Criteria:

-   WHEN installing the repo THEN `@clipper/contracts` and `@clipper/common` SHALL build (tsc) with no type errors.
-   WHEN running unit tests THEN schemas, state machine, and utilities SHALL pass happy-path and edge cases.
-   WHEN publishing (or linking) packages THEN their exports SHALL be tree-shakeable and ESM-compatible.

### Non-Functional Requirements

-   Reliability: Validation failures must be deterministic and human-readable.
-   Performance: Schema parsing and time utils add negligible overhead (<1ms typical per call for average-sized payloads).
-   Security: Config loader redacts secrets in logs; error envelopes do not leak sensitive env values.
-   Compatibility: TypeScript ≥ 5, Node/Bun ESM; zero or minimal runtime deps.
-   Observability: Logger includes correlation, structured fields, and supports JSON output.
````

## File: planning/queue-layer/design.md
````markdown
<!-- artifact_id: 5a5c1e9b-3f5f-4bf1-9a3c-1c1f1e9df0a3 -->

# Queue Layer — Design (pg-boss)

## Overview

Use pg-boss to implement an at-least-once queue backed by Supabase Postgres. Keep a thin adapter with stable interfaces so we can swap providers.

---

## Architecture

```mermaid
flowchart LR
  API -->|publish(job)| Queue[Queue Adapter]
  Queue -->|enqueue| PGBoss[(pg-boss on Postgres)]
  Worker -->|consume| Queue
  Queue -->|ack/retry/dlq| PGBoss
```

---

## Topics & Priority

Option A (single topic + priority):

-   Topic: `clips`
-   Priority mapping: fast=10, normal=50, bulk=90 (lower number = higher priority)

Option B (multiple topics):

-   Topics: `clips.fast`, `clips.normal`, `clips.bulk`

Recommendation: Start with single topic + priority for simplicity; add separate topics later if needed.

---

## Visibility, Retries, DLQ

-   Visibility/timeout: `QUEUE_VISIBILITY_SEC` (e.g., 90s). Configure via job `timeout`.
-   Retries: `QUEUE_MAX_ATTEMPTS` (default 3) with exponential backoff (base `QUEUE_RETRY_BACKOFF_MS_BASE`, max `QUEUE_RETRY_BACKOFF_MS_MAX`) and jitter.
-   Dead-letter: publish exhausted jobs to `clips.dlq` with original payload + error.

---

## Interfaces

```ts
export interface QueueMessage {
    jobId: string;
    priority?: 'fast' | 'normal' | 'bulk';
}

export interface QueueAdapter {
    publish(msg: QueueMessage, opts?: { timeoutSec?: number }): Promise<void>;
    consume(handler: (msg: QueueMessage) => Promise<void>): Promise<void>;
    shutdown(): Promise<void>;
}
```

pg-boss wiring (sketch):

```ts
import PgBoss from 'pg-boss';

const boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: process.env.PG_BOSS_SCHEMA || 'pgboss',
    // tuneable intervals
});

await boss.start();

await boss.subscribe(
    'clips',
    {
        teamSize: Number(process.env.QUEUE_CONCURRENCY || 4),
        includeMetadata: true,
    },
    async (job) => {
        try {
            await handler(job.data as QueueMessage);
            await boss.complete(job.id);
        } catch (err) {
            // let pg-boss handle retries per job options
            throw err;
        }
    }
);

export async function publishClip(msg: QueueMessage) {
    const priorityMap = { fast: 10, normal: 50, bulk: 90 } as const;
    await boss.publish('clips', msg, {
        priority: priorityMap[msg.priority ?? 'normal'],
        timeout: Number(process.env.QUEUE_VISIBILITY_SEC || 90) * 1000,
        retryLimit: Number(process.env.QUEUE_MAX_ATTEMPTS || 3),
        retryBackoff: true,
    });
}
```

Notes:

-   pg-boss manages retries/timeout internally; throwing from the handler triggers retry/backoff.
-   Include job metadata for tracing and metrics.

---

## Observability

-   Emit metrics: published, claimed, completed, failed, retried; job durations.
-   Log with jobId and topic; redact payload secrets.
-   Health: boss.on('error') handler + a `/healthz` that checks connection and queue lag (optional query on boss state).

---

## Shutdown

-   Trap SIGINT/SIGTERM; stop consuming; wait for in-flight jobs; call `boss.stop()`.
````

## File: planning/queue-layer/requirements.md
````markdown
<!-- artifact_id: 8c2f5e22-9f11-4d66-9a08-7d4b6a7d5a7f -->

# Queue Layer — Requirements (pg-boss)

## Introduction

Provide a durable, at-least-once job queue using Postgres via pg-boss. Support priorities, retries with backoff, visibility timeouts, and dead-letter handling. Expose a thin abstraction so we can swap implementations later if needed.

---

## Functional Requirements

1. Publish Jobs

-   User Story: As the API, I want to enqueue a job with metadata, so that workers can process it asynchronously.
-   Acceptance:
    -   WHEN a job is published, THEN it SHALL be persisted in Postgres and available for workers.
    -   WHEN publishing, THEN priority and timeout SHALL be configurable per job.

2. Consume & Process

-   User Story: As a worker, I want to claim jobs and process them with a visibility timeout, so that stuck jobs are retried.
-   Acceptance:
    -   WHEN a worker claims a job, THEN it SHALL be invisible to other workers until ack/timeout.
    -   WHEN processing completes, THEN the job SHALL be acked; on failure, retries SHALL apply.

3. Retries & Backoff

-   User Story: As an operator, I want controlled retries, so that transient errors recover without overload.
-   Acceptance:
    -   WHEN a job fails, THEN it SHALL retry up to MAX attempts with exponential backoff and jitter.
    -   WHEN retries are exhausted, THEN the job SHALL be sent to a dead-letter queue/topic.

4. Priorities

-   User Story: As a scheduler, I want job priorities, so that urgent tasks run first.
-   Acceptance:
    -   WHEN a job has priority `fast|normal|bulk`, THEN the system SHALL schedule higher-priority jobs sooner.

5. Idempotency

-   User Story: As a worker, I want to avoid duplicate processing, so that at-least-once delivery doesn’t create double work.
-   Acceptance:
    -   WHEN a job is re-delivered, THEN the worker SHALL short-circuit if it’s already completed in DB/Storage.

6. Observability

-   User Story: As an operator, I want metrics and logs, so that I can see queue depth, lag, and failures.
-   Acceptance:
    -   WHEN the system runs, THEN it SHALL emit metrics for queue depth, claim latency, success/fail counts, and retry counts.

7. Configuration

-   User Story: As a maintainer, I want runtime tuning via env, so that I can adjust without code changes.
-   Acceptance:
    -   WHEN env vars change, THEN visibility timeout, retries, and concurrency SHALL adjust accordingly on restart.

---

## Non-Functional Requirements

-   No DB extensions required beyond what Supabase provides by default.
-   Safe shutdown and graceful worker drain.
-   Bun compatibility (via node-postgres). If any edge arises, a small Node process is acceptable as a fallback.

---

## Out of Scope

-   Data model persistence (handled by Data Layer).
-   Media/ASR steps (Worker/Media layers).
````

## File: planning/design.md
````markdown
# High‑Performance Design Document

## Objective

Design the **highest‑throughput, lowest‑latency** version of the YouTube/File clipper with optional subtitles. Prioritize CPU/GPU efficiency, horizontal scalability, and predictable latency under load.

-   **Edge/API**: Bun + Elysia (TypeScript) for request handling, validation, and orchestration.
-   **Workers**: Go (static binary) _and/or_ Bun Workers. Default to **Go workers** for peak stability and RSS predictability; keep an abstraction so Bun Workers can be swapped in for simpler deploys.
-   **Media**: FFmpeg (+ hardware acceleration when available).
-   **ASR**: Faster‑Whisper / whisper.cpp with GPU (CUDA/ROCm) or hosted ASR for burst traffic.
-   **Queue**: Redis Streams (or NATS JetStream) with at‑least‑once semantics.
-   **DB**: Postgres with partitioned job tables; Drizzle for migrations & types.
-   **Storage**: Local NVMe scratch + S3/R2 for durable results; multipart uploads for egress.

---

## Architecture (C4‑ish)

```mermaid
flowchart LR
  subgraph Client
    UI[SPA / CLI / API client]
  end

  subgraph Edge
    Elysia[Bun + Elysia API]
    RL[Rate Limiter]
  end

  subgraph Control
    Q[Redis Streams / NATS JS]
    PG[(Postgres)]
  end

  subgraph Workers
    W1[Go Worker Pool\n(ffmpeg, ASR, mux)]
    W2[Bun Workers (optional)]
  end

  subgraph Storage
    NVME[/Local NVMe Scratch/]
    S3[(S3/R2)]
  end

  UI -->|POST /api/jobs| Elysia
  Elysia --> RL
  RL -->|accept| Elysia
  Elysia -->|validate & persist| PG
  Elysia -->|enqueue| Q
  W1 <-->|claim/ack| Q
  W1 -->|progress| PG
  W1 --> NVME
  W1 -->|upload results| S3
  Elysia -->|GET /api/jobs/:id| PG
  Elysia -->|GET result| S3
```

---

## Job Lifecycle (Sequence)

```mermaid
sequenceDiagram
  participant C as Client
  participant A as Bun API
  participant Q as Queue
  participant W as Worker
  participant DB as Postgres
  participant ST as S3/R2

  C->>A: POST /api/jobs {start,end,source,subs}
  A->>DB: Insert job(status=queued)
  A->>Q: XADD stream job
  A-->>C: 202 {id, status=queued}

  W->>Q: XREADGROUP claim job
  W->>DB: UPDATE status=processing
  W->>W: Resolve source (upload/YouTube*)
  W->>W: ffprobe, fast trim (stream copy)
  alt non-keyframe or codecs mismatch
    W->>W: re-encode (NVENC/VAAPI if available)
  end
  opt withSubtitles
    W->>W: ASR segment (GPU)
    W->>W: Burn-in (optional)
  end
  W->>ST: multipart upload results
  W->>DB: UPDATE status=done, result keys
  W->>Q: ACK
  C->>A: GET /api/jobs/:id
  A->>DB: SELECT job
  A-->>C: {status, progress, urls}
```

---

## Performance Principles

1. **Do the least work**: prefer stream‑copy (`-c copy`) when GOP alignment permits.
2. **Work where the data is**: pull to **local NVMe**, process, then push via **multipart**.
3. **Exploit hardware**: NVENC/VAAPI/QSV for re‑encode paths; GPU ASR.
4. **Exploit queues**: backpressure, priorities, and batch ASR where valid.
5. **Avoid hot locks**: stateless workers; shard by jobId to reduce contention.
6. **Zero‑downtime**: rolling updates; idempotent job steps and resumable uploads.

---

## Critical Path Optimizations

### Trimming

-   **Fast path**: `ffmpeg -ss <start> -to <end> -i INPUT -c copy -avoid_negative_ts 1 OUTPUT.mp4`
-   **Precision path** (when frame‑accurate is needed): `-ss` _after_ `-i` plus `-copyts` and smart `-force_key_frames` on a prepass when viable.
-   **Codec pass‑through**: If output container supports input codecs, avoid re‑encode entirely.

### Re‑encode (when necessary)

-   Use **H.264** via **NVENC** (or **VAAPI/QSV**) with `-preset p1/p2`, target **CRF‑like** via `-cq` or fixed `-b:v` for predictability.
-   Audio: `-c:a aac -b:a 160k` (or stream copy if matching).
-   Pin worker process CPU affinity for consistent caches under heavy load.

### Subtitles / ASR

-   **Segment‑only transcription**: feed only `[start,end]` audio to ASR.
-   **GPU ASR**: Faster‑Whisper, batch multiple tiny jobs to amortize GPU kernel launches.
-   **Burn‑in**: Single pass when possible: `-filter_complex [0:v][subs]overlay` or `subtitles=` with styles.

### I/O & Storage

-   **Scratch**: tmpfs/NVMe with quotas; spill to disk only when required.
-   **Upload**: S3 multipart with 8–16 concurrent parts; `--expected-size` for fewer ListParts calls.
-   **Download**: Prefer progressive HTTP range; for YouTube (if enabled), ytdlp with **throttling off** and max retries low.

### Queueing & Concurrency

-   **Redis Streams**: consumer groups with per‑worker prefetch=1..N; visibility timeout smaller than P95 job to catch stalls.
-   **Priorities**: separate streams (e.g., `clips.fast`, `clips.subs`) or message field `priority` + consumer scheduling.
-   **Backpressure**: API inserts to DB even when queue is saturated but returns `429` with `retryAfter` when system is at limit.

---

## Components

### API (Bun + Elysia)

-   Validates with Zod, writes job row (status=queued), enqueues to Redis/NATS.
-   Provides **signed result URLs** (short TTL) and a **progress** view (computed from worker heartbeats or parsed ffmpeg timecodes persisted to DB).
-   Rate limiting (sliding window) + global circuit breaker (shed load when NVMe or queue saturation detected).

### Worker (Go preferred; Bun Worker optional)

-   Long‑running daemon; prewarms **FFmpeg** and **ASR** resources.
-   **Idempotent**: if the same jobId appears, verify outputs exist in S3 and **short‑circuit** to done.
-   Heartbeats progress to DB every \~500ms.
-   **Crashes**: unacked messages return to stream after visibility timeout; a different worker claims them.

### Database (Postgres)

-   `jobs` partitioned by `created_at` (daily) to keep indexes hot.
-   Secondary indexes on `(status, created_at)` and `(id)`.
-   `job_events` append‑only for observability (progress snapshots, state transitions).

### Storage

-   Result keys are content‑hashed (`sha256/..../clip.mp4`) to enable de‑dup and CDN cache friendliness.
-   Lifecycle rules delete after `RETENTION_HOURS`.

---

## Data Model (Delta for Perf)

-   `jobs(status, priority, shard, created_at, updated_at, expires_at, progress, attempts, last_heartbeat_at, result_video_key, result_srt_key, error_code, error_message)`
-   `job_events(job_id, ts, type, data)`

Indexes

-   `idx_jobs_status_created_at`
-   `idx_jobs_expires_at`
-   `idx_job_events_job_id_ts`

---

## State Machine

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> processing: claimed by worker
  processing --> done: outputs uploaded
  processing --> failed: error/timeout
  failed --> queued: retry policy (max K)
  done --> expired: TTL cleanup
```

**Retry policy**: exponential backoff with jitter; cap at **3 attempts**; classify errors (transient vs permanent) to avoid useless retries.

---

## Config & Tuning

-   `MAX_CLIP_SECONDS`: default 120
-   `MAX_PARALLEL_ENCODERS_PER_NODE`: default `min(cores/2, 6)`
-   `NVME_SCRATCH_GB`: default 20
-   `QUEUE_VISIBILITY_SEC`: P95(job) × 1.5
-   `HEARTBEAT_MS`: 500
-   `S3_MULTIPART_CONCURRENCY`: 12
-   `ASR_GPU_BATCH`: 4–8 short segments

---

## SLOs & Capacity Planning

-   **SLO**: 95% of 30s clip jobs (no subtitles) finish in **≤ 30s**; with subtitles **≤ 90s** on GPU host.
-   **Single node** (16 vCPU, NVMe, no GPU): \~**10–16** concurrent re‑encodes; stream‑copy jobs 100+/min.
-   **GPU node** (A10/T4): ASR throughput **200–400× real‑time** for short segments with batching.

---

## Observability

-   **Metrics**: queue depth, claim latency, encode duration, ASR duration, S3 egress latency, NVMe utilization.
-   **Tracing**: jobId spans across API→worker→S3.
-   **Logging**: structured; scrub URLs/keys.

---

## Failure Modes & Mitigations

-   **NVMe full** → shed new work; pause consumers; alert.
-   **GPU OOM** → lower ASR batch size; route to CPU/hosted ASR.
-   **S3 throttling** → adaptive concurrency on multipart.
-   **Worker crash** → message visibility timeout returns job to queue.
-   **YouTube fetch blocked** → surface 403 with guidance; keep upload‑first path.

---

## Security

-   Signed download URLs (short TTL); no direct bucket listing.
-   API keys for programmatic use; per‑key quotas.
-   SSRF protections for source URLs; only allow whitelisted domains in fetch mode.

---

## Rollout Plan

1. Implement queue abstraction and LocalFS scratch → S3 path.
2. Ship Bun API + Bun workers (fastest path) with all perf switches off.
3. Introduce **Go worker** behind the same queue contract; A/B test on a subset of partitions.
4. Turn on HW acceleration where available; add GPU ASR pool.
5. Add autoscaling (HPA) by queue lag; shard by `shard = hash(jobId) % N` for worker locality.

---

## Interfaces (Stable Contracts)

```ts
// Queue contract (TS psuedotypes)
interface ClipJobMessage {
    id: string;
    source: { type: 'upload' | 'youtube'; url?: string; key?: string };
    startSec: number;
    endSec: number;
    subs: { enabled: boolean; burnIn: boolean; lang: 'auto' | string };
    priority: 'fast' | 'normal' | 'bulk';
}

interface Queue {
    publish(msg: ClipJobMessage): Promise<void>;
    // workers implement claim/ack with their client libs
}

// Progress events
interface ProgressEvent {
    jobId: string;
    pct: number;
    stage: 'probe' | 'trim' | 'encode' | 'asr' | 'upload';
}
```

---

## Appendix: FFmpeg presets

-   **Stream‑copy**: `-ss <start> -to <end> -i INPUT -c copy -movflags +faststart`
-   **NVENC**: `-hwaccel cuda -i INPUT -c:v h264_nvenc -preset p1 -cq 23 -c:a aac -b:a 160k -movflags +faststart`
-   **Burn‑in**: `-filter_complex "[0:v]subtitles=subs.srt:force_style='Fontsize=24,Outline=1'[v];[v][0:a]concat=n=1:v=1:a=1[outv][outa]" -map [outv] -map [outa]`
````

## File: planning/journey.md
````markdown
# design.md — High-Performance YouTube Clip Maker

## Overview

This design describes the most performant architecture for our YouTube Clip Maker service. We will maximize throughput, minimize latency, and isolate workloads to fully utilize system resources while staying cost-efficient.

Key strategies:

-   **Bun main API thread** for request handling and orchestration.
-   **Dedicated Bun Workers** for media processing (FFmpeg) and ASR transcription.
-   **In-memory + Redis hybrid queue** for job scheduling, backpressure, and distribution.
-   **Local NVMe scratch space** for temporary files to avoid network latency.
-   **S3/R2 storage** for result delivery with signed URLs.
-   **Optional GPU node pool** for ASR to drastically reduce transcription time.

---

## Architecture Diagram

```mermaid
graph TD
    C[Client (Web/UI/API Consumer)] -->|REST JSON| A[Bun API (Elysia)]
    A -->|enqueue job| Q[Job Queue (Redis)]
    Q -->|dispatch| W1[Bun Worker: FFmpeg]
    Q -->|dispatch| W2[Bun Worker: ASR]
    W1 -->|writes| S[(Local NVMe Scratch)]
    W2 -->|writes SRT| S
    S -->|upload| R[(S3/R2 Storage)]
    R -->|signed URL| A
    A -->|status/result JSON| C
```

---

## Processing Flow

1. **Job Creation**

    - Validate payload via Zod.
    - Generate Job ID.
    - Push to Redis queue with metadata.

2. **Worker Scheduling**

    - **FFmpeg Workers**: Pull jobs, fetch source (upload or yt-dlp), process clip, write to NVMe.
    - **ASR Workers**: If subtitles requested, pull transcription jobs, process with whisper.cpp GPU (or hosted API), write `.srt`.

3. **Result Storage**

    - Upload MP4 and optional SRT to S3/R2.
    - Update job status in Postgres.

4. **Delivery**

    - API returns signed URLs via `GET /api/jobs/:id/result`.

---

## Deployment Topology

```mermaid
graph LR
    subgraph API Layer
        A1[Bun API Instance 1]
        A2[Bun API Instance 2]
    end

    subgraph Worker Pool
        F1[FFmpeg Worker 1]
        F2[FFmpeg Worker 2]
        AWR1[ASR Worker 1]
        AWR2[ASR Worker 2]
    end

    A1 & A2 --> Q[(Redis Queue)]
    Q --> F1 & F2 & AWR1 & AWR2
    F1 & F2 & AWR1 & AWR2 --> DB[(Postgres)]
    F1 & F2 & AWR1 & AWR2 --> S3[(S3/R2)]
```

---

## Performance Optimizations

-   **Stream copy first**: Use `ffmpeg -ss start -to end -c copy` when possible.
-   **GPU-accelerated ASR**: Whisper with CUDA or hosted API for speed.
-   **Parallelization**: Limit per-worker concurrency to avoid CPU starvation, scale horizontally.
-   **Chunked upload** to S3 for large files to avoid blocking.
-   **Local caching**: Cache common YouTube sources briefly to avoid repeat downloads.
-   **Health checks**: Remove slow or dead workers from Redis queue rotation.

---

## Data Flow Optimization

-   Temporary processing happens on **local NVMe** → fastest possible I/O.
-   Immediate upload to S3 once processing finishes.
-   Expire files from scratch space quickly to free I/O bandwidth.

---

## Observability

-   **Metrics**: job duration histograms, FFmpeg time-to-first-byte, ASR duration.
-   **Structured logs**: correlated with job IDs.
-   **Alerts**: high failure rates, queue backlog thresholds.

---

## Future Scaling

-   **Multi-node**: Redis and Postgres centralize state; API and workers can scale independently.
-   **Specialized workers**: Dedicated GPU nodes for ASR; CPU-heavy nodes for FFmpeg.
-   **Edge caching**: CDN distribution of results for global low-latency delivery.
````

## File: planning/layers.md
````markdown
# 0) Foundations (Contracts & Utilities)

**What:** Shared TypeScript types, Zod schemas, time parsing, config loader, error envelope, job state machine.
**Deliverables:**

-   `@clipper/contracts` (types + Zod → optional OpenAPI)
-   `@clipper/common` (env loader, logger, error helper, time utils)
    **DoD:** Types compile, schemas validate, example payloads round-trip.

# 1) Data Layer (Supabase + Drizzle)

**What:** Postgres schema + migrations; Supabase Storage buckets.
**Deliverables:**

-   Tables: `jobs`, `job_events`, (optional) `api_keys`
-   Indices & retention TTLs; storage buckets `sources/`, `results/`
-   Drizzle models + repo functions
    **DoD:** Can create/read/update job rows locally; storage write/read works with signed URLs.

# 2) Queue Layer (pick one and commit)

**What:** Abstraction + concrete queue. Recommend **pg-boss** (Postgres) to start; Redis Streams later if needed.
**Deliverables:**

-   `Queue.publish()`, `Queue.consume()`, ack/retry/backoff, priorities
-   Visibility timeout & dead-letter handling
    **DoD:** Jobs published/claimed/acked; retries capped; unit tests simulate crash/resume.

# 3) Media IO (Source Resolver)

**What:** Resolve the input media to a local file path.
**Deliverables:**

-   Upload path: fetch from Supabase Storage to NVMe
-   (Optional, gated) YouTube: `yt-dlp` resolver behind `ENABLE_YTDLP`
-   SSRF guard + size/duration caps via `ffprobe`
    **DoD:** Given a job, returns a local source file or a clear error.

# 4) FFmpeg Service (Clipper)

**What:** The fast clip path with fallback.
**Deliverables:**

-   Stream-copy first: `-ss -to -c copy`
-   Fallback re-encode: x264 veryfast; `-movflags +faststart`
-   Progress parser (stderr `time=` → % of segment)
    **DoD:** Generates correct MP4 on both paths; progress updates emitted.

# 5) ASR Service (Groq Whisper)

**What:** Subtitles for the requested segment only.
**Deliverables:**

-   Client for Groq API (model selection via env)
-   Segment extraction (`-vn -ac 1 -ar 16k`) → send to Groq → `.srt` writer
-   Burn-in filter (`subtitles=`) pipeline option
    **DoD:** For a job with subs, returns valid `.srt`; optional burned-in MP4 verified.

# 6) Worker Runtime

**What:** The long-running job processor.
**Deliverables:**

-   Concurrency control; prefetch/prefork settings
-   Heartbeats → DB (`progress`, `last_heartbeat_at`)
-   Idempotency: short-circuit if outputs exist in Storage
-   Structured state transitions: `queued → processing → done|failed` + retries
    **DoD:** Can drain a queue; survives crashes; meets SLOs on sample load.

# 7) API (Bun + Elysia)

**What:** Public REST to submit, check, and fetch results.
**Endpoints:**

-   `POST /api/jobs` (validate → persist → enqueue)
-   `POST /api/uploads` or `POST /api/jobs/upload` (multipart)
-   `GET /api/jobs/:id` (status/progress)
-   `GET /api/jobs/:id/result` (signed URLs)
    **Cross-cutting:** rate limit, CORS, ADMIN_ENABLED, consistent error envelope.
    **DoD:** E2E happy path from request → downloadable clip.

# 8) Storage Output & Delivery

**What:** Ship outputs to Supabase Storage and sign URLs.
**Deliverables:**

-   Result keys: `results/{jobId}/clip.mp4`, `clip.srt`
-   Signed URL helper with short TTL
-   Optional CDN headers
    **DoD:** Download works from a cold client via signed link.

# 9) Retention & Cleanup

**What:** TTL deletion of old artifacts and rows.
**Deliverables:**

-   Scheduled task (cron) removing expired Storage objects + DB rows
-   Safety: dry-run mode, rate-limited deletes
    **DoD:** Items older than TTL disappear automatically; metrics confirm.

# 10) Observability & Ops

**What:** Know what’s happening and when it breaks.
**Deliverables:**

-   `/healthz`, `/metrics` (Prometheus)
-   Job duration histograms; queue depth; Groq latency; S3 upload latency
-   Correlated logs by jobId; redaction of secrets
    **DoD:** Dash shows current queue, success rate, P95s; alerts fire on backlog/fail rate.

# 11) Security & Abuse Controls

**What:** Keep it up and clean.
**Deliverables:**

-   IP rate limits; max concurrent jobs per IP/key
-   SSRF protections; input URL allowlist when fetch is enabled
-   API key support for programmatic access (optional)
    **DoD:** Load tests don’t DOS the node; malicious URLs are rejected.

# 12) Docs & SDK Stubs

**What:** Make it usable without you.
**Deliverables:**

-   Markdown API reference + curl examples
-   Optional OpenAPI from Zod
-   Tiny TS client (`createJob`, `getStatus`, `getResult`)
    **DoD:** A new dev can integrate in <30 minutes.

# 13) (Optional) Minimal UI

**What:** A 1-page tool to demo and dogfood.
**Deliverables:**

-   URL/upload inputs, time pickers, “Subtitles/Burn-in” toggles
-   Job card with live polling + download
    **DoD:** Non-dev can create a clip in under a minute.

---

## Build Order (fastest path to value)

1. **0,1,2** Foundations + DB + Queue
2. **4** FFmpeg clipper (upload-only)
3. **6** Worker runtime with progress → **7** API (create/status/result)
4. **8** Storage delivery + signed URLs
5. **9** Cleanup + **10** Observability
6. **5** Groq Whisper ASR + burn-in
7. **3** (optional) YouTube resolver gated by env
8. **12/13** Docs + tiny UI

---

## Clear Interfaces (keep seams loose)

```ts
// contracts
type SourceType = 'upload' | 'youtube';
type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

interface CreateJobInput {
    sourceType: SourceType;
    youtubeUrl?: string;
    uploadKey?: string; // Supabase path
    start: string; // HH:MM:SS(.ms)
    end: string;
    withSubtitles: boolean;
    burnSubtitles: boolean;
    subtitleLang?: 'auto' | string;
}

interface JobRecord {
    id: string;
    status: JobStatus;
    progress: number;
    resultVideoKey?: string;
    resultSrtKey?: string;
    error?: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

// queue
interface Queue {
    publish(jobId: string): Promise<void>;
    consume(handler: (jobId: string) => Promise<void>): Promise<void>;
}

// services
interface SourceResolver {
    toLocal(
        job: JobRecord
    ): Promise<{ localPath: string; cleanup: () => Promise<void> }>;
}
interface Clipper {
    clip(args: {
        input: string;
        startSec: number;
        endSec: number;
    }): Promise<{ localPath: string; progress$: AsyncIterable<number> }>;
}
interface ASR {
    transcribe(args: {
        input: string;
        startSec: number;
        endSec: number;
        lang?: string;
    }): Promise<{ srtPath: string }>;
}
interface Storage {
    upload(localPath: string, key: string): Promise<void>;
    sign(key: string, ttlSec: number): Promise<string>;
    remove(key: string): Promise<void>;
}
```

---

## Definition of Done for the whole project

-   Meets SLOs: P95 ≤ 30s (no subs) / ≤ 90s (with subs) for 30s clips on target hardware.
-   Handles 100+ concurrent stream-copy jobs on a single node without errors.
-   Clean error envelopes; retries + idempotency verified.
-   Docs published; minimal UI demo works end-to-end.
````

## File: planning/requirements.md
````markdown
# requirements.md — YouTube Clip Maker

## Introduction

A web service that clips segments from YouTube videos (or uploaded files) between a start and end timestamp, with optional autogenerated subtitles. Prioritize performance, scalability, and reliability. The service exposes a REST API and uses **Bun + Elysia** for the API layer, **FFmpeg** for clipping, **Groq Whisper API** for ASR (subtitles), **Supabase** (**Postgres + Storage**) for metadata and file storage, and **Redis or Postgres-based queueing** (e.g., `pgmq`/`pg-boss`) for job distribution.

---

## Functional Requirements

### 1. Job Creation

-   **Endpoint**: `POST /api/jobs`
-   Accepts: sourceType (`youtube`|`upload`), youtubeUrl or uploadToken, start, end, withSubtitles, burnSubtitles, subtitleLang.
-   Validate timestamps, enforce max clip length.
-   Return jobId, status=queued, expiresAt.

### 2. File Uploads

-   **Endpoint**: `POST /api/uploads` or multipart `POST /api/jobs/upload`
-   Provide a **Supabase Storage** upload URL (signed) or accept file directly and upload server-side using the **service role key**.
-   Associate uploaded file with jobId and store under bucket `sources/{jobId}/source.ext`.

### 3. Job Processing

-   Use FFmpeg to trim video segment.
-   Prefer stream copy for speed, fallback to re-encode if needed.
-   If `withSubtitles=true`, call **Groq Whisper** (e.g., `whisper-large-v3` or `faster-whisper` variants) to produce `.srt` for just the `[start,end]` segment; optionally burn-in via FFmpeg.
-   Persist outputs to **Supabase Storage** under `results/{jobId}/clip.mp4` and optional `clip.srt`.

### 4. Job Status

-   **Endpoint**: `GET /api/jobs/:id`
-   Return status (`queued|processing|done|failed`), progress %, result URLs (or null), expiresAt, error (if any).

### 5. Result Delivery

-   **Endpoint**: `GET /api/jobs/:id/result`
-   Return **Supabase Storage signed URLs** for MP4 and optional SRT.

### 6. Error Handling

-   All errors follow `{ error: { code, message, details? } }` format.
-   Validation errors return HTTP 400; unauthorized YouTube downloads return 403.

### 7. Expiration & Cleanup

-   Results expire after `RETENTION_HOURS`.
-   Background worker deletes expired files and DB records; **Supabase Storage** objects are removed by key.

### 8. Performance & Scaling

-   Local NVMe scratch for temp files.
-   **Queue**: Redis Streams **or** Postgres-based queue (Supabase Postgres with `pgmq`/`pg-boss`).
-   **ASR**: Groq Whisper for low-latency GPU inference; fallback to local `whisper.cpp` if configured.
-   Horizontal scaling of API and workers.

### 9. Security

-   Signed **Supabase Storage** result URLs with short TTL.
-   Rate limits per IP.
-   ADMIN_ENABLED env flag to gate management routes.
-   Protect **Supabase service role key** and **GROQ_API_KEY**; server-side only.

### 10. Observability

-   Metrics: job duration, FFmpeg processing time, ASR processing time (Groq), queue lag.
-   Logs: structured JSON correlated by jobId; redact URLs and tokens.
-   Alerts: queue backlog, Groq error rate/latency spikes, high failure rate.

---

## Non-Functional Requirements

-   P95 for 30s clip without subtitles ≤ 30s; with subtitles ≤ 90s (via Groq Whisper).
-   Handle at least 100 concurrent stream-copy jobs per node.
-   Idempotent job processing to handle retries.
-   Compliant with YouTube ToS for content handling.

---

## API Endpoints Summary

-   `POST /api/jobs` — create new job.
-   `POST /api/uploads` — get upload URL.
-   `POST /api/jobs/upload` — upload file with job creation.
-   `GET /api/jobs/:id` — check job status.
-   `GET /api/jobs/:id/result` — get result URLs.
-   `GET /healthz` — health check.
-   `GET /metrics` — Prometheus metrics (admin only).

---

## Dependencies

-   Bun + Elysia (API)
-   Supabase (Postgres + Storage)
-   Redis **or** Postgres-based queue (`pgmq`, `pg-boss`)
-   FFmpeg (clipping)
-   **Groq Whisper API** (ASR)

---

## Acceptance Criteria

-   Valid requests are queued and processed within SLOs.
-   Invalid input returns clear, consistent error messages.
-   Progress is visible via `GET /api/jobs/:id`.
-   Subtitles are generated via **Groq Whisper** when requested; `.srt` delivered or burn-in applied.
-   Results are accessible via **Supabase signed URLs** until `expiresAt`.
-   Service scales horizontally without downtime.

---

## Risks & Mitigation

-   **YouTube ToS violations** — default to upload path; gate yt-dlp usage.
-   **Groq API outages or rate limits** — fallback to local whisper.cpp or queued retry with exponential backoff; surface 503 gracefully.
-   **High load** — queue backpressure; rate limiting; increase worker pool.
-   **Supabase throttling/limits** — tune multipart uploads; cache-bust and respect RLS; monitor usage quotas.

---

## Future Enhancements

-   WebSocket updates for real-time progress.
-   Multiple clip segments per job.
-   OAuth via Supabase Auth for user-specific job management.

---

## Configuration

-   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
-   `SUPABASE_STORAGE_BUCKET` (e.g., `clips`)
-   `GROQ_API_KEY`
-   `RETENTION_HOURS`, `MAX_CLIP_SECONDS`
-   Queue: `REDIS_URL` **or** Postgres DSN + queue schema
````

## File: .env.example
````
## Example .env for yt-clipper
# Copy to .env and fill in required values. Never commit real secrets.

SIGNED_URL_TTL_SEC=600
RETENTION_HOURS=72
MAX_CLIP_SECONDS=120
LOG_LEVEL=info
ADMIN_ENABLED=false

# --- Database / Supabase ---
# Fill these with your project values (do not commit secrets publicly)
# DATABASE_URL format (example): postgres://user:password@host:5432/db?sslmode=require
DATABASE_URL=postgresql://<user>:<password>@<host>:6543/postgres?sslmode=require
SUPABASE_URL=https://<your_project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
SUPABASE_SOURCES_BUCKET=sources
SUPABASE_RESULTS_BUCKET=results

# --- Queue (pg-boss) ---
QUEUE_PROVIDER=pgboss
PG_BOSS_SCHEMA=pgboss
QUEUE_NAME=clips
QUEUE_VISIBILITY_SEC=90
QUEUE_MAX_ATTEMPTS=3
QUEUE_RETRY_BACKOFF_MS_BASE=1000
QUEUE_RETRY_BACKOFF_MS_MAX=60000
QUEUE_CONCURRENCY=4
GROQ_API_KEY=
GROQ_MODEL=whisper-large-v3-turbo
NODE_ENV=development
DB_PASSWORD=
````

## File: .gitignore
````
# dependencies (bun install)
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store

.cursor
````

## File: CLAUDE.md
````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

Overview

- This repository uses Bun as the runtime and tooling by default. Follow Bun commands and APIs described below.

Developer commands

- Install dependencies: bun install
- Run the app (development with hot reload): bun --hot ./index.ts
- Run a single TypeScript file: bun <file.ts>
- Run tests: bun test
- Build assets (CSS/TS/HTML): bun build <file.html|file.ts|file.css>
- Run a script defined in package.json: bun run <script>

Linting & typechecking

- Type checking is expected to use the TypeScript toolchain; run tsc if configured or rely on the user's preferred command. Add tests with bun test.

Architecture summary

- Small single-package repo. Entry point: index.ts (project root) — Bun serves HTML and backend routes.
- Frontend: HTML imports (index.html) import .tsx/.ts/.js modules directly. React components may be in frontend.tsx or similarly named files.
- Backend: index.ts registers routes via Bun.serve and may expose endpoints under /api/*.
- Data storage: prefer built-in Bun integrations (bun:sqlite, Bun.sql for Postgres, Bun.redis) when present.

Files of interest

- index.ts — application entrypoint (server + routes)
- package.json — project metadata and scripts

Development notes

- Do not use Express, ws, pg, better-sqlite3, or other Node packages that Bun provides alternatives for; use Bun's built-ins.
- Bun automatically loads .env; do not add dotenv.
- When modifying files, follow existing code style and import patterns.

Editing guidance for Claude Code

- Prefer editing existing files over creating new ones.
- Avoid adding new docs unless requested.
- When running commands locally, use Bun commands listed above.

For server use Elysia 
---
````

## File: index.ts
````typescript
console.log("Hello via Bun!");
````

## File: README.md
````markdown
# yt-clipper

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Environment Variables (R2)

The Foundations config loader (`@clipper/common/config`) validates these env vars. Bun automatically loads `.env`.

-   NODE_ENV: development | test | production (default: development)
-   LOG_LEVEL: debug | info | warn | error (default: info)
-   SUPABASE_URL: Supabase project URL (required)
-   SUPABASE_ANON_KEY: Supabase anon/service key (required)
-   QUEUE_URL: Queue/DB URL (optional; e.g., Postgres conn string)
-   ENABLE_YTDLP: Enable YouTube resolver (default: false)
-   CLIP_MAX_DURATION_SEC: Max clip duration in seconds (default: 120)
-   ENABLE_OPENAPI: If 'true', allows generating OpenAPI from contracts (optional)

Example `.env`:

```env
NODE_ENV=development
LOG_LEVEL=debug
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=replace-with-key
QUEUE_URL=postgres://user:pass@localhost:5432/clipper
ENABLE_YTDLP=false
CLIP_MAX_DURATION_SEC=120
# Optional
ENABLE_OPENAPI=false
```
````

## File: vitest.setup.ts
````typescript
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
````

## File: packages/api/src/index.ts
````typescript
import { Elysia, t } from 'elysia';
import cors from '@elysiajs/cors';
import { Schemas, CreateJobInputType } from '@clipper/contracts';
import { createLogger } from '@clipper/common';
import { InMemoryJobsRepo, InMemoryJobEventsRepo } from '@clipper/data';
import { PgBossQueueAdapter } from '@clipper/queue';

const log = createLogger((process.env.LOG_LEVEL as any) || 'info').with({
    mod: 'api',
});

const jobsRepo = new InMemoryJobsRepo();
const eventsRepo = new InMemoryJobEventsRepo();
const queue = new PgBossQueueAdapter({
    connectionString: process.env.DATABASE_URL!,
});
await queue.start();

function tcToSec(tc: string) {
    const [hh, mm, rest] = tc.split(':');
    const [ss, ms] = rest?.split('.') || [rest || '0', undefined];
    return (
        Number(hh) * 3600 +
        Number(mm) * 60 +
        Number(ss) +
        (ms ? Number(`0.${ms}`) : 0)
    );
}

export const app = new Elysia()
    .use(cors())
    .get('/healthz', async () => {
        const h = await queue.health();
        return { ok: h.ok, queue: h };
    })
    .get('/metrics/queue', () => queue.getMetrics())
    .post('/api/jobs', async ({ body, set }) => {
        const parsed = Schemas.CreateJobInput.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return {
                error: {
                    code: 'VALIDATION_FAILED',
                    message: parsed.error.message,
                },
            };
        }
        const input = parsed.data as CreateJobInputType;
        const id = crypto.randomUUID();
        const startSec = tcToSec(input.start);
        const endSec = tcToSec(input.end);
        if (endSec - startSec > Number(process.env.MAX_CLIP_SECONDS || 120)) {
            set.status = 400;
            return {
                error: {
                    code: 'CLIP_TOO_LONG',
                    message: 'Clip exceeds MAX_CLIP_SECONDS',
                },
            };
        }
        const row = await jobsRepo.create({
            id,
            status: 'queued',
            progress: 0,
            sourceType: input.sourceType,
            sourceKey: input.uploadKey,
            sourceUrl: input.youtubeUrl,
            startSec,
            endSec,
            withSubtitles: input.withSubtitles,
            burnSubtitles: input.burnSubtitles,
            subtitleLang: input.subtitleLang,
            resultVideoKey: undefined,
            resultSrtKey: undefined,
            errorCode: undefined,
            errorMessage: undefined,
            expiresAt: undefined,
        });

        await eventsRepo.add({
            jobId: id,
            ts: new Date().toISOString(),
            type: 'created',
        });
        await queue.publish({ jobId: id, priority: 'normal' });

        return {
            id: row.id,
            status: row.status,
            expiresAt: new Date(
                Date.now() +
                    Number(process.env.RETENTION_HOURS || 72) * 3600_000
            ).toISOString(),
        };
    });

if (import.meta.main) {
    const port = Number(process.env.PORT || 3000);
    const server = Bun.serve({ fetch: app.fetch, port });
    log.info('API started', { port });
    const stop = async () => {
        log.info('API stopping');
        server.stop(true);
        await queue.shutdown();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
````

## File: packages/common/src/errors.ts
````typescript
import { redactSecrets } from './redact';
export type ServiceErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'INTERNAL'
    | 'INVALID_STATE'
    | 'VALIDATION_FAILED';

export interface ErrorEnvelope {
    code: ServiceErrorCode;
    message: string;
    details?: unknown;
    correlationId?: string;
}

export class ServiceError extends Error {
    constructor(
        public code: ServiceErrorCode,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: ErrorEnvelope };
export type ServiceResult<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
    return { ok: true, value };
}
export function err(
    code: ServiceErrorCode,
    message: string,
    details?: unknown,
    correlationId?: string
): Err {
    // Redact secrets in message/details
    return {
        ok: false,
        error: {
            code,
            message: redactSecrets(message),
            details: redactSecrets(details),
            correlationId,
        },
    };
}

export function fromException(e: unknown, correlationId?: string): Err {
    if (e instanceof ServiceError) {
        return err(e.code, e.message, e.details, correlationId);
    }
    const message = e instanceof Error ? e.message : String(e);
    return err('INTERNAL', message, undefined, correlationId);
}
````

## File: packages/common/src/logger.ts
````typescript
import { redactSecrets } from './redact';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
    level: LogLevel;
    with(fields: Record<string, unknown>): Logger;
    debug(msg: string, fields?: Record<string, unknown>): void;
    info(msg: string, fields?: Record<string, unknown>): void;
    warn(msg: string, fields?: Record<string, unknown>): void;
    error(msg: string, fields?: Record<string, unknown>): void;
}

function emit(
    level: LogLevel,
    base: Record<string, unknown>,
    msg: string,
    fields?: Record<string, unknown>
) {
    const line = {
        level,
        ts: new Date().toISOString(),
        msg: redactSecrets(msg),
        ...redactSecrets(base),
        ...redactSecrets(fields ?? {}),
    };
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(line));
}

export function createLogger(
    level: LogLevel = 'info',
    base: Record<string, unknown> = {}
): Logger {
    return {
        level,
        with(additional) {
            return createLogger(level, { ...base, ...additional });
        },
        debug(msg, fields) {
            if (['debug'].includes(level)) emit('debug', base, msg, fields);
        },
        info(msg, fields) {
            if (['debug', 'info'].includes(level))
                emit('info', base, msg, fields);
        },
        warn(msg, fields) {
            if (['debug', 'info', 'warn'].includes(level))
                emit('warn', base, msg, fields);
        },
        error(msg, fields) {
            emit('error', base, msg, fields);
        },
    };
}
````

## File: packages/contracts/package.json
````json
{
    "name": "@clipper/contracts",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json"
    },
    "dependencies": {
        "zod": "^3.23.8",
        "zod-to-openapi": "^0.2.1"
    },
    "devDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/data/src/db/connection.ts
````typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

export function createDb(url = process.env.DATABASE_URL): DB {
    if (!url) {
        throw new Error('DATABASE_URL is required');
    }
    const pool = new Pool({ connectionString: url });
    return drizzle(pool, { schema });
}
````

## File: packages/data/src/db/schema.ts
````typescript
import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    boolean,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';

// Enums
export const jobStatus = pgEnum('job_status', [
    'queued',
    'processing',
    'done',
    'failed',
]);
export const sourceType = pgEnum('source_type', ['upload', 'youtube']);

// jobs table
export const jobs = pgTable(
    'jobs',
    {
        id: uuid('id').primaryKey(),
        status: jobStatus('status').notNull().default('queued'),
        progress: integer('progress').notNull().default(0),
        sourceType: sourceType('source_type').notNull(),
        sourceKey: text('source_key'),
        sourceUrl: text('source_url'),
        startSec: integer('start_sec').notNull(),
        endSec: integer('end_sec').notNull(),
        withSubtitles: boolean('with_subtitles').notNull().default(false),
        burnSubtitles: boolean('burn_subtitles').notNull().default(false),
        subtitleLang: text('subtitle_lang'),
        resultVideoKey: text('result_video_key'),
        resultSrtKey: text('result_srt_key'),
        errorCode: text('error_code'),
        errorMessage: text('error_message'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
    },
    (t: any) => ({
        idxStatusCreatedAt: index('idx_jobs_status_created_at').on(
            t.status,
            t.createdAt
        ),
        idxExpiresAt: index('idx_jobs_expires_at').on(t.expiresAt),
    })
);

// job_events table
export const jobEvents = pgTable(
    'job_events',
    {
        jobId: uuid('job_id')
            .notNull()
            .references(() => jobs.id, { onDelete: 'cascade' }),
        ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
        type: text('type').notNull(),
        data: jsonb('data'),
    },
    (t: any) => ({
        idxJobIdTs: index('idx_job_events_job_id_ts').on(t.jobId, t.ts),
    })
);

// api_keys table (optional)
export const apiKeys = pgTable('api_keys', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    revoked: boolean('revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobEvent = typeof jobEvents.$inferSelect;
export type NewJobEvent = typeof jobEvents.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
````

## File: packages/data/src/cleanup.ts
````typescript
import { createDb } from './db/connection';
import { jobs } from './db/schema';
import { lte, isNotNull, and, eq, desc } from 'drizzle-orm';
import type { StorageRepo } from './storage';
import type { Logger } from '@clipper/common';
import { createLogger, noopMetrics, type Metrics } from '@clipper/common';

export type CleanupOptions = {
    now?: Date;
    batchSize?: number;
    dryRun?: boolean;
    rateLimitDelayMs?: number;
    storage?: StorageRepo | null;
    logger?: Logger;
    metrics?: Metrics;
};

export type CleanupItem = {
    jobId: string;
    resultKeys: string[];
};

export type CleanupResult = {
    scanned: number;
    deletedJobs: number;
    deletedObjects: number;
    items: CleanupItem[];
    errors: Array<{ jobId: string; stage: 'storage' | 'db'; error: string }>;
};

export async function cleanupExpiredJobs(
    opts: CleanupOptions = {}
): Promise<CleanupResult> {
    const db = createDb();
    const now = opts.now ?? new Date();
    const limit = opts.batchSize ?? 100;
    const dryRun = opts.dryRun ?? true;
    const delay = opts.rateLimitDelayMs ?? 0;
    const storage = opts.storage ?? null;
    const logger =
        opts.logger ?? createLogger('info').with({ comp: 'cleanup' });
    const metrics = opts.metrics ?? noopMetrics;

    const rows = await db
        .select()
        .from(jobs)
        .where(and(isNotNull(jobs.expiresAt), lte(jobs.expiresAt, now)))
        .orderBy(desc(jobs.expiresAt))
        .limit(limit);

    const result: CleanupResult = {
        scanned: rows.length,
        deletedJobs: 0,
        deletedObjects: 0,
        items: [],
        errors: [],
    };

    for (const r of rows) {
        const jobId = r.id as string;
        const keys = [r.resultVideoKey, r.resultSrtKey].filter(
            (k): k is string => !!k
        );
        result.items.push({ jobId, resultKeys: keys });

        if (dryRun) continue;

        // remove storage objects if configured
        if (storage) {
            for (const key of keys) {
                try {
                    await storage.remove(key);
                    result.deletedObjects++;
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    result.errors.push({ jobId, stage: 'storage', error: msg });
                    logger?.warn('storage delete failed', { jobId, key, msg });
                }
                if (delay > 0) await sleep(delay);
            }
        }

        // delete the job (cascades events)
        try {
            await db.delete(jobs).where(eq(jobs.id, jobId));
            result.deletedJobs++;
            metrics.inc('cleanup.jobs.deleted', 1);
            logger.info('job deleted', { jobId });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            result.errors.push({ jobId, stage: 'db', error: msg });
            logger?.error('db delete failed', { jobId, msg });
        }

        if (delay > 0) await sleep(delay);
    }

    return result;
}

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}
````

## File: packages/queue/src/dlq-consumer.ts
````typescript
import PgBoss from 'pg-boss';
import { createLogger, type LogLevel } from '@clipper/common';

const envLevel = process.env.LOG_LEVEL;
const level: LogLevel =
    envLevel === 'debug' ||
    envLevel === 'info' ||
    envLevel === 'warn' ||
    envLevel === 'error'
        ? envLevel
        : 'info';
const log = createLogger(level).with({ mod: 'queue-dlq' });

export async function startDlqConsumer(opts?: {
    connectionString?: string;
    schema?: string;
    queueName?: string;
    concurrency?: number;
}) {
    const connectionString =
        opts?.connectionString || process.env.DATABASE_URL!;
    const schema = opts?.schema || process.env.PG_BOSS_SCHEMA || 'pgboss';
    const topic = (opts?.queueName ||
        process.env.QUEUE_NAME ||
        'clips') as string;
    const dlqTopic = `${topic}.dlq`;
    const concurrency = Number(
        opts?.concurrency || process.env.QUEUE_CONCURRENCY || 2
    );

    const boss = new PgBoss({ connectionString, schema });
    await boss.start();
    log.info('DLQ consumer started', { dlqTopic, concurrency });

    await boss.work(dlqTopic, { batchSize: concurrency }, async (jobs) => {
        for (const job of jobs) {
            const payload = job.data as Record<string, unknown>;
            log.error('DLQ message received', { jobId: job.id, payload });
            // TODO: integrate alerting (pager/email/webhook) here if desired
        }
    });

    return async () => {
        log.info('DLQ consumer stopping');
        await boss.stop();
    };
}
````

## File: packages/queue/src/pgboss.ts
````typescript
import PgBoss from 'pg-boss';
import type { QueueAdapter, QueueMessage, QueuePriority } from './types';

const priorityMap: Record<QueuePriority, number> = {
    fast: 10,
    normal: 50,
    bulk: 90,
};

export class PgBossQueueAdapter implements QueueAdapter {
    private boss?: PgBoss;
    private topic: string;
    private dlqTopic: string;
    private metrics = {
        publishes: 0,
        claims: 0,
        completes: 0,
        retries: 0,
        errors: 0,
        dlq: 0,
    };

    constructor(
        private readonly opts: {
            connectionString: string;
            schema?: string;
            queueName?: string;
            concurrency?: number;
            visibilityTimeoutSec?: number;
            maxAttempts?: number;
        }
    ) {
        this.topic = opts.queueName ?? process.env.QUEUE_NAME ?? 'clips';
        this.dlqTopic = `${this.topic}.dlq`;
    }

    async start() {
        if (this.boss) return;
        this.boss = new PgBoss({
            connectionString: this.opts.connectionString,
            schema: this.opts.schema ?? process.env.PG_BOSS_SCHEMA ?? 'pgboss',
        });
        this.boss.on('error', (err) => {
            // Increment error metric on boss-level errors
            this.metrics.errors++;
            // Avoid importing logger to keep package lean; rely on caller logs
            console.error('[pgboss] error', err);
        });
        await this.boss.start();
        // Ensure queues exist with basic policies
        const expireInSeconds = Math.max(
            1,
            Math.floor(
                Number(
                    process.env.QUEUE_VISIBILITY_SEC ||
                        this.opts.visibilityTimeoutSec ||
                        90
                )
            )
        );
        const retryLimit = Number(
            process.env.QUEUE_MAX_ATTEMPTS || this.opts.maxAttempts || 3
        );
        try {
            await this.boss.createQueue(this.topic, {
                name: this.topic,
                expireInSeconds,
                retryLimit,
                deadLetter: this.dlqTopic,
            });
        } catch (err) {
            // Intentionally ignore errors if the queue already exists
            // console.error('Error creating queue:', err);
        }
        try {
            await this.boss.createQueue(this.dlqTopic, {
                name: this.dlqTopic,
                expireInSeconds: expireInSeconds * 2,
                retryLimit: 0,
            });
        } catch {}
    }

    async publish(
        msg: QueueMessage,
        opts?: { timeoutSec?: number }
    ): Promise<void> {
        if (!this.boss) await this.start();
        const expireInSeconds = Math.max(
            1,
            Math.floor(
                opts?.timeoutSec ??
                    Number(
                        process.env.QUEUE_VISIBILITY_SEC ||
                            this.opts.visibilityTimeoutSec ||
                            90
                    )
            )
        );
        const attemptLimit = Number(
            process.env.QUEUE_MAX_ATTEMPTS || this.opts.maxAttempts || 3
        );
        const priority = priorityMap[msg.priority ?? 'normal'];
        await this.boss!.send(this.topic, msg as object, {
            priority,
            expireInSeconds,
            retryLimit: attemptLimit,
            retryBackoff: true,
            deadLetter: this.dlqTopic,
        });
        this.metrics.publishes++;
    }

    async consume(
        handler: (msg: QueueMessage) => Promise<void>
    ): Promise<void> {
        if (!this.boss) await this.start();
        const batchSize = Number(
            process.env.QUEUE_CONCURRENCY || this.opts.concurrency || 4
        );
        await this.boss!.work<QueueMessage>(
            this.topic,
            { batchSize },
            async (jobs) => {
                for (const job of jobs) {
                    this.metrics.claims++;
                    try {
                        await handler(job.data as QueueMessage);
                        this.metrics.completes++;
                    } catch (err) {
                        // A thrown error triggers retry/DLQ in pg-boss
                        this.metrics.retries++;
                        this.metrics.errors++;
                        throw err;
                    }
                }
                // Throw inside handler to trigger retry; returning resolves completions
            }
        );
    }

    async shutdown(): Promise<void> {
        if (this.boss) {
            await this.boss.stop();
            this.boss = undefined;
        }
    }

    async health(): Promise<{ ok: boolean; error?: string }> {
        try {
            if (!this.boss) await this.start();
            // Simple ping by fetching the state; if it throws, not healthy
            // getQueue takes a name and returns settings; use topic
            await this.boss!.getQueue(this.topic);
            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }
}
````

## File: packages/queue/src/types.ts
````typescript
export type QueuePriority = 'fast' | 'normal' | 'bulk';

export interface QueueMessage {
    jobId: string;
    priority?: QueuePriority;
}

export interface QueueAdapter {
    publish(msg: QueueMessage, opts?: { timeoutSec?: number }): Promise<void>;
    consume(handler: (msg: QueueMessage) => Promise<void>): Promise<void>;
    shutdown(): Promise<void>;
    start(): Promise<void>;
    health(): Promise<{ ok: boolean; error?: string }>;
    getMetrics(): {
        publishes: number;
        claims: number;
        completes: number;
        retries: number;
        errors: number;
        dlq: number;
    };
}
````

## File: packages/queue/tsconfig.json
````json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false
  },
  "include": ["src"]
}
````

## File: packages/worker/src/index.ts
````typescript
import { createLogger } from '@clipper/common';
import { InMemoryJobsRepo, InMemoryJobEventsRepo } from '@clipper/data';
import { PgBossQueueAdapter } from '@clipper/queue';

const log = createLogger((process.env.LOG_LEVEL as any) || 'info').with({
    mod: 'worker',
});

const jobs = new InMemoryJobsRepo();
const events = new InMemoryJobEventsRepo();
const queue = new PgBossQueueAdapter({
    connectionString: process.env.DATABASE_URL!,
});

async function main() {
    await queue.start();
    await queue.consume(async ({ jobId }: { jobId: string }) => {
        // idempotency: if already done, short-circuit
        const row = await jobs.get(jobId);
        if (!row) {
            log.warn('job not found', { jobId });
            return;
        }
        if (row.status === 'done') return;

        await jobs.update(jobId, { status: 'processing', progress: 5 });
        await events.add({
            jobId,
            ts: new Date().toISOString(),
            type: 'processing',
        });

        // simulate work & progress updates
        await jobs.update(jobId, { progress: 50 });
        await events.add({
            jobId,
            ts: new Date().toISOString(),
            type: 'progress',
            data: { pct: 50, stage: 'trim' },
        });

        await jobs.update(jobId, { progress: 100, status: 'done' });
        await events.add({ jobId, ts: new Date().toISOString(), type: 'done' });
    });
}

if (import.meta.main) {
    const run = async () => {
        try {
            await main();
        } catch (e) {
            log.error('worker crashed', { err: String(e) });
            process.exit(1);
        }
    };
    const stop = async () => {
        log.info('worker stopping');
        await queue.shutdown();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    run();
}
````

## File: planning/foundations/tasks.md
````markdown
artifact_id: 2a4bba3e-6fe6-45e2-89ab-72d6396e8a35

# Foundations (Contracts & Utilities) — Tasks

## 1. Package scaffolding

-   [x] Create workspaces in package.json for `@clipper/contracts` and `@clipper/common` (Requirements: R7)
-   [x] Initialize tsconfig bases for both packages (TS5, ESM) (R7)
-   [x] Set up Bun/TS build scripts and test runner (R7)

## 2. @clipper/contracts

-   [x] Implement domain types in `src/types.ts` (R1)
-   [x] Implement Zod schemas in `src/schemas.ts` with cross-field validation (R1)
-   [x] Add barrel exports `src/index.ts` (R1)
-   [x] (Optional) Implement OpenAPI generator `src/openapi.ts` guarded by env flag (R1)
-   [x] Unit tests: valid/invalid CreateJobInput, JobRecord round-trip (R1)

## 3. @clipper/common — Config

-   [x] Implement `ConfigSchema` and `loadConfig()` with defaults and redaction (R2)
-   [x] Unit tests: missing required, invalid values, test env defaults (R2)

## 4. @clipper/common — Logger

-   [x] Implement `createLogger()` with `.with()` scoping and level filtering (R3)
-   [ ] Unit tests: level gating, field inheritance, error logging (R3)

## 5. @clipper/common — Error handling

-   [x] Define `ServiceError`, `ErrorEnvelope`, and `ServiceResult` helpers (R4)
-   [ ] Unit tests: fromException mapping, pattern matching ok/err (R4)

## 6. @clipper/common — Time utilities

-   [x] Implement `parseTimecode`, `formatTimecode`, and `validateRange` (R5)
-   [x] Unit tests: edge cases (00:00:00, ms precision, negative, over-cap) (R5)

## 7. @clipper/common — Job state machine

-   [x] Implement `transition(current, to, reason?)` + allowed map (R6)
-   [ ] Unit tests: allowed transitions, invalid transitions, idempotent terminal (R6)

## 8. DX & Packaging

-   [ ] Configure linting and formatting (eslint, prettier) minimal rules (R7)
-   [x] Ensure exports are ESM and tree-shakeable, add `exports` maps (R7)
-   [x] Monorepo TS resolution: workspace linking for @clipper/\*, avoid cross-package src bleed; builds use compiled outputs (R7)
-   [ ] Add minimal READMEs for both packages (R7)

## 9. Examples & Docs

-   [ ] Add example payloads and round-trip validation scripts in repo root or examples/ (R1, R5)
-   [x] Document environment variables in README (R2)

---

## Task–Requirement Mapping

-   Section 2 → R1
-   Section 3 → R2
-   Section 4 → R3
-   Section 5 → R4
-   Section 6 → R5
-   Section 7 → R6
-   Sections 1, 8, 9 → R7
````

## File: drizzle.config.ts
````typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './packages/data/src/db/schema.ts',
    out: './packages/data/drizzle',
    dialect: 'postgresql',
    strict: true,
});
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    // Output settings
    "declaration": true,
    "outDir": "dist",
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
````

## File: vitest.config.ts
````typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            'packages/**/tests/**/*.test.ts',
            'packages/**/tests/**/*.ts',
        ],
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        globals: false,
        watch: false,
    },
});
````

## File: packages/data/src/db/repos.ts
````typescript
import { desc, eq } from 'drizzle-orm';
import { createDb } from './connection';
import { jobEvents, jobs } from './schema';
import type { JobStatus } from '@clipper/contracts';
import { createLogger, noopMetrics, type Metrics } from '@clipper/common';
import type {
    JobEvent as RepoJobEvent,
    JobRow,
    JobEventsRepository,
    JobsRepository,
} from '../repo';

export class DrizzleJobsRepo implements JobsRepository {
    private readonly logger = createLogger('info').with({ comp: 'jobsRepo' });
    constructor(
        private readonly db = createDb(),
        private readonly metrics: Metrics = noopMetrics
    ) {}

    async create(
        row: Omit<JobRow, 'createdAt' | 'updatedAt'>
    ): Promise<JobRow> {
        const start = Date.now();
        const [rec] = await this.db
            .insert(jobs)
            .values({
                id: row.id,
                status: row.status,
                progress: row.progress,
                sourceType: row.sourceType,
                sourceKey: row.sourceKey,
                sourceUrl: row.sourceUrl,
                startSec: row.startSec,
                endSec: row.endSec,
                withSubtitles: row.withSubtitles,
                burnSubtitles: row.burnSubtitles,
                subtitleLang: row.subtitleLang,
                resultVideoKey: row.resultVideoKey,
                resultSrtKey: row.resultSrtKey,
                errorCode: row.errorCode,
                errorMessage: row.errorMessage,
                expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
            })
            .returning();
        const out = toJobRow(rec);
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'jobs.create',
        });
        this.logger.info('job created', { jobId: out.id });
        return out;
    }

    async get(id: string): Promise<JobRow | null> {
        const start = Date.now();
        const [rec] = await this.db
            .select()
            .from(jobs)
            .where(eq(jobs.id, id))
            .limit(1);
        const out = rec ? toJobRow(rec) : null;
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'jobs.get',
        });
        return out;
    }

    async update(id: string, patch: Partial<JobRow>): Promise<JobRow> {
        const start = Date.now();
        const [rec] = await this.db
            .update(jobs)
            .set(toJobsPatch(patch))
            .where(eq(jobs.id, id))
            .returning();
        if (!rec) throw new Error('NOT_FOUND');
        const row = toJobRow(rec);
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'jobs.update',
        });
        this.logger.info('job updated', { jobId: row.id });
        return row;
    }

    async listByStatus(
        status: JobStatus,
        limit = 50,
        offset = 0
    ): Promise<JobRow[]> {
        const start = Date.now();
        const rows = await this.db
            .select()
            .from(jobs)
            .where(eq(jobs.status, status))
            .orderBy(desc(jobs.createdAt))
            .limit(limit)
            .offset(offset);
        const out = rows.map(toJobRow);
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'jobs.listByStatus',
        });
        return out;
    }

    async transition(
        id: string,
        next: JobStatus,
        event?: { type?: string; data?: Record<string, unknown> }
    ): Promise<JobRow> {
        const start = Date.now();
        const res = await this.db.transaction(async (tx) => {
            const [updated] = await tx
                .update(jobs)
                .set({ status: next, updatedAt: new Date() })
                .where(eq(jobs.id, id))
                .returning();
            if (!updated) throw new Error('NOT_FOUND');

            if (event) {
                await tx.insert(jobEvents).values({
                    jobId: id,
                    type: event.type ?? `status:${next}`,
                    data: event.data ?? null,
                });
            }
            return toJobRow(updated);
        });
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'jobs.transition',
        });
        this.logger.info('job transitioned', { jobId: id, next });
        return res;
    }
}

export class DrizzleJobEventsRepo implements JobEventsRepository {
    constructor(
        private readonly db = createDb(),
        private readonly metrics: Metrics = noopMetrics
    ) {}

    async add(evt: RepoJobEvent): Promise<void> {
        const start = Date.now();
        await this.db.insert(jobEvents).values({
            jobId: evt.jobId,
            ts: new Date(evt.ts),
            type: evt.type,
            data: evt.data ?? null,
        });
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'events.add',
        });
    }

    async list(
        jobId: string,
        limit = 100,
        offset = 0
    ): Promise<RepoJobEvent[]> {
        const start = Date.now();
        const rows = await this.db
            .select()
            .from(jobEvents)
            .where(eq(jobEvents.jobId, jobId))
            .orderBy(desc(jobEvents.ts))
            .limit(limit)
            .offset(offset);
        const out = rows.map((r) => ({
            jobId: r.jobId,
            ts: r.ts.toISOString(),
            type: r.type,
            data: (r.data as Record<string, unknown> | null) ?? undefined,
        }));
        this.metrics.observe('repo.op.duration_ms', Date.now() - start, {
            op: 'events.list',
        });
        return out;
    }
}

function toJobRow(j: any): JobRow {
    return {
        id: j.id,
        status: j.status,
        progress: j.progress,
        sourceType: j.sourceType,
        sourceKey: j.sourceKey ?? undefined,
        sourceUrl: j.sourceUrl ?? undefined,
        startSec: j.startSec,
        endSec: j.endSec,
        withSubtitles: j.withSubtitles,
        burnSubtitles: j.burnSubtitles,
        subtitleLang: j.subtitleLang ?? undefined,
        resultVideoKey: j.resultVideoKey ?? undefined,
        resultSrtKey: j.resultSrtKey ?? undefined,
        errorCode: j.errorCode ?? undefined,
        errorMessage: j.errorMessage ?? undefined,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
        expiresAt: j.expiresAt ? j.expiresAt.toISOString() : undefined,
    };
}

function toJobsPatch(patch: Partial<JobRow>) {
    const out: any = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) continue;
        if (k === 'expiresAt' && v) out[k] = new Date(v as string);
        else out[k] = v as any;
    }
    return out;
}
````

## File: packages/data/src/repo.ts
````typescript
import type { JobStatus } from '@clipper/contracts';

export interface JobRow {
    id: string;
    status: JobStatus;
    progress: number;
    sourceType: 'upload' | 'youtube';
    sourceKey?: string;
    sourceUrl?: string;
    startSec: number;
    endSec: number;
    withSubtitles: boolean;
    burnSubtitles: boolean;
    subtitleLang?: string;
    resultVideoKey?: string;
    resultSrtKey?: string;
    errorCode?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
}

export interface JobEvent {
    jobId: string;
    ts: string;
    type: string;
    data?: Record<string, unknown>;
}

export interface JobsRepository {
    create(row: Omit<JobRow, 'createdAt' | 'updatedAt'>): Promise<JobRow>;
    get(id: string): Promise<JobRow | null>;
    update(id: string, patch: Partial<JobRow>): Promise<JobRow>;
    listByStatus(
        status: JobStatus,
        limit?: number,
        offset?: number
    ): Promise<JobRow[]>;
    transition(
        id: string,
        next: JobStatus,
        event?: { type?: string; data?: Record<string, unknown> }
    ): Promise<JobRow>;
}

export interface JobEventsRepository {
    add(evt: JobEvent): Promise<void>;
    list(jobId: string, limit?: number, offset?: number): Promise<JobEvent[]>;
}

// Minimal in-memory impl to wire API/worker until DB is added
export class InMemoryJobsRepo implements JobsRepository {
    private map = new Map<string, JobRow>();
    async create(
        row: Omit<JobRow, 'createdAt' | 'updatedAt'>
    ): Promise<JobRow> {
        const now = new Date().toISOString();
        const rec: JobRow = { ...row, createdAt: now, updatedAt: now };
        this.map.set(rec.id, rec);
        return rec;
    }
    async get(id: string) {
        return this.map.get(id) ?? null;
    }
    async update(id: string, patch: Partial<JobRow>): Promise<JobRow> {
        const cur = this.map.get(id);
        if (!cur) throw new Error('NOT_FOUND');
        const next = {
            ...cur,
            ...patch,
            updatedAt: new Date().toISOString(),
        } as JobRow;
        this.map.set(id, next);
        return next;
    }
    async listByStatus(
        status: JobStatus,
        limit = 50,
        offset = 0
    ): Promise<JobRow[]> {
        return Array.from(this.map.values())
            .filter((r) => r.status === status)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .slice(offset, offset + limit);
    }
    async transition(
        id: string,
        next: JobStatus,
        event?: { type?: string; data?: Record<string, unknown> }
    ): Promise<JobRow> {
        const cur = await this.get(id);
        if (!cur) throw new Error('NOT_FOUND');
        const updated = await this.update(id, { status: next });
        // no-op event store here; handled by InMemoryJobEventsRepo
        return updated;
    }
}

export class InMemoryJobEventsRepo implements JobEventsRepository {
    private events: JobEvent[] = [];
    async add(evt: JobEvent): Promise<void> {
        this.events.push(evt);
    }
    async list(jobId: string, limit = 100, offset = 0): Promise<JobEvent[]> {
        return this.events
            .filter((e) => e.jobId === jobId)
            .sort((a, b) => a.ts.localeCompare(b.ts))
            .slice(offset, offset + limit);
    }
}
````

## File: packages/common/src/index.ts
````typescript
export * from './config';
export * from './logger';
export * from './errors';
export * from './time';
export * from './state';
export * from './env';
export * from './metrics';
export * from './redact';
````

## File: planning/queue-layer/tasks.md
````markdown
<!-- artifact_id: 0d40a0a9-b2e4-43f2-8f9d-bb47a7f86ae0 -->

# Queue Layer — Tasks (pg-boss)

## 1. Dependencies & config

-   [x] Add dependency: pg-boss
-   [x] Env: `QUEUE_PROVIDER=pgboss`, `PG_BOSS_SCHEMA=pgboss`, `QUEUE_NAME=clips`, `QUEUE_VISIBILITY_SEC=90`, `QUEUE_MAX_ATTEMPTS=3`, `QUEUE_RETRY_BACKOFF_MS_BASE=1000`, `QUEUE_RETRY_BACKOFF_MS_MAX=60000`, `QUEUE_CONCURRENCY=4`

## 2. Abstraction & adapter

-   [x] Define `QueueAdapter` interface
-   [x] Implement `PgBossQueueAdapter` with `publish`, `consume`, `shutdown`
-   [x] Map priorities fast|normal|bulk to numeric priority
-   [x] Support DLQ publish to `clips.dlq` after retries exhausted

## 2b. DLQ Consumer & Docs

-   [x] Add `startDlqConsumer()` to consume `clips.dlq` and log/alert
-   [x] Add README to `@clipper/queue` with usage and envs

## 3. Integration with Data Layer

-   [x] On `POST /api/jobs`, persist job row then `publish({ jobId, priority })` (temporary in-memory repo)
-   [x] Worker `consume` handler: load job from DB (in-memory now), check idempotency, process, update status, ack (by returning)
-   [x] Emit progress events to `job_events` (in-memory now)

## 4. Health & observability

-   [x] Metrics: publishes, claims, completes, retries, failures
-   [x] Error handling hooks: boss.on('error')
-   [x] Health endpoint checks boss connectivity

## 5. Testing

-   [ ] Unit test adapter (mock boss)
-   [x] Integration: minimal publish → consume happy path against local Postgres (skips if DATABASE_URL unset)
-   [ ] Integration: retry on throw → DLQ after limit

## 6. Ops

-   [x] Graceful shutdown on SIGINT/SIGTERM
-   [ ] Document minimal production settings and scaling notes

## 7. Post-DB Layer Integration (Drizzle + Postgres)

-   [ ] Replace in-memory repo with Drizzle repositories in `packages/data` (jobs, job_events, any metadata tables)
-   [ ] Define Drizzle schema for:
    -   [ ] jobs (id, status, priority, attempts, last_error, created_at, updated_at)
    -   [ ] job_events (job_id FK, type, payload/jsonb, created_at)
    -   [ ] dlq_jobs (job_id, reason, payload, created_at) or reuse job_events with type=dlq
    -   [ ] indexes: (status), (created_at), (job_id), (priority, status)
-   [ ] Create migrations for the above tables (do not commit secrets); verify `bunx drizzle-kit` workflow or existing migration tool
-   [ ] Ensure `pgboss` schema exists or allow pg-boss to manage its own schema via `maintenance`/migrate on start; document choice
-   [ ] Implement transactional publish:
    -   [ ] Insert job row
    -   [ ] Publish to queue
    -   [ ] Commit; on failure, roll back insert
-   [ ] Idempotency: unique constraint on job id; implement upsert/no-op on duplicate publishes
-   [ ] Worker consume path:
    -   [ ] Load job by id
    -   [ ] Guard against double-processing (status check + optimistic update)
    -   [ ] Update status/progress and append job_events
    -   [ ] Mark complete on success
-   [ ] Retry/DLQ path:
    -   [ ] On handler throw, increment attempts and rely on pg-boss retry
    -   [ ] After max attempts, persist DLQ record (dlq_jobs or job_events type=dlq) and publish to `clips.dlq`
-   [ ] Retention: scheduled cleanup for completed/failed/DLQ older than `RETENTION_HOURS`
-   [ ] Observability: expand metrics to include DB-backed counts; add lightweight health query for DB connectivity
-   [ ] Seed script updates to create sample jobs and events
-   [ ] E2E tests (real DB):
    -   [ ] publish → consume updates DB state and emits events
    -   [ ] retry then DLQ after limit persists DLQ record
    -   [ ] idempotent publish does not duplicate jobs
    -   [ ] retention cleanup removes old rows
-   [ ] CI: provide `DATABASE_URL` for tests (local docker-compose or external PG); skip integration tests if unset
-   [ ] Docs: update `@clipper/queue` README with schema diagram, transactions, DLQ flow, and ops notes
````

## File: package.json
````json
{
    "name": "yt-clipper",
    "module": "index.ts",
    "type": "module",
    "private": true,
    "workspaces": [
        "packages/*"
    ],
    "scripts": {
        "build": "bun run --cwd packages/contracts build && bun run --cwd packages/common build && bun run --cwd packages/data build && bun run --cwd packages/queue build && bun run --cwd packages/worker build && bun run --cwd packages/api build",
        "test": "bunx vitest run",
        "test:watch": "bunx vitest",
        "db:generate": "bunx drizzle-kit generate --config=drizzle.config.ts",
        "db:push": "bunx drizzle-kit push --config=drizzle.config.ts"
    },
    "devDependencies": {
        "@types/bun": "latest",
        "dotenv": "^17.2.1",
        "drizzle-kit": "^0.31.4",
        "vitest": "^2.0.5"
    },
    "peerDependencies": {
        "typescript": "^5"
    }
}
````

## File: packages/data/src/index.ts
````typescript
export * from './repo';
export * as dbSchema from './db/schema';
export * from './db/connection';
export * from './db/repos';
export * from './storage';
export * from './cleanup';
export * from './api-keys';
````

## File: packages/data/package.json
````json
{
    "name": "@clipper/data",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
        "dist"
    ],
    "scripts": {
        "build": "tsc -p tsconfig.json",
        "db:generate": "bunx drizzle-kit generate --config=drizzle.config.ts",
        "db:push": "bunx drizzle-kit push --config=drizzle.config.ts",
        "storage:bootstrap": "bun src/scripts/bootstrap-storage.ts",
        "db:seed": "bun src/scripts/seed.ts",
        "cleanup": "bun src/scripts/cleanup.ts"
    },
    "dependencies": {
        "@clipper/common": "*",
        "@clipper/contracts": "*",
        "@supabase/supabase-js": "^2.54.0",
        "drizzle-orm": "^0.44.4",
        "pg": "^8.16.3"
    },
    "devDependencies": {
        "@types/node": "^24.2.1",
        "@types/pg": "^8.15.5",
        "typescript": "^5"
    }
}
````

## File: planning/data-layer/tasks.md
````markdown
<!-- artifact_id: 4b3a2a7c-2a40-4b97-b386-0df39bdfd3d0 -->

# Data Layer — Tasks (Supabase + Drizzle)

## 1. Initialize schema and migrations

-   [x] Create Drizzle schema files for `jobs`, `job_events`, `api_keys` (optional)
    -   Requirements: 1, 2, 3
-   [x] Add indices: `idx_jobs_status_created_at`, `idx_jobs_expires_at`, `idx_job_events_job_id_ts`
    -   Requirements: 4
-   [x] Generate and commit Drizzle migrations
    -   Requirements: 7

## 2. Repository implementations

-   [x] Implement `JobsRepo` with `create`, `get`, `update`, `listByStatus`, `transition`
    -   Requirements: 1, 6, 8
-   [x] Implement `JobEventsRepo` with `add`, `list`
    -   Requirements: 2, 6
-   [x] Implement transactional state transitions (update + event)
    -   Requirements: 8

## 3. Storage helpers (Supabase Storage)

-   [x] Provide canonical key builders (`sources/{jobId}/source.ext`, `results/{jobId}/clip.*`)
    -   Requirements: 5
-   [x] Implement `StorageRepo` methods: `upload`, `sign`, `remove`
    -   Requirements: 5, 9
-   [x] Add configuration for signed URL TTL (default 10 minutes)
    -   Requirements: 9

## 4. Local development setup

-   [x] Add `.env` entries: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
    -   Requirements: Non-functional
-   [x] Provide a bootstrap script to create buckets `sources`, `results` if missing
    -   Requirements: 5, 7
-   [x] Document how to run migrations and seed minimal data
    -   Requirements: 7

## 5. Cleanup and retention

-   [x] Implement a cleanup job: delete expired `jobs` and cascade `job_events`; remove result objects
    -   Requirements: 4
-   [x] Add a dry-run and rate-limit option for deletes
    -   Requirements: 4, 9

## 6. Testing

-   [x] Unit tests for repositories (happy path + error cases)
    -   Requirements: 6, 8, 10
-   [x] Integration test: create → transition → events → sign URLs
    -   Requirements: 1, 2, 5, 6
-   [x] Cleanup test: insert expired rows → run cleanup → verify DB and storage
    -   Requirements: 4

## 7. Observability

-   [x] Emit metrics: repo operation durations, error counts
    -   Requirements: 10
-   [x] Structured logs with jobId correlation
    -   Requirements: 2, 10

## 8. Security

-   [x] Hash API keys with Bun.password; never store plaintext
    -   Requirements: 3, 9
-   [x] Ensure parameterized queries and secret redaction in errors
    -   Requirements: 9
````
