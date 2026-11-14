import { Storage } from "@google-cloud/storage";
import type { Readable } from "node:stream";
import { AsyncCache } from "./async-cache";

export type PdfMetadata = { size: number; generation: string };
export interface PdfStorage {
  metadata(name: string): Promise<PdfMetadata>;
  stream(name: string, metadata: PdfMetadata, range?: { start: number; end: number }): Readable;
}

/** Use the supported GCS API beneath App Storage, with Replit's sidecar auth.
 * Never download an object to discover its size. Pin reads to its generation
 * so replacement between metadata and stream cannot mix different PDF bytes.
 */
export function createPdfStorage(bucketId: string): PdfStorage {
  const storage = new Storage({
    projectId: "",
    credentials: {
      type: "external_account", audience: "replit", subject_token_type: "access_token",
      token_url: "http://127.0.0.1:1106/token",
      credential_source: {
        url: "http://127.0.0.1:1106/credential",
        format: { type: "json", subject_token_field_name: "access_token" },
      },
      universe_domain: "googleapis.com",
    },
    timeout: 20_000,
    retryOptions: { maxRetries: 2, totalTimeout: 30 },
  });
  const bucket = storage.bucket(bucketId);
  const metadata = new AsyncCache<string, PdfMetadata>(60_000, 100);
  return {
    metadata: name => metadata.get(name, async () => {
      const [object] = await bucket.file(name).getMetadata();
      const size = Number(object.size);
      if (!Number.isSafeInteger(size) || size < 0 || !object.generation || object.contentEncoding === "gzip") {
        throw new Error("PDF storage metadata is invalid");
      }
      return { size, generation: String(object.generation) };
    }),
    stream: (name, object, range) => bucket.file(name, { generation: object.generation })
      .createReadStream({ ...range, decompress: false }),
  };
}
