import { CandidateSpec } from "./traits.js";
import { Persona } from "./prompt.js";

export interface GeneratedCandidate {
  spec: CandidateSpec;
  persona: Persona;
}

export function renderMarkdown(candidates: GeneratedCandidate[], note?: string): string {
  const parts: string[] = [
    "# Settling — generated candidates\n",
    "_Vignette quality review. The trait numbers below are the hidden layer; the visitor only ever sees the prose._\n",
  ];
  if (note) parts.push(`> ${note}\n`);
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
