import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { sampleCandidates, CandidateSpec } from "./traits.js";
import { PersonaSchema, Persona, SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";

const MODEL = "claude-opus-4-8";
const OUT_DIR = "out";
const CONCURRENCY = 3;

interface GeneratedCandidate {
  spec: CandidateSpec;
  persona: Persona;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    seed: Number(get("--seed") ?? 42),
    count: Number(get("--count") ?? 12),
    dryRun: args.includes("--dry-run"),
  };
}

async function generateOne(
  client: Anthropic,
  spec: CandidateSpec
): Promise<GeneratedCandidate> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(spec) }],
    output_config: { format: zodOutputFormat(PersonaSchema) },
  });
  const persona = response.parsed_output;
  if (!persona) {
    throw new Error(`No parsed output for ${spec.id} (stop: ${response.stop_reason})`);
  }
  return { spec, persona };
}

function renderMarkdown(candidates: GeneratedCandidate[]): string {
  const parts: string[] = [
    "# Settling — generated candidates\n",
    "_Vignette quality review. The trait numbers below are the hidden layer; the visitor only ever sees the prose._\n",
  ];
  for (const { spec, persona } of candidates) {
    parts.push(`---\n\n## ${persona.name}, ${persona.age} — ${spec.id}`);
    parts.push(`> ${persona.bio}\n`);
    persona.dates.forEach((d, i) => {
      parts.push(`**Date ${i + 1} — ${d.setting}**\n\n${d.vignette}\n`);
    });
    parts.push(
      `<details><summary>Hidden layer</summary>\n\n` +
        `- percentile: **p${spec.percentile}** (score ${spec.score.toFixed(3)})\n` +
        `- strengths: ${spec.strengths.join(", ")} · weaknesses: ${spec.weaknesses.join(", ")}\n` +
        `- flaw axis: ${spec.flawAxis} — ${persona.flawSummary}\n` +
        `- connection axis: ${spec.connectionAxis} — ${persona.connectionSummary}\n` +
        `- seed: ${spec.seed}\n\n</details>\n`
    );
  }
  return parts.join("\n");
}

async function main() {
  const { seed, count, dryRun } = parseArgs();
  const specs = sampleCandidates(seed, count);

  console.log(`Sampled ${specs.length} Pareto-frontier candidates (seed ${seed})`);
  console.log(
    specs
      .map((s) => `  ${s.id}: p${s.percentile}  flaw=${s.flawAxis}  connection=${s.connectionAxis}`)
      .join("\n")
  );

  if (dryRun) {
    console.log("\n--- dry run: prompt for first candidate ---\n");
    console.log(buildUserPrompt(specs[0]));
    return;
  }

  const client = new Anthropic();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Cache by candidate seed so re-runs only generate what's missing.
  const cachePath = path.join(OUT_DIR, "candidates.json");
  const cache: Record<string, GeneratedCandidate> = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
    : {};

  const pending = specs.filter((s) => !cache[s.seed]);
  console.log(`\nGenerating ${pending.length} candidates (${specs.length - pending.length} cached)...`);

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((s) => generateOne(client, s)));
    for (const r of results) {
      cache[r.spec.seed] = r;
      console.log(`  ✓ ${r.spec.id}: ${r.persona.name}, ${r.persona.age} (p${r.spec.percentile})`);
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  }

  const ordered = specs.map((s) => cache[s.seed]);
  const mdPath = path.join(OUT_DIR, "candidates.md");
  fs.writeFileSync(mdPath, renderMarkdown(ordered));
  console.log(`\nWrote ${cachePath} and ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
