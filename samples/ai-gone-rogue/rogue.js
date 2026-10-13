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

// Typing speed (milliseconds per character). Kept very fast because the presenter controls
// the pace: the first line types when the scene opens, then each click types the next line.
const PACE = { perChar: 9 };

// Group a script into "beats", one per click. A { dim } step joins the line after it,
// { war } joins the line before it (the stamp lands right after the last line),
// and { race } gets its own click.
const beatsOf = (script) => {
  const beats = [];
  let pre = [];
  for (const step of script) {
    if (step.dim) pre.push(step);
    else if (step.war) beats[beats.length - 1].push(step);
    else { beats.push([...pre, step]); pre = []; }
  }
  return beats;
};

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

  // Play one beat. typed=false shows it instantly (used when jumping or going back).
  const runBeat = async (slide, beat, typed, alive) => {
    const duel = slide.querySelector(".duel");
    const codebase = duel.querySelector(".codebase");
    const badge = duel.querySelector(".lang");
    for (const step of beat) {
      if (step.war) { codebase.classList.add("war"); continue; }
      if (step.race) { codebase.classList.add("racing"); continue; }
      if (step.dim) { duel.querySelector(`.term.${step.dim}`).classList.add("dim"); continue; }

      const body = duel.querySelector(`.term.${step.s} .term-body`);
      const line = document.createElement("div");
      line.className = `line ${step.k || "cmd"}`;
      body.appendChild(line);
      duel.querySelector(`.term.${step.s}`).classList.add("talking");
      duel.querySelector(`.term.${step.s === "a" ? "b" : "a"}`).classList.remove("talking");

      if (!typed || step.k === "sys" || reduceMotion) {
        line.textContent = step.t;
      } else {
        line.classList.add("typing");
        line._full = step.t;
        for (let i = 1; i <= step.t.length; i++) {
          if (!alive()) break;   // the presenter clicked on: finish this line instantly
          line.textContent = step.t.slice(0, i);
          await wait(PACE.perChar);
        }
        line.textContent = step.t;
        line.classList.remove("typing");
      }
      if (step.lang) {
        badge.textContent = step.lang;
        badge.dataset.lang = step.lang;
        if (typed) { codebase.classList.remove("hit"); void codebase.offsetWidth; codebase.classList.add("hit"); }
      }
    }
  };

  document.querySelectorAll(".duel-slide").forEach((slide) => {
    const duel = slide.querySelector(".duel");
    const beats = beatsOf(SCRIPTS[duel.dataset.script]);
    slide.dataset.steps = beats.length - 1;   // beat 0 plays on entry, one click per beat after that
    build(duel);
    let rendered = 0, prevAt = -1;   // beats on screen so far, and the last step shown

    slide.addEventListener("slidestep", (e) => {
      const at = e.detail.at;
      const token = (duel.token = (duel.token || 0) + 1);   // a newer click finishes the line still typing
      const alive = () => duel.token === token && slide.classList.contains("active");
      const finish = () => { if (alive()) slide.classList.toggle("duel-done", at === beats.length - 1); };
      const forward = !e.detail.entering && at === prevAt + 1;
      prevAt = at;

      // Entering, going back or jumping: start from a clean screen.
      if (!forward) { build(duel); slide.classList.remove("duel-done"); rendered = 0; }
      // Instantly show any earlier beats that aren't on screen yet.
      while (rendered < at) runBeat(slide, beats[rendered++], false, alive);

      if (e.detail.entering && at === 0) {
        // Scene just opened: type the first line after a short beat.
        wait(700).then(() => { if (!alive()) return; rendered = 1; runBeat(slide, beats[0], true, alive).then(finish); });
      } else if (forward) {
        rendered = at + 1;
        runBeat(slide, beats[at], true, alive).then(finish);
      } else {
        rendered = at + 1;
        runBeat(slide, beats[at], false, alive);
        finish();
      }
    });
  });
})();
