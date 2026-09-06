/**
 * PromiseProbe
 *
 * Tests whether a workflow actually keeps the promises it makes
 * across baseline, changed, and boundary inputs.
 *
 * @rote-frontmatter
 * ---
 * name: promise-probe
 * version: 0.1.0
 * description: Probes whether a workflow keeps declared promises across baseline, changed, and boundary observations.
 * source: https://github.com/wemakedevs/rote
 * provenance:
 *   author: Hackathon team
 * metadata:
 *   rote_version: 0.78.0
 *   version: 0.1.0
 *   status: draft
 *   kind: atomic
 *   flow_type: sequential
 *   execution_model: steps_with_presentation
 *   format: typescript
 *   requires_endpoints: []
 *   requires_sessions: false
 *   contract:
 *     atomic: true
 *     input:
 *       type: file
 *     output:
 *       format: json
 *       destination: stdout
 *     composable: true
 * ---
 */

import { analyzePromises } from "./lib/analyze.ts";

type PromiseRule = {
  id: string;
  statement: string;
  expected: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

type Observation = {
  case: string;
  input: string;
  output: string;
};

function getArg(name: string): string | undefined {
  const prefix = `${name}=`;

  for (const arg of Deno.args) {
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
  }

  return undefined;
}

function parsePromises(markdown: string): PromiseRule[] {
  const rules: PromiseRule[] = [];
  const blocks = markdown.split(/^## /m).slice(1);

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim());

    const id = lines[0]?.trim() ?? "";
    const statement = lines
      .find((line) => line.startsWith("Statement:"))
      ?.replace("Statement:", "")
      .trim() ?? "";
    const expected = lines
      .find((line) => line.startsWith("Expected:"))
      ?.replace("Expected:", "")
      .trim() ?? "";
    const severityValue = lines
      .find((line) => line.startsWith("Severity:"))
      ?.replace("Severity:", "")
      .trim() ?? "MEDIUM";

    if (!id || !statement || !expected) {
      throw new Error(`Invalid promise definition: ${id || "(missing id)"}`);
    }

    const severity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(
      severityValue,
    )
      ? severityValue as PromiseRule["severity"]
      : "MEDIUM";

    rules.push({
      id,
      statement,
      expected,
      severity,
    });
  }

  return rules;
}

async function readJson(path: string): Promise<Observation> {
  return JSON.parse(await Deno.readTextFile(path));
}

if (import.meta.main) {
  const projectRoot = getArg("project_root") ?? Deno.cwd();

  const promisePath =
    getArg("promise_path") ??
    `${projectRoot}/resources/fixtures/promise.md`;

  const baselinePath =
    getArg("baseline_path") ??
    `${projectRoot}/resources/fixtures/baseline-input.json`;

  const changedPath =
    getArg("changed_path") ??
    `${projectRoot}/resources/fixtures/changed-input.json`;

  const boundaryPath =
    getArg("boundary_path") ??
    `${projectRoot}/resources/fixtures/boundary-input.json`;

  const promises = parsePromises(
    await Deno.readTextFile(promisePath),
  );

  const observations = await Promise.all([
    readJson(baselinePath),
    readJson(changedPath),
    readJson(boundaryPath),
  ]);

  const report = analyzePromises(promises, observations);

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      PROMISEPROBE                           ║");
  console.log("║       Workflow Contract & Resilience Verification            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  VERDICT       ${report.verdict}`);
  console.log(`  SCORE         ${report.score}/100`);
  console.log(
    `  COVERAGE      ${report.passed_checks}/${report.total_checks} checks passed`,
  );
  console.log(`  VIOLATIONS    ${report.failed_checks}`);
  console.log("");
  console.log("  ── PROMISE MATRIX ─────────────────────────────────────────");
  console.log("");

  for (const evaluation of report.evaluations) {
    const icon = evaluation.passed ? "✓" : "✗";
    const state = evaluation.passed ? "HELD" : "BROKEN";

    console.log(
      `  ${icon} ${evaluation.id.padEnd(7)} ${evaluation.case.padEnd(10)} ${state.padEnd(7)} expected=${evaluation.expected}`,
    );
    console.log(
      `             observed=${evaluation.observed}`,
    );
  }

  console.log("");

  if (report.violations.length > 0) {
    console.log("  ── RISK SIGNALS ───────────────────────────────────────────");
    console.log("");

    for (const violation of report.violations) {
      console.log(
        `  ⚠ ${violation.id}  ${violation.case}  severity=${violation.severity}`,
      );
    }
  } else {
    console.log("  ✓ No promise violations detected.");
  }

  console.log("");
  console.log("  PromiseProbe asks one question:");
  console.log(
    '  "Does the workflow still behave as promised when reality changes?"',
  );
  console.log("");

}
