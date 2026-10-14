// AI in Practice — slide engine (shared by every session page).
// Next: → Space PageDown Enter click/tap · Back: ← PageUp · F fullscreen · R replay scene.
// Each slide can reveal items one click at a time with data-step="1", "2", …
// data-step="0" shows an item as soon as the scene opens (and replays its .on animations).
// (or declare data-steps="n" and react to the "slidestep" event for custom scenes).
// <main class="deck" data-next="url">: pressing Next on the very last step goes to that page.
// <section class="slide" data-goto="1">: pressing Next on this scene's last step jumps to scene 1.
(() => {
  const deck = document.querySelector(".deck");
  if (!deck) return;
  const slides = [...deck.querySelectorAll(".slide")];
  const bar = document.querySelector(".deck-progress span");
  const counter = document.querySelector(".deck-counter");
  let index = 0, at = 0;

  const stepsIn = (s) => Math.max(
    0,
    Number(s.dataset.steps || 0),
    ...[...s.querySelectorAll("[data-step]")].map((el) => Number(el.dataset.step))
  );

  const render = (entering) => {
    const s = slides[index];
    slides.forEach((other, i) => {
      other.classList.toggle("active", i === index);
      other.classList.toggle("past", i < index);
      if (i !== index) other.classList.remove("play");
    });
    if (entering) {
      // Restart this scene's animations from the beginning (including data-step="0" items).
      s.classList.remove("play");
      s.querySelectorAll("[data-step]").forEach((el) => el.classList.remove("on"));
      void s.offsetWidth;
      s.classList.add("play");
    }
    s.dataset.at = at;
    s.querySelectorAll("[data-step]").forEach((el) =>
      el.classList.toggle("on", Number(el.dataset.step) <= at));
    s.dispatchEvent(new CustomEvent("slidestep", { detail: { at, entering } }));

    deck.dataset.slide = index + 1;
    if (bar) bar.style.width = `${((index + 1) / slides.length) * 100}%`;
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    document.title = `${s.dataset.title || "Slide"} · ${deck.dataset.deckTitle || ""}`;
    history.replaceState(null, "", `#${index + 1}`);
  };

  const go = (i, step = 0) => {
    if (i < 0 || i >= slides.length) return;
    index = i; at = step;
    render(true);
  };
  const next = () => {
    if (at < stepsIn(slides[index])) { at++; render(false); }
    else if (slides[index].dataset.goto) go(Number(slides[index].dataset.goto) - 1);
    else if (index === slides.length - 1 && deck.dataset.next) location.href = deck.dataset.next;
    else go(index + 1);
  };
  const prev = () => {
    if (at > 0) { at--; render(false); }
    else if (index > 0) go(index - 1, stepsIn(slides[index - 1]));
  };
  // Lets interactive scenes jump to a step, e.g. clicking a road sign picks that lane.
  window.slideDeck = {
    next, prev, go,
    setStep(step) { at = Math.max(0, Math.min(step, stepsIn(slides[index]))); render(false); },
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // ---------- Keyboard (also covers presentation clickers) ----------
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onControl = e.target.closest?.("button, a, input, textarea, select");
    switch (e.key) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case "N": case "n":
        e.preventDefault(); next(); break;
      case " ": case "Enter":
        if (onControl) return;
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace": case "P": case "p":
        e.preventDefault(); prev(); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1, stepsIn(slides[slides.length - 1])); break;
      case "f": case "F": toggleFullscreen(); break;
      case "r": case "R": at = 0; render(true); break;
    }
  });

  // ---------- Click / tap / swipe ----------
  let swiped = false, touchX = 0;
  deck.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { swiped = true; dx < 0 ? next() : prev(); }
  });
  deck.addEventListener("click", (e) => {
    if (swiped) { swiped = false; return; }
    if (e.target.closest("a, button")) return;
    next();
  });

  document.querySelector("[data-deck='prev']")?.addEventListener("click", prev);
  document.querySelector("[data-deck='next']")?.addEventListener("click", next);
  document.querySelector("[data-deck='fullscreen']")?.addEventListener("click", toggleFullscreen);

  // Controls fade out while presenting; moving the mouse brings them back.
  let idle;
  document.addEventListener("mousemove", () => {
    deck.classList.add("ui-show");
    clearTimeout(idle);
    idle = setTimeout(() => deck.classList.remove("ui-show"), 2500);
  });

  // ---------- Start (supports links like #3) ----------
  const fromHash = () => {
    const n = parseInt(location.hash.slice(1), 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), slides.length) - 1 : 0;
  };
  window.addEventListener("hashchange", () => { if (fromHash() !== index) go(fromHash()); });
  go(fromHash());
})();
