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

// lead forms: post the lead to the GoHighLevel inbound webhook (form.action)
// as JSON and swap in an inline confirmation -- the page never navigates away.
// The payload keeps GHL-friendly contact keys (first_name, last_name, phone,
// email, postal_code) plus source/attribution fields for the workflow to map.
(function () {
  const buildLead = (form) => {
    const d = Object.fromEntries(new FormData(form));
    const name = (d.name || '').trim();
    const [first, ...rest] = name.split(/\s+/);
    return {
      first_name: first || '',
      last_name: rest.join(' '),
      full_name: name,
      phone: (d.phone || '').trim(),
      email: (d.email || '').trim(),
      postal_code: (d.zip || '').trim(),
      service: d.service || '',
      message: (d.message || '').trim(),
      landing_page: d.landing_page || '',
      form_location: d.form_location || form.dataset.location || '',
      page_url: location.origin + location.pathname,
      gclid: d.gclid || '',
      utm_source: d.utm_source || '',
      utm_medium: d.utm_medium || '',
      utm_campaign: d.utm_campaign || '',
      utm_term: d.utm_term || '',
      utm_content: d.utm_content || '',
      lead_source: 'Website - Landing Page',
      submitted_at: new Date().toISOString(),
    };
  };

  document.querySelectorAll('.lead-form').forEach((form) => {
    const card = form.closest('.lead-card');
    const success = card && card.querySelector('.lc-success');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const lead = buildLead(form);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: JSON.stringify(lead),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(res.status);
        form.classList.add('hide');
        success && success.classList.add('show');
        // the page never reloads on submit, so GTM's form/thank-you-page
        // triggers can't see the lead -- hand it a custom event instead
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'lead_form_submit',
          form_location: lead.form_location,
          landing_page: lead.landing_page,
          service: lead.service,
        });
      } catch {
        submitBtn.disabled = false;
        alert('Something went wrong sending that — please call (747) 370-5601 instead.');
      }
    });
  });
})();
