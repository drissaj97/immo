/** Exécute des tâches async avec un plafond de concurrence. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }

  const pool = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: pool }, () => run()));
  return results;
}
