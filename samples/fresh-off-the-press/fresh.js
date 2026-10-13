// Fresh Off the Press · "What's New?" sneak peek.
// Scene 1: the headline "decodes" from random characters, then a boot line types out.
// Scene 2: the four feature cards load on entry, one after another (shimmer → decoded name →
//          words stream in); clicks 1–4 spotlight one card each, click 5 shows all four. The Intelligent UI card holds a working bill splitter.
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
    // Clicks 1–4 spotlight one card each; click 5 shows them all side by side again.
    cards.forEach((card, i) => card.classList.toggle("focus", at === i + 1));
    grid.classList.toggle("has-focus", at >= 1 && at <= cards.length);
    // On phones the cards stack, so bring the spotlighted one into view.
    const focused = cards[at - 1];
    if (focused && innerWidth <= 760) focused.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
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
})();
