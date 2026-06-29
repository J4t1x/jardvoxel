// ═══════════════════════════════════════════════════════════
// SPEC-H001: JSON Reporter
// Outputs structured JSON results to file.
// ═══════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';

export function generateJSONReport(results) {
  const report = {
    runId: results.runId,
    timestamp: new Date().toISOString(),
    model: results.model,
    numPredict: results.numPredict,
    summary: results.summary,
    tasks: results.tasks,
  };

  const dir = path.dirname(new URL(import.meta.url).pathname);
  const resultsDir = path.join(dir, '..', 'state', 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const filename = `run-${results.runId}-${Date.now()}.json`;
  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  return filepath;
}
