// buttery inertia scroll (matches the site's motion reference) -- degrades
// straight to native scrolling if the CDN script didn't load for any reason
const lenis = window.Lenis ? new Lenis({
  autoRaf: true,
  autoToggle: true,
  anchors: true,
  allowNestedScroll: true,
  naiveDimensions: true,
  stopInertiaOnNavigate: true,
}) : null;

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
const io = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    obs.unobserve(e.target);
  });
}, { threshold: .12 });
revealEls.forEach(el => io.observe(el));

// heading word-reveal: wraps each word in a clipped mask so it rises into
// place, one section-heading at a time -- section h2s trigger on scroll in
// (once), the hero h1 triggers shortly after load since it's already on screen
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrapWords = (root) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((tok) => {
            if (tok.trim() === '') { frag.appendChild(document.createTextNode(tok)); return; }
            const mask = document.createElement('span');
            mask.className = 'word-mask';
            const word = document.createElement('span');
            word.className = 'word';
            word.textContent = tok;
            mask.appendChild(word);
            frag.appendChild(mask);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(root);
    return Array.from(root.querySelectorAll('.word'));
  };

  const stagger = (words, base = 0) => {
    words.forEach((w, i) => { w.style.transitionDelay = (base + i * 0.035) + 's'; });
  };

  const heroH1 = document.querySelector('.hero h1');
  if (heroH1) {
    const words = wrapWords(heroH1);
    stagger(words, 0.15);
    requestAnimationFrame(() => requestAnimationFrame(() => heroH1.classList.add('words-in')));
  }

  const headIo = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const words = wrapWords(e.target);
      stagger(words);
      requestAnimationFrame(() => requestAnimationFrame(() => e.target.classList.add('words-in')));
      obs.unobserve(e.target);
    });
  }, { threshold: .3 });
  document.querySelectorAll('.section h2').forEach((h) => headIo.observe(h));
})();

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
  const open = () => { menu.classList.add('open'); backdrop && backdrop.classList.add('open'); document.body.classList.add('mm-open'); lenis && lenis.stop(); };
  const close = () => { menu.classList.remove('open'); backdrop && backdrop.classList.remove('open'); document.body.classList.remove('mm-open'); lenis && lenis.start(); };
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
    lenis && lenis.stop();
  };
  const close = () => {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
    document.body.classList.remove('mm-open');
    lenis && lenis.start();
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
