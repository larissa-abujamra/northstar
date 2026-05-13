/* =========================================================
   NORTHSTAR — main.js
   Nav scroll · reveals · counters · marquee · video · tweaks
   ========================================================= */

(() => {

  /* ---------- NAV scroll state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(el => {
    const d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--delay', d);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------- Stat counters ---------- */
  const counters = document.querySelectorAll('.counter');
  const formatNum = n => Math.round(n).toLocaleString('en-US');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-to'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNum(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterIO.observe(c));

  /* ---------- Marquee: duplicate content for seamless loop ---------- */
  ['mq-track-1', 'mq-track-2'].forEach(id => {
    const track = document.getElementById(id);
    if (!track) return;
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Scatter-text scroll animation ----------
     Each character is wrapped in a span and animated from
     scattered (translateX + rotateX, low opacity) to settled
     based on scroll progress through the element.
     Range: [top hits 85% of viewport] → [center hits viewport center]
     mapped to [0, 0.5] of element scroll progress.            */
  document.querySelectorAll('.scatter-text').forEach(node => {
    const text = node.textContent.trim().replace(/\s+/g, ' ');
    const chars = [...text];
    const center = (chars.length - 1) / 2;
    node.textContent = '';
    const spans = chars.map((c, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      // Spaces render as double nbsp to keep word gaps + remain animatable
      span.innerHTML = (c === ' ') ? '\u00A0\u00A0' : c;
      const distance = (i - center) / center; // -1 .. 1
      span.dataset.distance = distance.toFixed(4);
      // initial scattered position
      span.style.setProperty('--tx', (distance * 60) + 'px');
      span.style.setProperty('--rx', (distance * 40) + 'deg');
      span.style.setProperty('--op', '0.15');
      node.appendChild(span);
      return span;
    });

    const update = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // start: element top hits 85% of viewport (rect.top = vh*0.85)
      // end:   element center hits viewport center (rect.top + rect.height/2 = vh/2)
      const startTop = vh * 0.85;
      const endTop   = (vh / 2) - (rect.height / 2);
      const denom    = startTop - endTop;
      // Guard against degenerate states (pre-layout, zero-height viewport, etc.)
      if (!vh || denom <= 0 || !isFinite(denom)) return;
      const raw = (startTop - rect.top) / denom;
      const progress = Math.max(0, Math.min(1, raw));
      // The spec maps [0, 0.5] of element scroll progress to the full animation
      const t = Math.max(0, Math.min(1, progress / 0.5));
      const eased = 1 - Math.pow(1 - t, 3);
      spans.forEach(span => {
        const d = parseFloat(span.dataset.distance);
        const tx = d * 60 * (1 - eased);
        const rx = d * 40 * (1 - eased);
        const op = 0.15 + (1 - 0.15) * eased;
        span.style.setProperty('--tx', tx.toFixed(2) + 'px');
        span.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        span.style.setProperty('--op', op.toFixed(3));
      });
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Defer first computation until after layout settles so we don't
    // overwrite the static scatter values with NaN before measurements exist
    requestAnimationFrame(() => requestAnimationFrame(update));
  });

  /* ---------- Word-by-word opacity reveal on scroll ----------
     Each word is wrapped in its own inline-block span. As the element
     passes through the viewport, words light up from 0.12 → 1 opacity
     sequentially, with overlapping slices so it reads as a smooth wave. */
  document.querySelectorAll('.word-reveal').forEach(node => {
    // Walk child nodes to preserve inline elements like <br/>
    const parts = [];
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const words = child.textContent.split(/\s+/).filter(Boolean);
        words.forEach(w => parts.push({ kind: 'word', text: w }));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        parts.push({ kind: 'el', node: child.cloneNode(true) });
      }
    });

    node.textContent = '';
    const wordSpans = [];
    parts.forEach(p => {
      if (p.kind === 'word') {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = p.text;
        node.appendChild(span);
        node.appendChild(document.createTextNode(' '));
        wordSpans.push(span);
      } else {
        node.appendChild(p.node);
      }
    });

    const n = wordSpans.length;
    if (!n) return;
    // Each word owns a slice of total progress; slice width > stride for overlap
    const stride = 1 / n;
    const sliceWidth = stride * 2.5;
    const MIN_OP = 0.12;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Range mirrors the Framer offset ["start 0.85", "center center"]:
      // progress 0 when element top hits 85% of viewport,
      // progress 1 when element center hits viewport center.
      const startTop = vh * 0.85;
      const endTop   = (vh / 2) - (rect.height / 2);
      const denom    = startTop - endTop;
      if (!vh || denom <= 0 || !isFinite(denom)) return;
      const raw = (startTop - rect.top) / denom;
      const progress = Math.max(0, Math.min(1, raw));

      for (let i = 0; i < n; i++) {
        const wStart = i * stride;
        const t = Math.max(0, Math.min(1, (progress - wStart) / sliceWidth));
        const op = MIN_OP + (1 - MIN_OP) * t;
        wordSpans[i].style.setProperty('--op', op.toFixed(3));
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    requestAnimationFrame(() => requestAnimationFrame(update));
  });

  /* ---------- Modalities explorer (split-panel interactive) ---------- */
  const modex = document.querySelector('.modex');
  if (modex) {
    const items = Array.from(modex.querySelectorAll('.modex-item'));
    const visuals = Array.from(modex.querySelectorAll('.modex-visual'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let inView = false;

    const setActive = (idx) => {
      activeIndex = idx;
      items.forEach((it, i) => {
        const active = i === idx;
        it.classList.toggle('is-active', active);
        it.classList.remove('is-running');
        it.setAttribute('aria-selected', String(active));
      });
      visuals.forEach((v, i) => v.classList.toggle('is-active', i === idx));
      if (inView && !reducedMotion) {
        void items[idx].offsetWidth; // reflow to restart the bar animation
        items[idx].classList.add('is-running');
      }
    };

    items.forEach((item, idx) => {
      const fill = item.querySelector('.modex-bar-fill');
      if (fill) {
        fill.addEventListener('animationend', () => {
          if (idx === activeIndex && inView && !reducedMotion) {
            setActive((activeIndex + 1) % items.length);
          }
        });
      }
      const activate = () => { if (idx !== activeIndex) setActive(idx); else if (inView && !reducedMotion) { item.classList.remove('is-running'); void item.offsetWidth; item.classList.add('is-running'); } };
      item.addEventListener('mouseenter', activate);
      item.addEventListener('click', activate);
      item.addEventListener('focus', activate);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });

    const modexIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        inView = e.isIntersecting;
        if (inView) {
          setActive(activeIndex);
        } else {
          items.forEach(i => i.classList.remove('is-running'));
        }
      });
    }, { threshold: 0.2 });
    modexIO.observe(modex);
  }

  /* ---------- Video hydration with graceful fallback ----------
     We use data-src + a HEAD probe so missing files don't spam the
     console with resource errors in environments without the videos.
     Drop the .mp4 files at the referenced paths and they'll appear. */
  document.querySelectorAll('video[data-src]').forEach(v => {
    const src = v.getAttribute('data-src');
    if (!src) return;
    let loaded = false;
    const ok = () => {
      if (loaded) return;
      loaded = true;
      v.setAttribute('data-loaded', 'true');
    };
    v.addEventListener('loadeddata', ok);
    v.addEventListener('canplay', ok);
    v.addEventListener('error', () => { v.style.display = 'none'; });

    fetch(src, { method: 'HEAD' })
      .then(r => {
        if (!r || !r.ok) { v.style.display = 'none'; return; }
        v.src = src;
        v.load();
      })
      .catch(() => { v.style.display = 'none'; });

    setTimeout(() => {
      if (v.readyState < 2) v.style.display = 'none';
    }, 4000);
  });

  /* ---------- TWEAKS panel (vanilla, host-protocol compliant) ---------- */
  const TWEAKS = window.__NORTHSTAR_TWEAKS || {};

  const ACCENTS = [
    { name: 'Deep Purple', accent: '#4A1D96', violet: '#6D3FE0', indigo: '#3E2BCC', soft: '#E9E2FB',  deep: '#0E0B33', accent2: '#1A1A4E' },
    { name: 'Royal Indigo', accent: '#2A3FCF', violet: '#5B6FE8', indigo: '#1E2DA8', soft: '#DDE3FA',  deep: '#0A1235', accent2: '#13205E' },
    { name: 'Plum Magenta', accent: '#A21BAA', violet: '#C146CC', indigo: '#6A1D8F', soft: '#F6E0F7',  deep: '#2A0A2F', accent2: '#4A1057' },
    { name: 'Forest Spruce', accent: '#1F6B5B', violet: '#3FA08A', indigo: '#15514A', soft: '#DCEEE8', deep: '#0A2A26', accent2: '#0F3A33' },
  ];

  const FONTS = [
    { name: 'Manrope',           stack: '"Manrope", "Plus Jakarta Sans", system-ui, sans-serif' },
    { name: 'Plus Jakarta Sans', stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  ];

  const applyAccent = (name) => {
    const a = ACCENTS.find(x => x.name === name) || ACCENTS[0];
    const r = document.documentElement.style;
    r.setProperty('--accent',     a.accent);
    r.setProperty('--accent-2',   a.accent2);
    r.setProperty('--accent-deep',a.deep);
    r.setProperty('--accent-soft',a.soft);
    r.setProperty('--violet',     a.violet);
    r.setProperty('--indigo',     a.indigo);
    r.setProperty('--accent-glow',a.accent + '52');
  };
  const applyFont = (name) => {
    const f = FONTS.find(x => x.name === name) || FONTS[0];
    document.documentElement.style.setProperty('--font-display', f.stack);
  };

  // initial paint from defaults
  applyAccent(TWEAKS.darkSectionTone || 'Deep Purple');
  applyFont(TWEAKS.displayFont || 'Manrope');

  // Build panel
  const panel = document.createElement('div');
  panel.id = 'tweaks';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Tweaks');
  panel.innerHTML = `
    <div class="tweaks-head">
      <div class="tweaks-title">Tweaks</div>
      <button class="tweaks-close" aria-label="Close tweaks">×</button>
    </div>
    <div class="tweak-row">
      <div class="tweak-label">Accent palette</div>
      <div class="tweak-swatches" data-control="accent"></div>
    </div>
    <div class="tweak-row">
      <div class="tweak-label">Display font</div>
      <div class="tweak-radio" data-control="font"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const swatchEl = panel.querySelector('[data-control="accent"]');
  ACCENTS.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'tweak-swatch';
    btn.title = a.name;
    btn.style.background = `linear-gradient(135deg, ${a.accent} 0%, ${a.violet} 100%)`;
    btn.setAttribute('aria-pressed', String(a.name === (TWEAKS.darkSectionTone || 'Deep Purple')));
    btn.addEventListener('click', () => {
      applyAccent(a.name);
      swatchEl.querySelectorAll('.tweak-swatch').forEach(s => s.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      persist({ darkSectionTone: a.name, accent: a.accent });
    });
    swatchEl.appendChild(btn);
  });

  const fontEl = panel.querySelector('[data-control="font"]');
  FONTS.forEach(f => {
    const btn = document.createElement('button');
    btn.textContent = f.name;
    btn.setAttribute('aria-pressed', String(f.name === (TWEAKS.displayFont || 'Manrope')));
    btn.addEventListener('click', () => {
      applyFont(f.name);
      fontEl.querySelectorAll('button').forEach(s => s.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      persist({ displayFont: f.name });
    });
    fontEl.appendChild(btn);
  });

  const persist = (edits) => {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    } catch (e) {}
  };

  const closeBtn = panel.querySelector('.tweaks-close');
  closeBtn.addEventListener('click', () => {
    panel.classList.remove('is-open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  });

  // Host protocol: register message listener BEFORE announcing availability
  window.addEventListener('message', (e) => {
    const data = e && e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === '__activate_edit_mode')   panel.classList.add('is-open');
    if (data.type === '__deactivate_edit_mode') panel.classList.remove('is-open');
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

})();
