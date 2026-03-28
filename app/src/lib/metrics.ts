type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();

export function incrementMetric(name: string, value = 1): void {
  const current = counters.get(name) ?? 0;
  counters.set(name, current + value);
}

export function getMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

export function resetMetrics(): void {
  counters.clear();
}
