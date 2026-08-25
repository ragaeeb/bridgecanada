import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { initCardTilts } from '../src/scripts/tilt.ts';

// Lightweight DOM mock for Bun test environment
function createMockElement(tag: string, attributes: Record<string, string> = {}) {
  const children: any[] = [];
  const classListSet = new Set<string>();
  const styleMap = new Map<string, string>();
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  const el = {
    tagName: tag.toUpperCase(),
    attributes: { ...attributes },
    dataset: {} as Record<string, string>,
    parentNode: null as any,
    classList: {
      add: (c: string) => classListSet.add(c),
      remove: (c: string) => classListSet.delete(c),
      contains: (c: string) => classListSet.has(c),
    },
    style: {
      willChange: '',
      setProperty: (k: string, v: string) => styleMap.set(k, v),
      removeProperty: (k: string) => styleMap.delete(k),
      getPropertyValue: (k: string) => styleMap.get(k) || '',
    },
    getAttribute: (k: string) => el.attributes[k] ?? null,
    setAttribute: (k: string, v: string) => {
      el.attributes[k] = v;
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        el.dataset[camel] = v;
      }
    },
    hasAttribute: (k: string) => k in el.attributes,
    appendChild: (child: any) => {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    removeChild: (child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    },
    remove: () => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    },
    querySelector: (selector: string) => {
      if (selector.includes('.card-glare')) {
        return children.find((c) => c.className === 'card-glare') || null;
      }
      return null;
    },
    querySelectorAll: (selector: string) => {
      if (selector.includes('[data-tilt]')) {
        return children.filter((c) => c.hasAttribute('data-tilt'));
      }
      if (selector.includes('.card-glare')) {
        return children.filter((c) => c.className === 'card-glare');
      }
      return [];
    },
    addEventListener: (event: string, fn: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((f) => f !== fn);
      }
    },
    emit: (event: string, value: any = {}) => {
      listeners[event]?.forEach((fn) => fn(value));
    },
    listenerCount: (event: string) => listeners[event]?.length ?? 0,
    getBoundingClientRect: () => ({
      left: 10,
      top: 10,
      width: 200,
      height: 150,
    }),
    className: '',
  };

  for (const [k, v] of Object.entries(attributes)) {
    el.setAttribute(k, v);
  }

  return el;
}

describe('tilt controller lifecycle & idempotence', () => {
  // Set up global mocks for window.matchMedia & document.createElement
  const origWindow = globalThis.window;
  const origDoc = globalThis.document;
  const origRequestAnimationFrame = globalThis.requestAnimationFrame;
  const origCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const pendingFrames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 1;

  const runFrame = (timestamp: number) => {
    const callbacks = [...pendingFrames.values()];
    pendingFrames.clear();
    callbacks.forEach((callback) => callback(timestamp));
  };

  beforeAll(() => {
    (globalThis as any).window = {
      matchMedia: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    };
    (globalThis as any).document = {
      createElement: (tag: string) => createMockElement(tag),
      body: createMockElement('body'),
    };
    globalThis.requestAnimationFrame = (callback) => {
      const id = nextFrameId++;
      pendingFrames.set(id, callback);
      return id;
    };
    globalThis.cancelAnimationFrame = (id) => {
      pendingFrames.delete(id);
    };
  });

  beforeEach(() => {
    pendingFrames.clear();
  });

  afterAll(() => {
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDoc;
    globalThis.requestAnimationFrame = origRequestAnimationFrame;
    globalThis.cancelAnimationFrame = origCancelAnimationFrame;
  });

  test('initializes glare element and cleans up completely on destroy', () => {
    const container = createMockElement('div');
    const card = createMockElement('div', { 'data-tilt': '' });
    container.appendChild(card);

    const controller = initCardTilts(container as any);

    const glare = card.querySelector('.card-glare');
    expect(glare).not.toBeNull();

    controller.destroy();

    expect(card.querySelector('.card-glare')).toBeNull();
    expect(card.classList.contains('is-tilting')).toBe(false);
  });

  test('re-initialization replaces prior listeners and glare without cross-controller teardown', () => {
    const container = createMockElement('div');
    const card = createMockElement('div', { 'data-tilt': '' });
    container.appendChild(card);

    const ctrl1 = initCardTilts(container as any);
    const ctrl2 = initCardTilts(container as any);

    const glares = card.querySelectorAll('.card-glare');
    expect(glares.length).toBe(1);
    expect(card.listenerCount('pointerenter')).toBe(1);
    expect(card.listenerCount('pointermove')).toBe(1);
    expect(card.listenerCount('pointerleave')).toBe(1);

    card.classList.add('is-tilting');
    card.style.setProperty('--tilt-rx', '2deg');
    ctrl1.destroy();
    expect(card.listenerCount('pointerenter')).toBe(1);
    expect(card.querySelectorAll('.card-glare').length).toBe(1);
    expect(card.classList.contains('is-tilting')).toBe(true);
    expect(card.style.getPropertyValue('--tilt-rx')).toBe('2deg');

    ctrl2.destroy();

    expect(card.querySelectorAll('.card-glare').length).toBe(0);
    expect(card.listenerCount('pointerenter')).toBe(0);
  });

  test('interpolates tilt consistently across animation frame rates', () => {
    const sampleTiltAfterQuarterSecond = (framesPerSecond: number) => {
      const container = createMockElement('div');
      const card = createMockElement('div', { 'data-tilt': '' });
      container.appendChild(card);
      const controller = initCardTilts(container as any);

      card.emit('pointermove', { clientX: 210, clientY: 85 });
      const frameCount = framesPerSecond / 4;
      for (let frame = 0; frame <= frameCount; frame++) {
        runFrame(1_000 + (frame * 1_000) / framesPerSecond);
      }

      const tilt = Number.parseFloat(card.style.getPropertyValue('--tilt-ry'));
      controller.destroy();
      return tilt;
    };

    const tiltAt60Fps = sampleTiltAfterQuarterSecond(60);
    const tiltAt120Fps = sampleTiltAfterQuarterSecond(120);

    expect(tiltAt120Fps).toBeCloseTo(tiltAt60Fps, 1);
  });

  test('resets frame timing after interpolation settles', () => {
    const container = createMockElement('div');
    const card = createMockElement('div', { 'data-tilt': '' });
    container.appendChild(card);
    const controller = initCardTilts(container as any);

    card.emit('pointermove', { clientX: 210, clientY: 85 });
    let timestamp = 1_000;
    for (let frame = 0; pendingFrames.size && frame < 200; frame++) {
      runFrame(timestamp);
      timestamp += 1_000 / 60;
    }
    expect(pendingFrames.size).toBe(0);

    const settledTilt = Number.parseFloat(card.style.getPropertyValue('--tilt-ry'));
    card.emit('pointerleave');
    runFrame(100_000);
    const resumedTilt = Number.parseFloat(card.style.getPropertyValue('--tilt-ry'));

    expect(resumedTilt).toBeCloseTo(settledTilt * 0.88, 1);
    controller.destroy();
  });
});
