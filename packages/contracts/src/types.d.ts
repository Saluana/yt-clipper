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