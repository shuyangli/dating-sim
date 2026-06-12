import { Persona } from "./prompt.js";

// What the renderer needs from a spec — a structural subset of CandidateSpec,
// kept loose so fixtures from older trait schemas stay renderable.
export interface RenderSpec {
  id: string;
  seed: number;
  strengths: string[];
  weaknesses: string[];
  connectionAxis: string;
  flawAxis: string;
  percentiles: Record<string, number>;
}

export interface GeneratedCandidate {
  spec: RenderSpec;
  persona: Persona;
}

function renderPercentiles(percentiles: Record<string, number>): string {
  return Object.entries(percentiles)
    .map(([beholder, p]) => `${beholder} **p${p}**`)
    .join(" · ");
}

export function renderMarkdown(candidates: GeneratedCandidate[], note?: string): string {
  const parts: string[] = [
    "# Settling — generated candidates\n",
    "_Vignette quality review. The trait numbers below are the hidden layer; the visitor only ever sees the prose. Percentiles are per beholder — a score is a property of a scorer, not of a person._\n",
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
        `- percentile by beholder: ${renderPercentiles(spec.percentiles)}\n` +
        `- strengths: ${spec.strengths.join(", ")} · weaknesses: ${spec.weaknesses.join(", ")}\n` +
        `- flaw axis: ${spec.flawAxis} — ${persona.flawSummary}\n` +
        `- connection axis: ${spec.connectionAxis} — ${persona.connectionSummary}\n` +
        `- seed: ${spec.seed}\n\n</details>\n`
    );
  }
  return parts.join("\n");
}
