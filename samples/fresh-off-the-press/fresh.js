// Fresh Off the Press · "What's New?" sneak peek.
// Scene 1: the headline "decodes" from random characters, then a boot line types out.
// Scene 2: the four feature cards load on entry, one after another (shimmer → decoded name →
//          words stream in); clicks 1–4 open a "little deeper" pop-up per drop, click 5 the Pro Tip. The Intelligent UI card holds a working bill splitter.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/=?";

  // Scramble an element's text, then lock in the real letters left to right.
  const decode = (el, ms = 900) => {
    const final = el.dataset.final;
    clearInterval(el._t);
    if (reduce) { el.textContent = final; return; }
    const start = performance.now();
    el._t = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / ms);
      const locked = Math.floor(p * final.length);
      el.textContent = [...final].map((c, i) =>
        i < locked || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");
      if (p === 1) clearInterval(el._t);
    }, 40);
  };

  // Type text into an element one character at a time.
  const type = (el, html, speed = 28) => {
    clearTimeout(el._t);
    const text = html.replace(/<[^>]+>/g, "");
    if (reduce) { el.innerHTML = html; return; }
    let i = 0;
    const tick = () => {
      i++;
      el.textContent = text.slice(0, i);
      if (i < text.length) el._t = setTimeout(tick, speed);
      else el.innerHTML = html;
    };
    el.textContent = "";
    el._t = setTimeout(tick, speed);
  };

  // Remember each decoding element's real text before anything scrambles or clears it.
  document.querySelectorAll("[data-decode]").forEach((el) => { el.dataset.final = el.textContent; });

  // ---------- 1 · Title ----------
  const title = document.querySelector(".fresh-title");
  const boot = title?.querySelector(".boot-text");
  title?.addEventListener("slidestep", (e) => {
    if (!e.detail.entering) return;
    const h = title.querySelector("[data-decode]");
    h.textContent = "";
    clearTimeout(title._t1); clearTimeout(title._t2);
    boot.textContent = "";
    title._t1 = setTimeout(() => decode(h, 1100), 250);
    title._t2 = setTimeout(() => type(boot,
      '&gt; scanning OpenAI + Anthropic… <span class="ok">4 new drops found ✓</span>'), 1500);
  });

  // ---------- 2 · Feature cards ----------
  const slide = document.querySelector(".feats-slide");
  if (!slide) return;
  const grid = slide.querySelector(".feats");
  const cards = [...slide.querySelectorAll(".feat")];

  // Wrap each word so it can stream in like an AI reply.
  slide.querySelectorAll("[data-stream]").forEach((p) => {
    p.innerHTML = p.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
  });

  // Turn a card on (once) and decode its name.
  const reveal = (card) => {
    if (card.classList.contains("on")) return;
    card.classList.add("on");
    decode(card.querySelector("[data-decode]"), 700);
    slide.dispatchEvent(new CustomEvent("cardon"));
  };

  slide.addEventListener("slidestep", (e) => {
    const at = e.detail.at;
    if (e.detail.entering) {
      // All four cards load by themselves, one after another, so nothing sits there looking empty.
      cards.forEach((card) => { clearTimeout(card._t); card.classList.remove("on"); });
      cards.forEach((card, i) => {
        if (at > 0 || reduce) reveal(card);
        else card._t = setTimeout(() => reveal(card), 300 + i * 450);
      });
    } else {
      // A click before they've all loaded: finish loading them now.
      cards.forEach((card) => { clearTimeout(card._t); reveal(card); });
    }
    // Clicks 1–4 open a pop-up on one drop each (its card glows behind it); click 5 opens the Pro Tip.
    cards.forEach((card, i) => card.classList.toggle("focus", at === i + 1));
    grid.classList.toggle("has-focus", at >= 1 && at <= cards.length);
    openDrop(at, e.detail.entering);
  });

  // ---------- Pop-ups ----------
  const drops = slide.querySelector(".drops");
  const openDrop = (at, entering) => {
    drops.querySelectorAll(".drop").forEach((d) => {
      const show = Number(d.dataset.for) === at;
      if (show && !d.classList.contains("open")) {
        d.classList.add("open");
        d.scrollTop = 0;
        // Grow out of its card (the Pro Tip just rises into place).
        const card = cards[at - 1];
        if (!reduce && !entering) {
          const from = card?.getBoundingClientRect(), to = d.getBoundingClientRect();
          const move = from
            ? `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${Math.min(0.6, from.width / to.width)})`
            : "translateY(40px) scale(0.92)";
          d.animate([{ transform: move, opacity: 0 }, { transform: "none", opacity: 1 }],
            { duration: 480, easing: "cubic-bezier(.2, .8, .2, 1)" });
        }
      } else if (!show) d.classList.remove("open");
    });
    drops.classList.toggle("open", at >= 1);
  };
  // Clicking a card (or its "Go deeper" button) opens its pop-up directly; ✕ closes back to all four cards.
  cards.forEach((card, i) => {
    const more = document.createElement("button");
    more.type = "button"; more.className = "feat-more";
    more.innerHTML = "Go deeper <b>↗</b>";
    more.setAttribute("aria-label", `Go deeper: ${card.querySelector("h3 .vh").textContent}`);
    card.querySelector(".meta").append(more);
    card.addEventListener("click", (e) => {
      if ((e.target.closest("button") && e.target !== more && !more.contains(e.target)) || !window.slideDeck) return;
      e.stopPropagation();
      window.slideDeck.setStep(i + 1);
    });
  });
  drops.querySelectorAll(".drop-x").forEach((x) => x.addEventListener("click", () => window.slideDeck?.setStep(0)));
  // Mouse/tap on this scene never steps forward, so the cards can be explored in any order:
  // clicking outside a pop-up closes it, clicks inside it do nothing (its links and buttons still work).
  // The clicker / → keys still walk through the pop-ups in order.
  slide.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    e.stopPropagation();
    if (e.target.closest(".drop-scrim")) window.slideDeck?.setStep(0);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && slide.classList.contains("active") && Number(slide.dataset.at) > 0) window.slideDeck?.setStep(0);
  });

  // ---------- Intelligent UI: a real (tiny) bill splitter ----------
  const widget = slide.querySelector(".demo-iui");
  const nEl = widget.querySelector(".n"), each = widget.querySelector(".each"), people = widget.querySelector(".people");
  const TOTAL = 120;
  let n = 4, auto = null;
  const show = () => {
    nEl.textContent = n;
    each.textContent = `$${(TOTAL / n).toFixed(2)}`;
    each.classList.remove("bump"); void each.offsetWidth; each.classList.add("bump");
    people.innerHTML = Array.from({ length: n }, (_, i) => `<span style="animation-delay:${i * 40}ms">🧑</span>`).join("");
  };
  const step = (d) => { n = Math.min(8, Math.max(1, n + d)); show(); };
  widget.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    clearInterval(auto); auto = null; widget._touched = true;   // the viewer took over, so stop the auto demo
    step(Number(b.dataset.d));
  }));
  // Until someone taps it, the widget demos itself: 4 → 5 → 6 → 2 → 3 → 4 …
  const iuiCard = widget.closest(".feat");
  const SEQ = [5, 6, 2, 3, 4];
  let k = 0;
  const startAuto = () => {
    if (iuiCard.classList.contains("on") && auto === null && !reduce && !widget._touched) {
      auto = setInterval(() => { n = SEQ[k++ % SEQ.length]; show(); }, 1800);
    }
  };
  slide.addEventListener("slidestep", (e) => {
    if (e.detail.entering) { clearInterval(auto); auto = null; n = 4; k = 0; show(); }
    startAuto();
  });
  slide.addEventListener("cardon", startAuto);
  widget.addEventListener("pointerdown", () => { widget._touched = true; }, { once: true });
  show();

  // ---------- 3 · Side trip: "A Dot that never forgets" ----------
  // The glowing Dot rides the rail to the current station (CSS reads --pos); stations behind it get a ✓.
  const story = document.querySelector(".dot-story");
  const stops = [...(story?.querySelectorAll(".ds-stop") || [])];
  story?.addEventListener("slidestep", (e) => {
    const at = e.detail.at;
    story.style.setProperty("--pos", at);
    stops.forEach((s, i) => { s.classList.toggle("done", i < at); s.classList.toggle("now", i === at); });
    // On phones the stations stack, so keep the current one on screen.
    if (!e.detail.entering) stops[at]?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  });
  story?.querySelector(".ds-return").addEventListener("click", () => window.slideDeck?.leave());
})();
