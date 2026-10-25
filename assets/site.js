(function () {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finePointer = matchMedia('(pointer: fine)').matches;

      // Scroll reveals.
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

      // Scroll progress and nav hide.
      const root = document.documentElement;
      const nav = document.querySelector('nav');
      const timeline = document.getElementById('timeline');
      let lastY = 0;
      function onScroll() {
        const max = root.scrollHeight - root.clientHeight;
        const y = window.scrollY;
        root.style.setProperty('--p', max > 0 ? y / max : 0);
        nav.style.transform = y > lastY && y > 200 ? 'translateY(-100%)' : 'translateY(0)';
        lastY = y;
        if (timeline) {
          const r = timeline.getBoundingClientRect();
          const fill = Math.min(100, Math.max(0, ((innerHeight * 0.6 - r.top) / r.height) * 100));
          timeline.style.setProperty('--fill', fill + '%');
        }
      }
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // Pointer glow, tilt, and magnetic buttons (fine pointers only).
      if (finePointer && !reduced) {
        addEventListener('pointermove', (e) => {
          root.style.setProperty('--mx', e.clientX + 'px');
          root.style.setProperty('--my', e.clientY + 'px');
        }, { passive: true });

        document.querySelectorAll('.proj').forEach((card) => {
          card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
            card.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
            card.style.setProperty('--px', x * 100 + '%');
            card.style.setProperty('--py', y * 100 + '%');
          });
          card.addEventListener('pointerleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
          });
        });

        document.querySelectorAll('.magnetic').forEach((btn) => {
          btn.addEventListener('pointermove', (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
          });
          btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
      }

      // Optional sound: off by default. A short tone on section changes, generated in the browser.
      const soundBtn = document.getElementById('sound');
      let ctx = null;
      function tone(freq, duration) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }
      soundBtn.addEventListener('click', () => {
        const on = soundBtn.getAttribute('aria-pressed') !== 'true';
        if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        soundBtn.setAttribute('aria-pressed', String(on));
        soundBtn.textContent = on ? 'Sound on' : 'Sound off';
        soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
        if (on) tone(660, 0.18);
      });
      const cueIo = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting && ctx && soundBtn.getAttribute('aria-pressed') === 'true') tone(440 + Math.random() * 110, 0.12); });
      }, { threshold: 0.4 });
      document.querySelectorAll('section').forEach((s) => cueIo.observe(s));
    })();

/* Custom cursor, desktop only. Enlarges over interactive elements. */
(function () {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('has-cursor');
  const dot = document.querySelector('.cursor');
  let x = 0, y = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function frame() {
    cx += (x - cx) * 0.25; cy += (y - cy) * 0.25;
    dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
    requestAnimationFrame(frame);
  })();
  document.querySelectorAll('a, button, .proj, .case-media').forEach((el) => {
    el.addEventListener('pointerenter', () => dot.classList.add('hover'));
    el.addEventListener('pointerleave', () => dot.classList.remove('hover'));
  });
})();

/* Case-study image wipe: reveal the image when its block enters view. */
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  document.querySelectorAll('.case-media').forEach((el) => io.observe(el));
})();
