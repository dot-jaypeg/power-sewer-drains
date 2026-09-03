// sticky header: crossfade from transparent-over-hero to solid once scrolled past it
const nav = document.getElementById('nav');
if (nav) {
  const heroEl = document.querySelector('.hero');
  const updateNav = () => {
    nav.classList.toggle('scrolled', scrollY > 10);
    if (heroEl) {
      const threshold = Math.max(heroEl.offsetHeight - 90, 80);
      nav.classList.toggle('nav-transparent', scrollY < threshold);
    }
  };
  addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}

// reveal on scroll, staggered per sibling group so grids/lists cascade in
const revealEls = Array.from(document.querySelectorAll('.reveal'));
const groups = new Map();
revealEls.forEach(el => {
  const p = el.parentElement;
  if (!groups.has(p)) groups.set(p, []);
  groups.get(p).push(el);
});
groups.forEach(list => {
  list.forEach((el, i) => el.style.setProperty('--d', Math.min(i * 0.06, 0.24) + 's'));
});
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting));
}, { threshold: .12 });
revealEls.forEach(el => io.observe(el));

// don't force autoplay on background videos for users who asked for reduced motion
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach(v => v.pause());
}

// mobile off-canvas menu
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const backdrop = document.querySelector('.mm-backdrop');
  const closeBtn = document.querySelector('.mm-close');
  if (!toggle || !menu) return;
  const open = () => { menu.classList.add('open'); backdrop && backdrop.classList.add('open'); document.body.classList.add('mm-open'); };
  const close = () => { menu.classList.remove('open'); backdrop && backdrop.classList.remove('open'); document.body.classList.remove('mm-open'); };
  toggle.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  backdrop && backdrop.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();

// $49 offer modal: fires once the visitor scrolls past the hero (proof of
// engagement) rather than on a blind timer, and only once per session
(function () {
  const backdrop = document.getElementById('offer-backdrop');
  const modal = document.getElementById('offer-modal');
  const closeBtn = document.getElementById('offer-close');
  const rejectBtn = document.getElementById('offer-reject');
  const claimBtn = document.getElementById('offer-claim');
  const heroEl = document.querySelector('.hero');
  if (!backdrop || !modal || !heroEl) return;
  if (sessionStorage.getItem('offerSeen')) return;

  const open = () => {
    if (sessionStorage.getItem('offerSeen')) return;
    sessionStorage.setItem('offerSeen', '1');
    backdrop.classList.add('open');
    modal.classList.add('open');
    document.body.classList.add('mm-open');
  };
  const close = () => {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
    document.body.classList.remove('mm-open');
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (!e.isIntersecting) open(); });
  }, { threshold: 0 });
  io.observe(heroEl);

  closeBtn && closeBtn.addEventListener('click', close);
  rejectBtn && rejectBtn.addEventListener('click', close);
  claimBtn && claimBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

// contact form: submit via fetch so a successful send shows an inline
// message instead of navigating away to Formspree's own confirmation page
(function () {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('fc-success');
  if (!form) return;
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
      if (res.ok) {
        form.classList.add('hide');
        success && success.classList.add('show');
      } else {
        submitBtn.disabled = false;
        alert("Something went wrong sending that — please call (747) 370-5601 instead.");
      }
    } catch {
      submitBtn.disabled = false;
      alert("Something went wrong sending that — please call (747) 370-5601 instead.");
    }
  });
})();
