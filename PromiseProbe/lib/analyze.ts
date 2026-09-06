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

type Evaluation = {
  id: string;
  case: string;
  passed: boolean;
  expected: string;
  observed: string;
  severity: string;
};

function evaluatePromise(
  rule: PromiseRule,
  observation: Observation,
): Evaluation {
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

function calculateScore(evaluations: Evaluation[]): number {
  if (evaluations.length === 0) return 0;

  const passed = evaluations.filter((item) => item.passed).length;
  return Math.round((passed / evaluations.length) * 100);
}

export function analyzePromises(
  rules: PromiseRule[],
  observations: Observation[],
) {
  if (rules.length === 0) {
    throw new Error("At least one promise rule is required");
  }

  if (observations.length === 0) {
    throw new Error("At least one observation is required");
  }

  const evaluations: Evaluation[] = [];

  for (const rule of rules) {
    for (const observation of observations) {
      const applicable =
        (rule.id === "P-001") ||
        (rule.id === "P-002" && observation.case === "changed") ||
        (rule.id === "P-003" && observation.case === "boundary");

      if (!applicable) continue;

      evaluations.push(evaluatePromise(rule, observation));
    }
  }

  const violations = evaluations.filter((item) => !item.passed);
  const score = calculateScore(evaluations);

  return {
    score,
    total_checks: evaluations.length,
    passed_checks: evaluations.length - violations.length,
    failed_checks: violations.length,
    verdict: violations.length === 0 ? "PROMISES HELD" : "PROMISE VIOLATION",
    evaluations,
    violations,
  };
}
