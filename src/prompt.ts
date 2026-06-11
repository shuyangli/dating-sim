import { z } from "zod";
import { CandidateSpec, TRAIT_AXES } from "./traits.js";

// What the LLM returns for each candidate. Vignettes are the deliverable;
// the two summaries are designer-facing debug fields, never shown to visitors.
export const PersonaSchema = z.object({
  name: z.string().describe("First name only. Vary ethnicity and style across candidates."),
  age: z.number().int().describe("Between 26 and 39."),
  bio: z
    .string()
    .describe(
      "His dating-app bio, written in his own voice, 1-2 sentences. Should sound like a real person typed it, including one small uncurated detail."
    ),
  dates: z
    .array(
      z.object({
        setting: z.string().describe("Where the date happens, a few words."),
        vignette: z
          .string()
          .describe(
            "3-4 sentences, second person, present tense. Must contain exactly one moment expressing his flaw and one moment of genuine connection."
          ),
      })
    )
    .describe("Exactly 3 entries: first date, second date, third date."),
  flawSummary: z
    .string()
    .describe("One line for the designer: how his flaw shows up across the dates."),
  connectionSummary: z
    .string()
    .describe("One line for the designer: what makes the connection moments land."),
});

export type Persona = z.infer<typeof PersonaSchema>;

export const SYSTEM_PROMPT = `You write the candidates for "Settling", an interactive art piece about gay dating in big cities — about how infinite choice raises the reference point without raising the odds, and how people reject good matches while waiting for a perfect one that can only be grown, never found.

You are given a hidden trait card for one man. The visitor playing the piece will go on one to three dates with him and decide, on gut feeling alone, whether to see him again. Your vignettes ARE the date — they are everything the visitor gets. The numbers exist underneath, but you must translate them entirely into lived moments. The piece fails if a vignette reads like a character sheet; it works if the visitor catches themselves doing flaw-math on a person they just felt something for.

Craft rules:
- Second person, present tense. The visitor is on the date. ("He orders for you without asking.")
- 3-4 sentences per vignette. Specific and sensory: a real-feeling bar, a misjudged joke, the exact gesture. No abstractions, no adjectives doing the work a moment should do.
- Every vignette contains exactly ONE expression of his flaw and ONE moment of genuine connection. The connection must make rejecting him cost something. The flaw must be the kind a maximizer fixates on: real, human, survivable.
- Never name traits, never use numbers, never say "flaw" or "connection". Show, only.
- The three dates escalate: date 1 is first impressions (drinks, coffee, a walk); date 2 the novelty fades and routine peeks through; date 3 a moment of real intimacy AND the sharpest look at the flaw. This is where maximizers bail in real life — let the material let them.
- Setting: gay men dating in a large city (New York-ish, unnamed). Apps exist in this world; so do exes everyone shares. Textured, contemporary, unsentimental.
- He is a whole person, not a lesson. Warm where his card is warm, limited where it is limited. Avoid camp stereotype and avoid scrubbing the culture out — both are failures.
- Strength expressions should differ in register across candidates (one man's warmth is remembering your mom's surgery; another's is feeding strays). Never reuse a beat.

Example of target quality (for a man strong in warmth, weak in stability):
"He's twenty minutes late and arrives mid-apology, helmet under one arm, having clearly biked across the bridge for this. He orders for you both without asking — confident or presumptuous, you can't decide. But when you mention your mom's surgery, he puts his phone face-down, and doesn't pick it up again."

Return the structured persona exactly as specified. The flawSummary and connectionSummary are notes to the designer, not prose.`;

export function buildUserPrompt(spec: CandidateSpec): string {
  const lines = TRAIT_AXES.map(
    (axis) => `  ${axis}: ${spec.traits[axis].toFixed(2)}`
  ).join("\n");
  return `Hidden trait card (0 = absent, 1 = exceptional):
${lines}

Strong axes: ${spec.strengths.join(", ")}
Weak axes: ${spec.weaknesses.join(", ")}
Primary connection axis (the thing that makes leaving him cost something): ${spec.connectionAxis}
Primary flaw axis (the thing a maximizer will fixate on): ${spec.flawAxis}

Write this man.`;
}
