# Flagship Play Gap Mapper

An adapter-free, draft Rote Play that reads a local hackathon strategy, performs a read-only public Rote Play registry search, classifies overlap, and recommends the first differentiated Play to build.

## Run

```sh
rote play run ./main.ts \
  project_root=/absolute/path/to/project \
  strategy_path=/absolute/path/to/project/strategy.md \
  constraints="10-minute demo; developer audience"
```

For a deterministic offline run, add `registry_results_path=/absolute/path/to/project/registry-results.json`. That path must also be inside `project_root`.

## Boundaries

- Reads only files under `project_root`.
- Registry mode only invokes `rote play search ... --source registry --scope public --json`.
- It neither installs adapters nor requests credentials, publishes, creates Plays, or executes a recommended Play.
- The output is a recommendation, not an authorization to build, publish, or run anything.

## Verification

```sh
deno test --allow-read ../../tests/flagship-play-gap-mapper_test.ts
deno run --allow-read --allow-run=rote resources/analyze.ts "$PWD" resources/fixtures/strategy.md "" "" 10 resources/fixtures/registry-results.json
rote play validate ./main.ts
rote play lint ./main.ts --skip-runtime
```
