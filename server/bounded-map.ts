/** Resolve independent work in order, stopping new work on the first failure.
 * Wait for already-started workers before rejecting to avoid detached writes.
 */
export async function boundedMap<T, R>(
  items: readonly T[], work: (item: T, index: number) => Promise<R>, concurrency = 4,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Invalid concurrency");
  const results = new Array<R>(items.length);
  let next = 0;
  let failed = false;
  let failure: unknown;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try { results[index] = await work(items[index], index); }
      catch (error) { failed = true; failure = error; }
    }
  }));
  if (failed) throw failure;
  return results;
}
