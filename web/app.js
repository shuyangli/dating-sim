/* Settling — v1 of the Mirror.
   Stated question → authored dilemmas → swipe phase → date phase → reveal.
   All data is pre-generated (data.js); preference inference runs in-browser. */

(function () {
  const DATA = window.SETTLING;
  const AXES = DATA.axes;
  const LABEL = (axis) => DATA.labels[axis] || axis;

  // ---------- inference (port of src/inference.ts, parameterized by axes) ----

  const GAIN = 12 / AXES.length; // assumed human decisiveness over unnormalized utility
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  function inferWeights(choices) {
    const iters = 3000, lr = 0.5, lambda = 0.01, BOUND = 1.0;
    const theta = AXES.map(() => 0);
    for (let it = 0; it < iters; it++) {
      const grad = theta.map((t) => -2 * lambda * t);
      for (const { winner, loser } of choices) {
        let u = 0;
        for (let k = 0; k < AXES.length; k++) {
          u += Math.exp(theta[k]) * (winner[AXES[k]] - loser[AXES[k]]);
        }
        const p = sigmoid(GAIN * u);
        for (let k = 0; k < AXES.length; k++) {
          const d = winner[AXES[k]] - loser[AXES[k]];
          grad[k] += ((1 - p) * GAIN * d * Math.exp(theta[k])) / choices.length;
        }
      }
      for (let k = 0; k < theta.length; k++) {
        theta[k] = Math.max(-BOUND, Math.min(BOUND, theta[k] + lr * grad[k]));
      }
    }
    const w = theta.map((t) => Math.exp(t));
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    const out = {};
    AXES.forEach((axis, k) => (out[axis] = w[k] / mean));
    return out;
  }

  function scoreOf(traits, weights) {
    let total = 0, wsum = 0;
    for (const axis of AXES) {
      total += traits[axis] * weights[axis];
      wsum += weights[axis];
    }
    return total / wsum;
  }

  // ---------- state ----------------------------------------------------------

  const START_AGE = 27;
  const S = {
    screen: "title",
    stated: null,
    dilemmaIndex: 0,
    dilemmaChoices: [], // {axes, pickedAxis, passedAxis, winner, loser}
    swipeIndex: 0,
    liked: [],
    decisions: {}, // id -> {swipe, swipeMs, datesAttended, settled}
    months: 0,
    dateQueue: [],
    dateQueueIndex: 0,
    dateNumber: 1,
    settledWith: null,
    nearby: 2341,
    renderedAt: 0,
  };

  const stage = document.getElementById("stage");
  const hud = document.getElementById("hud");
  const hudAge = document.getElementById("hud-age");
  const hudNearby = document.getElementById("hud-nearby");
  const toast = document.getElementById("toast");
  let toastTimer = null;

  const age = () => START_AGE + Math.floor(S.months / 12);
  const ageMonths = () => S.months % 12;

  function updateHud(showNearby) {
    hud.hidden = S.screen === "title";
    hudAge.textContent = `You are ${age()}`;
    hudNearby.textContent = showNearby ? `${S.nearby.toLocaleString()} nearby` : "";
  }

  function tick(months) {
    S.months += months;
    S.nearby += Math.floor(Math.random() * 9) - 2; // the counter never really goes down
  }

  function showToast(text, delayMs) {
    clearTimeout(toastTimer);
    toast.hidden = true;
    toastTimer = setTimeout(() => {
      toast.textContent = text;
      toast.hidden = false;
      toastTimer = setTimeout(() => (toast.hidden = true), 4200);
    }, delayMs);
  }

  const PHANTOMS = [
    "Tariq, 33, is 0.4 miles away",
    "New match: Devon, 29",
    "Lucas, 31, liked your profile",
    "New match: Pretty close by…",
    "Aleks, 35, sent you a message",
    "Someone nearby just joined",
  ];
  let phantomIdx = 0;
  function phantom() {
    showToast("♥ " + PHANTOMS[phantomIdx++ % PHANTOMS.length], 3800);
  }

  function render(html) {
    clearTimeout(toastTimer);
    toast.hidden = true;
    stage.innerHTML = html;
    stage.style.animation = "none";
    void stage.offsetHeight; // restart the fade
    stage.style.animation = "";
    window.scrollTo(0, 0);
    S.renderedAt = performance.now();
  }

  function on(id, fn) {
    document.getElementById(id).addEventListener("click", fn);
  }

  // ---------- screens --------------------------------------------------------

  function showTitle() {
    S.screen = "title";
    updateHud(false);
    render(`
      <div class="kicker">A simulation</div>
      <h1>Settling</h1>
      <p class="dim" style="margin-top:1rem">About choice, commitment, and the mathematics of loneliness.</p>
      <p style="margin-top:2.2rem">You are ${START_AGE}. You just moved to the city.<br/>
      Everyone says the hard part is over.</p>
      <div class="row"><button id="begin" class="primary">Begin</button></div>
      <p class="dim small" style="margin-top:3rem">Five minutes. No account. It only remembers you until you close the tab.</p>
    `);
    on("begin", showStated);
  }

  function showStated() {
    S.screen = "stated";
    updateHud(false);
    const opts = AXES.map(
      (a) => `<button data-axis="${a}">${LABEL(a)}</button>`
    ).join("");
    render(`
      <div class="kicker">Before the apps</div>
      <h2>What do you tell yourself matters most?</h2>
      <p class="dim">One answer. You'll be held to it gently.</p>
      <div class="row">${opts}</div>
    `);
    stage.querySelectorAll("button[data-axis]").forEach((b) =>
      b.addEventListener("click", () => {
        S.stated = b.dataset.axis;
        showDilemma();
      })
    );
  }

  function showDilemma() {
    if (S.dilemmaIndex >= DATA.dilemmas.length) return showSwipeIntro();
    S.screen = "dilemma";
    updateHud(false);
    const d = DATA.dilemmas[S.dilemmaIndex];
    render(`
      <div class="kicker">Warm-up · ${S.dilemmaIndex + 1} of ${DATA.dilemmas.length}</div>
      <h2>${DATA.question}</h2>
      <div class="pair">
        <button id="pick-a">${d.a.line}</button>
        <button id="pick-b">${d.b.line}</button>
      </div>
    `);
    const pick = (chosen, other) => {
      S.dilemmaChoices.push({
        axes: d.axes,
        pickedAxis: chosen.axis,
        passedAxis: other.axis,
        winner: chosen.traits,
        loser: other.traits,
      });
      S.dilemmaIndex++;
      showDilemma();
    };
    on("pick-a", () => pick(d.a, d.b));
    on("pick-b", () => pick(d.b, d.a));
  }

  function showSwipeIntro() {
    S.screen = "swipeIntro";
    updateHud(true);
    render(`
      <div class="kicker">The app</div>
      <p>You make a profile. It does well.</p>
      <p class="dim">Each pass costs a month. So does each match — coffee, scheduling, the small talk. Time is the only thing the app doesn't show you.</p>
      <div class="row"><button id="go" class="primary">Open it</button></div>
    `);
    on("go", showSwipe);
  }

  function showSwipe() {
    if (S.swipeIndex >= DATA.deck.length) return showDateIntro();
    S.screen = "swipe";
    updateHud(true);
    const c = DATA.deck[S.swipeIndex];
    render(`
      <div class="kicker">Profile ${S.swipeIndex + 1}</div>
      <div class="card">
        <div class="name">${c.name}, ${c.age}</div>
        <p class="bio" style="margin-top:.6rem">${c.bio}</p>
      </div>
      <div class="row">
        <button id="pass">✕ &nbsp;Pass</button>
        <button id="like" class="primary">♥ &nbsp;Match</button>
      </div>
    `);
    const decide = (swipe) => {
      S.decisions[c.id] = {
        swipe,
        swipeMs: Math.round(performance.now() - S.renderedAt),
        datesAttended: 0,
        settled: false,
      };
      if (swipe === "like") S.liked.push(c.id);
      tick(1);
      S.swipeIndex++;
      showSwipe();
    };
    on("pass", () => decide("pass"));
    on("like", () => decide("like"));
  }

  function showDateIntro() {
    S.dateQueue = S.liked.slice();
    if (S.dateQueue.length === 0) return showReveal();
    S.screen = "dateIntro";
    updateHud(true);
    render(`
      <div class="kicker">The dates</div>
      <p>${S.dateQueue.length} matched back. You start meeting them, one at a time, in the order the app decided.</p>
      <p class="dim">Three good dates is something. Most people don't get to three.</p>
      <div class="row"><button id="go" class="primary">First date</button></div>
    `);
    on("go", () => {
      S.dateQueueIndex = 0;
      S.dateNumber = 1;
      showDate();
    });
  }

  function currentDateCandidate() {
    const id = S.dateQueue[S.dateQueueIndex];
    return DATA.deck.find((c) => c.id === id);
  }

  function showDate() {
    if (S.dateQueueIndex >= S.dateQueue.length) return showReveal();
    S.screen = "date";
    updateHud(true);
    const c = currentDateCandidate();
    const d = c.dates[S.dateNumber - 1];
    S.decisions[c.id].datesAttended = S.dateNumber;
    const last = S.dateNumber === 3;
    render(`
      <div class="kicker">${c.name} · date ${S.dateNumber} — ${d.setting}</div>
      <div class="vignette">${d.vignette}</div>
      <div class="row">
        <button id="leave">Keep looking</button>
        <button id="stay" class="primary">${last ? "Stay. Build something." : "See him again"}</button>
      </div>
    `);
    phantom();
    on("stay", () => {
      tick(2);
      if (last) {
        S.settledWith = c.id;
        S.decisions[c.id].settled = true;
        showReveal();
      } else {
        S.dateNumber++;
        showDate();
      }
    });
    on("leave", () => {
      tick(2);
      S.dateQueueIndex++;
      S.dateNumber = 1;
      showDate();
    });
  }

  // ---------- the reveal -----------------------------------------------------

  function fateMonths(c) {
    return 2 + (c.seed % 9);
  }

  function fateLine(c) {
    const dec = S.decisions[c.id];
    const m = fateMonths(c);
    if (dec && dec.settled) return "He stayed too.";
    if (dec && dec.swipe === "like" && dec.datesAttended > 0) {
      return `You left after date ${dec.datesAttended}. He met someone ${m} months later.`;
    }
    if (dec && dec.swipe === "like") {
      return `You matched and never met. He met someone ${m} months later.`;
    }
    const secs = dec ? Math.max(1, Math.round(dec.swipeMs / 1000)) : 0;
    return `You passed in ${secs} second${secs === 1 ? "" : "s"}. He met someone ${m} months later.`;
  }

  function showReveal() {
    S.screen = "reveal";
    updateHud(true);
    hudNearby.textContent = "";

    const weights = inferWeights(S.dilemmaChoices);
    const ranked = DATA.deck
      .map((c) => ({ c, s: scoreOf(c.traits, weights) }))
      .sort((a, b) => b.s - a.s);
    const best = ranked[0].c;
    const bestDec = S.decisions[best.id];

    // Receipts: every dilemma where the stated value was on the table.
    const statedTests = S.dilemmaChoices.filter((ch) => ch.axes.includes(S.stated));
    const betrayals = statedTests.filter((ch) => ch.pickedAxis !== S.stated);
    const receiptItems = S.dilemmaChoices
      .map((ch) => {
        const involved = ch.axes.includes(S.stated);
        const betrayed = involved && ch.pickedAxis !== S.stated;
        const txt = `Offered <em>${LABEL(ch.axes[0])}</em> against <em>${LABEL(ch.axes[1])}</em> — you chose ${LABEL(ch.pickedAxis)}.`;
        return `<li>${betrayed ? `<span class="accent">${txt}</span>` : txt}</li>`;
      })
      .join("");

    const topAxes = AXES.slice().sort((a, b) => weights[b] - weights[a]);
    const maxW = weights[topAxes[0]];
    const bars = topAxes
      .map(
        (a) => `
        <div class="bar-row">
          <span class="bar-label">${LABEL(a)}</span>
          <div class="bar" style="width:${Math.round((weights[a] / maxW) * 220)}px"></div>
        </div>`
      )
      .join("");

    const firstDates = Object.values(S.decisions).filter((d) => d.datesAttended > 0).length;
    const years = Math.floor(S.months / 12);
    const ending = S.settledWith
      ? (() => {
          const c = DATA.deck.find((x) => x.id === S.settledWith);
          return `<p>You stopped at ${age()}, ${ageMonths()} months in, with <strong>${c.name}</strong>. The counter read ${S.nearby.toLocaleString()} more nearby.</p><p class="accent">You closed it anyway.</p>`;
        })()
      : `<p>The deck ran out. You are ${age()}. ${firstDates} first dates, ${years} year${years === 1 ? "" : "s"}.</p><p class="accent">The counter never ran out. That was never the problem.</p>`;

    const rankEntries = ranked
      .slice(0, 5)
      .map(({ c }, i) => {
        const isBest = i === 0;
        return `
        <div class="rank-entry${isBest ? " best" : ""}">
          <div>${i + 1}. <strong>${c.name}, ${c.age}</strong>${isBest ? ' <span class="accent">— your best match, by your own thumbs</span>' : ""}</div>
          <div class="fate">${fateLine(c)}</div>
        </div>`;
      })
      .join("");

    const statedLine =
      statedTests.length === 0
        ? `<p>You said <em>${LABEL(S.stated)}</em> mattered most. The warm-up never tested it. The dates did.</p>`
        : betrayals.length === 0
          ? `<p>You said <em>${LABEL(S.stated)}</em> mattered most — and every time we tested it, you meant it. That's rarer than you'd think.</p>`
          : `<p>You said <em>${LABEL(S.stated)}</em> mattered most. We put it on the table ${statedTests.length} time${statedTests.length === 1 ? "" : "s"}; you traded it away ${betrayals.length === statedTests.length ? "every time" : `${betrayals.length} of ${statedTests.length} times`}.</p>`;

    const bestLine = bestDec
      ? bestDec.settled
        ? `<p class="accent">You found him. You actually stopped.</p>`
        : `<p class="accent">${best.name} was #1 by your own revealed taste. ${fateLine(best)}</p>`
      : "";

    render(`
      <div class="kicker">The reveal</div>
      ${ending}
      <hr class="divider" />

      <div class="kicker">Receipts</div>
      ${statedLine}
      <ul class="choice-list">${receiptItems}</ul>
      <hr class="divider" />

      <div class="kicker">What your thumbs said</div>
      <p class="dim small">Your taste, inferred from behavior alone. Approximate by design — it aims, it doesn't testify.</p>
      ${bars}
      <hr class="divider" />

      <div class="kicker">The deck, scored by you</div>
      <p class="dim small">Not our ranking. Yours — every man re-scored under the weights your choices revealed.</p>
      ${rankEntries}
      ${bestLine}
      <hr class="divider" />

      <p style="font-size:1.15rem">A percentile is a property of a scorer, not of a person.<br/>
      And the best partner in this simulation was never anyone's best option —<br/>
      <span class="accent">he became it, in the years after someone stopped looking.</span></p>
      <div class="row"><button id="again">Live it again</button></div>
      <p class="dim small" style="margin-top:2.5rem">Settling · a work in progress · nothing leaves this page</p>
    `);
    on("again", () => location.reload());
  }

  showTitle();
})();
