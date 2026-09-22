// Landing-page behavior, loaded after app.js (which still provides smooth
// scroll, reveal-on-scroll, and section-heading word reveals).

// sticky header: transparent over the LP hero, solid card once past it --
// app.js only knows about the homepage's .hero, so the LP hero is handled here
(function () {
  const nav = document.getElementById('nav');
  const heroEl = document.querySelector('.lp-hero');
  if (!nav || !heroEl) return;
  // on narrow screens the form stacks under the copy, making the hero very
  // tall -- go solid almost immediately there so content never shows through
  const stacked = matchMedia('(max-width: 960px)');
  const update = () => {
    const threshold = stacked.matches ? 10 : Math.max(heroEl.offsetHeight - 90, 80);
    nav.classList.toggle('nav-transparent', scrollY < threshold);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();

// hero video: the clip is ~12MB, so only desktop visitors get it -- phones
// (most paid clicks) keep the poster frame and a fast first paint
(function () {
  const v = document.querySelector('.lp-hero video[data-desktop-src]');
  if (!v) return;
  if (!matchMedia('(min-width: 961px)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  v.src = v.dataset.desktopSrc;
  v.play().catch(() => {});
})();

// ad attribution: copy gclid / utm_* from the landing URL into every lead
// form's hidden fields (and keep them for the session, so a visitor who
// clicks around the page before converting still carries the source)
(function () {
  const keys = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const params = new URLSearchParams(location.search);
  const read = (k) => { try { return sessionStorage.getItem('lp_' + k); } catch { return null; } };
  const save = (k, v) => { try { sessionStorage.setItem('lp_' + k, v); } catch {} };
  keys.forEach((k) => { if (params.get(k)) save(k, params.get(k)); });
  document.querySelectorAll('.lead-form').forEach((form) => {
    keys.forEach((k) => {
      const v = params.get(k) || read(k);
      if (!v) return;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
  });
})();

// lead forms: submit via fetch and swap in an inline confirmation instead
// of navigating away to Formspree's own page
(function () {
  document.querySelectorAll('.lead-form').forEach((form) => {
    const card = form.closest('.lead-card');
    const success = card && card.querySelector('.lc-success');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(res.status);
        form.classList.add('hide');
        success && success.classList.add('show');
      } catch {
        submitBtn.disabled = false;
        alert('Something went wrong sending that — please call (747) 370-5601 instead.');
      }
    });
  });
})();
