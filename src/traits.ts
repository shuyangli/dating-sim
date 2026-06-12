import { Rng, mulberry32, range, int, shuffle } from "./rng.js";

// The trait axes every candidate is sampled on. The visitor never sees these
// words or numbers — they exist so the simulation can score what the vignettes
// only evoke. The set deliberately includes the market-legible attributes
// dating apps actually trade on (looks, fitness, wealth, status) alongside the
// interior ones: the deck must not moralize by omission.
export const TRAIT_AXES = [
  "warmth",
  "humor",
  "looks",
  "fitness",
  "wealth",
  "status",
  "ambition",
  "emotional availability",
  "stability",
  "curiosity",
  "chemistry",
] as const;

export type TraitAxis = (typeof TRAIT_AXES)[number];
export type TraitVector = Record<TraitAxis, number>;

export interface CandidateSpec {
  id: string;
  seed: number;
  traits: TraitVector;
  strengths: TraitAxis[]; // 2-3 high axes — one becomes the connection moment
  weaknesses: TraitAxis[]; // 1-2 low axes — one becomes the visible flaw
  connectionAxis: TraitAxis;
  flawAxis: TraitAxis;
  // A percentile is not a property of a person; it's a property of a scorer.
  // Scores are computed per preference profile; the Mirror's intake will add
  // the visitor's own profile, and the reveal judges them only by that one.
  percentiles: Record<string, number>;
}

function weights(base: number, emphasis: Partial<TraitVector>): TraitVector {
  const w = {} as TraitVector;
  for (const axis of TRAIT_AXES) w[axis] = emphasis[axis] ?? base;
  return w;
}

// Preset beholders. None of them is "correct" — that's the point. The same
// deck scored by each produces different p99s.
export const PREFERENCE_PROFILES: Record<string, TraitVector> = {
  uniform: weights(1, {}),
  romantic: weights(0.5, { chemistry: 2, "emotional availability": 2, warmth: 2 }),
  aesthete: weights(0.5, { looks: 2, fitness: 2, status: 2 }),
  pragmatist: weights(0.5, { wealth: 2, stability: 2, ambition: 2 }),
};

// Every candidate is strong somewhere and weak somewhere — Pareto-frontier
// bundles only. The agony of choosing is trading apples for oranges; a
// candidate who dominates another would let the visitor escape that agony.
export function sampleVector(rng: Rng): {
  traits: TraitVector;
  strengths: TraitAxis[];
  weaknesses: TraitAxis[];
} {
  const order = shuffle(rng, TRAIT_AXES);
  const nStrengths = int(rng, 2, 3);
  const nWeaknesses = int(rng, 1, 2);
  const strengths = order.slice(0, nStrengths);
  const weaknesses = order.slice(nStrengths, nStrengths + nWeaknesses);

  const traits = {} as TraitVector;
  for (const axis of TRAIT_AXES) {
    if (strengths.includes(axis)) traits[axis] = range(rng, 0.78, 0.95);
    else if (weaknesses.includes(axis)) traits[axis] = range(rng, 0.2, 0.45);
    else traits[axis] = range(rng, 0.5, 0.7);
  }
  return { traits, strengths, weaknesses };
}

function dominates(a: TraitVector, b: TraitVector): boolean {
  let strictly = false;
  for (const axis of TRAIT_AXES) {
    if (a[axis] < b[axis]) return false;
    if (a[axis] > b[axis]) strictly = true;
  }
  return strictly;
}

export function score(traits: TraitVector, prefs: TraitVector): number {
  let total = 0;
  let weightSum = 0;
  for (const axis of TRAIT_AXES) {
    total += traits[axis] * prefs[axis];
    weightSum += prefs[axis];
  }
  return total / weightSum;
}

// Percentile against a large background pool drawn from the same sampler,
// under a given beholder's weights.
export function buildPercentileFn(
  seed: number,
  prefs: TraitVector,
  poolSize = 10_000
): (traits: TraitVector) => number {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const scores: number[] = [];
  for (let i = 0; i < poolSize; i++) scores.push(score(sampleVector(rng).traits, prefs));
  scores.sort((a, b) => a - b);
  return (traits: TraitVector) => {
    const s = score(traits, prefs);
    let lo = 0;
    let hi = scores.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (scores[mid] < s) lo = mid + 1;
      else hi = mid;
    }
    return Math.round((lo / scores.length) * 100);
  };
}

export function sampleCandidates(
  seed: number,
  count: number,
  profiles: Record<string, TraitVector> = PREFERENCE_PROFILES
): CandidateSpec[] {
  const rng = mulberry32(seed);
  const percentileFns = Object.fromEntries(
    Object.entries(profiles).map(([name, prefs]) => [name, buildPercentileFn(seed, prefs)])
  );
  const accepted: CandidateSpec[] = [];

  while (accepted.length < count) {
    const candidateSeed = int(rng, 0, 2 ** 31 - 1);
    const { traits, strengths, weaknesses } = sampleVector(mulberry32(candidateSeed));

    // Keep the visible pool on the Pareto frontier.
    if (
      accepted.some((c) => dominates(c.traits, traits) || dominates(traits, c.traits))
    ) {
      continue;
    }

    accepted.push({
      id: `cand-${accepted.length + 1}`,
      seed: candidateSeed,
      traits,
      strengths,
      weaknesses,
      connectionAxis: strengths[int(rng, 0, strengths.length - 1)],
      flawAxis: weaknesses[int(rng, 0, weaknesses.length - 1)],
      percentiles: Object.fromEntries(
        Object.entries(percentileFns).map(([name, fn]) => [name, fn(traits)])
      ),
    });
  }
  return accepted;
}
