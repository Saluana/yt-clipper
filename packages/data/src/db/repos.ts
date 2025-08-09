import { desc, eq } from 'drizzle-orm';
import { createDb } from './connection';
import { jobEvents, jobs } from './schema';
import type { JobStatus } from '@clipper/contracts';
import type { JobEvent as RepoJobEvent, JobRow, JobEventsRepository, JobsRepository } from '../repo';

export class DrizzleJobsRepo implements JobsRepository {
  constructor(private readonly db = createDb()) {}

  async create(row: Omit<JobRow, 'createdAt' | 'updatedAt'>): Promise<JobRow> {
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
    return toJobRow(rec);
  }

  async get(id: string): Promise<JobRow | null> {
    const [rec] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return rec ? toJobRow(rec) : null;
  }

  async update(id: string, patch: Partial<JobRow>): Promise<JobRow> {
    const [rec] = await this.db
      .update(jobs)
      .set(toJobsPatch(patch))
      .where(eq(jobs.id, id))
      .returning();
    if (!rec) throw new Error('NOT_FOUND');
    return toJobRow(rec);
  }

  async listByStatus(status: JobStatus, limit = 50, offset = 0): Promise<JobRow[]> {
    const rows = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.status, status))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(toJobRow);
  }

  async transition(
    id: string,
    next: JobStatus,
    event?: { type?: string; data?: Record<string, unknown> }
  ): Promise<JobRow> {
    return await this.db.transaction(async (tx) => {
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
  }
}

export class DrizzleJobEventsRepo implements JobEventsRepository {
  constructor(private readonly db = createDb()) {}

  async add(evt: RepoJobEvent): Promise<void> {
    await this.db.insert(jobEvents).values({
      jobId: evt.jobId,
      ts: new Date(evt.ts),
      type: evt.type,
      data: evt.data ?? null,
    });
  }

  async list(jobId: string, limit = 100, offset = 0): Promise<RepoJobEvent[]> {
    const rows = await this.db
      .select()
      .from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(desc(jobEvents.ts))
      .limit(limit)
      .offset(offset);
  return rows.map((r) => ({ jobId: r.jobId, ts: r.ts.toISOString(), type: r.type, data: (r.data as Record<string, unknown> | null) ?? undefined }));
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
