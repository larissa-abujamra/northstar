/* =========================================================
   NORTHSTAR — main.js
   Nav scroll · reveals · counters · marquee · video · tweaks
   ========================================================= */

(() => {

  /* ---------- Primary CTA: layered button with arrow-dots hover cascade ----
     Auto-wires every .btn-primary / .btn-on-dark anchor. Reads the existing
     label, drops any inline arrow span, and rebuilds the child DOM as:
       .btn-bg (gradient backdrop, absolute)
       .btn-inner
         .btn-label
         .btn-icon-wrap → 4 stacked .btn-arrow (each = 5 dots in a > chevron)
     CSS handles the staggered fly-through on hover. */
  document.querySelectorAll('.btn-primary, .btn-on-dark').forEach(btn => {
    if (btn.dataset.cta === 'wired') return;

    // Pull label text out of whatever currently lives inside (text + optional
    // arrow span). textContent is fine because these CTAs are plain text.
    const label = btn.textContent.replace(/\s*[→➔➜]\s*$/u, '').trim();
    btn.textContent = '';

    const bg = document.createElement('span');
    bg.className = 'btn-bg';
    bg.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.className = 'btn-inner';

    const lab = document.createElement('span');
    lab.className = 'btn-label';
    lab.textContent = label;

    const iconWrap = document.createElement('span');
    iconWrap.className = 'btn-icon-wrap';
    iconWrap.setAttribute('aria-hidden', 'true');

    // Single static chevron — 5 dots laid out vertically, --index controls
    // horizontal shift forming a > with the middle dot (index 0) at the tip.
    const arrow = document.createElement('span');
    arrow.className = 'btn-arrow';
    [2, 1, 0, 1, 2].forEach(idx => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.setProperty('--index', String(idx));
      arrow.appendChild(dot);
    });
    iconWrap.appendChild(arrow);

    inner.appendChild(lab);
    inner.appendChild(iconWrap);
    btn.appendChild(bg);
    btn.appendChild(inner);
    btn.dataset.cta = 'wired';
  });

  /* ---------- Sparkle particles under "intelligence." in the hero ----------
     Sparse ambient dust — tiny purple dots drifting slowly, opacity pulsing
     between near-invisible and faint. Anchored to the word via an inline
     wrapper; radial mask feathers the field at its edges so there's no hard
     cutoff. Loop pauses when offscreen and respects reduced-motion. */
  const heroEm = document.querySelector('.hero-title em');
  if (heroEm && !heroEm.closest('.hero-em-wrap')) {
    const wrap = document.createElement('span');
    wrap.className = 'hero-em-wrap';
    heroEm.parentNode.insertBefore(wrap, heroEm);
    wrap.appendChild(heroEm);

    const layer = document.createElement('span');
    layer.className = 'hero-sparkles';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    wrap.appendChild(layer);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 50;                  // sparse — you can count them
    const OP_MIN = 0.24;
    const OP_MAX = 0.70;
    const SPEED = 0.3;             // px/frame max drift
    let particles = [];
    let w = 0, h = 0;

    const seed = () => {
      particles = [];
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          r:  0.4 + Math.random() * 0.8,           // 0.4 → 1.2 px
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.008 + Math.random() * 0.018,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, w, h);
      const amp = (OP_MAX - OP_MIN) * 0.5;
      const mid = OP_MIN + amp;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
        p.phase += p.phaseSpeed;
        const op = mid + amp * Math.sin(p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 29, 150, ${op.toFixed(3)})`;
        ctx.fill();
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = false;
    let raf = null;
    const tick = () => {
      if (!running) return;
      drawFrame();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    // Re-seed when the em's box changes (font load, viewport rescale, etc.)
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(wrap);
    }

    if (reduced) {
      // single static frame, no animation
      drawFrame();
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (!running) { running = true; tick(); }
          } else {
            running = false;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
          }
        });
      });
      io.observe(wrap);
    }
  }

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
    const totalLen = text.length;
    const center = (totalLen - 1) / 2;
    node.textContent = '';

    // Wrap each WORD in an inline-block with white-space: nowrap so the
    // browser can't break inside it, but CAN break at the real spaces
    // between word-groups. The per-char .ch spans still drive animation.
    const spans = [];
    const words = text.split(' ');
    let i = 0;
    words.forEach((word, wi) => {
      const group = document.createElement('span');
      group.className = 'word-group';
      for (const c of word) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = c;
        const distance = (i - center) / center; // -1 .. 1
        span.dataset.distance = distance.toFixed(4);
        span.style.setProperty('--tx', (distance * 60) + 'px');
        span.style.setProperty('--rx', (distance * 40) + 'deg');
        span.style.setProperty('--op', '0.15');
        group.appendChild(span);
        spans.push(span);
        i++;
      }
      node.appendChild(group);
      // Real space between word-groups \u2014 this is where the browser wraps.
      if (wi < words.length - 1) {
        node.appendChild(document.createTextNode(' '));
        i++; // keep index in lockstep with original text positions
      }
    });

    const update = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Widened window so the reveal takes more scroll distance:
      // start when element top is at 90% of viewport,
      // end   when element top is at 20% of viewport (well past center).
      const startTop = vh * 0.9;
      const endTop   = vh * 0.2;
      const denom    = startTop - endTop;
      if (!vh || denom <= 0 || !isFinite(denom)) return;
      const raw = (startTop - rect.top) / denom;
      const progress = Math.max(0, Math.min(1, raw));
      // Use the full [0,1] range (no /0.5 cap) \u2014 animation now fills the
      // whole window instead of completing in the first half.
      const t = progress;
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
    // Distribute slot STARTS across [0, 1 - sliceWidth] so the last word's
    // slot ends at exactly progress = 1. The previous scheme (stride = 1/n,
    // sliceWidth = 2.5/n) ran the last slot off the end of progress, so the
    // final word never fully revealed no matter how far the user scrolled.
    const sliceWidth = 0.35;
    const startStep = n > 1 ? (1 - sliceWidth) / (n - 1) : 0;
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
        const wStart = i * startStep;
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

  /* ---------- Tactile glove: scroll-driven 3D rotation ----------
     Flat PNG transformed via CSS custom properties. Scroll progress maps
     to rotateY [-25..25], rotateX [8..0..-8], and scale [0.9..1.05..0.9].
     A per-frame exponential lerp gives the spring-y feel without an actual
     physics integrator. rAF only runs while #what is in the viewport. */
  const whatSec = document.getElementById('what');
  const gloveImg = document.querySelector('.modex-glove-img');
  const gloveShadow = document.querySelector('.modex-glove-shadow');
  if (whatSec && gloveImg) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = null;
    let active = false;
    let cy = 0, cx = 0, cs = 1;

    const computeTarget = () => {
      const rect = whatSec.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!vh) return { y: 0, x: 0, s: 1 };
      // Range matches Framer offset ["start end", "end start"]:
      // progress 0 when section top hits bottom of viewport,
      // progress 1 when section bottom exits top of viewport.
      const total = vh + rect.height;
      const traveled = vh - rect.top;
      const p = Math.max(0, Math.min(1, traveled / total));
      return {
        y: -55 + 110 * p,                      // -55 → 55  (90° → 110° span)
        x: 18 - 36 * p,                         // 18 → -18
        s: 0.82 + 0.28 * Math.sin(p * Math.PI), // 0.82 → 1.10 → 0.82
      };
    };

    const applyVars = () => {
      gloveImg.style.setProperty('--glove-rotY', cy.toFixed(2) + 'deg');
      gloveImg.style.setProperty('--glove-rotX', cx.toFixed(2) + 'deg');
      gloveImg.style.setProperty('--glove-scale', cs.toFixed(3));
      if (gloveShadow) gloveShadow.style.setProperty('--glove-scale', cs.toFixed(3));
    };

    const tick = () => {
      if (!active) { raf = null; return; }
      const t = computeTarget();
      const k = 0.2; // exp-lerp factor — higher = snappier, lower = looser
      cy += (t.y - cy) * k;
      cx += (t.x - cx) * k;
      cs += (t.s - cs) * k;
      applyVars();
      raf = requestAnimationFrame(tick);
    };

    // Seed current values to the target so the first paint isn't a snap from 0.
    const initial = computeTarget();
    cy = initial.y; cx = initial.x; cs = initial.s;
    applyVars();

    if (!reduced) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          active = e.isIntersecting;
          if (active && !raf) raf = requestAnimationFrame(tick);
        });
      });
      io.observe(whatSec);
    }
  }

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

    const loadDirect = () => { v.src = src; v.load(); };

    // file:// and some sandboxed contexts reject fetch() — skip the HEAD
    // probe there and let the <video> element try directly. A fetch error
    // (network hiccup, CORS quirk) also shouldn't kill the video, so we
    // fall through on .catch instead of hiding. Real 404s still hide.
    if (location.protocol === 'file:') {
      loadDirect();
    } else {
      fetch(src, { method: 'HEAD' })
        .then(r => {
          if (r && r.ok) loadDirect();
          else v.style.display = 'none';
        })
        .catch(loadDirect);
    }

    // Hide only if no loadeddata/canplay ever fired (timeout extended
    // from 4s to 10s — 23MB videos can need more than 4s on first load).
    setTimeout(() => { if (!loaded) v.style.display = 'none'; }, 10000);
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
