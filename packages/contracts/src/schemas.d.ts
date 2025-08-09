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