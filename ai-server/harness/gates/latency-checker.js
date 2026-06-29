// ═══════════════════════════════════════════════════════════
// SPEC-H001: Hard Gate — Latency Checker
// Measures and validates response time percentiles.
// ═══════════════════════════════════════════════════════════

/**
 * @param {number[]} latencies - Array of latencies in ms
 * @param {number} threshold - p95 threshold in ms
 * @returns {{ passed: boolean, p50: number, p95: number, p99: number }}
 */
export function checkLatency(latencies, threshold = 2000) {
  if (!latencies || latencies.length === 0) {
    return { passed: false, p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return { passed: p95 <= threshold, p50, p95, p99 };
}
