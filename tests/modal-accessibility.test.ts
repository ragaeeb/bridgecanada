import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { initCinematic } from '../src/scripts/cinematic.ts';

// Mock MockHTMLElement class for instanceof checks in node/bun
class MockHTMLElement {
  [key: string]: any;
  tagName = '';
  attributes: Record<string, string> = {};
  dataset: Record<string, string> = {};
  parentNode: any = null;
  parentElement: any = null;
  offsetParent: any = {};
  style: any = {};
  classList: any = {};
  children: any[] = [];
  scrollWidth = 1000;
  clientWidth = 800;
  scrollLeft = 0;
  clientHeight = 600;
  offsetLeft = 0;
}

function matchesSelector(node: any, sel: string): boolean {
  if (sel.startsWith('.')) {
    return node.classList.contains(sel.slice(1));
  }
  if (sel.startsWith('[') && sel.endsWith(']')) {
    return node.hasAttribute(sel.slice(1, -1));
  }
  if (sel.includes('.')) {
    const [tag, cls] = sel.split('.');
    return node.tagName?.toLowerCase() === tag && node.classList.contains(cls);
  }
  if (sel.includes('[')) {
    const [tag = '', rest = ''] = sel.split('[');
    const attr = rest.replace(']', '');
    return (!tag || node.tagName?.toLowerCase() === tag) && node.hasAttribute(attr);
  }
  return sel === node.tagName?.toLowerCase();
}

function createDOMTree() {
  const createNode = (tag: string, attrs: Record<string, string> = {}) => {
    const node = new MockHTMLElement();
    const nodeChildren: any[] = [];
    const nodeClassList = new Set<string>();
    const nodeStyle = new Map<string, string>();
    const nodeAttrs = { ...attrs };
    const nodeListeners: Record<string, ((...args: any[]) => void)[]> = {};

    node.tagName = tag.toUpperCase();
    node.attributes = nodeAttrs;
    node.children = nodeChildren;
    node.classList = {
      add: (c: string) => nodeClassList.add(c),
      remove: (c: string) => nodeClassList.delete(c),
      contains: (c: string) => nodeClassList.has(c),
    };
    node.style = {
      setProperty: (k: string, v: string) => nodeStyle.set(k, v),
      removeProperty: (k: string) => nodeStyle.delete(k),
      getPropertyValue: (k: string) => nodeStyle.get(k) || '',
      pointerEvents: '',
      paddingRight: '',
      overflow: '',
      display: '',
    };
    node.setAttribute = (k: string, v: string) => {
      nodeAttrs[k] = v;
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        node.dataset[camel] = v;
      }
    };
    node.getAttribute = (k: string) => nodeAttrs[k] ?? null;
    node.removeAttribute = (k: string) => {
      delete nodeAttrs[k];
    };
    node.hasAttribute = (k: string) => k in nodeAttrs;
    node.appendChild = (c: any) => {
      c.parentNode = node;
      c.parentElement = node;
      nodeChildren.push(c);
      return c;
    };
    node.querySelectorAll = (sel: string) => {
      const matches: any[] = [];
      const parts = sel.split(',').map((s) => s.trim());
      const traverse = (n: any) => {
        if (parts.some((part) => matchesSelector(n, part))) {
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
    };
    node.querySelector = (sel: string) => {
      const parts = sel.split(',').map((s) => s.trim());
      const matches: any[] = [];
      const traverse = (n: any) => {
        if (parts.some((part) => matchesSelector(n, part))) {
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
    };
    node.contains = (candidate: any) => {
      if (candidate === node) {
        return true;
      }
      return nodeChildren.some((child) => child.contains?.(candidate));
    };
    node.addEventListener = (event: string, fn: any) => {
      nodeListeners[event] = nodeListeners[event] || [];
      nodeListeners[event].push(fn);
    };
    node.removeEventListener = (event: string, fn: any) => {
      if (nodeListeners[event]) {
        nodeListeners[event] = nodeListeners[event].filter((f) => f !== fn);
      }
    };
    node.dispatchEvent = (event: { type: string; [key: string]: any }) => {
      const evt = {
        preventDefault: () => {},
        stopPropagation: () => {},
        ...event,
      };
      const handlers = nodeListeners[event.type] || [];
      for (const h of handlers) {
        h(evt);
      }
    };
    node.focus = () => {
      (globalThis as any).document.activeElement = node;
    };
    node.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
    node.scrollTo = () => {};

    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v);
      if (k === 'class') {
        v.split(/\s+/).forEach((c) => nodeClassList.add(c));
      }
    }

    return node;
  };

  // Mock document body & structure
  const body = createNode('body');
  const skipLink = createNode('a', { class: 'skip-link', href: '#experience' });
  // Set pre-existing inert/aria-hidden on an element to test state-preserving teardown
  const existingInertWidget = createNode('div', { class: 'existing-inert', inert: '', 'aria-hidden': 'true' });
  const main = createNode('main', { id: 'experience' });
  const section = createNode('section', { 'data-cinematic': '' });
  const stage = createNode('div', { class: 'cinematic-stage' });
  const catalog = createNode('section', { class: 'catalog', id: 'itinerary' });
  const openBtn = createNode('button', { class: 'customizer-trigger-btn', 'data-open-customizer': '' });

  stage.appendChild(openBtn);
  stage.appendChild(catalog);
  section.appendChild(stage);
  main.appendChild(section);

  const modal = createNode('div', {
    class: 'customizer-modal',
    'data-customizer-modal': '',
    'aria-hidden': 'true',
    role: 'dialog',
  });
  const backdrop = createNode('div', { class: 'customizer-backdrop', 'data-close-customizer': '' });
  const panel = createNode('div', { class: 'customizer-panel' });
  const closeBtn = createNode('button', { class: 'customizer-close', 'data-close-customizer': '' });
  const form = createNode('form', { 'data-customizer-form': '' });
  const input1 = createNode('input', { type: 'radio', name: 'mission', value: 'Gov', checked: 'true' });
  const submitBtn = createNode('button', { type: 'submit', class: 'submit-inquiry-btn' });

  form.appendChild(input1);
  form.appendChild(submitBtn);
  panel.appendChild(closeBtn);
  panel.appendChild(form);
  modal.appendChild(backdrop);
  modal.appendChild(panel);

  body.appendChild(skipLink);
  body.appendChild(existingInertWidget);
  body.appendChild(main);
  body.appendChild(modal);

  return {
    body,
    main,
    skipLink,
    existingInertWidget,
    openBtn,
    closeBtn,
    backdrop,
    modal,
    form,
    input1,
    submitBtn,
    createNode,
  };
}

describe('VIP Delegation customizer modal accessibility & focus trapping', () => {
  const origWindow = globalThis.window;
  const origDoc = globalThis.document;
  const origHTMLElement = (globalThis as any).HTMLElement;

  beforeAll(() => {
    (globalThis as any).HTMLElement = MockHTMLElement;

    (globalThis as any).window = {
      scrollY: 0,
      innerWidth: 1024,
      innerHeight: 768,
      scrollTo: () => {},
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      requestAnimationFrame: (cb: () => void) => {
        cb();
        return 1;
      },
      cancelAnimationFrame: () => {},
      matchMedia: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
      addEventListener: (event: string, fn: any) => {
        (globalThis as any).windowListeners = (globalThis as any).windowListeners || {};
        (globalThis as any).windowListeners[event] = (globalThis as any).windowListeners[event] || [];
        (globalThis as any).windowListeners[event].push(fn);
      },
      removeEventListener: (event: string, fn: any) => {
        if ((globalThis as any).windowListeners?.[event]) {
          (globalThis as any).windowListeners[event] = (globalThis as any).windowListeners[event].filter(
            (f: any) => f !== fn,
          );
        }
      },
      dispatchEvent: (event: any) => {
        const handlers = (globalThis as any).windowListeners?.[event.type] || [];
        for (const h of handlers) {
          h(event);
        }
      },
    };

    (globalThis as any).document = {
      documentElement: {
        classList: { add: () => {}, remove: () => {} },
        clientWidth: 1024,
        style: { overflow: 'auto' },
      },
      body: { style: { paddingRight: '0px' } },
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
    (globalThis as any).HTMLElement = origHTMLElement;
  });

  test('opening modal sets initial focus to close button across initial frame and timers, isolates background, and locks scroll', async () => {
    const { body, main, skipLink, openBtn, closeBtn, modal } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);
    expect(controller).not.toBeNull();

    // Trigger open from opener button
    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });

    expect(modal.classList.contains('is-open')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');

    // Initial focus must be closeBtn (not the backdrop or body)
    expect((globalThis as any).document.activeElement).toBe(closeBtn);

    // Wait for subsequent timers (20ms, 100ms) to ensure focus remains firmly on closeBtn
    await new Promise((r) => setTimeout(r, 40));
    expect((globalThis as any).document.activeElement).toBe(closeBtn);

    // Background elements must be isolated
    expect(main.hasAttribute('inert')).toBe(true);
    expect(main.getAttribute('aria-hidden')).toBe('true');
    expect(skipLink.hasAttribute('inert')).toBe(true);
    expect(skipLink.getAttribute('aria-hidden')).toBe('true');

    // Document scroll must be locked
    expect((globalThis as any).document.documentElement.style.overflow).toBe('hidden');

    controller?.destroy();
  });

  test('focus containment traps Tab and Shift+Tab within modal focusables', () => {
    const { body, openBtn, closeBtn, submitBtn, modal } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);

    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });
    expect(modal.classList.contains('is-open')).toBe(true);

    // Initial focus on first element (closeBtn)
    expect((globalThis as any).document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps to last element (submitBtn)
    (globalThis as any).window.dispatchEvent({
      type: 'keydown',
      key: 'Tab',
      shiftKey: true,
      preventDefault: () => {},
    });
    expect((globalThis as any).document.activeElement).toBe(submitBtn);

    // Tab from last element wraps to first element (closeBtn)
    (globalThis as any).window.dispatchEvent({
      type: 'keydown',
      key: 'Tab',
      shiftKey: false,
      preventDefault: () => {},
    });
    expect((globalThis as any).document.activeElement).toBe(closeBtn);

    controller?.destroy();
  });

  test('delayed focus recovery never steals focus after the user moves within the modal', async () => {
    const { body, openBtn, submitBtn } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);
    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });
    submitBtn.focus();

    await new Promise((resolve) => setTimeout(resolve, 400));
    const activeElement = (globalThis as any).document.activeElement;
    controller?.destroy();
    expect(activeElement).toBe(submitBtn);
  });

  test('Escape key closes modal, restores background interactivity state-preservingly, and restores focus to opener', () => {
    const { body, main, existingInertWidget, openBtn, modal } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);

    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });
    expect(modal.classList.contains('is-open')).toBe(true);

    // Press Escape
    (globalThis as any).window.dispatchEvent({
      type: 'keydown',
      key: 'Escape',
      preventDefault: () => {},
    });

    expect(modal.classList.contains('is-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    expect(main.hasAttribute('inert')).toBe(false);
    // State preservation check: existingInertWidget must retain inert and aria-hidden
    expect(existingInertWidget.hasAttribute('inert')).toBe(true);
    expect(existingInertWidget.getAttribute('aria-hidden')).toBe('true');

    expect((globalThis as any).document.activeElement).toBe(openBtn);

    controller?.destroy();
  });

  test('closing modal restores background interactivity and prior scroll/overflow styles', () => {
    const { body, main, existingInertWidget, skipLink, openBtn, closeBtn, modal } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);

    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });

    expect(modal.classList.contains('is-open')).toBe(true);

    // Close via close button click
    closeBtn.dispatchEvent({ type: 'click', currentTarget: closeBtn });

    expect(modal.classList.contains('is-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');

    // Background interactivity restored
    expect(main.hasAttribute('inert')).toBe(false);
    expect(main.hasAttribute('aria-hidden')).toBe(false);
    expect(skipLink.hasAttribute('inert')).toBe(false);
    // Prior state preserved on existing inert element
    expect(existingInertWidget.hasAttribute('inert')).toBe(true);

    // Prior scroll/overflow restored
    expect((globalThis as any).document.documentElement.style.overflow).toBe('auto');

    // Focus restored to trigger
    expect((globalThis as any).document.activeElement).toBe(openBtn);

    controller?.destroy();
  });

  test('destroy() cleans up open modal state, removes background inert, and restores prior overflow styles', () => {
    const { body, main, skipLink, openBtn, modal } = createDOMTree();
    (globalThis as any).document.body = body;

    const controller = initCinematic(body as any);

    openBtn.focus();
    openBtn.dispatchEvent({ type: 'click', currentTarget: openBtn });
    expect(modal.classList.contains('is-open')).toBe(true);

    // Call destroy while modal is open
    controller?.destroy();

    expect(modal.classList.contains('is-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    expect(main.hasAttribute('inert')).toBe(false);
    expect(skipLink.hasAttribute('inert')).toBe(false);
    expect((globalThis as any).document.documentElement.style.overflow).toBe('auto');
  });
});
