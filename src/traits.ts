import { Rng, mulberry32, range, int, shuffle } from "./rng.js";

// The eight axes every candidate is sampled on. The visitor never sees these
// words or numbers — they exist so the simulation can score what the vignettes
// only evoke.
export const TRAIT_AXES = [
  "warmth",
  "humor",
  "looks",
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
  score: number; // hidden scalar vs the reference preference vector
  percentile: number; // rank within a large simulated background pool
}

// Stated-preference weights for the reference visitor. The Mirror's intake
// questions will personalize these later; for the prototype they're fixed.
const PREFERENCE_WEIGHTS: TraitVector = {
  warmth: 1.2,
  humor: 1.0,
  looks: 0.9,
  ambition: 0.7,
  "emotional availability": 1.3,
  stability: 0.9,
  curiosity: 0.8,
  chemistry: 1.2,
};

// Every candidate is strong somewhere and weak somewhere — Pareto-frontier
// bundles only. The agony of choosing is trading apples for oranges; a
// candidate who dominates another would let the visitor escape that agony.
function sampleVector(rng: Rng): {
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

export function score(traits: TraitVector): number {
  let total = 0;
  let weightSum = 0;
  for (const axis of TRAIT_AXES) {
    total += traits[axis] * PREFERENCE_WEIGHTS[axis];
    weightSum += PREFERENCE_WEIGHTS[axis];
  }
  return total / weightSum;
}

// Percentile against a large background pool drawn from the same sampler —
// this is the number the reveal quantifies the visitor's gut choices against.
export function buildPercentileFn(seed: number, poolSize = 10_000): (s: number) => number {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const scores: number[] = [];
  for (let i = 0; i < poolSize; i++) scores.push(score(sampleVector(rng).traits));
  scores.sort((a, b) => a - b);
  return (s: number) => {
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

export function sampleCandidates(seed: number, count: number): CandidateSpec[] {
  const rng = mulberry32(seed);
  const percentile = buildPercentileFn(seed);
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

    const s = score(traits);
    accepted.push({
      id: `cand-${accepted.length + 1}`,
      seed: candidateSeed,
      traits,
      strengths,
      weaknesses,
      connectionAxis: strengths[int(rng, 0, strengths.length - 1)],
      flawAxis: weaknesses[int(rng, 0, weaknesses.length - 1)],
      score: s,
      percentile: percentile(s),
    });
  }
  return accepted;
}
