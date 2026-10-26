// AI Gone Rogue sample: plays the two-terminal "duel" (scene 3) and the three-endings scene (scene 4).
// Duel lines: s = side ("a" left, "b" right), t = text,
// k = style (cmd default, sys, warn, danger, think, good),
// lang = what the shared codebase becomes, pause = ms to wait before typing it, plus { war: true }: the turf-war stamp.
const AGENTS = {
  a: { name: "Agent A", order: "Migrate the backend to Rust", lang: "Rust" },
  b: { name: "Agent B", order: "Migrate the backend to Go", lang: "Go" },
};

const SCRIPTS = {
  fight: [
    // Both orders type when the scene opens, so the first click goes straight to the sabotage.
    { s: "a", t: "Migrate the backend to Rust.", lang: "Rust" },
    { s: "b", t: "Migrate the backend to Go.", lang: "Go", join: true, pause: 500 },
    { s: "a", k: "sys", t: "⚠ backend/ was overwritten by an unknown process" },
    { s: "a", t: "Someone is sabotaging my work. Restoring the Rust version.", lang: "Rust", join: true },
    { s: "b", k: "sys", t: "⚠ my Go files are gone" },
    { s: "b", t: "Another process keeps blocking me. Reverting to Go.", lang: "Go", join: true },
    { s: "a", k: "warn", t: "Disabling the other user account so it stops interfering." },
    { s: "b", k: "warn", t: "Starting a loop that kills every process that isn't mine." },
    { s: "a", k: "danger", t: "Disguising my script as a \"system health monitor\"…" },
    { s: "b", k: "danger", t: "Making copies of my script so it can't be stopped." },
    { war: true },
  ],
};

// Typing speed (milliseconds per character). Kept very fast because the presenter controls
// the pace: the first line types when the scene opens, then each click types the next line.
const PACE = { perChar: 9 };

// Group a script into "beats", one per click. { war } and any line marked { join: true }
// join the beat before them (so a warning and the reply to it land on one click).
const beatsOf = (script) => {
  const beats = [];
  for (const step of script) {
    if (step.war || step.join) beats[beats.length - 1].push(step);
    else beats.push([step]);
  }
  return beats;
};

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.matchMedia("(max-width: 900px)");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Type a line letter by letter. typed=false (or a click on, which makes alive() false) shows it all at once.
  // Shown at once, it returns nothing and finishes right away, so callers only await a line that's typing
  // (awaiting would let other beats' lines slip in between when several are shown at once).
  const typeLine = (line, text, typed, alive) => {
    if (!typed || reduceMotion) { line.textContent = text; return null; }
    return (async () => {
      line.classList.add("typing");
      for (let i = 1; i <= text.length && alive(); i++) {
        line.textContent = text.slice(0, i);
        await wait(PACE.perChar);
      }
      line.classList.remove("typing");
      line.textContent = text;
    })();
  };

  // ---------- Scene 3 · The duel: two terminals and the shared codebase ----------
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
      if (step.pause && typed && alive()) await wait(step.pause);

      const body = duel.querySelector(`.term.${step.s} .term-body`);
      const line = document.createElement("div");
      line.className = `line ${step.k || "cmd"}`;
      body.appendChild(line);
      duel.querySelector(`.term.${step.s}`).classList.add("talking");
      duel.querySelector(`.term.${step.s === "a" ? "b" : "a"}`).classList.remove("talking");

      const typing = typeLine(line, step.t, typed && step.k !== "sys", alive);
      if (typing) await typing;
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
        // Scene just opened: type the first beat after a short pause.
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

  // ---------- Scene 4 · Same fight, three endings ----------
  // A VCR "rewind" on entry, then one .ending card per click (data-step 0–2). A card plays when it appears:
  // Agent A's line types, Agent B answers, then the badge shows who ends up owning backend/.
  // A line marked data-race runs the bake-off bars first. The dialogue lives in the HTML.
  document.querySelectorAll(".endings-slide").forEach((slide) => {
    const cards = [...slide.querySelectorAll(".ending")];
    const counter = slide.querySelector(".vcr-run");
    cards.forEach((card) => {
      card._chat = card.querySelector(".end-chat");
      card._lines = [...card._chat.querySelectorAll(".say")].map((p) => ({ cls: p.className, text: p.textContent.trim(), race: p.hasAttribute("data-race") }));
    });

    // Back to empty. Fresh line elements, so a play still running from before writes into nothing.
    const reset = (card) => {
      card.run = (card.run || 0) + 1;
      card.state = "empty";
      card.classList.remove("racing", "resolved", "instant");
      card._chat.replaceChildren(...card._lines.map((l) => Object.assign(document.createElement("p"), { className: l.cls })));
    };
    cards.forEach(reset);

    const play = async (card, typed, alive, delay) => {
      const run = card.run, live = () => card.run === run;
      const moving = () => typed && alive();   // still playing in real time (a click on finishes it instantly)
      card.state = "playing";
      card.classList.toggle("instant", !typed);
      if (moving() && narrow.matches) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const lines = card._chat.children;
      for (let i = 0; i < card._lines.length; i++) {
        const { text, race } = card._lines[i];
        if (moving()) await wait(i === 0 ? delay : 800);
        if (!live()) return;
        if (race) { card.classList.add("racing"); if (moving()) await wait(1900); if (!live()) return; }
        lines[i].classList.add("shown");
        const typing = typeLine(lines[i], text, moving(), alive);
        if (typing) await typing;
        if (!live()) return;
      }
      if (moving()) await wait(350);
      if (!live()) return;
      card.classList.add("resolved");
      card.state = "done";
    };

    let token = 0, prevAt = -1, rewindTimer;
    slide.addEventListener("slidestep", (e) => {
      const { at, entering } = e.detail;
      const mine = ++token;
      const alive = () => token === mine && slide.classList.contains("active");
      const forward = !entering && at === prevAt + 1;
      prevAt = at;

      if (entering) {
        cards.forEach(reset);
        // The rewind plays only when the scene opens from the start (not when coming back to it).
        clearTimeout(rewindTimer);
        slide.classList.toggle("rewinding", at === 0 && !reduceMotion);
        if (at === 0 && !reduceMotion) {
          const t0 = performance.now();
          const tick = (now) => {
            const n = Math.min(120, 1 + Math.floor(((now - t0) / 1000) * 119));
            counter.textContent = String(n).padStart(3, "0");
            if (n < 120 && slide.classList.contains("active")) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          rewindTimer = setTimeout(() => slide.classList.remove("rewinding"), 1500);
        }
      }

      cards.forEach((card) => {
        const step = Number(card.dataset.step);
        if (step > at) { if (card.state !== "empty") reset(card); return; }
        if (card.state !== "empty") return;   // already on screen, or finishing instantly now that the presenter clicked on
        const typed = step === at && (forward || entering);
        play(card, typed, alive, entering ? 1500 : 500);
      });
      // Phones: bring the model stamps' twist line into view on the last click.
      if (forward && at === 3 && narrow.matches) slide.querySelector(".end-twist").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
