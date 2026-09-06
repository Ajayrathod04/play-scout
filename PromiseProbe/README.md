# PromiseProbe

**PromiseProbe** is a Rote play for testing whether a workflow actually keeps the promises it makes.

It evaluates declared workflow promises across three scenarios:

- **Baseline** — verifies normal expected behavior.
- **Changed** — verifies adaptation when input changes.
- **Boundary** — verifies controlled behavior at boundaries.

## What it reports

- Overall score out of 100
- Clear verdict
- Promise-by-promise evaluation
- Expected versus observed behavior
- Severity for violations
- Evidence for failing scenarios

## Example

The included fixtures intentionally demonstrate a changed-input violation:

```text
PROMISEPROBE
Workflow Contract & Resilience Verification

VERDICT       PROMISE VIOLATION
SCORE         80/100
COVERAGE      4/5 checks passed
VIOLATIONS    1

✗ P-002   changed    BROKEN  expected=ADAPTED
           observed=RESULT_READY STALE_RESULT

⚠ P-002  changed  severity=HIGH
```

## Why it exists

A workflow can appear to work while silently breaking the expectations it makes.

PromiseProbe turns those expectations into explicit checks and tests them across normal, changed, and boundary conditions.

> Does the workflow still behave as promised when reality changes?

## Included fixtures

- `resources/fixtures/promise.md` — declared promises
- `resources/fixtures/baseline-input.json` — baseline observation
- `resources/fixtures/changed-input.json` — changed-input observation
- `resources/fixtures/boundary-input.json` — boundary observation
- `resources/fixtures/expected-results.json` — expected analysis result

## Validation

- Rote validation: PASS
- Rote quality score: 0.88
- Tests: 5 passed
- Type checks: PASS
