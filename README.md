# Rote Playoffs Hackathon — Flagship Play Gap Mapper

A reusable Rote Play that reads a bounded local hackathon/product strategy, compares it against public Rote Play evidence, classifies overlap, and recommends the highest-leverage differentiated Play to build first.

## What it does

The Play:

1. Reads a strategy file under a declared project root.
2. Extracts goals, target users, desired outcomes, differentiators, constraints, and evidence.
3. Performs a bounded public Rote Play registry comparison.
4. Classifies candidate overlap as duplicate, adjacent, or distinct.
5. Scores generated candidate workflows across strategic fit, novelty, feasibility, demo clarity, and safety.
6. Produces one concrete build recommendation.

## Safety boundary

The Play is read-only.

It does not:

- install adapters
- request credentials
- publish Plays
- create Plays
- execute the recommended workflow
- write to external services

## Verification

The project includes:

- deterministic offline registry fixtures
- strategy fixtures
- automated tests
- dependency manifest
- Rote Play validation and lint evidence

Run the test suite with:

```sh
deno test --allow-read --allow-write tests/flagship-play-gap-mapper_test.ts
```

## Play

The released Play package is located at:

`plays/flagship-play-gap-mapper/`

## Project status

Released and indexed through Rote.
