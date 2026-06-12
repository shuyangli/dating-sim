# Settling

An interactive simulation about choice, commitment, and the mathematics of
loneliness in big-city gay dating. Thesis, art direction, and the Mirror game
design live in [CONCEPT.md](./CONCEPT.md).

## Candidate generator (prototype)

Generates the Mirror's date candidates: each one is sampled as a hidden
Pareto-frontier trait vector, then an LLM writes the person — an app bio plus
three escalating date vignettes, each containing one genuine flaw and one
moment of real connection. The visitor only ever sees the prose; the numbers
surface in the reveal.

```sh
npm install

# Inspect the sampled trait cards and the prompt without calling the API
npm run generate -- --dry-run --count 12 --seed 42

# Generate for real (writes out/candidates.json + out/candidates.md)
export ANTHROPIC_API_KEY=sk-ant-...
npm run generate -- --count 12 --seed 42
```

Generation is cached by candidate seed in `out/candidates.json`, so re-runs
only produce what's missing. Review `out/candidates.md` to judge whether the
vignettes land — that file is the quality gate for the whole Mirror movement.

- `src/traits.ts` — 11 trait axes (including the market-legible ones: looks,
  fitness, wealth, status), seeded Pareto-frontier sampling, and
  beholder-relative scoring: percentiles are computed per preference profile
  against a 10,000-person background pool, because a p99 is a property of a
  scorer, not of a person
- `src/prompt.ts` — the vignette-writer system prompt (the artistic core) and
  the structured output schema
- `src/generate.ts` — CLI: batch generation, caching, markdown render

## The playable v1 (`web/`)

A fully static build of the Mirror — no backend, no accounts, nothing leaves
the page. Stated question → eight authored dilemmas → swipe the twelve-man
deck → date vignettes → the reveal (receipts, taste inferred in-browser via
the Bradley-Terry port, and the deck re-scored by the player's own revealed
weights).

```sh
npm run build-web        # regenerate web/data.js from the fixtures
npx http-server web      # or just open web/index.html
```

Deploys to GitHub Pages via `.github/workflows/pages.yml` on pushes that touch
`web/`.
