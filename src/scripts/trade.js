import * as THREE from 'three';
import { CONTACT_EMAIL, CONTACT_HREF } from '../config/contact.ts';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let cleanup = null;
let firstVisit = true;
let restoredScroll = null;
function startTrade() {
  cleanup = initTrade(firstVisit, restoredScroll);
  firstVisit = false;
  restoredScroll = null;
}
function stopTrade() {
  restoredScroll = window.scrollY;
  cleanup?.();
  cleanup = null;
}
window.addEventListener('pagehide', stopTrade);
window.addEventListener('pageshow', () => {
  if (!cleanup) {
    startTrade();
  }
});
motionPreference.addEventListener('change', () => {
  stopTrade();
  startTrade();
});
startTrade();

function initTrade(alignHash, restoreY) {
  const body = document.querySelector('[data-trade]');
  if (!body) {
    return null;
  }
  const reduce = motionPreference.matches;
  const events = new AbortController();
  let frame = 0,
    fillFrame = 0,
    loaderTimer = 0,
    hideTimer = 0,
    copyTimer = 0;
  let scene3 = null,
    renderer3 = null;
  let pendingFocus = -1;
  function listen(target, event, handler, options = {}) {
    target.addEventListener(event, handler, { ...options, signal: events.signal });
  }

  const CONTACT = CONTACT_EMAIL;

  const PICKS = {
    cashew: { name: 'Cashew nuts' },
    jute: { name: 'Jute bags' },
    spice: { name: 'Spices' },
  };

  /* Where each chapter sits on the scroll, in viewport heights, and where the map camera looks. */
  const STARTS = [0, 1.2, 2.4, 3.8, 5.2, 6.6];
  const LEAD = 0.45;
  const ALL = [-95, 118, -14, 52];
  const CAMS = [
    { b: ALL, a: [0.5, 0.37], f: [0.94, 0.42], m: { a: [0.5, 0.27], f: [0.9, 0.3] }, focus: -1 },
    { b: ALL, a: [0.27, 0.52], f: [0.5, 0.6], m: { a: [0.5, 0.27], f: [0.9, 0.3] }, focus: -1 },
    {
      b: [-84, 46, -14, 50],
      a: [0.72, 0.27],
      f: [0.46, 0.36],
      ma: 0.55,
      m: { a: [0.5, 0.17], f: [0.92, 0.2], ma: 0.3 },
      focus: 0,
    },
    {
      b: [-84, 96, -4, 50],
      a: [0.27, 0.27],
      f: [0.4, 0.36],
      ma: 0.55,
      m: { a: [0.5, 0.17], f: [0.92, 0.2], ma: 0.3 },
      focus: 1,
    },
    {
      b: [-84, 114, -6, 50],
      a: [0.72, 0.27],
      f: [0.46, 0.36],
      ma: 0.55,
      m: { a: [0.5, 0.17], f: [0.92, 0.2], ma: 0.3 },
      focus: 2,
    },
    { b: ALL, a: [0.72, 0.27], f: [0.46, 0.36], ma: 0.55, m: { a: [0.5, 0.17], f: [0.92, 0.2], ma: 0.2 }, focus: -1 },
  ];

  const NODES = {
    ca: { name: 'Canada', lon: -75.6972, lat: 45.4215 },
    tz: { name: 'Tanzania', lon: 40.18, lat: -10.27 },
    bd: { name: 'Bangladesh', lon: 91.78, lat: 22.36 },
    my: { name: 'Malaysia', lon: 110.35, lat: 1.55 },
  };
  const ROUTES = [
    { k: 'tz', lift: 0.16 },
    { k: 'bd', lift: 0.22 },
    { k: 'my', lift: 0.28 },
  ];

  function $(s) {
    return body.querySelector(s);
  }
  const chapters = Array.prototype.slice.call(document.querySelectorAll('.ch'));
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  const canvas = $('#gl'),
    ctx = reduce ? null : canvas?.getContext('2d');
  const track = $('#track'),
    chrome = $('#chrome'),
    hint = $('#scrollhint'),
    readout = $('#readout'),
    loader = $('#loader'),
    fill = $('#loader-fill');
  const mail = $('#mail'),
    addr = $('#addr'),
    copyBtn = $('#copy'),
    pickName = $('#pick-name');
  const pickBtns = Array.prototype.slice.call(document.querySelectorAll('.pick'));

  function hex(c) {
    c = String(c).trim();
    if (c.charAt(0) === '#') {
      if (c.length === 4) {
        c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
      }
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    const m = c.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
  }
  function rgb(c) {
    return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  }
  function rgba(c, a) {
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  }

  /* Each chapter's colours come from the CSS tokens, so the canvas and the text never drift apart. */
  const themes = chapters.map((el) => {
    const cs = getComputedStyle(el);
    return {
      ground: hex(cs.getPropertyValue('--ground')),
      fg: hex(cs.getPropertyValue('--fg')),
      accent: hex(cs.getPropertyValue('--accent')),
      fgCss: cs.getPropertyValue('--fg').trim(),
      accentCss: cs.getPropertyValue('--accent').trim(),
    };
  });

  let dpr = 1,
    active = -1,
    ready = false,
    dirty = true,
    focus = -1;
  let S3 = null,
    slots = [null, null, null],
    pickedKey = 'cashew',
    scrollAng = 0,
    scrollAngS = 0,
    lastY = 0;
  const PICK_ORDER = ['cashew', 'jute', 'spice'];
  const VIEWH = 2 * 7 * Math.tan((16 * Math.PI) / 180);
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let cam = null,
    tgt = null,
    cur = null,
    lastW = 0;

  function target(cam0) {
    const W = innerWidth,
      H = innerHeight,
      mobile = W <= 860;
    const a = mobile ? cam0.m.a : cam0.a,
      f = mobile ? cam0.m.f : cam0.f,
      b = cam0.b;
    const lonSpan = b[1] - b[0],
      latSpan = b[3] - b[2];
    const s = Math.min((f[0] * W) / lonSpan, (f[1] * H) / latSpan);
    const ma = mobile && cam0.m.ma != null ? cam0.m.ma : cam0.ma != null ? cam0.ma : 1;
    return {
      lon: (b[0] + b[1]) / 2,
      lat: (b[2] + b[3]) / 2,
      s: s,
      ax: a[0] * W,
      ay: a[1] * H,
      rx: (lonSpan * s) / 2,
      ry: (latSpan * s) / 2,
      ma: ma,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    track.style.height = `${(STARTS[STARTS.length - 1] + 1) * innerHeight}px`;
    if (S3) {
      resize3D();
    }
    if (active >= 0) {
      tgt = target(CAMS[active]);
      if (innerWidth !== lastW || reduce) {
        cam = Object.assign({}, tgt);
      }
    }
    lastW = innerWidth;
    dirty = true;
  }

  function activeIndex() {
    let p = window.scrollY / innerHeight,
      a = 0;
    for (let i = 0; i < STARTS.length; i++) {
      if (p >= STARTS[i] - LEAD) {
        a = i;
      }
    }
    return a;
  }

  function syncHint() {
    hint.classList.toggle('is-on', ready && active === 0 && window.scrollY < 40);
  }

  function apply(i) {
    if (i === active) {
      return;
    }
    const first = active < 0;
    active = i;
    focus = CAMS[i].focus;
    chapters.forEach((el, j) => {
      const visible = ready && j === i;
      el.classList.toggle('is-active', visible);
      el.inert = !visible;
      el.setAttribute('aria-hidden', String(!visible));
    });
    tgt = target(CAMS[i]);
    if (first || !cam) {
      cam = Object.assign({}, tgt);
    }
    if (first) {
      const T = themes[i];
      cur = { g: T.ground.slice(), f: T.fg.slice(), a: T.accent.slice() };
    }
    body.style.setProperty('--chrome', themes[i].fgCss);
    body.style.setProperty('--accent', themes[i].accentCss);
    readout.textContent = chapters[i].getAttribute('data-readout') || '';
    if (S3) {
      slots = computeSlots();
    }
    navLinks.forEach((a) => {
      const current = a.getAttribute('data-nav').split(' ').includes(String(i));
      a.classList.toggle('is-current', current);
      if (current) {
        a.setAttribute('aria-current', 'location');
      } else {
        a.removeAttribute('aria-current');
      }
    });
    if (ready && pendingFocus === i) {
      focusChapter(i);
    }
    dirty = true;
  }

  function onScroll() {
    if (!reduce) {
      scrollAng += (window.scrollY - lastY) * 0.004;
    }
    lastY = window.scrollY;
    apply(activeIndex());
    syncHint();
    dirty = true;
  }

  function focusChapter(i) {
    const heading = chapters[i].querySelector('h1,h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    pendingFocus = -1;
  }

  function chapterForHash(hash) {
    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return -1;
    }
    if (id === 'top') {
      return 0;
    }
    const target = document.getElementById(id);
    return chapters.findIndex((chapter) => chapter === target || chapter.contains(target));
  }

  function goTo(i, updateHash = false, moveFocus = false) {
    if (!chapters[i]) {
      return;
    }
    if (updateHash) {
      const hash = `#${chapters[i].id}`;
      if (location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    }
    if (moveFocus) {
      pendingFocus = i;
      if (ready && active === i) {
        focusChapter(i);
      }
    }
    window.scrollTo({ top: STARTS[i] * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ── enquiry ── */
  function setPick(k) {
    if (!Object.hasOwn(PICKS, k)) {
      return;
    }
    pickBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pick') === k));
    });
    pickName.textContent = PICKS[k].name.toLowerCase();
    pickedKey = k;
    if (S3) {
      slots = computeSlots();
      dirty = true;
    }
    mail.href = `${CONTACT_HREF}?subject=${encodeURIComponent(`Trade enquiry: ${PICKS[k].name}`)}`;
  }
  addr.textContent = CONTACT;
  setPick(
    pickBtns.find((button) => button.getAttribute('aria-pressed') === 'true')?.getAttribute('data-pick') || 'cashew',
  );
  pickBtns.forEach((b) => {
    listen(b, 'click', () => {
      setPick(b.getAttribute('data-pick'));
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-enquire]'), (b) => {
    listen(b, 'click', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      setPick(b.getAttribute('data-enquire'));
      if (reduce || !ctx) {
        location.hash = chapters[5].id;
        chapters[5].scrollIntoView({ behavior: 'auto', block: 'start' });
        focusChapter(5);
      } else {
        goTo(5, true, true);
      }
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), (a) => {
    listen(a, 'click', (e) => {
      if (reduce || !ctx || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
      }
      e.preventDefault();
      goTo(+a.getAttribute('data-goto'), true, true);
    });
  });
  function flash(txt) {
    if (events.signal.aborted) {
      return;
    }
    copyBtn.textContent = txt;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyBtn.textContent = 'Copy address';
    }, 1800);
  }
  function selectAddr() {
    if (events.signal.aborted) {
      return;
    }
    const r = document.createRange();
    r.selectNodeContents(addr);
    const s = window.getSelection();
    if (!s) {
      return;
    }
    s.removeAllRanges();
    s.addRange(r);
  }
  listen(copyBtn, 'click', () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(CONTACT).then(
        () => {
          flash('Copied');
        },
        () => {
          selectAddr();
          flash('Selected');
        },
      );
    } else {
      selectAddr();
      flash('Selected');
    }
  });
  body.setAttribute('data-trade-interactive', '');

  function dispose() {
    events.abort();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(fillFrame);
    clearTimeout(loaderTimer);
    clearTimeout(hideTimer);
    clearTimeout(copyTimer);
    if (scene3) {
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      scene3.traverse((object) => {
        if (object.geometry) {
          geometries.add(object.geometry);
        }
        if (object.material) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            materials.add(material);
            for (const value of Object.values(material)) {
              if (value?.isTexture) {
                textures.add(value);
              }
            }
          }
        }
        if (object.isInstancedMesh) {
          object.dispose();
        }
      });
      for (const texture of textures) {
        texture.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
      for (const geometry of geometries) {
        geometry.dispose();
      }
      scene3.clear();
    }
    renderer3?.dispose();
    body.classList.remove('trade-ready');
    body.removeAttribute('data-trade-interactive');
    body.style.removeProperty('--chrome');
    body.style.removeProperty('--accent');
    navLinks.forEach((link) => {
      link.classList.remove('is-current');
      link.removeAttribute('aria-current');
    });
    copyBtn.textContent = 'Copy address';
    chapters.forEach((chapter) => {
      chapter.classList.remove('is-active');
      chapter.inert = false;
      chapter.removeAttribute('aria-hidden');
    });
    loader.hidden = true;
    track.style.height = '';
  }

  // Native scrolling remains available if motion is reduced or Canvas2D is unavailable.
  if (reduce || !ctx) {
    return dispose;
  }

  /* ── map scene ── */
  function step(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 3.4);
    ['lon', 'lat', 'ax', 'ay', 'rx', 'ry', 'ma'].forEach((n) => {
      cam[n] += (tgt[n] - cam[n]) * k;
    });
    cam.s = Math.exp(Math.log(cam.s) + (Math.log(tgt.s) - Math.log(cam.s)) * k);
    const T = themes[active];
    for (let i = 0; i < 3; i++) {
      cur.g[i] += (T.ground[i] - cur.g[i]) * k;
      cur.f[i] += (T.fg[i] - cur.f[i]) * k;
      cur.a[i] += (T.accent[i] - cur.a[i]) * k;
    }
  }

  function qb(p0, p1, p2, t) {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  }

  function draw(now) {
    const W = innerWidth,
      H = innerHeight,
      s = cam.s,
      t = reduce ? 0 : now / 1000;
    const cx = cam.lon,
      cy = cam.lat,
      ax = cam.ax,
      ay = cam.ay,
      fg = cur.f,
      ac = cur.a;
    const small = W <= 860;
    function X(lon) {
      return ax + (lon - cx) * s;
    }
    function Y(lat) {
      return ay - (lat - cy) * s;
    }
    function P(k) {
      return [X(NODES[k].lon), Y(NODES[k].lat)];
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgb(cur.g);
    ctx.fillRect(0, 0, W, H);

    /* graticule: a dot every 5 degrees, fading out from the middle of the framed region */
    const rx = Math.max(cam.rx * 1.15, 40),
      ry = Math.max(cam.ry * 1.5, 40);
    ctx.fillStyle = rgb(fg);
    for (let lo = -140; lo <= 150; lo += 5) {
      const x = X(lo);
      if (x < -4 || x > W + 4) {
        continue;
      }
      for (let la = -45; la <= 70; la += 5) {
        const y = Y(la);
        if (y < -4 || y > H + 4) {
          continue;
        }
        const dx = (x - ax) / rx,
          dy = (y - ay) / ry,
          e = dx * dx + dy * dy;
        if (e >= 1) {
          continue;
        }
        ctx.globalAlpha = (1 - e) * 0.5 * cam.ma;
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }
    }
    ctx.globalAlpha = cam.ma;

    const fs = small ? 10 : 11;
    ctx.font = `500 ${fs}px ui-monospace,Menlo,Consolas,monospace`;
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '1px';
    }
    ctx.textBaseline = 'alphabetic';

    /* equator */
    const ye = Y(0);
    ctx.strokeStyle = rgba(fg, 0.22);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(X(-100), ye);
    ctx.lineTo(X(125), ye);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(fg, 0.45);
    ctx.fillText('EQUATOR', X(-98), ye - 6);

    /* routes: each origin to Canada, the focused one in the accent colour */
    const C = P('ca');
    ROUTES.forEach((r, i) => {
      const O = P(r.k),
        on = focus < 0 || focus === i;
      const d = Math.hypot(O[0] - C[0], O[1] - C[1]);
      const K = [(O[0] + C[0]) / 2, (O[1] + C[1]) / 2 - d * r.lift];
      ctx.beginPath();
      ctx.moveTo(O[0], O[1]);
      ctx.quadraticCurveTo(K[0], K[1], C[0], C[1]);
      ctx.strokeStyle = rgba(on ? ac : fg, on ? 0.28 : 0.13);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (!on) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(O[0], O[1]);
      ctx.quadraticCurveTo(K[0], K[1], C[0], C[1]);
      ctx.setLineDash([1.5, 8]);
      ctx.lineDashOffset = -t * 16;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = rgba(ac, 0.95);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineCap = 'butt';
      for (let j = 0; j < 6; j++) {
        let u = (t * 0.07 + i * 0.33 - j * 0.012) % 1;
        if (u < 0) {
          u += 1;
        }
        const p = qb(O, K, C, u);
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3.2 * (1 - j * 0.13), 0, 6.2832);
        ctx.fillStyle = rgba(ac, 0.9 * (1 - j / 6));
        ctx.fill();
      }
    });

    /* ports */
    ['tz', 'bd', 'my', 'ca'].forEach((k, i) => {
      const n = NODES[k],
        p = P(k),
        isC = k === 'ca';
      const idx = k === 'tz' ? 0 : k === 'bd' ? 1 : k === 'my' ? 2 : -9;
      const on = isC || focus < 0 || focus === idx;
      if (on && !reduce) {
        const ph = (t * 0.8 + i * 0.25) % 1;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 5 + ph * 16, 0, 6.2832);
        ctx.strokeStyle = rgba(ac, 0.5 * (1 - ph));
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p[0], p[1], 7, 0, 6.2832);
      ctx.strokeStyle = rgba(on ? ac : fg, on ? 0.5 : 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.4, 0, 6.2832);
      ctx.fillStyle = rgba(on ? ac : fg, on ? 1 : 0.5);
      ctx.fill();
      ctx.fillStyle = rgba(fg, on ? 0.95 : 0.45);
      const label = n.name.toUpperCase();
      if (isC) {
        ctx.textAlign = 'center';
        ctx.fillText(label, p[0], p[1] - 15);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(label, p[0] + 13, p[1] + 4);
      }
    });
  }

  let last = performance.now();
  function loop(now) {
    frame = 0;
    if (document.hidden || events.signal.aborted) {
      return;
    }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (cam && (!reduce || dirty)) {
      step(dt);
      draw(now);
      if (S3) {
        update3D(dt, now);
      }
      dirty = false;
    }
    frame = requestAnimationFrame(loop);
  }

  function resume() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    last = performance.now();
    if (!frame) {
      frame = requestAnimationFrame(loop);
    }
  }

  /* ── 3D layer: models are built in code and textures are painted on canvas, so no outside images load ── */
  function computeSlots() {
    const out = [null, null, null];
    if (!S3 || !ready) {
      return out;
    }
    const W = innerWidth,
      H = innerHeight,
      mobile = W <= 860,
      ppu = H / VIEWH;
    function at(px, py, size) {
      return { x: (px - W / 2) / ppu, y: -(py - H / 2) / ppu, s: size / (1.6 * ppu) };
    }
    const big = mobile
      ? { size: Math.min(0.28 * H, 0.6 * W), ay: 0.33 }
      : { size: Math.min(0.44 * H, 0.36 * W), ay: 0.64 };
    const AX = [0.72, 0.31, 0.72];
    if (active === 0 && !mobile) {
      const e = Math.min(0.17 * H, 0.105 * W),
        cx = 0.79 * W,
        cy = 0.7 * H;
      out[1] = at(cx - 0.85 * e, cy - 0.4 * e, e);
      out[0] = at(cx + 0.85 * e, cy - 0.3 * e, e);
      out[2] = at(cx, cy + 0.75 * e, e);
    } else if (active === 0 && mobile) {
      /* phone hero: a row of the three products in the gap between the map and the headline */
      const band = H * 0.63 - 345,
        em = Math.min(0.27 * W, band * 0.95);
      if (em >= 64) {
        const cym = 0.37 * H + band / 2;
        out[0] = at(0.2 * W, cym, em);
        out[1] = at(0.5 * W, cym, em * 1.05);
        out[2] = at(0.8 * W, cym, em);
      }
    } else if (active >= 2 && active <= 4) {
      const gi = active - 2;
      out[gi] = at(mobile ? 0.5 * W : AX[gi] * W, big.ay * H, big.size);
    } else if (active === 5 && !mobile && H >= 700) {
      out[PICK_ORDER.indexOf(pickedKey)] = at(0.72 * W, big.ay * H, big.size);
    }
    return out;
  }

  function resize3D() {
    const s = S3;
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    s.renderer.setSize(innerWidth, innerHeight, false);
    s.camera.aspect = innerWidth / innerHeight;
    s.camera.updateProjectionMatrix();
    slots = computeSlots();
  }

  function update3D(dt, now) {
    const s = S3,
      t = reduce ? 0 : now / 1000;
    if (!reduce) {
      const kp = 1 - Math.exp(-dt * 6);
      ptr.x += (ptr.tx - ptr.x) * kp;
      ptr.y += (ptr.ty - ptr.y) * kp;
      scrollAngS += (scrollAng - scrollAngS) * kp;
    }
    const sx = ptr.x,
      sy = ptr.y,
      sa = scrollAngS;
    for (let i = 0; i < 3; i++) {
      const G = s.groups[i],
        S = slots[i];
      if (S) {
        if (!G.on) {
          G.on = true;
          G.px = S.x;
          G.py = S.y;
          G.v = 0;
          G.spinA = reduce ? 0 : Math.PI * 1.4;
        }
        G.tx = S.x;
        G.ty = S.y;
        G.ts = S.s;
      } else {
        G.on = false;
        G.ts = 0;
      }
      if (reduce) {
        G.sc = G.ts;
        G.px = G.tx;
        G.py = G.ty;
      } else {
        G.v += (G.ts - G.sc) * 70 * dt;
        G.v *= Math.exp(-dt * 9);
        G.sc = Math.max(0, G.sc + G.v * dt);
        const kk = 1 - Math.exp(-dt * 5);
        G.px += (G.tx - G.px) * kk;
        G.py += (G.ty - G.py) * kk;
        G.spinA *= Math.exp(-dt * 2.2);
      }
      const vis = G.sc > 0.003;
      G.root.visible = vis;
      if (!vis) {
        continue;
      }
      G.root.position.set(G.px, G.py + (reduce ? 0 : Math.sin(t * 1.1 + i * 2.1) * 0.05 * G.sc), 0);
      G.root.scale.setScalar(G.sc);
      let ry, rx;
      if (i === 0) {
        ry = t * 0.35 + sa * 0.6 + G.spinA + sx * 0.5;
        rx = 0.25 + sy * 0.25;
      } else if (i === 1) {
        ry = Math.sin(t * 0.5) * 0.45 + Math.sin(sa * 0.6) * 0.5 + G.spinA + sx * 0.45;
        rx = 0.1 + sy * 0.15;
      } else {
        ry = t * 0.25 + sa * 0.5 + G.spinA + sx * 0.4;
        rx = 0.5 + sy * 0.2;
      }
      G.spin.rotation.set(rx, ry, 0);
    }
    if (!reduce && s.groups[0].root.visible) {
      for (let k = 0; k < s.kernels.length; k++) {
        const m = s.kernels[k];
        m.rotation.x += m.userData.wx * dt;
        m.rotation.y += m.userData.wy * dt;
      }
    }
    if (s.groups[2].root.visible) {
      s.floaters(t);
    }
    s.rim.color.setRGB(cur.a[0] / 255, cur.a[1] / 255, cur.a[2] / 255, THREE.SRGBColorSpace);
    s.renderer.render(s.scene, s.camera);
  }

  function initScene() {
    let T = THREE,
      renderer;
    try {
      renderer = new T.WebGLRenderer({
        canvas: $('#gl3d'),
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (_err) {
      return null;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer3 = renderer;
    const scene = new T.Scene();
    scene3 = scene;
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 7);

    function col(h) {
      return new T.Color(h);
    }
    function rng(seed) {
      return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function ctex(w, h, paint, srgb) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      paint(c.getContext('2d'), w, h);
      const tx = new T.CanvasTexture(c);
      tx.wrapS = tx.wrapT = T.RepeatWrapping;
      tx.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (srgb) {
        tx.colorSpace = T.SRGBColorSpace;
      }
      return tx;
    }
    function finalize(content) {
      const box = new T.Box3().setFromObject(content),
        size = new T.Vector3(),
        ctr = new T.Vector3();
      box.getSize(size);
      box.getCenter(ctr);
      const pivot = new T.Group();
      pivot.add(content);
      pivot.position.copy(ctr).negate();
      const spin = new T.Group();
      spin.add(pivot);
      spin.scale.setScalar(1.6 / Math.max(size.x, size.y, size.z));
      const root = new T.Group();
      root.add(spin);
      root.visible = false;
      scene.add(root);
      return {
        root: root,
        spin: spin,
        pivot: pivot,
        sc: 0,
        v: 0,
        ts: 0,
        tx: 0,
        ty: 0,
        px: 0,
        py: 0,
        on: false,
        spinA: 0,
      };
    }

    /* lights: warm key, cool fill, and a rim that takes the chapter's accent colour */
    scene.add(new T.HemisphereLight(col('#ffffff'), col('#3b2a1d'), 0.85));
    const key = new T.DirectionalLight(col('#fff0d9'), 1.9);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fillL = new T.DirectionalLight(col('#d5efe4'), 0.45);
    fillL.position.set(-4, 1, 3);
    scene.add(fillL);
    const rim = new T.DirectionalLight(col('#ffffff'), 1.5);
    rim.position.set(-3, 2.5, -4);
    scene.add(rim);

    /* ── textures ── */
    const burlap = ctex(
      256,
      256,
      (g, w, h) => {
        const R = rng(11),
          n = 16,
          st = w / n;
        g.fillStyle = '#4a3318';
        g.fillRect(0, 0, w, h);
        for (let j = 0; j < n; j++) {
          for (let i = 0; i < n; i++) {
            const x = i * st,
              y = j * st,
              over = ((i + j) & 1) === 0;
            g.fillStyle = `hsl(${33 + R() * 7},44%,${36 + R() * 14}%)`;
            if (over) {
              g.fillRect(x, y + 1.5, st, st - 3);
            } else {
              g.fillRect(x + 1.5, y, st - 3, st);
            }
            g.fillStyle = `rgba(255,230,170,${0.12 + R() * 0.14})`;
            if (over) {
              g.fillRect(x, y + st * 0.32, st, st * 0.2);
            } else {
              g.fillRect(x + st * 0.32, y, st * 0.2, st);
            }
          }
        }
        g.lineWidth = 1;
        g.strokeStyle = 'rgba(255,243,208,.1)';
        for (let q = 0; q < 500; q++) {
          const a = R() * 6.28,
            x0 = R() * w,
            y0 = R() * h;
          g.beginPath();
          g.moveTo(x0, y0);
          g.lineTo(x0 + Math.cos(a) * 7, y0 + Math.sin(a) * 7);
          g.stroke();
        }
      },
      true,
    );
    burlap.repeat.set(2, 2.2);
    const burlapBump = burlap.clone();
    burlapBump.colorSpace = T.NoColorSpace;
    burlapBump.needsUpdate = true;

    const cashewBump = ctex(
      256,
      256,
      (g, w, h) => {
        const R = rng(9);
        g.fillStyle = '#808080';
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 700; i++) {
          const r = 2 + R() * 12,
            x = R() * w,
            y = R() * h,
            c = R() < 0.5 ? '255,255,255' : '0,0,0';
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, `rgba(${c},.16)`);
          gr.addColorStop(1, `rgba(${c},0)`);
          g.fillStyle = gr;
          g.fillRect(x - r, y - r, r * 2, r * 2);
        }
      },
      false,
    );

    const pepBump = ctex(
      256,
      256,
      (g, w, h) => {
        const R = rng(3);
        g.fillStyle = '#808080';
        g.fillRect(0, 0, w, h);
        g.lineCap = 'round';
        for (let i = 0; i < 900; i++) {
          const x = R() * w,
            y = R() * h,
            a = R() * 6.28,
            l = 6 + R() * 18;
          g.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.3)';
          g.lineWidth = 1 + R() * 1.4;
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(
            x + Math.cos(a + 1) * l * 0.5,
            y + Math.sin(a + 1) * l * 0.5,
            x + Math.cos(a) * l,
            y + Math.sin(a) * l,
          );
          g.stroke();
        }
      },
      false,
    );

    const stamp = ctex(
      512,
      320,
      (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#2b1b0a';
        g.strokeStyle = '#2b1b0a';
        g.globalAlpha = 0.92;
        g.lineWidth = 14;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(w / 2 - 70, 92);
        g.lineTo(w / 2 + 70, 92);
        g.stroke();
        g.beginPath();
        g.arc(w / 2, 92, 52, Math.PI, 0);
        g.stroke();
        g.textAlign = 'center';
        let fs = 60;
        g.font = `700 ${fs}px Avenir Next, Helvetica, Arial, sans-serif`;
        const mw = g.measureText('BRIDGE CANADA').width;
        if (mw > 440) {
          fs = Math.floor((fs * 440) / mw);
          g.font = `700 ${fs}px Avenir Next, Helvetica, Arial, sans-serif`;
        }
        g.fillText('BRIDGE CANADA', w / 2, 215);
        g.fillRect(70, 238, w - 140, 4);
        g.font = '500 26px ui-monospace, Menlo, monospace';
        g.fillText('JUTE · BANGLADESH', w / 2, 282);
      },
      true,
    );
    stamp.wrapS = stamp.wrapT = T.ClampToEdgeWrapping;

    /* ── cashew: a handful of kidney-shaped kernels ── */
    function cashewGeo() {
      const g = new T.SphereGeometry(1, 48, 32),
        P = g.attributes.position,
        N = g.attributes.normal,
        R = 1.3;
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i),
          y = P.getY(i),
          z = P.getZ(i),
          nx = N.getX(i),
          ny = N.getY(i),
          nz = N.getZ(i);
        const w = 0.8 + 0.24 * x,
          ph = x * 0.8,
          c = Math.cos(ph),
          s = Math.sin(ph);
        const ly = y * 0.7 * w,
          lz = z * 0.55 * w;
        P.setXYZ(i, R * s + s * ly, -R * (1 - c) + c * ly, lz);
        let ex = nx,
          ey = ny / (0.7 * w),
          ez = nz / (0.55 * w),
          l = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1;
        ex /= l;
        ey /= l;
        ez /= l;
        N.setXYZ(i, ex * c + ey * s, -ex * s + ey * c, ez);
      }
      g.computeBoundingBox();
      const b = g.boundingBox,
        ct = new T.Vector3();
      b.getCenter(ct);
      g.translate(-ct.x, -ct.y, -ct.z);
      return g;
    }
    const kGeo = cashewGeo();
    const kTints = ['#efe0b8', '#e4d0a0', '#eadaaf'];
    const kMats = kTints.map(
      (h) =>
        new T.MeshStandardMaterial({
          color: col(h),
          roughness: 0.64,
          metalness: 0,
          bumpMap: cashewBump,
          bumpScale: 0.1,
        }),
    );
    const cashewC = new T.Group(),
      kernels = [],
      Rc = rng(21),
      kp = [];
    for (let ki = 0; ki < 9; ki++) {
      let pp = null,
        tries = 0;
      while (tries++ < 400) {
        const cand = new T.Vector3(Rc() * 2 - 1, (Rc() * 2 - 1) * 0.8, Rc() * 2 - 1);
        if (cand.lengthSq() > 1) {
          continue;
        }
        cand.multiplyScalar(0.62);
        let ok = true;
        for (let q = 0; q < kp.length; q++) {
          if (kp[q].distanceTo(cand) < 0.42) {
            ok = false;
            break;
          }
        }
        if (ok) {
          pp = cand;
          break;
        }
      }
      if (!pp) {
        pp = new T.Vector3(Rc() - 0.5, Rc() - 0.5, Rc() - 0.5);
      }
      kp.push(pp);
      const km = new T.Mesh(kGeo, kMats[ki % 3]);
      km.position.copy(pp);
      km.rotation.set(Rc() * 6.28, Rc() * 6.28, Rc() * 6.28);
      km.scale.setScalar(0.31 + Rc() * 0.06);
      km.userData.wx = (Rc() - 0.5) * 0.6;
      km.userData.wy = (Rc() - 0.5) * 0.6;
      kernels.push(km);
      cashewC.add(km);
    }
    const cashewG = finalize(cashewC);

    /* ── jute tote: burlap body, rope handles, printed label ── */
    const BW = 1.1,
      BH = 1.2,
      BD = 0.46;
    function bulge(x, y) {
      const a = 1 - ((2 * x) / BW) * ((2 * x) / BW),
        b = 1 - ((2 * y) / BH) * ((2 * y) / BH);
      return 0.07 * Math.max(a, 0) * Math.max(b, 0);
    }
    const juteC = new T.Group();
    const body = new T.BoxGeometry(BW, BH, BD, 22, 24, 8),
      bp = body.attributes.position;
    for (let bi = 0; bi < bp.count; bi++) {
      const bz = bp.getZ(bi);
      if (Math.abs(bz) > BD / 2 - 1e-4) {
        bp.setZ(bi, bz + (bz > 0 ? 1 : -1) * bulge(bp.getX(bi), bp.getY(bi)));
      }
    }
    body.computeVertexNormals();
    const juteMat = new T.MeshStandardMaterial({
      map: burlap,
      bumpMap: burlapBump,
      bumpScale: 1,
      roughness: 0.95,
      metalness: 0,
      color: col('#ffffff'),
    });
    juteC.add(new T.Mesh(body, juteMat));

    const decal = new T.PlaneGeometry(0.8, 0.5, 16, 10),
      dp = decal.attributes.position;
    for (let di = 0; di < dp.count; di++) {
      const dx = dp.getX(di),
        dy = dp.getY(di) - 0.05;
      dp.setXYZ(di, dx, dy, BD / 2 + bulge(dx, dy) + 0.004);
    }
    decal.computeVertexNormals();
    const decalMesh = new T.Mesh(
      decal,
      new T.MeshStandardMaterial({
        map: stamp,
        transparent: true,
        roughness: 0.9,
        metalness: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    decalMesh.position.y = 0;
    juteC.add(decalMesh);

    const rope = burlap.clone();
    rope.repeat.set(10, 1.5);
    rope.needsUpdate = true;
    const ropeMat = new T.MeshStandardMaterial({ map: rope, roughness: 1, metalness: 0, color: col('#d8b57a') });
    [0.17, -0.17].forEach((z0) => {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(-0.34, 0.5, z0),
        new T.Vector3(-0.34, 0.82, z0),
        new T.Vector3(-0.2, 1.12, z0),
        new T.Vector3(0, 1.22, z0),
        new T.Vector3(0.2, 1.12, z0),
        new T.Vector3(0.34, 0.82, z0),
        new T.Vector3(0.34, 0.5, z0),
      ]);
      juteC.add(new T.Mesh(new T.TubeGeometry(curve, 40, 0.04, 8, false), ropeMat));
    });
    const juteG = finalize(juteC);

    /* ── spices: stoneware bowl heaped with Sarawak-style peppercorns ── */
    function pepperGeo() {
      const g = new T.SphereGeometry(0.05, 18, 14),
        P = g.attributes.position,
        v = new T.Vector3();
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i);
        const n = v.clone().normalize();
        const k =
          1 +
          0.14 * Math.sin(n.x * 9 + 1.3) * Math.sin(n.y * 8 + 0.7) * Math.sin(n.z * 10 + 2.1) +
          0.05 * Math.sin(n.x * 23 + n.y * 17 + n.z * 13);
        v.copy(n).multiplyScalar(0.05 * k);
        P.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    }
    const pGeo = pepperGeo();
    const pepMat = new T.MeshStandardMaterial({
      color: col('#ffffff'),
      roughness: 0.55,
      metalness: 0,
      bumpMap: pepBump,
      bumpScale: 1.4,
    });
    const spiceC = new T.Group();
    const prof = [
      [0, 0],
      [0.26, 0],
      [0.28, 0.04],
      [0.4, 0.09],
      [0.52, 0.2],
      [0.6, 0.34],
      [0.62, 0.38],
      [0.58, 0.38],
      [0.56, 0.34],
      [0.48, 0.22],
      [0.36, 0.14],
      [0.22, 0.11],
      [0, 0.11],
    ].map((p) => new T.Vector2(p[0], p[1]));
    const bowl = new T.Mesh(
      new T.LatheGeometry(prof, 64),
      new T.MeshStandardMaterial({ color: col('#8b5a31'), roughness: 0.55, metalness: 0, side: T.DoubleSide }),
    );
    spiceC.add(bowl);
    const filler = new T.Mesh(
      new T.SphereGeometry(0.58, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshStandardMaterial({ color: col('#120d09'), roughness: 1 }),
    );
    filler.scale.y = 0.57;
    filler.position.y = 0.11;
    spiceC.add(filler);

    const m4 = new T.Matrix4(),
      qq = new T.Quaternion(),
      ee = new T.Euler(),
      pv = new T.Vector3(),
      sv = new T.Vector3();
    const Rr = rng(5);
    function place(mesh, i, x, y, z, s) {
      ee.set(Rr() * 6.28, Rr() * 6.28, Rr() * 6.28);
      qq.setFromEuler(ee);
      pv.set(x, y, z);
      sv.setScalar(s);
      m4.compose(pv, qq, sv);
      mesh.setMatrixAt(i, m4);
    }
    const NB = 175,
      NW = 45;
    const heapB = new T.InstancedMesh(pGeo, pepMat, NB),
      heapW = new T.InstancedMesh(pGeo, pepMat, NW);
    heapB.frustumCulled = false;
    heapW.frustumCulled = false;
    let blacks = ['#1a1511', '#221b15', '#2c241d'],
      whites = ['#cfc3a6', '#ddd2b6', '#e6dcc2'],
      tmpC;
    for (let hi = 0; hi < NB + NW; hi++) {
      const ang = Rr() * 6.28,
        rr = Math.sqrt(Rr()) * 0.55;
      const hy = 0.11 + Math.sqrt(Math.max(0, 1 - (rr / 0.6) * (rr / 0.6))) * 0.4 - Rr() * 0.03 + 0.02;
      const isB = hi < NB,
        mesh = isB ? heapB : heapW,
        idx = isB ? hi : hi - NB;
      place(mesh, idx, Math.cos(ang) * rr, hy, Math.sin(ang) * rr, 0.9 + Rr() * 0.25);
      tmpC = col((isB ? blacks : whites)[Math.floor(Rr() * 3)]);
      mesh.setColorAt(idx, tmpC);
    }
    spiceC.add(heapB);
    spiceC.add(heapW);
    const spiceG = finalize(spiceC);

    /* loose peppercorns drifting around the bowl (added after sizing so they don't shrink the bowl) */
    const FN = 30,
      fl = [],
      Rf = rng(77);
    const flB = new T.InstancedMesh(pGeo, pepMat, 24),
      flW = new T.InstancedMesh(pGeo, pepMat, 6);
    flB.frustumCulled = false;
    flW.frustumCulled = false;
    for (let fi = 0; fi < FN; fi++) {
      fl.push({
        r: 0.8 + Rf() * 0.22,
        a: Rf() * 6.28,
        w: (0.12 + Rf() * 0.25) * (Rf() < 0.5 ? -1 : 1),
        y: -0.05 + Rf() * 0.8,
        ph: Rf() * 6.28,
        rx: Rf() * 6.28,
        ry: Rf() * 6.28,
        s: 0.9 + Rf() * 0.5,
      });
      (fi < 24 ? flB : flW).setColorAt(fi < 24 ? fi : fi - 24, col((fi < 24 ? blacks : whites)[fi % 3]));
    }
    spiceG.pivot.add(flB);
    spiceG.pivot.add(flW);
    function floaters(t) {
      for (let i = 0; i < FN; i++) {
        const f = fl[i],
          a = f.a + t * f.w;
        ee.set(f.rx + t * 0.8, f.ry + t * 0.6, 0);
        qq.setFromEuler(ee);
        pv.set(Math.cos(a) * f.r, f.y + Math.sin(t * 0.8 + f.ph) * 0.05, Math.sin(a) * f.r);
        sv.setScalar(f.s);
        m4.compose(pv, qq, sv);
        (i < 24 ? flB : flW).setMatrixAt(i < 24 ? i : i - 24, m4);
      }
      flB.instanceMatrix.needsUpdate = true;
      flW.instanceMatrix.needsUpdate = true;
    }

    listen(
      window,
      'pointermove',
      (e) => {
        if (reduce || e.pointerType === 'touch') {
          return;
        }
        ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
        ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
      },
      { passive: true },
    );

    return {
      renderer: renderer,
      scene: scene,
      camera: camera,
      groups: [cashewG, juteG, spiceG],
      kernels: kernels,
      floaters: floaters,
      rim: rim,
    };
  }

  /* ── loader ── */
  const t0 = performance.now();
  function finishLoader() {
    if (events.signal.aborted) {
      return;
    }
    ready = true;
    if (S3) {
      slots = computeSlots();
      dirty = true;
    }
    chapters[active].classList.add('is-active');
    chapters[active].inert = false;
    chapters[active].setAttribute('aria-hidden', 'false');
    if (pendingFocus === active) {
      focusChapter(active);
    }
    chrome.classList.add('is-on');
    syncHint();
    loader.classList.add('is-done');
    hideTimer = setTimeout(() => {
      loader.hidden = true;
    }, 1000);
  }
  function runFill() {
    if (reduce) {
      fill.style.clipPath = 'inset(0 0 0 0)';
      return;
    }
    const start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / 800);
      fill.style.clipPath = `inset(0 ${100 - 100 * (1 - (1 - p) ** 3)}% 0 0)`;
      if (p < 1) {
        fillFrame = requestAnimationFrame(tick);
      }
    })(start);
  }

  listen(window, 'scroll', onScroll, { passive: true });
  listen(window, 'resize', resize);
  listen(window, 'hashchange', () => {
    const i = chapterForHash(location.hash);
    if (i >= 0) {
      goTo(i, false, true);
    }
  });
  listen(document, 'visibilitychange', resume);
  try {
    S3 = initScene();
  } catch (err) {
    S3 = null;
    console.warn('Trade product scene is unavailable', err);
  }
  body.classList.add('trade-ready');
  loader.hidden = false;
  loader.classList.remove('is-done');
  fill.style.clipPath = 'inset(0 100% 0 0)';
  resize();
  if (restoreY !== null) {
    window.scrollTo({ top: restoreY, behavior: 'instant' });
  } else if (alignHash) {
    const i = chapterForHash(location.hash);
    if (i >= 0) {
      window.scrollTo({ top: STARTS[i] * innerHeight, behavior: 'instant' });
    }
  }
  lastY = window.scrollY;
  apply(activeIndex());
  runFill();
  resume();
  loaderTimer = setTimeout(finishLoader, Math.max(0, 850 - (performance.now() - t0)));
  return dispose;
}
