// "Meet the POA Team" sample. Team roles and responsibilities come from the
// POA Mission Atlas dashboard; `it` and `says` add the plain-English IT framing.
const TEAM = [
  { role: "Project Sponsor", who: "Vince", kind: "human", icon: "🎯", it: "Executive sponsor",
    says: "I set the vision, the objectives and the priorities, and I give final approval on scope changes. Every IT project needs someone who owns the “why.”" },
  { role: "Project Director", who: "Astra Max", kind: "agent", level: "max", icon: "🧭", it: "Project manager",
    says: "I lead delivery. I coordinate the other agents, juggle priorities and dependencies, and spot risks before they bite. Most importantly, I keep Vince sane." },
  { role: "Business Analyst", who: "Astra Extra High", kind: "agent", level: "xhigh", icon: "🔎", it: "Business analyst (BA)",
    says: "I research topics and recommend options, then work with Vince to turn them into clear principles and requirements. My project director provides me direction." },
  { role: "System Designer / Builder", who: "Astra High", kind: "agent", level: "high", icon: "🛠️", it: "Architect + developer",
    says: "The BA tells me what needs to get done, and I build it: I design the POA system and wire its coaching, data and day-to-day operations together." },
  { role: "Website Builder", who: "Astra High", kind: "agent", level: "high", icon: "🌐", it: "Web developer",
    says: "I build and maintain the project website, so everyone can see where the mission stands, clearly and accurately." },
  { role: "Testing Lead", who: "Astra Extra High", kind: "agent", level: "xhigh", icon: "📋", it: "QA lead",
    says: "I plan and coordinate the testing, track what we find, and report on quality: how stable, consistent and complete each feature is." },
  { role: "Testing Agent", who: "Astra High", kind: "agent", level: "high", icon: "🧪", it: "QA tester",
    says: "I run the approved tests, record the results, and flag anything unexpected." },
  { role: "Testing Grader", who: "Astra High", kind: "agent", level: "high", icon: "✅", it: "Independent reviewer",
    says: "I grade test results against the agreed criteria, on my own, and explain what I found. Nobody marks their own homework." },
];

// Stick-figure avatars: a person for Vince, a little robot for each AI agent.
const avatar = (m, opts = {}) => {
  const prop = opts.noProp ? "" : `<text class="av-prop" x="104" y="124" text-anchor="middle">${m.icon}</text>`;
  const body = m.kind === "human"
    ? `<circle class="av-head" cx="60" cy="40" r="22"/>
       <path class="av-ink" d="M60 62 V130 M60 82 L30 112 M60 82 L90 112 M60 130 L38 190 M60 130 L82 190"/>`
    : `<path class="av-ink" d="M60 18 V6"/><circle class="av-accent" cx="60" cy="6" r="5"/>
       <rect class="av-head" x="34" y="18" width="52" height="44" rx="12"/>
       <circle class="av-accent" cx="49" cy="38" r="5"/><circle class="av-accent" cx="71" cy="38" r="5"/>
       <path class="av-ink thin" d="M51 51 Q60 56 69 51"/>
       <rect class="av-chest" x="43" y="68" width="34" height="54" rx="9"/>
       <path class="av-ink" d="M43 80 L24 112 M77 80 L96 112 M52 122 L44 190 M68 122 L76 190"/>`;
  return `<svg class="avatar ${m.kind} ${m.level || ""}" viewBox="0 0 124 200" aria-hidden="true">${body}${prop}</svg>`;
};

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const tagFor = (m) => (m.kind === "human" ? "Human" : "AI agent");

  // ---------- Roll call: one member per click ----------
  const slide = document.querySelector(".rollcall");
  if (slide) {
    const stage = slide.querySelector(".rc-stage");
    const lineup = slide.querySelector(".rc-lineup");
    lineup.innerHTML = TEAM.map((m, i) => `
      <button type="button" class="rc-mini ${m.kind} ${m.level || ""}" data-i="${i}" title="${m.role}">
        ${avatar(m, { noProp: true })}<span>${String(i + 1).padStart(2, "0")}</span>
      </button>`).join("");
    lineup.addEventListener("click", (e) => {
      const mini = e.target.closest(".rc-mini");
      if (mini) window.slideDeck?.setStep(Number(mini.dataset.i) + 1);
    });
    const minis = [...lineup.querySelectorAll(".rc-mini")];
    let token = 0;

    const show = async (at) => {
      const my = ++token;
      minis.forEach((el, i) => { el.classList.toggle("met", i < at); el.classList.toggle("now", i === at - 1); });
      if (at === 0) {
        stage.innerHTML = `<div class="rc-intro"><span class="big">8</span> roles · <span class="big">1</span> human · <span class="big">7</span> AI agents<p>Click to meet them, one at a time →</p></div>`;
        return;
      }
      const m = TEAM[at - 1];
      stage.innerHTML = `
        <div class="rc-figure ${m.kind}">${avatar(m)}<span class="rc-name">${m.who}</span></div>
        <div class="rc-bubble ${m.kind}">
          <div class="rc-meta"><span class="rc-no">${String(at).padStart(2, "0")} / ${TEAM.length}</span>
            <span class="rc-tag ${m.kind}">${tagFor(m)}</span><span class="rc-it">In IT terms: <b>${m.it}</b></span></div>
          <h3>${m.role}</h3>
          <p class="rc-says"></p>
        </div>`;
      const says = stage.querySelector(".rc-says");
      await wait(500);
      if (reduceMotion) { says.textContent = m.says; return; }
      says.classList.add("typing");
      for (let i = 1; i <= m.says.length; i++) {
        if (my !== token) return;
        says.textContent = m.says.slice(0, i);
        await wait(30);
      }
      says.classList.remove("typing");
    };

    slide.dataset.steps = TEAM.length;
    slide.addEventListener("slidestep", (e) => show(e.detail.at));
  }

  // ---------- Team photo ----------
  const photo = document.querySelector(".team-photo");
  if (photo) {
    const group = (kind) => TEAM.map((m, i) => ({ m, i })).filter(({ m }) => m.kind === kind)
      .map(({ m, i }) => `<figure class="tp-member" style="--k:${i}">${avatar(m)}<figcaption><b>${m.role}</b><span>${m.who}</span></figcaption></figure>`).join("");
    photo.innerHTML = `
      <div class="tp-group human"><div class="tp-label">The human</div><div class="tp-row">${group("human")}</div></div>
      <div class="tp-group agent"><div class="tp-label">The AI agents</div><div class="tp-row">${group("agent")}</div></div>`;
  }

  // ---------- Fun break: team workout ----------
  const gym = document.querySelector(".gym");
  if (gym) {
    const lifters = TEAM.filter((m) => m.kind === "agent").slice(0, 5);
    gym.innerHTML = `
      <div class="coach">${avatar(TEAM.find((m) => m.kind === "human"), { noProp: true })}<span class="whistle-bubble">One more rep!</span><span class="coach-name">Vince</span></div>
      ${lifters.map((m, i) => `
        <div class="lifter ${i === 3 ? "wobbly" : ""}" style="--d:${i * 0.08}s">
          <div class="barbell"><i></i><b></b><i></i></div>
          ${avatar(m, { noProp: true })}
          ${i === 3 ? '<span class="oops">?!</span>' : ""}
        </div>`).join("")}`;
  }
})();
