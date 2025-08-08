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
