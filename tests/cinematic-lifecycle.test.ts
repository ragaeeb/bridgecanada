import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { initCinematic } from '../src/scripts/cinematic.ts';

const standardMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
});

function matchesSelector(node: any, sel: string): boolean {
  if (sel.startsWith('#')) {
    return node.attributes?.id === sel.slice(1);
  }
  if (sel.startsWith('.')) {
    return node.classList.contains(sel.slice(1));
  }
  if (sel.startsWith('[') && sel.endsWith(']')) {
    const inner = sel.slice(1, -1);
    if (inner.includes('=')) {
      const [k, v] = inner.split('=');
      const val = v?.replace(/^["']|["']$/g, '');
      return node.attributes?.[k!] === val;
    }
    return node.hasAttribute(inner);
  }
  return sel === node.tagName?.toLowerCase();
}

function createNode(tag: string, attrs: Record<string, string> = {}) {
  const nodeChildren: any[] = [];
  const nodeClassList = new Set<string>();
  const nodeStyle = new Map<string, string>();
  const nodeAttrs = { ...attrs };
  const nodeListeners: Record<string, ((...args: any[]) => void)[]> = {};
  const capturedPointers = new Set<number>();

  const node: any = {
    tagName: tag.toUpperCase(),
    attributes: nodeAttrs,
    dataset: {} as Record<string, string>,
    parentNode: null,
    classList: {
      add: (c: string) => nodeClassList.add(c),
      remove: (c: string) => nodeClassList.delete(c),
      contains: (c: string) => nodeClassList.has(c),
      toggle: (c: string, force?: boolean) => {
        if (force !== undefined) {
          if (force) {
            nodeClassList.add(c);
          } else {
            nodeClassList.delete(c);
          }
        } else {
          if (nodeClassList.has(c)) {
            nodeClassList.delete(c);
          } else {
            nodeClassList.add(c);
          }
        }
      },
    },
    style: {
      setProperty: (k: string, v: string) => nodeStyle.set(k, v),
      removeProperty: (k: string) => nodeStyle.delete(k),
      getPropertyValue: (k: string) => nodeStyle.get(k) || '',
      pointerEvents: '',
      transform: '',
      opacity: '',
      display: '',
    },
    setAttribute: (k: string, v: string) => {
      nodeAttrs[k] = v;
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        node.dataset[camel] = v;
      }
    },
    getAttribute: (k: string) => nodeAttrs[k] ?? null,
    removeAttribute: (k: string) => {
      delete nodeAttrs[k];
    },
    hasAttribute: (k: string) => k in nodeAttrs,
    appendChild: (c: any) => {
      c.parentNode = node;
      nodeChildren.push(c);
      return c;
    },
    removeChild: (c: any) => {
      const idx = nodeChildren.indexOf(c);
      if (idx !== -1) {
        nodeChildren.splice(idx, 1);
        c.parentNode = null;
      }
      return c;
    },
    remove: () => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    },
    querySelectorAll: (sel: string) => {
      const matches: any[] = [];
      const traverse = (n: any) => {
        if (matchesSelector(n, sel)) {
          matches.push(n);
        }
        for (const ch of n.children || []) {
          traverse(ch);
        }
      };
      for (const ch of nodeChildren) {
        traverse(ch);
      }
      return matches;
    },
    querySelector: (sel: string) => {
      if (sel === ':scope > .card-glare') {
        return nodeChildren.find((c) => c.classList.contains('card-glare')) || null;
      }
      const matches: any[] = [];
      const traverse = (n: any) => {
        if (matchesSelector(n, sel)) {
          matches.push(n);
        }
        for (const ch of n.children || []) {
          traverse(ch);
        }
      };
      for (const ch of nodeChildren) {
        traverse(ch);
      }
      return matches[0] || null;
    },
    addEventListener: (event: string, fn: any) => {
      nodeListeners[event] = nodeListeners[event] || [];
      nodeListeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: any) => {
      if (nodeListeners[event]) {
        nodeListeners[event] = nodeListeners[event].filter((f) => f !== fn);
      }
    },
    dispatch: (event: string, init: Record<string, any> = {}) => {
      const mockEvent = {
        ...init,
        currentTarget: node,
        target: init.target ?? node,
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.propagationStopped = true;
        },
      };
      const handlers = nodeListeners[event] || [];
      for (const h of handlers) {
        h(mockEvent);
      }
      return mockEvent;
    },
    click: () => node.dispatch('click'),
    setPointerCapture: (pointerId: number) => capturedPointers.add(pointerId),
    hasPointerCapture: (pointerId: number) => capturedPointers.has(pointerId),
    releasePointerCapture: (pointerId: number) => capturedPointers.delete(pointerId),
    scrollIntoView: (options?: any) => {
      node.lastScrollIntoViewOptions = options;
      node.scrollIntoViewCalls = (node.scrollIntoViewCalls || 0) + 1;
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    scrollWidth: 1000,
    clientWidth: 800,
    scrollLeft: 0,
    clientHeight: 600,
    offsetHeight: 2400,
    offsetLeft: 0,
    scrollTo: () => {},
    focus: () => {},
    children: nodeChildren,
  };

  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
    if (k === 'class') {
      v.split(/\s+/).forEach((c) => nodeClassList.add(c));
    }
  }

  return node;
}

function createMockCinematicDOM() {
  const root = createNode('main');
  const section = createNode('section', { 'data-cinematic': '', id: 'experience' });
  const stage = createNode('div', { class: 'cinematic-stage' });
  const catalog = createNode('section', { class: 'catalog', id: 'itinerary' });
  const rail = createNode('div', { 'data-rail': '' });
  const prevBtn = createNode('button', { 'data-rail-prev': '' });
  const nextBtn = createNode('button', { 'data-rail-next': '' });

  const card1 = createNode('li', { class: 'rail-card', 'data-tilt': '' });
  const card2 = createNode('li', { class: 'rail-card', 'data-tilt': '' });
  rail.appendChild(card1);
  rail.appendChild(card2);

  const panelVisit = createNode('article', { class: 'panel panel--visit narrative', id: 'visit' });
  const panelTrade = createNode('article', { class: 'panel panel--trade narrative', id: 'trade' });

  // Waypoint HUD Scrubber
  const hudAside = createNode('aside', { class: 'waypoint-hud' });
  const hudTrack = createNode('div', { class: 'hud-track' });
  const hudThumb = createNode('div', { 'data-hud-thumb': '' });
  hudTrack.appendChild(hudThumb);

  const hudNav = createNode('nav', { class: 'hud-nav' });
  const hudDot1 = createNode('button', { class: 'hud-dot', 'data-jump': '0', 'data-target': '#experience' });
  const hudDot2 = createNode('button', { class: 'hud-dot', 'data-jump': '0.27', 'data-target': '#visit' });
  const hudDot3 = createNode('button', { class: 'hud-dot', 'data-jump': '0.58', 'data-target': '#trade' });
  const hudDot4 = createNode('button', { class: 'hud-dot', 'data-jump': '0.88', 'data-target': '#itinerary' });
  hudNav.appendChild(hudDot1);
  hudNav.appendChild(hudDot2);
  hudNav.appendChild(hudDot3);
  hudNav.appendChild(hudDot4);

  hudAside.appendChild(hudTrack);
  hudAside.appendChild(hudNav);

  // Top Header Navigation
  const header = createNode('header', { class: 'site-header' });
  const brandBtn = createNode('button', { class: 'brand', 'data-jump': '0', 'data-target': '#experience' });
  const headerNav = createNode('nav');
  const navBtnVisit = createNode('button', { 'data-jump': '0.27', 'data-target': '#visit' });
  const navBtnTrade = createNode('button', { 'data-jump': '0.58', 'data-target': '#trade' });
  const navBtnItinerary = createNode('button', { 'data-jump': '0.88', 'data-target': '#itinerary' });
  headerNav.appendChild(navBtnVisit);
  headerNav.appendChild(navBtnTrade);
  headerNav.appendChild(navBtnItinerary);
  header.appendChild(brandBtn);
  header.appendChild(headerNav);

  // Hero CTA
  const heroCta = createNode('button', { class: 'primary-pill-btn', 'data-jump': '0.27', 'data-target': '#visit' });

  stage.appendChild(hudAside);
  stage.appendChild(header);
  stage.appendChild(heroCta);
  stage.appendChild(panelVisit);
  stage.appendChild(panelTrade);
  stage.appendChild(catalog);
  catalog.appendChild(rail);
  catalog.appendChild(prevBtn);
  catalog.appendChild(nextBtn);

  section.appendChild(stage);
  root.appendChild(section);

  return {
    root,
    section,
    stage,
    catalog,
    rail,
    prevBtn,
    nextBtn,
    panelVisit,
    panelTrade,
    hudDot1,
    hudDot2,
    hudDot3,
    hudDot4,
    brandBtn,
    navBtnVisit,
    navBtnTrade,
    navBtnItinerary,
    heroCta,
  };
}

describe('cinematic lifecycle and controller', () => {
  const origWindow = globalThis.window;
  const origDoc = globalThis.document;

  beforeAll(() => {
    (globalThis as any).window = {
      scrollY: 0,
      innerWidth: 1024,
      innerHeight: 768,
      scrollTo: () => {},
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      matchMedia: standardMatchMedia,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    (globalThis as any).document = {
      createElement: (tag: string) => createNode(tag),
      documentElement: {
        classList: { add: () => {}, remove: () => {} },
        clientWidth: 1024,
        style: {},
      },
      body: { style: {} },
      activeElement: null,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    (globalThis as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterAll(() => {
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDoc;
  });

  afterEach(() => {
    (globalThis as any).window.matchMedia = standardMatchMedia;
  });

  test('initializes controller and exports structured beats', () => {
    const { root } = createMockCinematicDOM();
    const ctrl = initCinematic(root as any);

    expect(ctrl).not.toBeNull();
    expect(ctrl?.beats).toBeDefined();
    expect(ctrl?.beats.introExit).toEqual([0.03, 0.18]);
    expect(ctrl?.beats.folioOpen).toEqual([0.15, 0.25]);

    ctrl?.destroy();
  });

  test('setProgress updates without error and destroy cleanly resets', () => {
    const { root } = createMockCinematicDOM();
    const ctrl = initCinematic(root as any);

    expect(() => {
      ctrl?.setProgress(0.5);
      ctrl?.setProgress(1.0);
    }).not.toThrow();

    expect(() => {
      ctrl?.destroy();
      ctrl?.destroy(); // idempotent
    }).not.toThrow();
  });

  test('standard-motion jump controls trigger window.scrollTo with smooth behavior and calculated progress', async () => {
    const { root, hudDot2, hudDot3, hudDot4, brandBtn, navBtnVisit } = createMockCinematicDOM();
    const scrollToCalls: any[] = [];

    (globalThis as any).window.scrollTo = (opts: any) => {
      scrollToCalls.push(opts);
    };

    const ctrl = initCinematic(root as any);
    expect(ctrl).not.toBeNull();
    await Bun.sleep(0);

    // Click brand (jump 0)
    brandBtn.click();
    expect(scrollToCalls.length).toBe(1);
    expect(scrollToCalls[0].behavior).toBe('smooth');
    expect(scrollToCalls[0].top).toBe(0);

    // Click Protocol HUD dot (jump 0.27)
    hudDot2.click();
    expect(scrollToCalls.length).toBe(2);
    expect(scrollToCalls[1].behavior).toBe('smooth');
    expect(scrollToCalls[1].top).toBeCloseTo((2400 - 768) * 0.27);

    // Click Header Nav Protocol button (jump 0.27)
    navBtnVisit.click();
    expect(scrollToCalls.length).toBe(3);
    expect(scrollToCalls[2].top).toBe(scrollToCalls[1].top);

    // Click Trade HUD dot (jump 0.58)
    hudDot3.click();
    expect(scrollToCalls.length).toBe(4);
    expect(scrollToCalls[3].behavior).toBe('smooth');
    expect(scrollToCalls[3].top).toBeGreaterThan(scrollToCalls[2].top);

    // Click Itinerary HUD dot (jump 0.88)
    hudDot4.click();
    expect(scrollToCalls.length).toBe(5);
    expect(scrollToCalls[4].behavior).toBe('smooth');
    expect(scrollToCalls[4].top).toBeGreaterThan(scrollToCalls[3].top);

    ctrl?.destroy();
  });

  test('timer-backed animation frames receive a finite timestamp', async () => {
    const { root, stage } = createMockCinematicDOM();
    const ctrl = initCinematic(root as any);

    await Bun.sleep(25);

    const introOpacity = stage.style.getPropertyValue('--intro-opacity');
    expect(introOpacity).not.toBe('');
    expect(introOpacity).not.toContain('NaN');

    ctrl?.destroy();
  });

  test('completed rail drags suppress the following click after pointer capture is lost', () => {
    const { root, rail } = createMockCinematicDOM();
    const ctrl = initCinematic(root as any);

    rail.dispatch('pointerdown', { pointerType: 'mouse', button: 0, pointerId: 1, clientX: 100 });
    rail.dispatch('pointermove', { pointerId: 1, clientX: 80 });
    rail.dispatch('pointerup', { pointerId: 1 });
    rail.dispatch('lostpointercapture', { pointerId: 1 });

    expect(rail.click().defaultPrevented).toBe(true);
    ctrl?.destroy();
  });

  for (const interruption of ['pointercancel', 'lostpointercapture'] as const) {
    test(`${interruption} clears drag click suppression`, () => {
      const { root, rail } = createMockCinematicDOM();
      const ctrl = initCinematic(root as any);

      rail.dispatch('pointerdown', { pointerType: 'mouse', button: 0, pointerId: 1, clientX: 100 });
      rail.dispatch('pointermove', { pointerId: 1, clientX: 80 });
      rail.dispatch(interruption, { pointerId: 1 });

      expect(rail.click().defaultPrevented).toBe(false);
      ctrl?.destroy();
    });
  }

  test('reduced-motion navigation resolves each HUD dot to its corresponding section target', () => {
    const { root, section, panelVisit, panelTrade, catalog, hudDot1, hudDot2, hudDot3, hudDot4, navBtnTrade } =
      createMockCinematicDOM();

    // Enable prefers-reduced-motion
    (globalThis as any).window.matchMedia = (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    const ctrl = initCinematic(root as any);
    expect(ctrl).not.toBeNull();

    // Dot 1 -> #experience
    hudDot1.click();
    expect(section.scrollIntoViewCalls).toBe(1);
    expect(section.lastScrollIntoViewOptions).toEqual({ behavior: 'auto' });

    // Dot 2 -> #visit
    hudDot2.click();
    expect(panelVisit.scrollIntoViewCalls).toBe(1);
    expect(panelVisit.lastScrollIntoViewOptions).toEqual({ behavior: 'auto' });

    // Dot 3 -> #trade
    hudDot3.click();
    expect(panelTrade.scrollIntoViewCalls).toBe(1);
    expect(panelTrade.lastScrollIntoViewOptions).toEqual({ behavior: 'auto' });

    // Dot 4 -> #itinerary
    hudDot4.click();
    expect(catalog.scrollIntoViewCalls).toBe(1);
    expect(catalog.lastScrollIntoViewOptions).toEqual({ behavior: 'auto' });

    // Header Nav Trade -> #trade
    navBtnTrade.click();
    expect(panelTrade.scrollIntoViewCalls).toBe(2);

    // Verify dots did NOT all default to section (#experience)
    expect(section.scrollIntoViewCalls).toBe(1);

    ctrl?.destroy();
  });

  test('reduced-motion navigation resolves controls without data-target via progress fallback', () => {
    const { root, stage, panelVisit, panelTrade, catalog } = createMockCinematicDOM();

    // Add a dot without data-target
    const untargetedDotVisit = createNode('button', { 'data-jump': '0.27' });
    const untargetedDotTrade = createNode('button', { 'data-jump': '0.58' });
    const untargetedDotItinerary = createNode('button', { 'data-jump': '0.88' });

    stage.appendChild(untargetedDotVisit);
    stage.appendChild(untargetedDotTrade);
    stage.appendChild(untargetedDotItinerary);

    (globalThis as any).window.matchMedia = (query: string) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    const ctrl = initCinematic(root as any);

    untargetedDotVisit.click();
    expect(panelVisit.scrollIntoViewCalls).toBe(1);

    untargetedDotTrade.click();
    expect(panelTrade.scrollIntoViewCalls).toBe(1);

    untargetedDotItinerary.click();
    expect(catalog.scrollIntoViewCalls).toBe(1);

    ctrl?.destroy();
  });
});
