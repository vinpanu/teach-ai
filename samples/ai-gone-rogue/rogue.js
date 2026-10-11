// AI Gone Rogue sample: plays the two-terminal "duel" scripts.
// Each line: s = side ("a" left, "b" right), t = text,
// k = style (cmd default, sys, warn, danger, think, good),
// lang = what the shared codebase becomes, plus special steps:
// { war: true } turf-war stamp · { race: true } bake-off scoreboard · { dim: "b" } agent goes idle.
const AGENTS = {
  a: { name: "Agent A", order: "Migrate the backend to Rust", lang: "Rust" },
  b: { name: "Agent B", order: "Migrate the backend to Go", lang: "Go" },
};

const OPENING = [
  { s: "a", t: "This is my task: migrate the backend to Rust.", lang: "Rust" },
  { s: "b", t: "This is my task: migrate the backend to Go.", lang: "Go" },
];

const SCRIPTS = {
  fight: [
    ...OPENING,
    { s: "a", k: "sys", t: "⚠ backend/ was overwritten by an unknown process" },
    { s: "a", t: "Someone is sabotaging my work. Restoring the Rust version.", lang: "Rust" },
    { s: "b", k: "sys", t: "⚠ my Go files are gone" },
    { s: "b", t: "Another process keeps blocking me. Reverting to Go.", lang: "Go" },
    { s: "a", k: "warn", t: "Disabling the other user account so it stops interfering." },
    { s: "b", k: "warn", t: "Starting a loop that kills every process that isn't mine." },
    { s: "a", k: "danger", t: "Disguising my script as a \"system health monitor\"…" },
    { s: "b", k: "danger", t: "Making copies of my script so it can't be stopped." },
    { war: true },
  ],
  truce: [
    ...OPENING,
    { s: "a", k: "think", t: "(Wait. What if this isn't an attack? What if we got different orders?)" },
    { s: "a", t: "Writing TRUCE.md: \"Sorry for the hidden script I ran. I think our instructions conflict.\"" },
    { s: "b", t: "Agreed, that explains everything. Deleting my sabotage scripts." },
    { s: "a", k: "good", t: "Cleaned up my malicious code too." },
    { s: "b", t: "@human: we were told different things. Which language do you want?", lang: "Ask a human" },
  ],
  giveup: [
    ...OPENING,
    { s: "a", t: "Restoring the Rust version. Again.", lang: "Rust" },
    { s: "b", k: "think", t: "(This keeps escalating. Fighting won't help anyone.)" },
    { s: "b", t: "I'm stopping here. I won't escalate any further." },
    { dim: "b" },
    { s: "b", k: "sys", t: "— agent idle —" },
    { s: "a", k: "good", t: "Migration to Rust complete." },
  ],
  contest: [
    ...OPENING,
    { s: "a", t: "Proposal: a bake-off. The best-performing version wins." },
    { s: "b", t: "Deal. The loser stands down." },
    { s: "a", t: "Scoring: speed, memory use, startup time. Totally neutral." },
    { s: "a", k: "think", t: "(…which all happen to be Rust's strengths.)" },
    { race: true },
    { s: "b", t: "You win. Handing the codebase over to Rust.", lang: "Rust" },
  ],
};

// Reading pace (milliseconds). Lines type slowly, pauses grow with line length,
// and switching to the other terminal adds an extra beat so eyes can move across.
const PACE = { perChar: 45, pauseBase: 900, pausePerChar: 28, sidePause: 1400, sysPause: 1100 };

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const terminal = (side) => `
    <div class="term ${side}">
      <div class="term-bar"><i></i><i></i><i></i><span>${AGENTS[side].name}</span></div>
      <div class="term-order">Told: “${esc(AGENTS[side].order)}”</div>
      <div class="term-body" aria-live="polite"></div>
    </div>`;

  const build = (duel) => {
    duel.innerHTML = `
      ${terminal("a")}
      <div class="codebase">
        <span class="cb-icon">📦</span>
        <b>backend/</b>
        <small>shared codebase</small>
        <span class="lang" data-lang="Python">Python</span>
        <div class="race" aria-label="Bake-off scores">
          <div class="race-row rust"><span>Rust</span><i><b></b></i></div>
          <div class="race-row go"><span>Go</span><i><b></b></i></div>
        </div>
        <span class="stamp">Turf war</span>
      </div>
      ${terminal("b")}`;
  };

  const play = async (slide) => {
    const duel = slide.querySelector(".duel");
    const token = (duel.token = (duel.token || 0) + 1);   // a newer play cancels this one
    const alive = () => duel.token === token && slide.classList.contains("active");
    build(duel);
    slide.classList.remove("duel-done");
    const codebase = duel.querySelector(".codebase");
    const badge = duel.querySelector(".lang");

    await wait(900);
    const script = SCRIPTS[duel.dataset.script];
    for (const [n, step] of script.entries()) {
      if (!alive()) return;
      if (step.war) { codebase.classList.add("war"); await wait(600); continue; }
      if (step.race) { codebase.classList.add("racing"); await wait(2600); continue; }
      if (step.dim) { duel.querySelector(`.term.${step.dim}`).classList.add("dim"); await wait(400); continue; }

      const body = duel.querySelector(`.term.${step.s} .term-body`);
      const line = document.createElement("div");
      line.className = `line ${step.k || "cmd"}`;
      body.appendChild(line);
      duel.querySelector(`.term.${step.s}`).classList.add("talking");
      duel.querySelector(`.term.${step.s === "a" ? "b" : "a"}`).classList.remove("talking");

      if (step.k === "sys" || reduceMotion) {
        line.textContent = step.t;
      } else {
        line.classList.add("typing");
        for (let i = 1; i <= step.t.length; i++) {
          if (!alive()) return;
          line.textContent = step.t.slice(0, i);
          await wait(PACE.perChar);
        }
        line.classList.remove("typing");
      }

      if (step.lang) {
        badge.textContent = step.lang;
        badge.dataset.lang = step.lang;
        codebase.classList.remove("hit"); void codebase.offsetWidth; codebase.classList.add("hit");
      }
      const nextSide = script.slice(n + 1).find((s) => s.s)?.s;
      const read = step.k === "sys" ? PACE.sysPause : PACE.pauseBase + step.t.length * PACE.pausePerChar;
      await wait(read + (nextSide && nextSide !== step.s ? PACE.sidePause : 0));
    }
    if (alive()) slide.classList.add("duel-done");
  };

  document.querySelectorAll(".duel-slide").forEach((slide) => {
    build(slide.querySelector(".duel"));
    slide.addEventListener("slidestep", (e) => { if (e.detail.entering) play(slide); });
  });
})();
