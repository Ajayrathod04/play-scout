import { assertEquals, assertThrows } from "jsr:@std/assert";
import { analyzePromises } from "../PromiseProbe/lib/analyze.ts";

type Observation = {
  case: string;
  input: string;
  output: string;
};

type PromiseRule = {
  id: string;
  statement: string;
  expected: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

function evaluatePromise(
  rule: PromiseRule,
  observation: Observation,
) {
  if (!rule.id.trim()) {
    throw new Error("Promise rule id is required");
  }

  if (!rule.expected.trim()) {
    throw new Error(`Expected behavior missing for ${rule.id}`);
  }

  const passed = observation.output.includes(rule.expected);

  return {
    id: rule.id,
    case: observation.case,
    passed,
    expected: rule.expected,
    observed: observation.output,
    severity: passed ? "NONE" : rule.severity,
  };
}

Deno.test("passes when observed behavior satisfies the promise", () => {
  const result = evaluatePromise(
    {
      id: "P-001",
      statement: "The workflow returns a clear result.",
      expected: "RESULT_READY",
      severity: "HIGH",
    },
    {
      case: "baseline",
      input: "normal",
      output: "RESULT_READY",
    },
  );

  assertEquals(result.passed, true);
  assertEquals(result.severity, "NONE");
});

Deno.test("detects a promise violation under changed input", () => {
  const result = evaluatePromise(
    {
      id: "P-002",
      statement: "The workflow adapts to changed input.",
      expected: "ADAPTED",
      severity: "HIGH",
    },
    {
      case: "changed",
      input: "changed",
      output: "STALE_RESULT",
    },
  );

  assertEquals(result.passed, false);
  assertEquals(result.severity, "HIGH");
});

Deno.test("rejects a promise without an expected behavior", () => {
  assertThrows(() =>
    evaluatePromise(
      {
        id: "P-003",
        statement: "Something happens.",
        expected: "",
        severity: "MEDIUM",
      },
      {
        case: "baseline",
        input: "normal",
        output: "RESULT_READY",
      },
    )
  );
});

Deno.test("calculates a perfect score when all applicable promises hold", () => {
  const rules = [
    {
      id: "P-001",
      statement: "Returns a result.",
      expected: "RESULT_READY",
      severity: "HIGH" as const,
    },
    {
      id: "P-002",
      statement: "Adapts to changed input.",
      expected: "ADAPTED",
      severity: "HIGH" as const,
    },
    {
      id: "P-003",
      statement: "Handles boundary input.",
      expected: "BOUNDARY_HANDLED",
      severity: "MEDIUM" as const,
    },
  ];

  const observations = [
    { case: "baseline", input: "normal", output: "RESULT_READY" },
    { case: "changed", input: "changed", output: "RESULT_READY ADAPTED" },
    {
      case: "boundary",
      input: "boundary",
      output: "RESULT_READY BOUNDARY_HANDLED",
    },
  ];

  const report = analyzePromises(rules, observations);

  assertEquals(report.score, 100);
  assertEquals(report.failed_checks, 0);
  assertEquals(report.verdict, "PROMISES HELD");
});

Deno.test("reports a high-severity changed-input violation", () => {
  const rules = [
    {
      id: "P-002",
      statement: "Adapts to changed input.",
      expected: "ADAPTED",
      severity: "HIGH" as const,
    },
  ];

  const observations = [
    { case: "changed", input: "changed", output: "STALE_RESULT" },
  ];

  const report = analyzePromises(rules, observations);

  assertEquals(report.score, 0);
  assertEquals(report.failed_checks, 1);
  assertEquals(report.verdict, "PROMISE VIOLATION");
  assertEquals(report.violations[0].severity, "HIGH");
});
