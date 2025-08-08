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
