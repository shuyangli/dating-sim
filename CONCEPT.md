# Settling

*An interactive simulation about choice, commitment, and the mathematics of loneliness.*

## The observation

In large cities, where dating apps make the option pool feel infinite, some people
optimize for the perfect candidate and go years without a partner, miserable about
dating. Others optimize for a p80/p90 candidate and settle down quickly.
Counterintuitively, in small cities people settle much faster and seem happier.

Gay dating in major metros is the purest case of this dynamic: migration concentrates
the community into a handful of cities, apps make the perceived pool effectively
infinite, and — unlike straight markets — both sides of the market run the same
maximizing algorithm. It is the cleanest natural experiment for choice overload
that exists.

## The thesis

> **The size of your option pool doesn't determine the quality of your outcome —
> it determines your reference point. Your reference point sets your stopping rule,
> and your stopping rule determines your life.**

The big-city dater and the small-town dater can go on the identical date with the
identical person. One compares him to the imagined best of 10,000 and keeps
swiping; the other compares him to the best of 50 and commits. Same input,
different denominator, different life. The misery is not caused by the options —
it is caused by the *perceived* denominator. The secretary problem's optimal
"explore 37%, then commit" rule literally breaks as n → ∞: the exploration phase
never ends.

And the second half, which turns the contradiction into a solution:

> **Partner quality is not a fixed number you discover; it is a seed you grow.
> The p99 relationship is never found — it is made, through years of investment
> that only commitment unlocks.**

This rescues the moral from "settle for less" (defeatist; nobody wants to feel
that). The satisficer does not accept a worse partner — they commit early to a
p75 match and compound it into something better than any first-date score in the
entire dataset. The maximizer is not holding out for the best; he is holding out
for something that cannot exist at first sight.

One line: **"The perfect partner is never found — and infinite choice keeps you
searching for what can only be grown."**

### Supporting mechanisms (encoded in the model because they are true and visceral)

- **The pool drains adversely.** While you search, the most commitment-ready
  people pair off with each other and exit. The pool you face at 40 is selected
  for non-commitment. Searching is not free.
- **You are also being evaluated.** Everyone is simultaneously chooser and chosen,
  running the same algorithm. Two-sided matching, not a menu.
- **Aging is real.** Time passes during the search; happiness is an integral,
  not an endpoint. Years spent searching are years not spent partnered.

### Intellectual anchors

Optimal stopping / the secretary problem · Schwartz's paradox of choice ·
Simon's satisficing and the maximizer/satisficer distinction ·
two-sided matching markets (Gale–Shapley) · choice-overload studies (Iyengar's
jam experiment) · adverse selection in search markets.

## The simulation: radical legibility

The initial instinct — simulate every agent swiping, chatting, dating — is a ton
of detail that obscures the mechanism. The key design insight:

> **The entire observed sociology falls out of two variables: perceived pool size,
> and stopping rule.** Everything else is noise.

So the core is a brutally simple numerical model that runs thousands of lives in
milliseconds:

- Agents with trait vectors; pairwise first-date compatibility score
- Aspiration threshold θ(perceived pool size, persona, time) —
  "there are 10,000 men in this city, why would I take an 8?"
- A meeting rate; mutual commitment when both scores clear both thresholds
  (rejection is two-sided)
- **Relationship quality grows with invested years** — the load-bearing mechanic:
  q(t) = q₀ + growth · investment · years, with a breakup hazard
- Happiness = ∫ (partnered quality − loneliness cost) dt
- The pool drains as couples form; agents age; late pools are adversely selected

Two knobs — perceived pool size and maximizer/satisficer persona — reproduce the
whole phenomenon. That is the legibility claim, and the piece should make it
felt: change one number, change everyone's life.

### The role of the AI

The LLM does **not** make decisions (slow, expensive, irreproducible, illegible).
The numerical model decides; the LLM **narrates**. Each agent has a story they
tell themselves, and the LLM updates that story after each date and generates the
rationalization:

> "He was kind. Funny. An honest 8. But this city is full of 9s..."

Humans don't compute thresholds — we narrate ourselves into them. The framing for
the wall text: **the only AI in the simulation is the part that lies to itself.**

Optional middle layer: a small cast (~12 followed characters) whose decisions ARE
LLM-driven with maximizer/satisficer personas, embedded in the fast numerical
background population. Texture from the few, truth from the many.

## The piece: five movements

A scrollytelling web piece (shareable; also stages well as a two-screen gallery
diptych with soundscape). The contradiction lands hardest when the audience
catches *themselves* doing it.

1. **The Mirror (hook).** Before any explanation, the visitor plays. Candidates
   appear one at a time with a compatibility percentile; accept or reject;
   rejections are final; the pool reads "∞ nearby." Nearly everyone holds out.
   *Then* the piece begins.

2. **The Diptych.** Split screen: same 100 souls, same compatibility matrix, only
   perceived pool size differs. Agents are particles of light; pairing = two
   particles binding and slowly warming in color; decades pass in minutes. The
   big city is *gorgeous* — a glittering, frantic sea of sparks that never
   settle. The small town starts dim and slow, then steadily warms into
   constellations. Make abundance beautiful: the beauty is the trap. Legible at
   one glance from across a room.

3. **The Voices.** Zoom into sampled agents. The same date transcript, evaluated
   by two inner monologues under two reference frames, reaching opposite
   conclusions. LLM-generated, drifting as text across the particle field.

4. **The Reveal.** Re-score every couple's compatibility at year ten: it exceeds
   every first-date score in the dataset.
   *"The best partner in the simulation was never anyone's best option."*
   Then the wall of epitaphs, generated per agent:
   - "Marcus, moved to NYC at 24. 312 first dates. Partnered at 41 with a man
     he'd have swiped left on at 28. Happy."
   - "Dev, stayed in Columbus. Married the third man he dated. Happy since 26."

5. **The Mirror, again.** "You rejected 9 people averaging p82. Here is what
   happens, on average, to people who run your algorithm." The visitor's own
   stopping rule, quantified against the population.

## Art direction

- **Visual language:** no dating-app UI pastiche (Tinder-card parody is tired).
  Particle systems: agents as points of light, commitment as binding and warming,
  churn as Brownian shimmer. Aging = slow loss of luminosity. Decades in minutes.
- **Sound carries the thesis:** every pairing is a chord. The big city is endless
  glittering arpeggios that never resolve; the small town cadences into sustained
  harmony. Unresolved suspension vs. resolution — music theory as the emotional
  argument.
- **Text layer:** LLM-generated inner monologue surfacing from sampled agents,
  drifting through the field.
- **Title candidates:** *Settling* (settling for / settling down / particles
  settling — the whole piece in one word), *37%*, *Someone Better*, *Good Enough*.

## Build sketch

1. **Core model** — TypeScript simulation engine, deterministic with seeds,
   ~hundreds of lines. Validate that the two knobs reproduce the phenomenon
   (happiness-vs-pool-size curves, time-to-partnership distributions).
2. **Diptych visualization** — WebGL/canvas particle field driven by the engine.
3. **The Mirror** — the interactive stopping game, instrumented to capture the
   visitor's revealed threshold.
4. **Narration layer** — LLM-generated monologues and epitaphs from simulation
   traces (batch-generated, cached; live generation optional).
5. **Sound** — Web Audio; chord resolution mapped to commitment events.
6. **Scrollytelling shell** stitching the five movements.
