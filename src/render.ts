// Render a candidate fixture file to reviewable markdown without touching the
// API. Fixtures embed their spec snapshots so they stay renderable as the
// trait schema evolves. Shape: { note?, candidates: [{ spec, persona }] }.
//
//   npm run render -- samples/candidates-seed42.json
import fs from "node:fs";
import { PersonaSchema } from "./prompt.js";
import { GeneratedCandidate, RenderSpec, renderMarkdown } from "./markdown.js";

const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error("usage: npm run render -- <fixture.json>");
  process.exit(1);
}

const fixture: {
  note?: string;
  candidates: { spec: RenderSpec; persona: unknown }[];
} = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const candidates: GeneratedCandidate[] = fixture.candidates.map((c) => ({
  spec: c.spec,
  persona: PersonaSchema.parse(c.persona),
}));

const outPath = fixturePath.replace(/\.json$/, ".md");
fs.writeFileSync(outPath, renderMarkdown(candidates, fixture.note));
console.log(`Rendered ${candidates.length} candidates -> ${outPath}`);
