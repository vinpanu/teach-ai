// "How POA Runs" sample: how my AI health coach project is governed and delivered.
// Facts and the real Registry entries come from the POA sponsor dashboard (sources are listed in index.html).

// Stick-figure avatars: a person for Vince, a little robot for each AI agent (its level sets the color).
const avatar = (kind, level = "") => {
  const body = kind === "human"
    ? `<circle class="av-head" cx="60" cy="40" r="22"/>
       <path class="av-ink" d="M60 62 V130 M60 82 L30 112 M60 82 L90 112 M60 130 L38 190 M60 130 L82 190"/>`
    : `<path class="av-ink" d="M60 18 V6"/><circle class="av-accent" cx="60" cy="6" r="5"/>
       <rect class="av-head" x="34" y="18" width="52" height="44" rx="12"/>
       <circle class="av-accent" cx="49" cy="38" r="5"/><circle class="av-accent" cx="71" cy="38" r="5"/>
       <path class="av-ink thin" d="M51 51 Q60 56 69 51"/>
       <rect class="av-chest" x="43" y="68" width="34" height="54" rx="9"/>
       <path class="av-ink" d="M43 80 L24 112 M77 80 L96 112 M52 122 L44 190 M68 122 L76 190"/>`;
  return `<svg class="avatar ${kind} ${level}" viewBox="0 0 124 200" aria-hidden="true">${body}</svg>`;
};

// Scene 4: what the robot asks, and which document owns the answer (one question per click).
const CATALOG = [
  { q: "What exactly are we building?", doc: "scope", owner: "Product Scope Specification", why: "Accepted scope and every capability record" },
  { q: "Who has to approve this change?", doc: "fw", owner: "Operating Framework", why: "Roles, decision rights and approvals" },
  { q: "What should I work on next?", doc: "reg", owner: "Registry", why: "Current state and the exact next step" },
];

// Scene 7: Registry tabs. Entries are real (from the dashboard, Oct 21, 2026), shortened into plain English.
// " " is a space that never breaks, so a date stays on one line on phones.
const REGISTRY = [
  { tab: "Agent Startup", title: "Project state: who's on what, and the exact next step", cols: ["Who", "Working on", "Next step"], rows: [
    ["Scope BA", "Product scope", "Ask Vince 3 prepared questions"],
    ["Mission 1B BA", "Coaching knowledge", "Capture 3 follow-up answers"],
    ["Architect", "Technical design", "Map the technical inventory"],
  ] },
  { tab: "Decisions", title: "62 decisions logged, each with an ID and a date", cols: ["ID", "Date", "Decision"], rows: [
    ["D-0083", "Oct\u00a019", "Create a project-wide testing framework"],
    ["D-0080", "Oct\u00a019", "Dashboard shows each mission's next steps"],
    ["D-0076", "Oct\u00a018", "Reporting to Vince is part of every lead's job"],
    ["D-0069", "Oct\u00a016", "Mission 1A approved as complete"],
  ] },
  { tab: "Questions", title: "Open questions, requests and concerns", cols: ["Type", "Item", "Status"], rows: [
    ["Request", "Adopt the new POA Testing Framework?", ["Awaiting Vince", "var(--human)"]],
    ["Question", "What scope and exit criteria for Mission 1B?", ["Open", "var(--c-cat)"]],
    ["Concern", "Fitness-tracker integration still unverified", ["Amber", "var(--amber)"]],
  ] },
  { tab: "Website Dashboard", title: "Dashboard updates: what Vince will see", cols: ["Field", "Value"], rows: [
    ["Program health", ["Needs attention", "var(--amber)"]],
    ["Director's view", "Mission 1A done; 3 workstreams active"],
    ["Requests for Vince", "1 waiting"],
  ] },
];
const OTHER_TABS = ["Ideas", "Milestones", "PMO Priorities"];   // real tabs, not shown in the demo

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // Every [data-avatar] gets a figure: "human", or a robot level ("max", "xhigh", "high"). Anything already inside stays.
  document.querySelectorAll("[data-avatar]").forEach((el) => {
    const v = el.dataset.avatar;
    el.insertAdjacentHTML("afterbegin", v === "human" ? avatar("human") : avatar("agent", v));
  });

  // ---------- 3 · One loop: a token circles the stations; the Registry spokes light up as it passes ----------
  const loop = document.querySelector(".loop");
  if (loop) {
    const slide = loop.closest(".slide");
    const svg = loop.querySelector(".loop-svg");
    const track = svg.querySelector(".track");
    const spokes = [...svg.querySelectorAll(".spoke")];
    const stations = [...loop.querySelectorAll(".loop-st")];
    const token = loop.querySelector(".loop-token");
    const trail = [...loop.querySelectorAll(".loop-trail")];
    const angles = stations.map((s) => parseFloat(s.style.getPropertyValue("--a")));
    const LAP = 15000;   // ms for one trip around the loop
    let W = 0, H = 0, RX = 0, RY = 0, run = 0;
    const point = (deg) => [W / 2 + Math.cos(deg * Math.PI / 180) * RX, H / 2 + Math.sin(deg * Math.PI / 180) * RY];
    const measure = () => {
      W = loop.clientWidth; H = loop.clientHeight;
      const cs = getComputedStyle(loop);
      RX = parseFloat(cs.getPropertyValue("--rx")) / 100 * W;
      RY = parseFloat(cs.getPropertyValue("--ry")) / 100 * H;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      Object.entries({ cx: W / 2, cy: H / 2, rx: RX, ry: RY }).forEach(([k, v]) => track.setAttribute(k, v));
      spokes.forEach((l) => {
        const [x, y] = point(angles[l.dataset.to]);
        l.setAttribute("x1", W / 2); l.setAttribute("y1", H / 2); l.setAttribute("x2", x); l.setAttribute("y2", y);
      });
    };
    const put = (el, deg) => { const [x, y] = point(deg); el.style.transform = `translate(${x}px, ${y}px)`; };
    const light = (deg) => {
      stations.forEach((s, i) => {
        const past = (((deg - angles[i]) % 360) + 360) % 360;   // degrees since the token reached this station
        s.classList.toggle("lit", past < 32 || past > 348);
      });
      spokes.forEach((l) => l.classList.toggle("hot", stations[l.dataset.to].classList.contains("lit")));
    };
    const start = () => {
      const my = ++run;
      measure();
      if (reduceMotion) { put(token, -90); stations.forEach((s) => s.classList.add("lit")); return; }
      const t0 = performance.now() + 1700;   // wait for the stations to pop in
      const frame = (now) => {
        if (my !== run || !slide.classList.contains("active")) return;
        const deg = -90 + Math.max(0, now - t0) / LAP * 360;
        put(token, deg);
        trail.forEach((el, i) => { put(el, deg - (i + 1) * 5); el.style.opacity = now < t0 ? 0 : 0.5 - i * 0.14; });
        if (now >= t0) light(deg);
        requestAnimationFrame(frame);
      };
      stations.forEach((s) => s.classList.remove("lit"));
      requestAnimationFrame(frame);
    };
    window.addEventListener("resize", measure);
    slide.addEventListener("slidestep", (e) => { if (e.detail.entering) start(); });
  }

  // ---------- 4 · Artifact Catalog: question → card flips → the owning document lights up ----------
  const cat = document.querySelector(".cat-slide");
  if (cat) {
    const q = cat.querySelector(".cat-q");
    const card = cat.querySelector(".cat-card");
    const shelf = cat.querySelector(".cat-shelf");
    const docs = [...shelf.querySelectorAll(".doc")];
    const [a1, a2] = cat.querySelectorAll(".cat-arrow");
    let run = 0, shown = -1;
    const ask = async (i) => {
      const my = ++run; shown = i;
      const item = CATALOG[i];
      const doc = shelf.querySelector(`[data-doc="${item.doc}"]`);
      card.classList.remove("flipped"); shelf.classList.remove("picking");
      docs.forEach((d) => d.classList.remove("hit")); a1.classList.remove("go"); a2.classList.remove("go");
      q.textContent = item.q; restart(q, "pop");
      await wait(600); if (my !== run) return;
      a1.classList.add("go");
      await wait(1000); if (my !== run) return;
      card.style.setProperty("--hit", doc.style.getPropertyValue("--c"));
      card.querySelector(".cc-icon").textContent = doc.querySelector("span").textContent;
      card.querySelector(".cc-owner").textContent = item.owner;
      card.querySelector(".cc-why").textContent = item.why;
      card.classList.add("flipped");
      await wait(750); if (my !== run) return;
      a1.classList.remove("go"); a2.classList.add("go");
      shelf.classList.add("picking"); doc.classList.add("hit");
    };
    cat.addEventListener("slidestep", (e) => {
      const i = Math.min(e.detail.at, CATALOG.length - 1);
      if (e.detail.entering || i !== shown) ask(i);   // the Pro Tip step keeps the last question on screen
    });
  }

  // ---------- 7 · Registry: one tab per click (tabs can also be clicked) ----------
  const reg = document.querySelector(".reg-slide");
  if (reg) {
    const title = reg.querySelector(".sh-title");
    const thead = reg.querySelector(".sh-grid thead");
    const tbody = reg.querySelector(".sh-grid tbody");
    const tabs = reg.querySelector(".sh-tabs");
    const order = [...REGISTRY.slice(0, 3).map((t) => t.tab), ...OTHER_TABS, REGISTRY[3].tab];
    tabs.innerHTML = order.map((name) => {
      const i = REGISTRY.findIndex((t) => t.tab === name);
      return i < 0 ? `<button type="button" class="sh-tab" disabled>${name}</button>`
        : `<button type="button" class="sh-tab" role="tab" data-i="${i}">${name}</button>`;
    }).join("");
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".sh-tab[data-i]");
      if (b) window.slideDeck?.setStep(Number(b.dataset.i));
    });
    // A cell is text, or [text, color] for a colored tag.
    const cell = (c) => Array.isArray(c) ? `<span class="tag" style="--tc:${c[1]}">${c[0]}</span>` : c;
    const show = (i) => {
      const t = REGISTRY[i];
      title.textContent = t.title; restart(title, "pop");
      thead.innerHTML = `<tr>${t.cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;
      tbody.innerHTML = t.rows.map((r, k) => `<tr style="--k:${k}">${r.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`).join("");
      tabs.querySelectorAll(".sh-tab[data-i]").forEach((b) => {
        const on = Number(b.dataset.i) === i;
        b.classList.toggle("on", on); b.setAttribute("aria-selected", on);
      });
    };
    reg.dataset.steps = REGISTRY.length - 1;
    reg.addEventListener("slidestep", (e) => show(e.detail.at));
  }

  // ---------- 8 · Delivery: the package visits each stage; its owner pops up and the handoff gets a ✓ ----------
  const dlc = document.querySelector(".dlc-track");
  if (dlc) {
    const slide = dlc.closest(".slide");
    const stations = [...dlc.querySelectorAll(".dlc-st")];
    const dots = stations.map((s) => s.querySelector(".dot"));
    const token = dlc.querySelector(".dlc-token");
    const fill = dlc.querySelector(".dlc-fill");
    const boom = dlc.querySelector(".dlc-boom");
    let run = 0, at = 0;
    // Where an element sits inside the track, from the layout (so pop-in animations can't throw it off).
    const box = (el) => {
      let x = 0, y = 0;
      for (let n = el; n && n !== dlc; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    };
    const place = (i, animate = true) => {
      at = i;
      const d = box(dots[i]);
      token.style.transition = animate ? "" : "none";
      token.style.transform = `translate(${d.x + d.w / 2}px, ${d.y + d.h / 2}px)`;
      fill.style.setProperty("--p", i / (dots.length - 1));
      // "Released!" sits above the owner's label, or at the end of the row when the stages are stacked (phones)
      const stacked = box(dots[1]).y > box(dots[0]).y + 4;
      const s = box(stations[i]), w = box(stations[i].querySelector(".who")), name = box(stations[i].querySelector("b"));
      boom.classList.toggle("side", stacked);
      boom.style.left = `${stacked ? s.x + s.w : d.x + d.w / 2}px`;
      boom.style.top = `${stacked ? name.y + name.h / 2 : Math.min(w.y, d.y) - 6}px`;
    };
    const play = async () => {
      const my = ++run;
      stations.forEach((s) => s.classList.remove("lit", "done"));
      boom.classList.remove("on");
      place(0, false); token.classList.remove("on");
      if (reduceMotion) {
        stations.forEach((s) => s.classList.add("lit", "done"));
        place(dots.length - 1, false); token.classList.add("on"); boom.classList.add("on");
        return;
      }
      await wait(1100); if (my !== run) return;
      token.classList.add("on");
      for (let i = 0; i < stations.length; i++) {
        if (i > 0) place(i);
        await wait(650); if (my !== run) return;
        stations[i].classList.add("lit");
        await wait(1000); if (my !== run) return;
        stations[i].classList.add("done");
      }
      boom.classList.add("on");
    };
    window.addEventListener("resize", () => place(at, false));
    slide.addEventListener("slidestep", (e) => { if (e.detail.entering) play(); });
  }

  // ---------- 9 · Dashboard: numbers count up as their tiles land ----------
  const dash = document.querySelector(".dash-slide");
  if (dash) {
    let run = 0;
    dash.addEventListener("slidestep", (e) => {
      if (!e.detail.entering || reduceMotion) return;
      const my = ++run;
      dash.querySelectorAll("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const k = Number(el.closest(".tile").style.getPropertyValue("--k"));
        const t0 = performance.now() + 1100 + k * 500;
        el.textContent = "0";
        const tick = (now) => {
          if (my !== run) return;
          const p = Math.min(1, Math.max(0, (now - t0) / 1100));
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
  }

  // ---------- 10 · Fun break: team workout ----------
  const gym = document.querySelector(".gym");
  if (gym) {
    const lifters = ["max", "xhigh", "high", "xhigh", "high"];
    gym.innerHTML = `
      <div class="coach">${avatar("human")}<span class="whistle-bubble">One more rep!</span><span class="coach-name">Vince</span></div>
      ${lifters.map((level, i) => `
        <div class="lifter ${i === 3 ? "wobbly" : ""}" style="--d:${i * 0.08}s">
          <div class="barbell"><i></i><b></b><i></i></div>
          ${avatar("agent", level)}
          ${i === 3 ? '<span class="oops">?!</span>' : ""}
        </div>`).join("")}`;
  }
})();
