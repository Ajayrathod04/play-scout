import { analyze } from "../plays/flagship-play-gap-mapper/resources/analyze.ts";

function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function assertRejects(operation: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(message), `expected error containing ${message}`);
    return;
  }
  throw new Error("expected operation to reject");
}

const root = new URL("../plays/flagship-play-gap-mapper", import.meta.url).pathname;
const strategy = new URL("../plays/flagship-play-gap-mapper/resources/fixtures/strategy.md", import.meta.url).pathname;
const incidentStrategy = new URL("../plays/flagship-play-gap-mapper/resources/fixtures/incident-strategy.md", import.meta.url).pathname;
const registry = new URL("../plays/flagship-play-gap-mapper/resources/fixtures/registry-results.json", import.meta.url).pathname;

Deno.test("recommends the flagship gap mapper using offline registry evidence", async () => {
  const report = await analyze([root, strategy, "developer audience", "", "10", registry]);
  assertEquals(report.recommended_play.name, "Flagship Play Gap Mapper");
  assertEquals(report.search.mode, "offline fixture");
  assertEquals(report.search.inspected, 2);
  assert(report.overlap.adjacent.includes("demo/hackathon-storyboard"));
  assert(report.scorecard[0].criteria.strategic_fit.evidence.some((value) => value.includes("Target user")));
  assert(report.scorecard[0].confidence > 0 && report.scorecard[0].confidence <= 1);
});

Deno.test("different strategy evidence produces a different generated recommendation", async () => {
  const baseline = await analyze([root, strategy, "developer audience", "", "10", registry]);
  const incident = await analyze([root, incidentStrategy, "", "", "10", registry]);
  assertEquals(incident.strategy.target_user, "On-call platform engineers during an active incident.");
  assert(baseline.recommended_play.name !== incident.recommended_play.name, "distinct strategies must not receive the same generated recommendation");
  assert(incident.recommended_play.name.includes("Incident"));
  assert(incident.scorecard[0].criteria.safety.evidence.some((value) => value.includes("No write")));
});

Deno.test("rejects strategy files outside the declared project root", async () => {
  await assertRejects(() => analyze([root, "/etc/hosts", "", "strategy", "10", registry]), "strategy_path must be inside project_root");
});

Deno.test("rejects an out-of-range public registry limit before any lookup", async () => {
  await assertRejects(() => analyze([root, strategy, "", "strategy", "21", registry]), "max_results must be an integer from 1 to 20");
});

Deno.test("rejects a strategy that is too short", async () => {
  const shortStrategy = `${root}/resources/fixtures/short-strategy.md`;
  await Deno.writeTextFile(shortStrategy, "too short");
  try {
    await assertRejects(
      () => analyze([root, shortStrategy, "", "strategy", "10", registry]),
      "strategy file must contain at least 40 characters",
    );
  } finally {
    await Deno.remove(shortStrategy);
  }
});

Deno.test("rejects missing required project or strategy arguments", async () => {
  await assertRejects(
    () => analyze([root, "", "", "", "10", registry]),
    "usage: analyze.ts",
  );
});

Deno.test("explicit search terms are trimmed and bounded to three terms", async () => {
  const report = await analyze([
    root,
    strategy,
    "",
    " flagship , rote , product , ignored ",
    "10",
    registry,
  ]);
  assertEquals(report.search.mode, "offline fixture");
  assertEquals(report.search.terms.length, 4);
  assertEquals(report.search.terms[0], "flagship");
  assertEquals(report.search.terms[3], "ignored");
});

Deno.test("offline registry accepts both object and array fixture shapes", async () => {
  const arrayRegistry = `${root}/resources/fixtures/array-registry-results.json`;
  await Deno.writeTextFile(
    arrayRegistry,
    JSON.stringify([
      {
        reference: "example/test-play",
        title: "Example Test Play",
        description: "A testing workflow",
        tags: ["testing"],
      },
    ]),
  );
  try {
    const report = await analyze([root, strategy, "", "testing", "10", arrayRegistry]);
    assertEquals(report.search.mode, "offline fixture");
    assertEquals(report.search.inspected, 1);
  } finally {
    await Deno.remove(arrayRegistry);
  }
});
