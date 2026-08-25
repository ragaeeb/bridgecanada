import { CONTACT_EMAIL } from '../config/contact.ts';
import { initCardTilts, type TiltController } from './tilt.ts';

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
export const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0;
  }
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

export const segmentInOut = (value: number, enter: readonly [number, number], exit: readonly [number, number]) =>
  smoothstep(enter[0], enter[1], value) * (1 - smoothstep(exit[0], exit[1], value));

export const computeHudThumbY = (progress: number, trackHeight: number, thumbHeight: number) => {
  const usable = Math.max(0, trackHeight - thumbHeight);
  return clamp(progress) * usable;
};

export const computeRailNavState = (scrollLeft: number, maxScroll: number) => {
  const isAtStart = scrollLeft <= 2;
  const isAtEnd = scrollLeft >= maxScroll - 2;
  return {
    canScrollPrev: !isAtStart,
    canScrollNext: !isAtEnd,
    prevDisabled: isAtStart,
    nextDisabled: isAtEnd,
  };
};

export const computeRailActiveIndex = (
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  cardCenters: readonly number[],
) => {
  if (cardCenters.length === 0 || scrollLeft <= 2) {
    return 0;
  }

  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  if (scrollLeft >= maxScroll - 2) {
    return cardCenters.length - 1;
  }

  const viewportCenter = scrollLeft + clientWidth / 2;
  return cardCenters.reduce(
    (closest, center, index) => {
      const distance = Math.abs(center - viewportCenter);
      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index;
};

export const dedupeImagesBySource = <T extends { currentSrc?: string; src: string }>(images: Iterable<T>): T[] => {
  const bySource = new Map<string, T>();
  for (const image of images) {
    const source = image.currentSrc || image.src;
    if (!bySource.has(source)) {
      bySource.set(source, image);
    }
  }
  return [...bySource.values()];
};

// Start the expensive scene shortly before it enters the viewport, while still
// suspending animation when the user is meaningfully outside the story section.
const SCENE_VISIBILITY_ROOT_MARGIN = '30% 0px';

export const resolveJumpTarget = (progress: number, explicitTarget?: string | null): string => {
  if (explicitTarget && explicitTarget.trim().length > 0) {
    return explicitTarget;
  }
  if (progress >= 0.75) {
    return '#itinerary';
  }
  if (progress >= 0.48) {
    return '#trade';
  }
  if (progress >= 0.2) {
    return '#visit';
  }
  return '#experience';
};

export const formatDelegationInquiry = (data: {
  mission: string;
  cities: string[];
  services: string[];
  size: string;
}) => {
  const subject = `VIP Delegation Inquiry: ${data.mission}`;
  const citiesStr = data.cities.length > 0 ? data.cities.join(', ') : 'All Major Hubs';
  const servicesStr = data.services.length > 0 ? `\n - ${data.services.join('\n - ')}` : ' Comprehensive Protocol';

  const body =
    `Dear Bridge Canada Team,\n\nI would like to inquire about coordinating a Canadian delegation visit with the following parameters:\n\n` +
    `• Mission Focus: ${data.mission}\n` +
    `• Delegation Size: ${data.size}\n` +
    `• Target Canadian Cities: ${citiesStr}\n\n` +
    `Key Services Requested:${servicesStr}\n\n` +
    `Please contact me at your earliest convenience to arrange an introductory briefing.\n\n` +
    `Kind regards,\n[Your Name / Title]\n[Organization / Embassy / Ministry]`;

  return {
    subject,
    body,
    mailtoHref: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
};

export const beats = {
  introExit: [0.03, 0.18] as const,
  folioOpen: [0.15, 0.25] as const,
  visit: { enter: [0.22, 0.27] as const, exit: [0.38, 0.46] as const },
  panorama: [0.46, 0.5] as const,
  trade: { enter: [0.5, 0.58] as const, exit: [0.69, 0.74] as const },
  catalog: [0.75, 0.93] as const,
  controls: [0.91, 0.98] as const,
} as const;

export interface CinematicController {
  destroy(): void;
  setProgress(progress: number): void;
  beats: typeof beats;
}

interface WindowWithBridgeCanada extends Window {
  __bridgeCanada?: {
    setProgress(progress: number): void;
    beats: typeof beats;
  };
}

function toggleElementInert(el: HTMLElement | null, active: boolean, activeClass?: string) {
  if (!el) {
    return;
  }
  if (active) {
    el.removeAttribute('inert');
    el.removeAttribute('aria-hidden');
    if (activeClass) {
      el.classList.add(activeClass);
    }
    el.style.pointerEvents = 'auto';
  } else {
    el.setAttribute('inert', '');
    el.setAttribute('aria-hidden', 'true');
    if (activeClass) {
      el.classList.remove(activeClass);
    }
    el.style.pointerEvents = 'none';
  }
}

function computeTimelineBeats(p: number) {
  const visit = segmentInOut(p, beats.visit.enter, beats.visit.exit);
  const trade = segmentInOut(p, beats.trade.enter, beats.trade.exit);
  return {
    introOut: smoothstep(...beats.introExit, p),
    open: smoothstep(...beats.folioOpen, p),
    visit,
    trade,
    catalogIn: smoothstep(...beats.catalog, p),
    controls: smoothstep(...beats.controls, p),
    focusAmount: Math.max(visit * 0.72, trade),
    push: smoothstep(0.03, 0.46, p) * (1 - smoothstep(0.72, 0.9, p) * 0.28),
    route: segmentInOut(p, [0.42, 0.5] as const, [0.7, 0.75] as const),
  };
}

export function initCinematic(root: Document | HTMLElement = document): CinematicController | null {
  const section = root.querySelector<HTMLElement>('[data-cinematic]');
  const stage = section?.querySelector<HTMLElement>('.cinematic-stage');
  const catalog = section?.querySelector<HTMLElement>('.catalog');
  const rail = section?.querySelector<HTMLElement>('[data-rail]');
  const railStatus = section?.querySelector<HTMLElement>('[data-rail-status]');
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-rail-prev]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-rail-next]');
  const webglContainer = section?.querySelector<HTMLElement>('[data-webgl]');
  const hudTrack = root.querySelector<HTMLElement>('.hud-track');
  const hudThumb = root.querySelector<HTMLElement>('[data-hud-thumb]');
  const hudDots = root.querySelectorAll<HTMLElement>('.hud-dot');
  const cursorGlow = root.querySelector<HTMLElement>('[data-cursor-glow]');
  const panelVisit = root.querySelector<HTMLElement>('.panel--visit');
  const panelTrade = root.querySelector<HTMLElement>('.panel--trade');
  const customizerModal = root.querySelector<HTMLElement>('[data-customizer-modal]');
  const customizerForm = root.querySelector<HTMLFormElement>('[data-customizer-form]');
  const customizerStatus = root.querySelector<HTMLElement>('[data-customizer-status]');

  if (!section || !stage || !catalog) {
    return null;
  }

  // BR-098: Mark JS enabled for progressive enhancement
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('js');
  }

  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointerMedia = window.matchMedia('(pointer: coarse)');

  let threeController: {
    updateScroll(p: number): void;
    updatePointer(x: number, y: number): void;
    setVisibility(v: boolean): void;
    destroy(): void;
    resize(): void;
  } | null = null;

  let tiltController: TiltController | null = null;
  let isDestroyed = false;

  const state = {
    top: 0,
    travel: 1,
    target: 0,
    playhead: 0,
    pointerTargetX: 0,
    pointerTargetY: 0,
    pointerX: 0,
    pointerY: 0,
    active: true,
    frame: 0,
    lastTime: 0,
  };

  // BR-073: Conditionally dynamic-import Three.js only when reduced motion is NOT active
  const setupThreeScene = async () => {
    if (reducedMotionMedia.matches || !webglContainer || isDestroyed) {
      return;
    }
    try {
      const { initThreeScene } = await import('./three-scene.ts');
      if (!isDestroyed && !threeController && !reducedMotionMedia.matches) {
        threeController = initThreeScene(webglContainer);
        // Synchronize delayed initialization with the live cinematic state.
        threeController?.updateScroll(state.playhead);
        threeController?.updatePointer(state.pointerX, state.pointerY);
        threeController?.setVisibility(state.active);
      }
    } catch {
      // Graceful fallback (BR-035)
      threeController = null;
    }
  };

  setupThreeScene();

  // Initialize Card Tilts
  tiltController = initCardTilts(section);

  const setVar = (name: string, value: string | number) => stage.style.setProperty(name, String(value));

  const measure = () => {
    if (isDestroyed || typeof window === 'undefined') {
      return;
    }
    const rect = section.getBoundingClientRect();
    const scrollY = window.scrollY || 0;
    const innerHeight = window.innerHeight || 800;
    state.top = scrollY + rect.top;
    state.travel = Math.max(1, section.offsetHeight - innerHeight);
    state.target = clamp((scrollY - state.top) / state.travel);
    threeController?.resize();
    updateRailControls();
    requestFrame();
  };

  const readScroll = () => {
    if (isDestroyed || typeof window === 'undefined') {
      return;
    }
    const scrollY = window.scrollY || 0;
    state.target = clamp((scrollY - state.top) / state.travel);
    requestFrame();
  };

  // BR-096: HUD thumb traverses full usable track length
  const updateHud = (p: number) => {
    if (hudThumb) {
      const trackH = hudTrack ? hudTrack.clientHeight : 140;
      const thumbH = hudThumb.clientHeight || 28;
      const y = computeHudThumbY(p, trackH, thumbH);
      hudThumb.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }

    const activeIndex = p < 0.22 ? 0 : p < 0.48 ? 1 : p < 0.74 ? 2 : 3;
    hudDots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
    });
  };

  // BR-067: Update rail prev/next button disabled states
  const updateRailControls = () => {
    if (!rail || !prevBtn || !nextBtn) {
      return;
    }
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const navState = computeRailNavState(rail.scrollLeft, maxScroll);

    prevBtn.disabled = navState.prevDisabled;
    prevBtn.setAttribute('aria-disabled', String(navState.prevDisabled));
    nextBtn.disabled = navState.nextDisabled;
    nextBtn.setAttribute('aria-disabled', String(navState.nextDisabled));
  };

  // BR-025 / BR-043 / BR-061: Synchronize panel interactivity, inertness, and focusability
  const updatePanelInteractivity = (visit: number, trade: number, catalogIn: number, instant: boolean) => {
    toggleElementInert(panelVisit, instant || visit > 0.05);
    toggleElementInert(panelTrade, instant || trade > 0.05);
    toggleElementInert(catalog, instant || catalogIn > 0.05, 'is-active');
  };

  const applyParallaxCssVars = (
    p: number,
    focusAmount: number,
    push: number,
    route: number,
    pointerScale: number,
    instant: boolean,
  ) => {
    setVar('--far-x', `${(state.pointerX * -8 * pointerScale).toFixed(2)}px`);
    setVar('--far-y', `${(state.pointerY * -5 * pointerScale + push * -4).toFixed(2)}px`);
    setVar('--far-scale', lerp(1.04, 1.115, push).toFixed(4));
    setVar('--mid-x', `${(state.pointerX * 14 * pointerScale).toFixed(2)}px`);
    setVar('--mid-y', `${(state.pointerY * 9 * pointerScale + push * -10).toFixed(2)}px`);
    setVar('--mid-scale', lerp(1.045, 1.16, push).toFixed(4));
    setVar('--world-blur', `${instant ? 0 : (focusAmount * 4.5).toFixed(2)}px`);
    setVar('--world-brightness', lerp(0.86, 0.64, focusAmount).toFixed(3));
    setVar('--shade-opacity', lerp(0.32, 0.72, Math.max(focusAmount, p * 0.7)).toFixed(3));
    setVar('--route-opacity', route.toFixed(3));
  };

  const applyNarrativeCssVars = (
    p: number,
    introOut: number,
    open: number,
    visit: number,
    trade: number,
    catalogIn: number,
    controls: number,
  ) => {
    setVar('--intro-opacity', (1 - introOut).toFixed(3));
    setVar('--intro-y', `${(introOut * -32).toFixed(2)}px`);
    setVar('--intro-blur', `${(introOut * 5).toFixed(2)}px`);
    setVar('--folio-left-x', `${(open * -112).toFixed(2)}%`);
    setVar('--folio-right-x', `${(open * 112).toFixed(2)}%`);
    setVar('--folio-opacity', (1 - smoothstep(0.34, 0.44, p)).toFixed(3));

    setVar('--panel-a-opacity', visit.toFixed(3));
    setVar(
      '--panel-a-y',
      `${(lerp(32, 0, smoothstep(...beats.visit.enter, p)) + smoothstep(...beats.visit.exit, p) * -22).toFixed(2)}px`,
    );
    setVar('--panel-b-opacity', trade.toFixed(3));
    setVar(
      '--panel-b-y',
      `${(lerp(32, 0, smoothstep(...beats.trade.enter, p)) + smoothstep(...beats.trade.exit, p) * -22).toFixed(2)}px`,
    );
    setVar('--catalog-opacity', catalogIn.toFixed(3));
    setVar('--catalog-y', `${lerp(76, 0, catalogIn).toFixed(2)}px`);
    setVar('--controls-opacity', controls.toFixed(3));
  };

  function updateInterpolatedState(
    s: {
      target: number;
      playhead: number;
      pointerX: number;
      pointerY: number;
      pointerTargetX: number;
      pointerTargetY: number;
    },
    dt: number,
    instant: boolean,
  ) {
    const scrollFactor = instant ? 1 : 1 - Math.exp(-12 * dt);
    const pointerFactor = instant ? 1 : 1 - Math.exp(-10 * dt);

    s.playhead = instant ? s.target : lerp(s.playhead, s.target, scrollFactor);
    s.pointerX = instant ? 0 : lerp(s.pointerX, s.pointerTargetX, pointerFactor);
    s.pointerY = instant ? 0 : lerp(s.pointerY, s.pointerTargetY, pointerFactor);
  }

  function shouldContinueSmoothing(
    s: {
      playhead: number;
      target: number;
      pointerX: number;
      pointerTargetX: number;
      pointerY: number;
      pointerTargetY: number;
    },
    instant: boolean,
  ): boolean {
    if (instant) {
      return false;
    }
    const needsScroll = Math.abs(s.playhead - s.target) > 0.0005;
    const needsPointer =
      Math.abs(s.pointerX - s.pointerTargetX) > 0.002 || Math.abs(s.pointerY - s.pointerTargetY) > 0.002;
    return needsScroll || needsPointer;
  }

  // BR-004 / BR-028 / BR-097: Time-based delta RAF smoothing
  const render = (timestamp: number) => {
    state.frame = 0;
    if (!state.active && state.target > 0 && state.target < 1) {
      return;
    }

    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    const instant = reducedMotionMedia.matches;
    updateInterpolatedState(state, dt, instant);

    const p = state.playhead;
    const b = computeTimelineBeats(p);
    const pointerScale = coarsePointerMedia.matches ? 0 : 1;

    threeController?.updateScroll(p);
    threeController?.updatePointer(state.pointerX, state.pointerY);
    updateHud(p);
    updatePanelInteractivity(b.visit, b.trade, b.catalogIn, instant);

    applyParallaxCssVars(p, b.focusAmount, b.push, b.route, pointerScale, instant);
    applyNarrativeCssVars(p, b.introOut, b.open, b.visit, b.trade, b.catalogIn, b.controls);

    if (shouldContinueSmoothing(state, instant)) {
      requestFrame();
    }
  };

  const safeRAF = (cb: FrameRequestCallback): number => {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(cb);
    }
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame !== 'undefined') {
      return window.requestAnimationFrame(cb);
    }
    return setTimeout(
      () => cb(typeof performance === 'undefined' ? Date.now() : performance.now()),
      16,
    ) as unknown as number;
  };

  const safeCancelRAF = (id: number): void => {
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(id);
    } else if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame !== 'undefined') {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  };

  function requestFrame() {
    if (!state.frame && !isDestroyed) {
      state.frame = safeRAF(render);
    }
  }

  // BR-036 / BR-041: Cursor glow follower scoped and reset properly
  const onPointerMove = (event: PointerEvent) => {
    if (cursorGlow && !coarsePointerMedia.matches) {
      cursorGlow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursorGlow.style.opacity = '1';
    }

    if (coarsePointerMedia.matches || reducedMotionMedia.matches) {
      return;
    }
    state.pointerTargetX = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
    state.pointerTargetY = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    requestFrame();
  };

  const hideCursor = () => {
    if (cursorGlow) {
      cursorGlow.style.opacity = '0';
    }
  };

  // BR-042: Visibility coordinator
  const observer = new IntersectionObserver(
    ([entry]) => {
      state.active = Boolean(entry?.isIntersecting);
      threeController?.setVisibility(state.active);
      if (state.active) {
        readScroll();
        requestFrame();
      }
    },
    { rootMargin: SCENE_VISIBILITY_ROOT_MARGIN },
  );
  observer.observe(section);

  // BR-020 / BR-059: Runtime capability & reduced motion changes
  const onReducedMotionChange = () => {
    if (reducedMotionMedia.matches) {
      threeController?.destroy();
      threeController = null;
      tiltController?.destroy();
      tiltController = null;
    } else {
      setupThreeScene();
      if (!tiltController) {
        tiltController = initCardTilts(section);
      }
    }
    measure();
  };

  const onCoarsePointerChange = () => {
    if (coarsePointerMedia.matches) {
      tiltController?.destroy();
      tiltController = null;
      hideCursor();
    } else if (!reducedMotionMedia.matches && !tiltController) {
      tiltController = initCardTilts(section);
    }
    measure();
  };

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', hideCursor);
  document.addEventListener('mouseleave', hideCursor);
  window.addEventListener('blur', hideCursor);
  reducedMotionMedia.addEventListener('change', onReducedMotionChange);
  coarsePointerMedia.addEventListener('change', onCoarsePointerChange);

  // BR-023 / BR-058 / BR-099: Image decode deduplication and graceful readiness gate
  const sceneImages = dedupeImagesBySource(stage.querySelectorAll<HTMLImageElement>('.world img'));
  const decodePromises = sceneImages.map((img) => img.decode().catch(() => undefined));
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));

  Promise.race([Promise.all(decodePromises), timeoutPromise]).finally(() => {
    if (!isDestroyed && typeof window !== 'undefined') {
      stage.classList.add('is-ready');
      measure();
      readScroll();
    }
  });

  // Jump controls for header & hud
  const jumpControls = root.querySelectorAll<HTMLElement>('[data-jump]');
  const jumpListeners: { el: HTMLElement; fn: () => void }[] = [];

  jumpControls.forEach((control) => {
    const onJumpClick = () => {
      const progress = Number(control.dataset.jump ?? 0);
      const targetId = resolveJumpTarget(progress, control.dataset.target);
      if (reducedMotionMedia.matches) {
        root.querySelector(targetId)?.scrollIntoView({ behavior: 'auto' });
        return;
      }
      window.scrollTo({
        top: state.top + state.travel * progress,
        behavior: 'smooth',
      });
    };
    control.addEventListener('click', onJumpClick);
    jumpListeners.push({ el: control, fn: onJumpClick });
  });

  // ----------------------------------------------------
  // 3D Itinerary Coverflow Rail Logic
  // ----------------------------------------------------
  let railCleanup = () => {};

  if (rail) {
    const cards = [...rail.querySelectorAll<HTMLElement>('.rail-card')];
    let statusTimer = 0;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragged = false;
    let suppressNextClick = false;
    let isPointerDown = false;

    const activeIndex = () => {
      const railRect = rail.getBoundingClientRect();
      const cardCenters = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rail.scrollLeft + rect.left - railRect.left + rect.width / 2;
      });
      return computeRailActiveIndex(rail.scrollLeft, rail.clientWidth, rail.scrollWidth, cardCenters);
    };

    const announce = () => {
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        if (railStatus) {
          railStatus.textContent = `Itinerary item ${activeIndex() + 1} of ${cards.length}`;
        }
      }, 180);
      updateRailControls();
    };

    const move = (direction: -1 | 1) => {
      const index = clamp(activeIndex() + direction, 0, cards.length - 1);
      const targetCard = cards[index];
      if (targetCard) {
        rail.scrollTo({
          left: targetCard.offsetLeft - rail.offsetLeft,
          behavior: reducedMotionMedia.matches ? 'auto' : 'smooth',
        });
      }
    };

    const onPrevClick = () => move(-1);
    const onNextClick = () => move(1);

    prevBtn?.addEventListener('click', onPrevClick);
    nextBtn?.addEventListener('click', onNextClick);
    rail.addEventListener('scroll', announce, { passive: true });

    // BR-016 / BR-017: Manual pointer capture ONLY for mouse dragging to preserve touch scrolling
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) {
        return;
      }
      isPointerDown = true;
      dragStartX = event.clientX;
      dragStartScroll = rail.scrollLeft;
      dragged = false;
      suppressNextClick = false;
      try {
        rail.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failure
      }
    };

    const onPointerMoveRail = (event: PointerEvent) => {
      if (!isPointerDown || !rail.hasPointerCapture(event.pointerId)) {
        return;
      }
      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) > 5) {
        dragged = true;
        rail.classList.add('is-dragging');
        rail.scrollLeft = dragStartScroll - distance;
      }
    };

    // BR-027: Handle pointerup, pointercancel, and lost capture
    const clearDragState = (event?: PointerEvent) => {
      isPointerDown = false;
      dragged = false;
      if (event && rail.hasPointerCapture(event.pointerId)) {
        try {
          rail.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore
        }
      }
      rail.classList.remove('is-dragging');
      announce();
    };

    const onPointerUp = (event: PointerEvent) => {
      suppressNextClick = dragged;
      clearDragState(event);
    };

    const onRailClick = (event: MouseEvent) => {
      if (suppressNextClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick = false;
      }
    };

    // BR-031: Home/End navigation without moving the window vertically
    const onKeyDown = (event: KeyboardEvent) => {
      const scrollBehavior = reducedMotionMedia.matches ? 'auto' : 'smooth';
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          move(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          move(-1);
          break;
        case 'Home':
          event.preventDefault();
          rail.scrollTo({ left: 0, behavior: scrollBehavior });
          break;
        case 'End':
          event.preventDefault();
          rail.scrollTo({ left: rail.scrollWidth, behavior: scrollBehavior });
          break;
      }
    };

    rail.addEventListener('pointerdown', onPointerDown);
    rail.addEventListener('pointermove', onPointerMoveRail);
    rail.addEventListener('pointerup', onPointerUp);
    rail.addEventListener('pointercancel', clearDragState);
    rail.addEventListener('lostpointercapture', clearDragState);
    rail.addEventListener('click', onRailClick, true);
    rail.addEventListener('keydown', onKeyDown);

    updateRailControls();

    railCleanup = () => {
      window.clearTimeout(statusTimer);
      prevBtn?.removeEventListener('click', onPrevClick);
      nextBtn?.removeEventListener('click', onNextClick);
      rail.removeEventListener('scroll', announce);
      rail.removeEventListener('pointerdown', onPointerDown);
      rail.removeEventListener('pointermove', onPointerMoveRail);
      rail.removeEventListener('pointerup', onPointerUp);
      rail.removeEventListener('pointercancel', clearDragState);
      rail.removeEventListener('lostpointercapture', clearDragState);
      rail.removeEventListener('click', onRailClick, true);
      rail.removeEventListener('keydown', onKeyDown);
    };
  }

  // ----------------------------------------------------
  // VIP Delegation Customizer Modal & Focus Trapping (BR-010, BR-019, BR-054)
  // ----------------------------------------------------
  let modalCleanup = () => {};

  let closeCustomizer = () => {};

  if (customizerModal) {
    interface SiblingSnapshot {
      element: HTMLElement;
      hadInert: boolean;
      inertValue: string | null;
      hadAriaHidden: boolean;
      ariaHiddenValue: string | null;
    }

    let backgroundSnapshots: SiblingSnapshot[] = [];
    let previousDocumentOverflow = '';
    let previousBodyPaddingRight = '';
    let lastFocusedElement: HTMLElement | null = null;
    let scrollYBeforeLock = 0;
    const focusTimers: number[] = [];

    const clearFocusTimers = () => {
      focusTimers.forEach((id) => window.clearTimeout(id));
      focusTimers.length = 0;
    };

    // BR-054: Robust reversible state-preserving scroll locking
    const lockScroll = () => {
      scrollYBeforeLock = typeof window !== 'undefined' ? window.scrollY : 0;
      previousDocumentOverflow = document.documentElement.style.overflow;
      previousBodyPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.documentElement.style.overflow = 'hidden';
    };

    const unlockScroll = () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      if (typeof window !== 'undefined') {
        window.scrollTo(0, scrollYBeforeLock);
      }
    };

    // Item 4 & 5: State-preserving background content isolation
    const getBackgroundSiblings = (): HTMLElement[] => {
      const parent = customizerModal.parentElement || (typeof document !== 'undefined' ? document.body : null);
      if (!parent?.children) {
        return [];
      }
      return Array.from(parent.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child !== customizerModal &&
          child.tagName !== 'SCRIPT' &&
          child.tagName !== 'STYLE',
      );
    };

    const lockBackground = () => {
      const siblings = getBackgroundSiblings();
      backgroundSnapshots = siblings.map((el) => ({
        element: el,
        hadInert: el.hasAttribute('inert'),
        inertValue: el.getAttribute('inert'),
        hadAriaHidden: el.hasAttribute('aria-hidden'),
        ariaHiddenValue: el.getAttribute('aria-hidden'),
      }));

      siblings.forEach((el) => {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      });
    };

    const unlockBackground = () => {
      backgroundSnapshots.forEach(({ element, hadInert, inertValue, hadAriaHidden, ariaHiddenValue }) => {
        if (hadInert) {
          element.setAttribute('inert', inertValue ?? '');
        } else {
          element.removeAttribute('inert');
        }

        if (hadAriaHidden) {
          element.setAttribute('aria-hidden', ariaHiddenValue ?? '');
        } else {
          element.removeAttribute('aria-hidden');
        }
      });
      backgroundSnapshots = [];
    };

    const openCustomizer = (event?: Event) => {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault();
      }
      if (typeof event?.stopPropagation === 'function') {
        event.stopPropagation();
      }
      clearFocusTimers();
      lastFocusedElement = (event?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
      customizerModal.classList.add('is-open');
      customizerModal.setAttribute('aria-hidden', 'false');

      // Force synchronous CSS layout evaluation to ensure visibility: visible is active
      void customizerModal.offsetWidth;

      lockScroll();
      lockBackground();

      // Explicitly select close button first (not backdrop)
      const initialFocus =
        customizerModal.querySelector<HTMLElement>('button.customizer-close') ||
        customizerModal.querySelector<HTMLElement>('button[data-close-customizer]') ||
        customizerModal.querySelector<HTMLElement>('input, button');

      const applyFocus = () => {
        const activeElement = document.activeElement;
        const focusNeedsRecovery =
          activeElement === null ||
          activeElement === document.body ||
          activeElement === lastFocusedElement ||
          (activeElement instanceof HTMLElement && !customizerModal.contains(activeElement));
        if (customizerModal.classList.contains('is-open') && initialFocus && focusNeedsRecovery) {
          initialFocus.focus({ preventScroll: true });
        }
      };

      // Multi-frame focus application guarantees focus sticks across inert/click event queues
      applyFocus();
      queueMicrotask(applyFocus);
      safeRAF(applyFocus);
      focusTimers.push(window.setTimeout(applyFocus, 20));
      focusTimers.push(window.setTimeout(applyFocus, 100));
      focusTimers.push(window.setTimeout(applyFocus, 370));
    };

    closeCustomizer = () => {
      clearFocusTimers();
      customizerModal.classList.remove('is-open');
      customizerModal.setAttribute('aria-hidden', 'true');
      unlockBackground();
      unlockScroll();

      if (customizerStatus) {
        customizerStatus.style.display = 'none';
      }

      lastFocusedElement?.focus();
      lastFocusedElement = null;
    };

    const trapModalFocus = (e: KeyboardEvent) => {
      const focusable = [
        ...customizerModal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (focusable.length === 0) {
        return;
      }

      // Item 2: Safely narrow first and last
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onModalKeyDown = (e: KeyboardEvent) => {
      if (!customizerModal.classList.contains('is-open')) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCustomizer();
      } else if (e.key === 'Tab') {
        trapModalFocus(e);
      }
    };

    const openTriggers = root.querySelectorAll('[data-open-customizer]');
    const closeTriggers = root.querySelectorAll('[data-close-customizer]');

    openTriggers.forEach((btn) => btn.addEventListener('click', openCustomizer));
    closeTriggers.forEach((btn) => btn.addEventListener('click', closeCustomizer));
    window.addEventListener('keydown', onModalKeyDown);

    // BR-010: Form submission with clear confirmation & fallback using formatDelegationInquiry
    const onFormSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      if (!customizerForm) {
        return;
      }

      const formData = new FormData(customizerForm);
      const inquiry = formatDelegationInquiry({
        mission: (formData.get('mission') as string) || 'Government & Ministerial',
        cities: formData.getAll('cities').map(String),
        services: formData.getAll('services').map(String),
        size: (formData.get('size') as string) || '1–4 VIPs',
      });

      if (customizerStatus) {
        customizerStatus.style.display = 'block';
        const fallbackLink = customizerStatus.querySelector<HTMLAnchorElement>('[data-customizer-fallback]');
        if (fallbackLink) {
          fallbackLink.href = inquiry.mailtoHref;
        }
      }

      window.location.href = inquiry.mailtoHref;
    };

    customizerForm?.addEventListener('submit', onFormSubmit);

    modalCleanup = () => {
      clearFocusTimers();
      openTriggers.forEach((btn) => btn.removeEventListener('click', openCustomizer));
      closeTriggers.forEach((btn) => btn.removeEventListener('click', closeCustomizer));
      window.removeEventListener('keydown', onModalKeyDown);
      customizerForm?.removeEventListener('submit', onFormSubmit);
    };
  }

  // BR-014: Gated immutable test hook in non-production
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const win = window as WindowWithBridgeCanada;
    win.__bridgeCanada = Object.freeze({
      setProgress(progress: number) {
        window.scrollTo({ top: state.top + state.travel * clamp(progress), behavior: 'auto' });
      },
      beats,
    });
  }

  // BR-008 / BR-091: Single idempotent teardown lifecycle
  return {
    beats,
    setProgress(progress: number) {
      window.scrollTo({ top: state.top + state.travel * clamp(progress), behavior: 'auto' });
    },
    destroy() {
      isDestroyed = true;
      if (state.frame) {
        safeCancelRAF(state.frame);
        state.frame = 0;
      }

      // Item 7: If destroy() runs while modal is open, clean up modal state & restore scroll & background
      if (customizerModal?.classList.contains('is-open')) {
        closeCustomizer();
      }

      observer.disconnect();
      threeController?.destroy();
      threeController = null;
      tiltController?.destroy();
      tiltController = null;

      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', hideCursor);
      document.removeEventListener('mouseleave', hideCursor);
      window.removeEventListener('blur', hideCursor);
      reducedMotionMedia.removeEventListener('change', onReducedMotionChange);
      coarsePointerMedia.removeEventListener('change', onCoarsePointerChange);

      jumpListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      railCleanup();
      modalCleanup();

      if (typeof window !== 'undefined') {
        const win = window as WindowWithBridgeCanada;
        if (win.__bridgeCanada) {
          delete win.__bridgeCanada;
        }
      }
    },
  };
}

// Auto-initialize when running in browser (guarded against running in test runner)
if (typeof document !== 'undefined' && process.env.NODE_ENV !== 'test') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCinematic(), { once: true });
  } else {
    initCinematic();
  }
}
