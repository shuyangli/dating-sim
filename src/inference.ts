import { Rng } from "./rng.js";
import { TRAIT_AXES, TraitAxis, TraitVector, score } from "./traits.js";

// Preference inference from forced choices ("this man or that man?").
// Bradley-Terry / logistic model: P(choose a over b) = sigmoid(G * w·(a - b)),
// with w = exp(theta) kept positive and regularized toward uniform. A handful
// of this-or-that picks in the Mirror's warm-up becomes the visitor's hidden
// preference vector — stated by behavior instead of by slider.

export interface Choice {
  winner: TraitVector;
  loser: TraitVector;
}

// Assumed decisiveness of a human chooser, matched to the simulation's
// "human" noise level: beta ~12 on normalized scores. Model utility u = w.d is
// unnormalized (weights are mean-1 over 11 axes), so the equivalent gain is
// beta / sum(w) ~ 12/11. Mis-set this and the fit compresses (gain too high)
// or inflates (too low) every inferred taste by the same factor.
const GAIN = 1.1;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function inferWeights(
  choices: Choice[],
  opts: { iters?: number; lr?: number; lambda?: number } = {}
): TraitVector {
  const { iters = 3000, lr = 0.5, lambda = 0.01 } = opts;
  // Prior: human taste intensities live in a bounded range (the preset
  // profiles span 4:1). Clamping theta to ±1 caps the inferred ratio at ~7:1;
  // without it, consistent answers make the MLE separable and weights blow up,
  // which both distorts the holdout ranking and saturates adaptive selection.
  const THETA_BOUND = 1.0;
  const theta: number[] = TRAIT_AXES.map(() => 0);

  // Ascend the MEAN log-likelihood (not the sum) so step sizes are stable
  // across question counts — the unnormalized gradient overshoots the theta
  // bounds and the fit bang-bangs instead of converging.
  for (let it = 0; it < iters; it++) {
    const grad = theta.map((t) => -2 * lambda * t);
    for (const { winner, loser } of choices) {
      let u = 0;
      for (let k = 0; k < TRAIT_AXES.length; k++) {
        u += Math.exp(theta[k]) * (winner[TRAIT_AXES[k]] - loser[TRAIT_AXES[k]]);
      }
      const p = sigmoid(GAIN * u);
      for (let k = 0; k < TRAIT_AXES.length; k++) {
        const d = winner[TRAIT_AXES[k]] - loser[TRAIT_AXES[k]];
        grad[k] += ((1 - p) * GAIN * d * Math.exp(theta[k])) / choices.length;
      }
    }
    for (let k = 0; k < theta.length; k++) {
      theta[k] = Math.max(-THETA_BOUND, Math.min(THETA_BOUND, theta[k] + lr * grad[k]));
    }
  }

  // Normalize to mean 1 so inferred vectors are comparable to the presets.
  const w = theta.map((t) => Math.exp(t));
  const mean = w.reduce((a, b) => a + b, 0) / w.length;
  const out = {} as TraitVector;
  TRAIT_AXES.forEach((axis, k) => (out[axis] = w[k] / mean));
  return out;
}

// A synthetic visitor with hidden true weights making a noisy choice. Beta is
// the decisiveness: ~40 reads the vignettes like a spreadsheet, ~12 like a
// person, ~6 like a person after two drinks.
export function simulateChoice(
  trueWeights: TraitVector,
  a: TraitVector,
  b: TraitVector,
  beta: number,
  rng: Rng
): Choice {
  const p = sigmoid(beta * (score(a, trueWeights) - score(b, trueWeights)));
  return rng() < p ? { winner: a, loser: b } : { winner: b, loser: a };
}

// Engineered dilemmas: constructed pairs that isolate one axis trade-off —
// "high on i, low on j" against its mirror image, everything else equal.
// In product these are authored contrast vignettes in the intake warm-up
// ("gorgeous but cold" vs "plain but devoted"); organic deck pairs differ too
// little in score to carry signal through human choice noise.
export interface Dilemma {
  a: TraitVector;
  b: TraitVector;
  axes: [TraitAxis, TraitAxis];
}

export function buildDilemmas(): Dilemma[] {
  const BASE = 0.6;
  const HI = 0.95;
  const LO = 0.25;
  const dilemmas: Dilemma[] = [];
  for (let i = 0; i < TRAIT_AXES.length; i++) {
    for (let j = i + 1; j < TRAIT_AXES.length; j++) {
      const a = {} as TraitVector;
      const b = {} as TraitVector;
      for (const axis of TRAIT_AXES) {
        a[axis] = BASE;
        b[axis] = BASE;
      }
      a[TRAIT_AXES[i]] = HI;
      a[TRAIT_AXES[j]] = LO;
      b[TRAIT_AXES[i]] = LO;
      b[TRAIT_AXES[j]] = HI;
      dilemmas.push({ a, b, axes: [TRAIT_AXES[i], TRAIT_AXES[j]] });
    }
  }
  return dilemmas;
}

// Pick the dilemma whose answer is least predictable under the current
// estimate — it probes the axes whose weights still look interchangeable.
export function selectDilemma(
  dilemmas: Dilemma[],
  asked: Set<number>,
  currentEstimate: TraitVector
): number {
  let best = -1;
  let bestInfo = -1;
  for (let d = 0; d < dilemmas.length; d++) {
    if (asked.has(d)) continue;
    let u = 0;
    for (const axis of TRAIT_AXES) {
      u += currentEstimate[axis] * (dilemmas[d].a[axis] - dilemmas[d].b[axis]);
    }
    const p = sigmoid(GAIN * u);
    const info = p * (1 - p);
    if (info > bestInfo) {
      bestInfo = info;
      best = d;
    }
  }
  asked.add(best);
  return best;
}

// Question selection over a candidate pool.
export type PairStrategy = "random" | "active" | "dilemma";

export function selectPair(
  strategy: PairStrategy,
  pool: TraitVector[],
  asked: Set<string>,
  currentEstimate: TraitVector,
  rng: Rng
): [number, number] {
  if (strategy === "random") {
    while (true) {
      const i = Math.floor(rng() * pool.length);
      const j = Math.floor(rng() * pool.length);
      if (i === j) continue;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (asked.has(key)) continue;
      asked.add(key);
      return [i, j];
    }
  }

  // Active: maximize Fisher information under the current estimate —
  // p(1-p)·(w·d)² — i.e. ask the question whose answer is least predictable
  // but most weight-revealing.
  let best: [number, number] = [0, 1];
  let bestInfo = -1;
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const key = `${i}-${j}`;
      if (asked.has(key)) continue;
      let u = 0;
      let dNorm = 0;
      for (const axis of TRAIT_AXES) {
        const d = pool[i][axis] - pool[j][axis];
        u += currentEstimate[axis] * d;
        dNorm += d * d;
      }
      const p = sigmoid(GAIN * u);
      const info = p * (1 - p) * dNorm;
      if (info > bestInfo) {
        bestInfo = info;
        best = [i, j];
      }
    }
  }
  asked.add(`${best[0]}-${best[1]}`);
  return best;
}
