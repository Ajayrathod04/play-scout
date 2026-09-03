/**
 * Flagship Play Gap Mapper
 *
 * Turns a local hackathon strategy into a differentiated first-Play recommendation.
 *
 * @rote-frontmatter
 * ---
 * name: flagship-play-gap-mapper
 * version: 0.1.0
 * description: Reads a local hackathon strategy, compares it with public Rote Plays, and recommends the highest-leverage differentiated Play to build first.
 * provenance:
 *   author: Hackathon team
 * source: https://github.com/wemakedevs/rote
 * metadata:
 *   rote_version: 0.78.0
 *   version: 0.1.0
 *   status: released
 *   kind: atomic
 *   flow_type: sequential
 *   execution_model: steps_with_presentation
 *   format: typescript
 *   requires_endpoints: []
 *   requires_sessions: false
 *   contract:
 *     atomic: true
 *     input:
 *       type: none
 *     output:
 *       format: json
 *       destination: stdout
 *     composable: true
 *   discoverability:
 *     tags:
 *     - hackathon
 *     - strategy
 *     - play-discovery
 *     - recommendation
 * parameters:
 * - name: project_root
 *   param_type: string
 *   required: true
 *   description: Absolute project directory that bounds strategy-file access.
 * - name: strategy_path
 *   param_type: string
 *   required: true
 *   description: Path to a Markdown or text strategy file beneath project_root.
 * - name: constraints
 *   param_type: string
 *   required: false
 *   default: ''
 *   description: Optional timebox, audience, or demo constraints.
 * - name: search_terms
 *   param_type: string
 *   required: false
 *   default: ''
 *   description: Optional comma-separated public-registry search terms.
 * - name: max_results
 *   param_type: integer
 *   required: false
 *   default: 10
 *   description: Maximum public Plays inspected per search term (1-20).
 * - name: registry_results_path
 *   param_type: string
 *   required: false
 *   default: ''
 *   description: Optional fixture JSON for an offline, deterministic run; skips public-registry lookup.
 * presentation_fixtures:
 *   analyze_strategy: resources/presentation-fixtures/analyze_strategy/fixture.yaml
 * steps:
 *   analyze_strategy:
 *     type: process.exec
 *     argv:
 *     - deno
 *     - run
 *     - --allow-read
 *     - --allow-run=rote
 *     - '@resource{analyze.ts}'
 *     - $project_root
 *     - $strategy_path
 *     - $constraints
 *     - $search_terms
 *     - $max_results
 *     - $registry_results_path
 * ---
 */

const { FlowOutput, isProcessExecBody, loadPresentationContext, stepName } =
  await import("__ROTE_PRESENTATION_SDK__");

const ctx = await loadPresentationContext();
const out = new FlowOutput();
const observation = ctx.requireAvailable(stepName("analyze_strategy"));

if (!isProcessExecBody(observation.body)) {
  throw new Error("analyze_strategy did not record a process observation");
}
if (observation.body.status.exit.kind !== "code" || observation.body.status.exit.code !== 0) {
  throw new Error(`analyze_strategy failed: ${observation.body.stderr?.text ?? "no stderr captured"}`);
}
const stdout = observation.body.stdout?.text;
if (!stdout) throw new Error("analyze_strategy did not return a report");

const report = JSON.parse(stdout) as {
  recommended_play: { name: string; promise: string; rationale: string; mvp_scope: string[] };
  overlap: { duplicate: string[]; adjacent: string[]; distinct: string[] };
  strategy: { goals: string[]; target_user: string; desired_outcome: string; differentiators: string[]; constraints: string[]; evidence: string[] };
  scorecard: Array<{ name: string; score: number; confidence: number; criteria: Record<string, { score: number; max: number; evidence: string[] }> }>;
  search: { mode: string; terms: string[]; inspected: number; coverage_note: string };
};

const scoreRows = report.scorecard
  .map((candidate) => `| ${candidate.name} | ${candidate.score} | ${Math.round(candidate.confidence * 100)}% |`)
  .join("\n");
const criteria = report.scorecard.map((candidate) => [
  `### ${candidate.name}`,
  ...Object.entries(candidate.criteria).map(([name, criterion]) =>
    `- **${name} (${criterion.score}/${criterion.max}):** ${criterion.evidence.join("; ")}`),
].join("\n")).join("\n\n");
const overlap = [
  ["Duplicate", report.overlap.duplicate],
  ["Adjacent", report.overlap.adjacent],
  ["Distinct", report.overlap.distinct],
].map(([label, values]) => `- **${label}:** ${(values as string[]).join(", ") || "None"}`).join("\n");

out.human([
  "# Flagship Play recommendation",
  `## Build first: ${report.recommended_play.name}`,
  report.recommended_play.promise,
  `\n${report.recommended_play.rationale}`,
  "## Strategy evidence used",
  `- **Goals:** ${report.strategy.goals.join("; ")}`,
  `- **Target user:** ${report.strategy.target_user}`,
  `- **Desired outcome:** ${report.strategy.desired_outcome}`,
  `- **Differentiators:** ${report.strategy.differentiators.join("; ")}`,
  `- **Constraints:** ${report.strategy.constraints.join("; ")}`,
  `- **Evidence:** ${report.strategy.evidence.join("; ")}`,
  "## MVP scope",
  ...report.recommended_play.mvp_scope.map((item) => `- ${item}`),
  "## Public Play overlap",
  overlap,
  "## Scorecard",
  "| Candidate | Score | Confidence |\n| --- | ---: | ---: |\n" + scoreRows,
  criteria,
  `\nRegistry mode: ${report.search.mode}; inspected ${report.search.inspected} result(s) for: ${report.search.terms.join(", ") || "strategy-derived terms"}. ${report.search.coverage_note}`,
].join("\n\n"));
out.summary(`Build ${report.recommended_play.name}: the highest-scoring differentiated strategy-to-Play workflow.`);
out.result({ recommended_play: report.recommended_play, strategy: report.strategy, overlap: report.overlap, scorecard: report.scorecard, search: report.search });
