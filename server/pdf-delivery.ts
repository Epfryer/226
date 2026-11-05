import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Transform, type Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";

export function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;
  const first = Number(match[1]), last = Number(match[2]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return null;
  const start = match[1] ? first : Math.max(0, size - last);
  const end = match[1] && match[2] ? Math.min(last, size - 1) : size - 1;
  if ((!match[1] && last === 0) || start >= size || start > end) return null;
  return { start, end };
}

type Entry = { path: string; size: number; touched: number; readers: number };

/** The storage SDK has no range/metadata API. Spool to bounded disk, never a full RAM buffer. */
export class PdfFileCache {
  private directory = mkdtemp(join(tmpdir(), "portfolio-pdfs-"));
  private entries = new Map<string, Entry>();
  private pending = new Map<string, Promise<Entry>>();
  constructor(
    private load: (name: string) => Readable,
    private maxFiles = 4,
    private maxFileBytes = 256 * 1024 * 1024,
    private ttl = 5 * 60 * 1000,
  ) {}

  private async obtain(name: string): Promise<Entry> {
    const existing = this.entries.get(name);
    if (existing && (Date.now() - existing.touched < this.ttl || existing.readers)) return existing;
    if (this.pending.has(name)) return this.pending.get(name)!;
    // Reserve synchronously, before awaiting filesystem work.
    const candidates = Array.from(this.entries.entries()).filter(([, e]) => !e.readers)
      .sort((a, b) => a[1].touched - b[1].touched);
    for (const [key, entry] of candidates) {
      if (Date.now() - entry.touched < this.ttl && this.entries.size + this.pending.size < this.maxFiles) break;
      this.entries.delete(key);
      void rm(entry.path, { force: true });
    }
    if (this.pending.size >= 2 || this.entries.size + this.pending.size >= this.maxFiles) {
      throw new Error("PDF service busy. Please retry shortly.");
    }
    const work = (async () => {
      const path = join(await this.directory, randomUUID());
      let bytes = 0;
      const limit = new Transform({
        transform: (chunk, _encoding, done) => {
          bytes += chunk.length;
          done(bytes > this.maxFileBytes ? new Error("PDF exceeds supported size") : null, chunk);
        },
      });
      try {
        await pipeline(this.load(name), limit, createWriteStream(path), {
          signal: AbortSignal.timeout(120_000),
        });
        const entry = { path, size: (await stat(path)).size, touched: Date.now(), readers: 0 };
        this.entries.set(name, entry);
        return entry;
      } catch (error) {
        await rm(path, { force: true });
        throw error;
      } finally {
        this.pending.delete(name);
      }
    })();
    this.pending.set(name, work);
    return work;
  }

  async acquire(name: string) {
    const entry = await this.obtain(name);
    entry.readers++;
    entry.touched = Date.now();
    let released = false;
    return {
      size: entry.size,
      stream: (range?: { start: number; end: number }) => createReadStream(entry.path, range),
      release: () => {
        if (!released) entry.readers--;
        released = true;
      },
    };
  }
}
