// Render a persona fixture file to reviewable markdown without touching the
// API. Fixture shape: { seed, count, note?, personas: { [candidateSeed]: Persona } }.
//
//   npm run render -- samples/candidates-seed42.json
import fs from "node:fs";
import { sampleCandidates } from "./traits.js";
import { PersonaSchema, Persona } from "./prompt.js";
import { GeneratedCandidate, renderMarkdown } from "./markdown.js";

const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error("usage: npm run render -- <fixture.json>");
  process.exit(1);
}

const fixture: {
  seed: number;
  count: number;
  note?: string;
  personas: Record<string, Persona>;
} = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const specs = sampleCandidates(fixture.seed, fixture.count);
const candidates: GeneratedCandidate[] = specs.map((spec) => {
  const raw = fixture.personas[spec.seed];
  if (!raw) throw new Error(`fixture missing persona for ${spec.id} (seed ${spec.seed})`);
  return { spec, persona: PersonaSchema.parse(raw) };
});

const outPath = fixturePath.replace(/\.json$/, ".md");
fs.writeFileSync(outPath, renderMarkdown(candidates, fixture.note));
console.log(`Rendered ${candidates.length} candidates -> ${outPath}`);
