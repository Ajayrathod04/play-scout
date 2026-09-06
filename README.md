# Flagship Play Gap Mapper

Turn a product or engineering strategy into an evidence-backed build decision.

Gap Mapper reads a local strategy, extracts its goals and differentiators, compares the idea against public Rote Plays using bounded registry evidence, classifies observed overlap, scores candidate directions, and returns one concrete build recommendation.

---

## Why this exists

A good idea is not automatically a good Play.

Before spending time implementing a new Play, a team should be able to answer:

- What are we actually trying to build?
- What does the target user need?
- Does similar work already exist in the public Rote ecosystem?
- Is the overlap a Duplicate, Adjacent, or Distinct?
- Which candidate has the strongest strategic fit?
- What should we build first?

Gap Mapper turns that repeated pre-build decision into a reusable, inspectable Rote Play.

---

## Workflow

```text
Local Strategy
      |
      v
Extract goals, target user, outcome & constraints
      |
      v
Bounded public Rote registry discovery
      |
      v
Compare candidate Plays
      |
      v
Duplicate / Adjacent / Distinct
      |
      v
Score candidate directions
      |
      v
One concrete build recommendation
```

---

## What it does

The Play accepts a local strategy document and analyzes it against bounded public Rote registry evidence.

It returns:

1. Strategy evidence
2. Extracted goals and target user
3. Public Play overlap
4. Duplicate / Adjacent / Distinct classifications
5. Candidate scorecard
6. Confidence
7. One concrete build recommendation

The Play is read-only with respect to the declared contract:

```text
Services           none
Writes             none declared
Authentication     none
Privileged access  process
```

---

# Quick Start

## 1. Install Rote

Install the Rote CLI using the official Rote installation method for your environment.

Verify the CLI:

```bash
rote --version
```

Verify that the Play commands are available:

```bash
rote play --help
```

If you are already participating in the Rote Playoffs environment, the authenticated/working Rote CLI setup can be reused.

---

## 2. Get the repository

Clone the repository:

```bash
git clone https://github.com/Ajayrathod04/play-scout.git
cd play-scout
```

The relevant Play is:

```text
plays/
└── flagship-play-gap-mapper/
```

---

## 3. Inspect the public Play before running

```bash
rote play inspect https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1
```

The inspection shows the resolved public contract, including parameters and access/effect information.

Expected required parameters:

```text
project_root
strategy_path
```

Optional parameters:

```text
constraints
search_terms
max_results
registry_results_path
```

---

# Run the public Play

The simplest public invocation is:

```bash
rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1
```

Rote will display the required parameters and ask for their values.

---

# Run from this repository

If you have cloned this repository and want to run the included strategy fixture:

```bash
cd play-scout

rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1 \
  project_root="$PWD/plays/flagship-play-gap-mapper" \
  strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md"
```

This is the recommended copy-paste command for the repository layout.

---

# Run with explicit constraints

You can provide additional constraints:

```bash
rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1 \
  project_root="$PWD/plays/flagship-play-gap-mapper" \
  strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md" \
  constraints="10-minute demo; developer audience"
```

---

# Parameters

## `project_root` — required

The local project/workspace directory used by the Play.

Example:

```text
/home/ajay/rote-hackathon/plays/flagship-play-gap-mapper
```

Repository-relative example:

```bash
project_root="$PWD/plays/flagship-play-gap-mapper"
```

## `strategy_path` — required

Path to the strategy document that should be analyzed.

Example:

```text
/home/ajay/rote-hackathon/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md
```

Repository-relative example:

```bash
strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md"
```

## `constraints` — optional

Additional strategy constraints supplied to the analysis.

Example:

```bash
constraints="10-minute demo; developer audience"
```

## `search_terms` — optional

Controls the bounded public-registry search terms.

Leave this at its default unless you have a specific reason to focus the registry search.

## `max_results` — optional

Maximum number of results considered per search term.

Default:

```text
10
```

Example:

```bash
max_results=10
```

## `registry_results_path` — optional

Path to supplied registry-results evidence.

This can be used for a deterministic/offline-style demonstration when a compatible registry-results fixture is available.

Example shape:

```bash
registry_results_path="$PWD/path/to/registry_results.json"
```

Do not invent a registry-results file. Use this parameter only when a compatible fixture actually exists.

---

# Example: Complete local run

From the repository root:

```bash
cd play-scout

rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1 \
  project_root="$PWD/plays/flagship-play-gap-mapper" \
  strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md" \
  constraints="10-minute demo; developer audience"
```

---

# Example result

A representative run produces a report similar to:

```text
# Flagship Play recommendation

## Build first: Flagship Play Gap Mapper

Map developers's strategy to a differentiated workflow and one build recommendation.

Won with 80/100 at 99% confidence.

## Strategy evidence

Goals:
- Build a flagship Rote Play that helps a product team turn a decided
  strategy into a clearly differentiated first workflow.
- It must avoid duplicating public Plays and finish with one concrete
  build decision.

Target user:
developers

Desired outcome:
one concrete build decision

## Public Play overlap

Duplicate:
...

Adjacent:
...

Distinct:
...

## Scorecard

Candidate                         Score    Confidence
------------------------------------------------------
Flagship Play Gap Mapper          80       99%
One Concrete Decision Path        75       99%
Flagship Rote Product Evidence
Navigator                         69       99%

## Recommendation

Build first:
Flagship Play Gap Mapper
```

The exact output is expected to vary with the supplied strategy and the public registry evidence available at run time.

---

# Understanding the result

## Duplicate

The observed public evidence is sufficiently similar that building the same workflow would risk unnecessary duplication.

This is a warning to reconsider the idea or differentiate it substantially.

## Adjacent

Related work exists, but the candidate is not the same workflow.

This can reveal an opportunity to differentiate rather than blindly duplicate.

## Distinct

No sufficiently similar candidate was identified within the bounded evidence examined.

This is useful evidence, but it should not be interpreted as proof of global uniqueness.

---

# Important: bounded registry evidence

Gap Mapper searches the public Rote registry using bounded search terms and a bounded result count.

For example, a run may report:

```text
Registry mode: public registry
inspected 22 result(s)
```

This means the Play analyzed the returned registry evidence within its configured search bounds.

It does NOT mean:

```text
"Every Play in existence was searched."
```

It does NOT prove:

```text
"No one has ever built this idea."
```

The result should be treated as evidence for a build decision, not as a mathematical proof of uniqueness.

---

# Live registry mode vs deterministic evidence

## Live public-registry mode

The default workflow can query the current public Rote registry.

Advantages:

- reflects public registry evidence available at run time
- useful for real pre-build research
- produces current overlap candidates

Because the registry changes, the exact result can change between runs.

## Deterministic fixture mode

When a compatible registry-results fixture is supplied through `registry_results_path`, the same evidence can be reused for a reproducible demonstration or test.

This is useful when a stable expected result is more important than current registry discovery.

---

# Included fixture

The repository contains a strategy fixture at:

```text
plays/flagship-play-gap-mapper/resources/fixtures/strategy.md
```

There is also an incident strategy fixture:

```text
plays/flagship-play-gap-mapper/resources/fixtures/incident-strategy.md
```

Use the strategy fixture for the standard Gap Mapper demonstration unless a different fixture is specifically intended for your test.

---

# Troubleshooting

## Error: missing required parameter(s)

If Rote reports:

```text
Invalid configuration: missing required parameter(s):
project_root, strategy_path
```

provide both values explicitly:

```bash
rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1 \
  project_root="$PWD/plays/flagship-play-gap-mapper" \
  strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md"
```

## Error: `realpath ... No such file or directory`

Check the strategy file:

```bash
ls -l "$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md"
```

If it does not exist, locate the available fixtures:

```bash
find "$PWD/plays/flagship-play-gap-mapper" -type f | sort
```

Then pass the real file path to `strategy_path`.

Do not use placeholder values such as:

```text
EXACT_STRATEGY_FILE_PATH
strategy_file=...
```

The parameter name is:

```text
strategy_path
```

## Verify the public Play

```bash
rote play inspect https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1
```

This is the first check to make if the public package behaves unexpectedly.

---

# Demo workflow

For a short demonstration:

### 1. Show the repository README

Start with the problem and workflow:

```text
Strategy
  ↓
Extract
  ↓
Registry evidence
  ↓
Compare
  ↓
Duplicate / Adjacent / Distinct
  ↓
Score
  ↓
Build decision
```

### 2. Inspect the public Play

```bash
rote play inspect https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1
```

### 3. Run it

```bash
rote play run https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1 \
  project_root="$PWD/plays/flagship-play-gap-mapper" \
  strategy_path="$PWD/plays/flagship-play-gap-mapper/resources/fixtures/strategy.md"
```

### 4. Highlight the evidence

Show:

```text
Strategy evidence
        ↓
Public Play overlap
        ↓
Duplicate / Adjacent / Distinct
        ↓
Scorecard
        ↓
Build first
```

The important part is not the raw terminal output. Show the evidence and the final decision.

---

# Design principle

> Don't just build another Play.
> Know why it should exist.

Gap Mapper makes that decision repeatable:

```text
Strategy
   ↓
Evidence
   ↓
Comparison
   ↓
Decision
   ↓
Reusable Play
```

---

# Public Play

https://play.modiqo.ai/ajayrathod04/flagship-play-gap-mapper@0.1.1

# Source

https://github.com/Ajayrathod04/play-scout

---

# Status

```text
Public:             Yes
Runnable:           Yes
Authentication:     None
Writes:             None declared
Services:           None
Registry:           Public Rote registry
```
