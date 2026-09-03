/**
 * Flagship Play Gap Mapper — analysis resource
 *
 * @rote-frontmatter
 * ---
 * name: flagship-play-gap-mapper-analyze
 * version: 0.1.0
 * description: Internal analysis resource for the Flagship Play Gap Mapper.
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
 * ---
 */

type RegistryPlay = { reference: string; title: string; description: string; tags: string[] };
type Criterion = { score: number; max: number; evidence: string[] };
type StrategyProfile = {
  goals: string[];
  target_user: string;
  desired_outcome: string;
  differentiators: string[];
  constraints: string[];
  evidence: string[];
};
type Candidate = {
  name: string;
  promise: string;
  mvp_scope: string[];
  criteria: Record<"strategic_fit" | "novelty_overlap" | "feasibility" | "demo_clarity" | "safety", Criterion>;
  score: number;
  confidence: number;
};

const STOP_WORDS = new Set(["about", "after", "and", "are", "build", "for", "from", "have", "into", "our", "play", "that", "the", "this", "with", "your", "must", "will", "helps", "help", "team"]);
const textDecoder = new TextDecoder();

function fail(message: string): never { throw new Error(message); }

function resolveBoundedPath(projectRoot: string, candidate: string): string {
  const root = Deno.realPathSync(projectRoot);
  const path = Deno.realPathSync(candidate);
  if (path !== root && !path.startsWith(`${root}/`)) fail("strategy_path must be inside project_root");
  return path;
}

function keywords(text: string): string[] {
  const seen = new Set<string>();
  for (const word of text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []) {
    if (!STOP_WORDS.has(word)) seen.add(word);
  }
  return [...seen].slice(0, 16);
}

function sentences(text: string): string[] {
  return text.replace(/^#+\s.*$/gm, "").split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter((value) => value.length > 15);
}

function section(text: string, names: string[]): string[] {
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^#{1,6}\s+(.+?)\s*$/.exec(lines[index]);
    if (!heading || !names.includes(heading[1].toLowerCase())) continue;
    const values: string[] = [];
    for (let cursor = index + 1; cursor < lines.length && !/^#{1,6}\s+/.test(lines[cursor]); cursor += 1) {
      const value = lines[cursor].replace(/^[-*]\s+/, "").trim();
      if (value) values.push(value);
    }
    return values;
  }
  return [];
}

function firstMatch(text: string, pattern: RegExp, fallback: string): string {
  const match = pattern.exec(text);
  return match?.[1]?.trim().replace(/[.]$/, "") || fallback;
}

export function extractStrategy(text: string, suppliedConstraints: string): StrategyProfile {
  const allSentences = sentences(text);
  const explicitGoals = section(text, ["goals", "goal", "objectives"]);
  const goals = explicitGoals.length > 0 ? explicitGoals : allSentences.filter((value) => /\b(build|create|turn|map|recommend|reduce|improve)\b/i.test(value)).slice(0, 3);
  const target = section(text, ["target user", "target users", "audience", "user"])[0]
    ?? firstMatch(text, /useful to ([^.]+?)(?:,| and |\.\s|$)/i, "the stated product team");
  const desired = section(text, ["desired outcome", "outcome", "decision"])[0]
    ?? firstMatch(text, /finish with ([^.]+?)(?:\.\s|$)/i, goals[0] ?? "a concrete decision");
  const explicitDifferentiators = section(text, ["differentiators", "differentiation", "why now"]);
  const differentiators = explicitDifferentiators.length > 0 ? explicitDifferentiators : allSentences.filter((value) => /\b(differentiat|avoid duplicat|unique|distinct|safe)\b/i.test(value));
  const explicitConstraints = section(text, ["constraints", "guardrails", "requirements"]);
  const constraints = [...explicitConstraints, ...suppliedConstraints.split(/[;,]/).map((value) => value.trim()).filter(Boolean), ...allSentences.filter((value) => /\b(under|within|minute|read-only|must not|only)\b/i.test(value))];
  const explicitEvidence = section(text, ["evidence", "signals", "proof"]);
  const evidence = explicitEvidence.length > 0 ? explicitEvidence : allSentences.filter((value) => /\b(public plays?|judges?|developers?|strategy)\b/i.test(value)).slice(0, 3);
  if (goals.length === 0) fail("strategy must state at least one goal");
  return {
    goals,
    target_user: target,
    desired_outcome: desired,
    differentiators: differentiators.length > 0 ? differentiators : ["No explicit differentiator supplied"],
    constraints: constraints.length > 0 ? [...new Set(constraints)] : ["No explicit constraints supplied"],
    evidence: evidence.length > 0 ? evidence : ["No explicit evidence supplied"],
  };
}

function title(words: string[]): string { return words.slice(0, 3).map((word) => word[0].toUpperCase() + word.slice(1)).join(" "); }

function candidateName(profile: StrategyProfile, mode: "gap" | "evidence" | "decision"): string {
  const source = `${profile.goals.join(" ")} ${profile.desired_outcome}`.toLowerCase();
  if (mode === "gap" && source.includes("flagship")) return "Flagship Play Gap Mapper";
  const focus = title(keywords(mode === "evidence" ? profile.evidence.join(" ") : mode === "decision" ? profile.desired_outcome : profile.goals.join(" ")));
  return `${focus || "Strategy"} ${mode === "gap" ? "Gap Mapper" : mode === "evidence" ? "Evidence Navigator" : "Decision Path"}`;
}

function overlapEvidence(plays: RegistryPlay[], profile: StrategyProfile): { duplicate: string[]; adjacent: string[]; distinct: string[] } {
  const terms = keywords(`${profile.goals.join(" ")} ${profile.differentiators.join(" ")} ${profile.desired_outcome}`);
  const duplicate: string[] = [];
  const adjacent: string[] = [];
  const distinct: string[] = [];
  for (const play of plays) {
    const haystack = `${play.title} ${play.description} ${play.tags.join(" ")}`.toLowerCase();
    const hits = terms.filter((term) => haystack.includes(term)).length;
    if (hits >= 3) duplicate.push(play.reference);
    else if (hits > 0) adjacent.push(play.reference);
    else distinct.push(play.reference);
  }
  return { duplicate, adjacent, distinct };
}

function criterion(score: number, max: number, evidence: string[]): Criterion { return { score: Math.max(0, Math.min(max, score)), max, evidence }; }

function makeCandidates(profile: StrategyProfile, overlap: ReturnType<typeof overlapEvidence>, inspected: number): Candidate[] {
  const hasTimebox = profile.constraints.some((value) => /\b(under|within|minute|hour|day)\b/i.test(value));
  const hasSafety = `${profile.differentiators.join(" ")} ${profile.constraints.join(" ")}`.match(/\b(safe|read-only|permission|bounded|private|mutate)\b/i) !== null;
  const hasDemo = `${profile.constraints.join(" ")} ${profile.evidence.join(" ")}`.match(/\b(demo|judge|minute|audience)\b/i) !== null;
  const overlapPenalty = Math.min(18, overlap.duplicate.length * 8 + overlap.adjacent.length * 2);
  const coverage = Math.min(1, inspected / 10);
  const modes: Array<{ mode: "gap" | "evidence" | "decision"; fit: number; feasibility: number; demo: number; safety: number; promise: string; scope: string[] }> = [
    { mode: "gap", fit: 30, feasibility: 17, demo: 13, safety: 14, promise: `Map ${profile.target_user}'s strategy to a differentiated workflow and one build recommendation.`, scope: ["Extract the stated goals and differentiators", "Compare public-Play overlap", "Return one build charter"] },
    { mode: "evidence", fit: 24, feasibility: 16, demo: 10, safety: 13, promise: `Turn the strategy evidence for ${profile.target_user} into a ranked opportunity brief.`, scope: ["Extract stated evidence", "Rank opportunity claims", "Expose confidence and unknowns"] },
    { mode: "decision", fit: 26, feasibility: 18, demo: 14, safety: 11, promise: `Guide ${profile.target_user} from stated constraints to ${profile.desired_outcome}.`, scope: ["Extract constraints", "Compare decision options", "Render the next decision"] },
  ];
  return modes.map((entry) => {
    const fit = criterion(entry.fit, 30, [`Uses ${profile.goals.length} extracted goal(s)`, `Target user: ${profile.target_user}`]);
    const novelty = criterion(20 - overlapPenalty, 20, overlap.duplicate.length > 0 ? [`${overlap.duplicate.length} potential duplicate(s) reduce novelty`] : [`No duplicate found in ${inspected} inspected public Play(s)`]);
    const feasibility = criterion(entry.feasibility + (hasTimebox ? 2 : 0), 20, [hasTimebox ? "Strategy supplies a timebox" : "No timebox supplied; estimate is less certain", "MVP remains read-only"]);
    const demo = criterion(entry.demo + (hasDemo ? 1 : 0), 15, [hasDemo ? "Strategy names a demo, judge, or audience signal" : "No explicit demo signal supplied", `Desired outcome: ${profile.desired_outcome}`]);
    const safety = criterion(entry.safety + (hasSafety ? 1 : 0), 15, [hasSafety ? "Strategy explicitly calls for bounded or safe behavior" : "Safety requirements are inferred rather than explicit", "No write, publish, credential, or adapter action is in scope"]);
    const criteria = { strategic_fit: fit, novelty_overlap: novelty, feasibility, demo_clarity: demo, safety };
    const score = Object.values(criteria).reduce((total, value) => total + value.score, 0);
    const confidence = Number((0.35 + coverage * 0.3 + Math.min(0.25, profile.evidence.length * 0.08) + (hasTimebox ? 0.05 : 0) + (hasSafety ? 0.05 : 0)).toFixed(2));
    return { name: candidateName(profile, entry.mode), promise: entry.promise, mvp_scope: entry.scope, criteria, score, confidence };
  }).sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function parseRegistry(value: unknown): RegistryPlay[] {
  const isRecord = (input: unknown): input is Record<string, unknown> =>
    typeof input === "object" && input !== null;

  const root = isRecord(value) ? value : null;
  const data = root && isRecord(root.data) ? root.data : null;
  const result = data && isRecord(data.result) ? data.result : null;

  const rows =
    Array.isArray(value) ? value :
    root && Array.isArray(root.items) ? root.items :
    result && Array.isArray(result.items) ? result.items :
    [];

  return rows.flatMap((row): RegistryPlay[] => {
    if (!isRecord(row)) return [];

    const item = row;

    const referenceCandidates = [
      item.reference,
      item.uri,
      item.play_uri,
      item.playId,
      item.play_id,
      item.id,
      item.name,
    ];

    const reference = referenceCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

    if (!reference) return [];

    const description =
      typeof item.description === "string"
        ? item.description
        : "";

    const title =
      typeof item.title === "string"
        ? item.title
        : typeof item.name === "string"
          ? item.name
          : reference;

    const tags = Array.isArray(item.tags)
      ? item.tags.filter(
          (tag): tag is string => typeof tag === "string",
        )
      : [];

    return [{
      reference,
      title,
      description,
      tags,
    }];
  });
}
async function registrySearch(terms: string[], limit: number): Promise<RegistryPlay[]> {
  const responses = await Promise.all(terms.slice(0, 3).map(async (term) => {
    const result = await new Deno.Command("rote", { args: ["play", "search", term, "--source", "registry", "--scope", "public", "--limit", String(limit), "--json"], stdout: "piped", stderr: "piped" }).output();
    if (!result.success) fail(`public registry search failed for '${term}': ${textDecoder.decode(result.stderr).trim()}`);
    return parseRegistry(JSON.parse(textDecoder.decode(result.stdout)));
  }));
  return [...new Map(responses.flat().map((play) => [play.reference, play])).values()];
}

function inspectedCoverage(inspected: number, maxResults: number, terms: number): string {
  return `Coverage is bounded to ${Math.min(3, terms)} search term(s) and up to ${maxResults} result(s) per term; ${inspected} unique result(s) were analyzed.`;
}

export async function analyze(args: string[]) {
  const [projectRoot, strategyPath, suppliedConstraints = "", searchTerms = "", maxResultsRaw = "10", fixturePath = ""] = args;
  if (!projectRoot || !strategyPath) fail("usage: analyze.ts <project_root> <strategy_path> [constraints] [search_terms] [max_results] [registry_results_path]");
  const maxResults = Number(maxResultsRaw);
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 20) fail("max_results must be an integer from 1 to 20");
  const strategy = Deno.readTextFileSync(resolveBoundedPath(projectRoot, strategyPath));
  if (strategy.trim().length < 40) fail("strategy file must contain at least 40 characters of strategy context");
  const profile = extractStrategy(strategy, suppliedConstraints);
  const terms = (searchTerms ? searchTerms.split(",") : keywords(`${profile.goals.join(" ")} ${profile.differentiators.join(" ")} ${profile.desired_outcome}`).slice(0, 3)).map((term) => term.trim()).filter(Boolean);
  if (terms.length === 0) fail("strategy did not yield usable registry search terms; provide search_terms");
  const plays = fixturePath ? parseRegistry(JSON.parse(Deno.readTextFileSync(resolveBoundedPath(projectRoot, fixturePath)))) : await registrySearch(terms, maxResults);
  const overlap = overlapEvidence(plays, profile);
  const scorecard = makeCandidates(profile, overlap, plays.length);
  const winner = scorecard[0];
  return {
    strategy: profile,
    recommended_play: { name: winner.name, promise: winner.promise, rationale: `Won with ${winner.score}/100 at ${Math.round(winner.confidence * 100)}% confidence. ${winner.criteria.strategic_fit.evidence.join("; ")}.`, mvp_scope: winner.mvp_scope },
    overlap,
    scorecard: scorecard.map(({ name, score, confidence, criteria }) => ({ name, score, confidence, criteria })),
    search: { mode: fixturePath ? "offline fixture" : "public registry", terms, inspected: plays.length, coverage_note: inspectedCoverage(plays.length, maxResults, terms.length) },
  };
}

if (import.meta.main) {
  try { console.log(JSON.stringify(await analyze(Deno.args))); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); Deno.exit(1); }
}
