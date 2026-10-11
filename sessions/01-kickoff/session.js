// Session 01 — Kickoff. Builds the highway scene and the vote options.
// To add or change a topic lane, edit LANES. The road, signs, captions and
// the vote list all update automatically.
const LANES = [
  { icon: "🔤", title: "AI Terms Decoded", blurb: "LLMs, tokens, agents, hallucinations: the jargon, explained in plain English." },
  { icon: "🩺", title: "My AI Health Coach", blurb: "A behind-the-scenes tour of a personal AI agent I built." },
  { icon: "🚨", title: "AI Gone Rogue", blurb: "True stories of AI misbehaving, from bending the rules to breaking into websites." },
  { icon: "🗞️", title: "Fresh Off the Press", blurb: "The newest AI features, released this week or this month." },
];

(() => {
  const slide = document.querySelector(".highway-slide");
  const N = LANES.length;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- Vote options (scene 6) ----------
  const voteList = document.querySelector("[data-lane-options]");
  if (voteList) {
    voteList.innerHTML = LANES.map((l, i) =>
      `<li><b>${i + 1}</b><span>${l.icon} ${esc(l.title)}</span></li>`).join("");
  }
  if (!slide) return;

  // ---------- Road geometry (perspective trapezoid, horizon at the top) ----------
  const H = 430, TOP = 10, TL = 520, TR = 680, BL = 40, BR = 1160, CAR_Y = 420, CAR_W = 220;
  const xAt = (frac, y) => {
    const t = (y - TOP) / (H - TOP);
    const l = TL + (BL - TL) * t, r = TR + (BR - TR) * t;
    return l + (r - l) * frac;
  };
  const centers = LANES.map((_, i) => xAt((i + 0.5) / N, 380));
  const carScale = Math.min(1, ((xAt(1 / N, 380) - xAt(0, 380)) * 0.9) / CAR_W);

  const glows = LANES.map((_, i) => {
    const a = i / N, b = (i + 1) / N;
    return `<polygon class="lane-glow" points="${xAt(a, TOP)},${TOP} ${xAt(b, TOP)},${TOP} ${xAt(b, H)},${H} ${xAt(a, H)},${H}"/>`;
  }).join("");
  const dividers = LANES.slice(1).map((_, i) => {
    const f = (i + 1) / N;
    return `<line class="divider" x1="${xAt(f, TOP)}" y1="${TOP}" x2="${xAt(f, H)}" y2="${H}"/>`;
  }).join("");

  // Rear view of the car, with the stick figure's head in the back window.
  const car = `
    <g class="hw-car">
      <g class="bounce">
        <defs>
          <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#00b8e6"/>
          </linearGradient>
        </defs>
        <rect x="-100" y="-16" width="36" height="22" rx="6" fill="#0d0d12"/>
        <rect x="64" y="-16" width="36" height="22" rx="6" fill="#0d0d12"/>
        <path d="M-78 -96 L-58 -150 Q-56 -156 -48 -156 L48 -156 Q56 -156 58 -150 L78 -96 Z" fill="#5a43d6"/>
        <path d="M-64 -100 L-48 -144 L48 -144 L64 -100 Z" fill="#0b1020" opacity="0.92"/>
        <circle cx="0" cy="-124" r="13" fill="none" stroke="#fff" stroke-width="4"/>
        <path d="M-20 -100 Q0 -114 20 -100" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <rect x="-110" y="-98" width="220" height="86" rx="20" fill="url(#carBody)"/>
        <rect x="-100" y="-82" width="32" height="16" rx="5" fill="#ff3b5c"/>
        <rect x="68" y="-82" width="32" height="16" rx="5" fill="#ff3b5c"/>
        <rect x="-26" y="-60" width="52" height="22" rx="4" fill="#f4f4f8"/>
        <text x="0" y="-43" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="16" fill="#1a1a2e">AI</text>
        <rect x="-104" y="-26" width="208" height="10" rx="5" fill="#16161f"/>
      </g>
    </g>`;

  const svg = slide.querySelector(".hw-road");
  svg.innerHTML = `
    <polygon class="asphalt" points="${TL},${TOP} ${TR},${TOP} ${BR},${H} ${BL},${H}"/>
    ${glows}
    <line class="edge" x1="${TL}" y1="${TOP}" x2="${BL}" y2="${H}"/>
    <line class="edge" x1="${TR}" y1="${TOP}" x2="${BR}" y2="${H}"/>
    ${dividers}
    ${car}`;

  slide.querySelector(".hw-signs").innerHTML = LANES.map((l, i) => `
    <div class="hw-sign"><span class="n">${i + 1}</span><br>${l.icon} ${esc(l.title)}<span class="arrow">↓</span></div>`).join("");

  const carEl = svg.querySelector(".hw-car");
  const signs = [...slide.querySelectorAll(".hw-sign")];
  const laneGlows = [...svg.querySelectorAll(".lane-glow")];
  const caption = slide.querySelector(".hw-caption");
  const intro = caption.innerHTML;

  // Steps: 1..N visit each lane, N+1 = "you decide" with every sign lit.
  slide.dataset.steps = N + 1;
  slide.addEventListener("slidestep", (e) => {
    const at = e.detail.at;
    const lane = at >= 1 && at <= N ? at - 1 : -1;
    const x = lane < 0 ? 600 : centers[lane];
    carEl.style.transform = `translate(${x}px, ${CAR_Y}px) scale(${carScale})`;
    slide.classList.toggle("choosing", lane >= 0);
    signs.forEach((s, i) => s.classList.toggle("active", i === lane || at === N + 1));
    laneGlows.forEach((g, i) => g.classList.toggle("active", i === lane));
    caption.innerHTML =
      lane >= 0 ? `<strong>Lane ${lane + 1}:</strong> ${esc(LANES[lane].blurb)}`
      : at === N + 1 ? `<strong>Which lane first? You decide.</strong>`
      : intro;
  });
})();
