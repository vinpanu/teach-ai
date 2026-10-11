// AI in Practice — shared site behavior: theme toggle, scroll reveal,
// card spotlight/tilt, hero neural-network canvas, typing effect.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Theme toggle (remembered per visitor) ----------
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  const currentTheme = () =>
    root.dataset.theme ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  const toggle = document.querySelector(".theme-toggle");
  const syncIcon = () => { if (toggle) toggle.textContent = currentTheme() === "dark" ? "☀" : "☾"; };
  syncIcon();
  toggle?.addEventListener("click", () => {
    root.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    syncIcon();
  });

  // ---------- Scroll reveal ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---------- Card spotlight + 3D tilt ----------
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (ev) => {
      const r = card.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      if (!reduceMotion) {
        const rx = ((y / r.height) - 0.5) * -8;
        const ry = ((x / r.width) - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // ---------- Typing effect ----------
  const typed = document.querySelector(".typed");
  if (typed) {
    const words = JSON.parse(typed.dataset.words || "[]");
    if (reduceMotion || !words.length) {
      typed.textContent = words[0] || "";
    } else {
      let w = 0, i = 0, deleting = false;
      const tick = () => {
        const word = words[w];
        typed.textContent = word.slice(0, i);
        if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1800); }
        if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; }
        i += deleting ? -1 : 1;
        setTimeout(tick, deleting ? 40 : 85);
      };
      tick();
    }
  }

  // ---------- Hero neural network ----------
  const canvas = document.getElementById("network");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, nodes = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 14000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8,
    }));
  };

  const nodeRGB = () => getComputedStyle(root).getPropertyValue("--node").trim();

  const draw = () => {
    const rgb = nodeRGB();
    ctx.clearRect(0, 0, w, h);
    const linkDist = 140;
    for (const n of nodes) {
      if (!reduceMotion) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        // nodes drift gently toward the cursor
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
        if (d < 180) { n.x += dx * 0.006; n.y += dy * 0.006; }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < linkDist) {
          ctx.strokeStyle = `rgba(${rgb}, ${(1 - d / linkDist) * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      const lit = md < 180;
      ctx.fillStyle = `rgba(${rgb}, ${lit ? 1 : 0.7})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, lit ? a.r * 1.8 : a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  };

  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  resize();
  draw();
})();
