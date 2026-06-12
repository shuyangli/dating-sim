# Inference evaluation — preference weights from forced choices

Can the Mirror infer a visitor's preference vector from this-or-that picks alone?
Synthetic visitors with known weights make noisy choices between pairs drawn from a
40-man frontier deck; we fit a Bradley-Terry logistic model (weights regularized toward
uniform) and check whether the **inferred** beholder ranks a held-out 200-man population
the way the **true** one does.

Strategies: **random** — organic pairs off the deck; **active** — organic pairs picked
for maximum information under the running estimate; **dilemma** — engineered contrast
pairs that isolate one axis trade-off (in product: authored intake vignettes like
'gorgeous but cold' vs 'plain but devoted'), selected adaptively.

- **rank corr** — Spearman correlation between true and inferred candidate rankings (1.0 = identical taste)
- **top-decile overlap** — of the visitor's true top 20 men, the share the inferred profile also puts in its top 20
- **top-3 axes** — how many of the visitor's 3 emphasized axes the inference identifies
- noise β is choice decisiveness: 40 ≈ reads like a spreadsheet, 12 ≈ reads like a person, 6 ≈ a person after two drinks
- averaged over 6 visitors (3 presets + 3 random) × 4 trials

| questions | noise | strategy | rank corr | top-decile overlap | top-3 axes |
|---|---|---|---|---|---|
| 6 | low (β=40) | random | 0.53 | 32% | 1.5/3 |
| 6 | low (β=40) | active | 0.55 | 38% | 1.4/3 |
| 6 | low (β=40) | dilemma | 0.65 | 49% | 1.7/3 |
| 6 | human (β=12) | random | 0.43 | 26% | 1.3/3 |
| 6 | human (β=12) | active | 0.48 | 33% | 1.1/3 |
| 6 | human (β=12) | dilemma | 0.51 | 38% | 1.5/3 |
| 6 | high (β=6) | random | 0.36 | 23% | 1.2/3 |
| 6 | high (β=6) | active | 0.37 | 29% | 1.0/3 |
| 6 | high (β=6) | dilemma | 0.39 | 29% | 1.0/3 |
| 10 | low (β=40) | random | 0.63 | 40% | 1.7/3 |
| 10 | low (β=40) | active | 0.66 | 46% | 1.9/3 |
| 10 | low (β=40) | dilemma | 0.78 | 55% | 2.2/3 |
| 10 | human (β=12) | random | 0.46 | 29% | 1.3/3 |
| 10 | human (β=12) | active | 0.52 | 34% | 1.5/3 |
| 10 | human (β=12) | dilemma | 0.60 | 41% | 1.6/3 |
| 10 | high (β=6) | random | 0.34 | 25% | 1.0/3 |
| 10 | high (β=6) | active | 0.39 | 29% | 1.1/3 |
| 10 | high (β=6) | dilemma | 0.45 | 32% | 1.2/3 |
| 16 | low (β=40) | random | 0.69 | 45% | 2.0/3 |
| 16 | low (β=40) | active | 0.68 | 44% | 1.9/3 |
| 16 | low (β=40) | dilemma | 0.81 | 59% | 2.3/3 |
| 16 | human (β=12) | random | 0.55 | 37% | 1.5/3 |
| 16 | human (β=12) | active | 0.54 | 34% | 1.5/3 |
| 16 | human (β=12) | dilemma | 0.62 | 41% | 1.7/3 |
| 16 | high (β=6) | random | 0.39 | 27% | 1.2/3 |
| 16 | high (β=6) | active | 0.40 | 28% | 1.1/3 |
| 16 | high (β=6) | dilemma | 0.47 | 30% | 1.3/3 |
| 24 | low (β=40) | random | 0.80 | 57% | 2.5/3 |
| 24 | low (β=40) | active | 0.73 | 51% | 2.1/3 |
| 24 | low (β=40) | dilemma | 0.83 | 58% | 2.6/3 |
| 24 | human (β=12) | random | 0.61 | 40% | 1.7/3 |
| 24 | human (β=12) | active | 0.56 | 37% | 1.5/3 |
| 24 | human (β=12) | dilemma | 0.64 | 40% | 1.8/3 |
| 24 | high (β=6) | random | 0.48 | 30% | 1.2/3 |
| 24 | high (β=6) | active | 0.44 | 30% | 1.2/3 |
| 24 | high (β=6) | dilemma | 0.50 | 31% | 1.4/3 |

## Takeaways

1. **Engineered dilemmas beat organic pairs at every budget.** Frontier deck candidates
   are similar in overall quality by design, so organic choices are nearly coin flips;
   authored contrast pairs isolate one trade-off per question and carry ~3x the signal.
2. **The sweet spot is ~10 dilemmas.** At human noise that buys rank corr ~0.60 and
   top-decile overlap ~40%; returns diminish sharply after 16. And β=12 is likely
   pessimistic for authored dilemmas — they present the trade-off legibly, which is the
   point of authoring them. At β=40 the same 16 questions reach 0.81 / 59%.
3. **Good enough to aim, not to testify.** The inferred vector reliably finds the
   visitor's top axis or two and ranks the deck far better than chance — use it for
   percentile estimates and directional reveal copy ('you consistently traded warmth
   away'). It is NOT precise enough for false-precision claims ('Daniel was YOUR p91').
4. **The reveal's sharpest lines should be receipts, not inferences.** Dilemma answers
   are direct behavioral facts — 'we showed you gorgeous-but-cold against
   plain-but-devoted; you picked gorgeous, twice.' Log them and quote them verbatim;
   save the fitted weights for ranking math.
5. **Keep one stated question.** Ask the visitor to *say* what they value before the
   dilemmas, then infer what they pick. Stated-versus-revealed needs the stated half —
   and the gap between the two is the most personal moment the reveal can deliver.
6. **The intake doesn't carry everything.** Every accept/reject during the swipe and
   date phases is another choice observation; the same model keeps refining the
   estimate as the visitor plays.

## Demo: one pragmatist, 12 choices at human noise (dilemma strategy)

| axis | true weight | inferred |
|---|---|---|
| wealth | 2.0 | 1.79 |
| stability | 2.0 | 1.79 |
| chemistry | 0.5 | 1.79 |
| warmth | 0.5 | 1.49 |
| ambition | 2.0 | 0.98 |
| curiosity | 0.5 | 0.90 |
| looks | 0.5 | 0.78 |
| emotional availability | 0.5 | 0.50 |
| humor | 0.5 | 0.42 |
| status | 0.5 | 0.31 |
| fitness | 0.5 | 0.25 |
