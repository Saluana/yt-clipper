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
}

export interface JobEventsRepository {
    add(evt: JobEvent): Promise<void>;
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
}

export class InMemoryJobEventsRepo implements JobEventsRepository {
    private events: JobEvent[] = [];
    async add(evt: JobEvent): Promise<void> {
        this.events.push(evt);
    }
}
