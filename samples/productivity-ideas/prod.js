// Productivity Ideas sample: old prescriptive prompt vs. new goal-based brief.
// The two prompts and two results are an illustrative example (same task, same AI).
const OLD_PROMPT = `### SYSTEM INSTRUCTIONS: READ CAREFULLY!!! ###
You are a HELPFUL ASSISTANT. You MUST follow ALL steps EXACTLY.
NEVER skip a step.

STEP 1: Open the first email.
STEP 2: Read the email from beginning to end.
STEP 3: Decide if it is POSITIVE, NEGATIVE or NEUTRAL.
STEP 4: Write down the category.
STEP 5: Repeat STEPS 1-4 for EVERY email. Do NOT stop early!!!
STEP 6: Count the POSITIVE emails.
STEP 7: Count the NEGATIVE emails.
STEP 8: Count the NEUTRAL emails.
STEP 9: Pick 3 quotes. Quotes MUST be under 15 words.
STEP 10: Format the output EXACTLY like the template below.
STEP 11: Do NOT add any other sections. NEVER add opinions.
STEP 12: Double-check that you followed EVERY step.

IMPORTANT!!! IMPORTANT!!! The output MUST use this template:

=== WEEKLY FEEDBACK REPORT ===
Positive: [number]
Negative: [number]
Neutral: [number]
Quote 1: [quote]
Quote 2: [quote]
Quote 3: [quote]
Summary: [ONE sentence, MAX 20 words]
=== END ===

REMEMBER: You MUST follow the template EXACTLY. CRITICAL!!!`;

const NEW_BRIEF = [
  ["Goal", "Summarize this week's customer emails for Monday's team meeting."],
  ["Why it matters", "We have 15 minutes to decide what to fix first, so the biggest problems should jump out."],
  ["What I know", "120 emails, attached. We released a new login page on Tuesday."],
  ["Constraints", "One page. Plain language: the team isn't technical."],
  ["What “done” looks like", "Someone who reads only the first line knows our #1 priority."],
];

const OLD_RESULT = `=== WEEKLY FEEDBACK REPORT ===
Positive: 31
Negative: 64
Neutral: 25
Quote 1: "Can't log in again."
Quote 2: "Love the new colors!"
Quote 3: "Where is my invoice?"
Summary: Customers had mixed feedback this week, mostly negative.
=== END ===`;

const NEW_RESULT = [
  ["h", "#1 priority: fix the new login page."],
  ["p", "46 of 120 emails (38%) report the same login error, and every one started after Tuesday's release."],
  ["s", "Also worth knowing"],
  ["li", "Invoices: 12 people couldn't find them. A clearer menu link would help."],
  ["li", "Good news: 31 people praised the new design."],
  ["next", "Suggested next step: fix or roll back the login page before Monday."],
];

const BRIEF_TEMPLATE = `Goal: What do you want, in one sentence?
Why it matters: Who is it for, and what will they do with it?
What I know: Facts, files and background the AI can't guess.
Constraints: Length, tone, audience, must-haves. Only the real ones.
What "done" looks like: How you'll judge if it's great.`;

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SHOUTY = /\b(MUST|NEVER|EXACTLY|EVERY|ALL|IMPORTANT|CRITICAL|NOT|CAREFULLY|REMEMBER|ONE|MAX)\b|!!!/g;
  const words = (s) => s.split(/\s+/).filter(Boolean).length;

  const countUp = async (el, target, ms = 1600) => {
    const steps = 40;
    for (let i = 1; i <= steps; i++) { el.textContent = Math.round((target * i) / steps); await wait(ms / steps); }
  };

  // ---------- Landing page: cards open ideas in any order; a ✓ marks the ones already seen ----------
  // Mouse clicks on its background do nothing (the clicker / → keys still open the next idea).
  document.querySelector(".prod-hub")?.addEventListener("click", (e) => {
    if (!e.target.closest("a, button")) e.stopPropagation();
  });
  document.querySelectorAll(".slide[data-chapter]").forEach((chapter) => chapter.addEventListener("slidestep", (e) => {
    if (e.detail.entering) document.querySelector(`.idea[href="#${chapter.id}"]`)?.classList.add("seen");
  }));

  // ---------- Scene 3: the old prompt scrolls past ----------
  const oldSlide = document.querySelector(".old-slide");
  const oldBody = oldSlide.querySelector(".doc-body");
  oldBody.innerHTML = esc(OLD_PROMPT).replace(SHOUTY, (m) => `<mark class="shout">${m}</mark>`);
  oldSlide.addEventListener("slidestep", (e) => {
    if (!e.detail.entering) return;
    const pane = oldSlide.querySelector(".doc-scroll");
    const distance = Math.max(0, oldBody.scrollHeight - pane.clientHeight + 24);
    oldBody.style.setProperty("--scroll", `-${distance}px`);
    countUp(oldSlide.querySelector(".n-words"), words(OLD_PROMPT));
    countUp(oldSlide.querySelector(".n-shout"), (OLD_PROMPT.match(SHOUTY) || []).length);
    countUp(oldSlide.querySelector(".n-steps"), 12, 1200);
  });

  // ---------- Scene 3: the new brief ----------
  const newSlide = document.querySelector(".new-slide");
  newSlide.querySelector(".doc-body").innerHTML = NEW_BRIEF.map(([label, text], i) =>
    `<div class="brief-row" style="--k:${i}"><span class="brief-label">${esc(label)}</span><span>${esc(text)}</span></div>`).join("");
  newSlide.addEventListener("slidestep", (e) => {
    if (!e.detail.entering) return;
    const all = NEW_BRIEF.map(([l, t]) => `${l} ${t}`).join(" ");
    countUp(newSlide.querySelector(".n-words"), words(all));
    countUp(newSlide.querySelector(".n-shout"), 0, 300);
    countUp(newSlide.querySelector(".n-steps"), 0, 300);
  });

  // ---------- Idea 03: copy buttons (data-copy="text to copy") ----------
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "✓ Copied!";
      } catch {
        // Clipboard blocked: select the prompt above the button so Ctrl+C / Cmd+C works.
        const range = document.createRange();
        range.selectNodeContents(btn.previousElementSibling);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = "Selected: press Ctrl+C";
      }
      setTimeout(() => { btn.textContent = label; }, 2200);
    });
  });

  // ---------- Parked scenes (inside <template id="parked-scenes">, so usually absent) ----------
  const resultSlide = document.querySelector(".results-slide");
  const tpl = document.querySelector(".tpl-body");
  if (!resultSlide || !tpl) return;

  // ---------- Same task, two results (typed side by side) ----------
  let token = 0;
  const typeInto = async (el, text, my, speed) => {
    for (let i = 1; i <= text.length; i++) {
      if (my !== token) return false;
      el.textContent = text.slice(0, i);
      await wait(speed);
    }
    return true;
  };
  resultSlide.addEventListener("slidestep", async (e) => {
    if (!e.detail.entering) return;
    const my = ++token;
    const oldOut = resultSlide.querySelector(".out-old .out-body");
    const newOut = resultSlide.querySelector(".out-new .out-body");
    oldOut.textContent = ""; newOut.innerHTML = "";
    resultSlide.classList.remove("results-done");
    await wait(700);
    const oldDone = typeInto(oldOut, OLD_RESULT, my, 22);
    const newDone = (async () => {
      for (const [kind, text] of NEW_RESULT) {
        const el = document.createElement(kind === "li" ? "div" : "p");
        el.className = `nr-${kind}`;
        newOut.appendChild(el);
        if (!(await typeInto(el, text, my, 24))) return;
        await wait(250);
      }
    })();
    await Promise.all([oldDone, newDone]);
    if (my === token) resultSlide.classList.add("results-done");
  });

  // ---------- Copyable brief template ----------
  tpl.innerHTML = BRIEF_TEMPLATE.split("\n").map((line) => {
    const [label, ...rest] = line.split(":");
    return `<div><b>${esc(label)}:</b>${esc(rest.join(":"))}</div>`;
  }).join("");
  const copyBtn = document.querySelector(".copy-btn");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(BRIEF_TEMPLATE);
      copyBtn.textContent = "✓ Copied!";
    } catch {
      // Clipboard blocked: select the template so Ctrl+C / Cmd+C works.
      const range = document.createRange();
      range.selectNodeContents(tpl);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      copyBtn.textContent = "Selected: press Ctrl+C";
    }
    setTimeout(() => { copyBtn.textContent = "📋 Copy template"; }, 2200);
  });
})();
