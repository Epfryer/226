/** Bounded process-local successful-response cache with in-flight coalescing.
 * Pending entries are never evicted, so a burst cannot create duplicate work.
 */
export class AsyncCache<K, V> {
  private entries = new Map<K, { value?: V; expires: number; pending?: Promise<V> }>();
  constructor(private ttl = 60_000, private capacity = 100, private now = Date.now) {}

  get(key: K, load: () => Promise<V>): Promise<V> {
    let entry = this.entries.get(key);
    if (entry?.pending) return entry.pending;
    if (entry && entry.expires > this.now()) return Promise.resolve(entry.value!);
    if (entry) this.entries.delete(key);
    if (this.entries.size >= this.capacity) {
      const idle = Array.from(this.entries).find(([, value]) => !value.pending);
      if (!idle) return Promise.reject(new Error("Cache busy. Please retry shortly."));
      this.entries.delete(idle[0]);
    }
    entry = { expires: 0 };
    this.entries.set(key, entry);
    const current = entry;
    current.pending = Promise.resolve().then(load).then(value => {
      current.value = value;
      current.expires = this.now() + this.ttl;
      current.pending = undefined;
      return value;
    }, error => {
      this.entries.delete(key);
      throw error;
    });
    return current.pending;
  }
}
