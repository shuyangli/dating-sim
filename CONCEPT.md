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
   appear one at a time; accept or reject; rejections are final; the pool reads
   "∞ nearby." Nearly everyone holds out. *Then* the piece begins.
   (Full game design below — the visitor never sees a number during play.)

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

## The Mirror: game design

A percentile on a card makes the visitor a gambler, not a dater. The fix is not
to hide the numbers better — it is to invert where they live:

> **The numbers exist, but you never date them.** Every candidate has a hidden
> trait vector and scalar score (the simulation needs them), but what the
> visitor sees is a *person generated from those traits* — a name, a face, and,
> crucially, not a profile but a **vignette of the date itself**. The numbers
> surface only in the reveal, when every gut choice gets re-scored. Seeing your
> vibes quantified is itself part of the piece.

Example vignette (three lines of lived moment, not stats):

> He ordered for you without asking — confident, or presumptuous? He laughed at
> his own joke before the punchline. But when you mentioned your mom, he put his
> phone face-down and listened.

### Mechanics that make it feel like dating

1. **Incommensurable bundles, never a clear winner.** Candidates are generated
   only on the Pareto frontier: each is strong on some axes, weak on others —
   funny but flaky, gorgeous but boring, kind but no spark. The agony of real
   dating is trading apples for oranges; a scalar deletes that agony, trait
   tension restores it.
2. **Every vignette contains one genuine flaw and one moment of real
   connection.** Big-city maximizing runs on flaw-fixation — with infinite
   options, any flaw is disqualifying. And rejecting someone only stings if you
   felt something first. Both beats, every card.
3. **Two phases, like reality.** A fast **swipe phase** (10–15 profiles, seconds
   each; cards drift away if you hesitate — app phenomenology) funnels into a
   slower, untimed **date phase** (5–7 vignettes). Whole game under five minutes.
4. **The phantom next.** While the visitor reads a date vignette, match
   notifications quietly arrive. After each rejection: *"2,341 more nearby."*
   The infinite scroll must be felt as a physical pull mid-decision.
5. **You get rejected too.** At least once, the visitor says yes and he doesn't:
   *"He had a nice time. He didn't feel it."* One beat punctures the menu
   illusion and makes the market two-sided.
6. **Time is the price.** Every decision advances the clock — seasons change in
   the backdrop, friends' couples appear in the periphery, *"You are 31 now."*
   The cost of search is never money; it is years.
7. **Commitment is a sequence, not a button.** Accepting means *another date*;
   coupling takes three consecutive yeses, with date-2 and date-3 vignettes that
   deepen (and reveal more flaws). This is where maximizers actually bail — when
   novelty fades — and the game lets them do it.
8. **The same man twice (the killer beat).** One candidate appears twice — same
   vignette lightly reskinned, different name — once early, once late. The
   reveal: *"You met Daniel twice. You said no at 27 and yes at 34. He was the
   same person."* One moment that carries the entire thesis: same input,
   different denominator.

### The reveal, rebuilt around persons instead of percentiles

- **Where are they now:** rejected candidates re-enter the simulation and pair
  off — *"Daniel met someone four months later."* The visitor watches their own
  pool drain.
- **Stated vs. revealed preferences:** three intake questions before play ("what
  matters most to you?") set this up. Then: *"You said kindness mattered most.
  You rejected the two kindest men in your pool in under 8 seconds each."*
- **Your revealed algorithm:** only now do numbers appear — *"You were running a
  p93 stopping rule"* — mapped onto the population outcomes from the diptych.

### Implementation

Candidates are batch-generated and cached: trait vector → LLM writes the
profile, three escalating date vignettes, the flaw, and the connection moment.
Deterministic seeds keep the simulation reproducible. Live LLM generation is
needed only for the personalized reveal text, if at all.

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
