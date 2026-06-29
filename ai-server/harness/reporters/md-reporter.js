// ═══════════════════════════════════════════════════════════
// SPEC-H001: Markdown Reporter
// Outputs human-readable Markdown report.
// ═══════════════════════════════════════════════════════════

export function generateMarkdownReport(results) {
  const lines = [];
  lines.push(`# LLM Testing Harness — Run ${results.runId}`);
  lines.push('');
  lines.push(`**Model:** ${results.model}`);
  lines.push(`**Date:** ${new Date().toISOString()}`);
  lines.push(`**num_predict:** ${results.numPredict}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  const s = results.summary;
  lines.push(`| Total cases | ${s.totalCases} |`);
  lines.push(`| Hard gate pass rate | ${(s.hardGatePassRate * 100).toFixed(1)}% |`);
  lines.push(`| p95 latency | ${s.p95Latency}ms |`);
  lines.push(`| JSON validity rate | ${(s.jsonValidityRate * 100).toFixed(1)}% |`);
  lines.push(`| Options pass rate | ${(s.optionsPassRate * 100).toFixed(1)}% |`);
  lines.push(`| Tone violations | ${s.toneViolations} |`);
  lines.push(`| Repeat rate | ${(s.repeatRate * 100).toFixed(1)}% |`);
  lines.push('');

  // Per-task breakdown
  for (const [taskType, taskResult] of Object.entries(results.tasks)) {
    lines.push(`## Task: ${taskType}`);
    lines.push('');
    lines.push('| Case | JSON | Tokens | Options | Repeat | Tone | Latency |');
    lines.push('|------|------|--------|---------|--------|------|---------|');
    for (const c of taskResult.cases) {
      const json = c.gates.json_valid ? 'PASS' : 'FAIL';
      const tokens = `${c.gates.token_count}/${c.gates.token_max}`;
      const options = c.gates.has_options ? 'PASS' : (taskType === 'npc_dialogue' ? 'FAIL' : 'N/A');
      const repeat = c.gates.no_repeat ? 'PASS' : 'FAIL';
      const tone = c.gates.tone_check ? 'PASS' : 'FAIL';
      const lat = `${c.latency}ms`;
      lines.push(`| ${c.id} | ${json} | ${tokens} | ${options} | ${repeat} | ${tone} | ${lat} |`);
    }
    lines.push('');
  }

  // Failures detail
  const failures = [];
  for (const [taskType, taskResult] of Object.entries(results.tasks)) {
    for (const c of taskResult.cases) {
      const failedGates = Object.entries(c.gates).filter(([k, v]) => v === false);
      if (failedGates.length > 0) {
        failures.push({ case: c.id, task: taskType, gates: failedGates.map(([k]) => k), response: c.response?.substring(0, 200) });
      }
    }
  }

  if (failures.length > 0) {
    lines.push('## Failures Detail');
    lines.push('');
    for (const f of failures) {
      lines.push(`### ${f.case} (${f.task})`);
      lines.push(`**Failed gates:** ${f.gates.join(', ')}`);
      if (f.response) {
        lines.push(`**Response (truncated):** \`${f.response}...\``);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
