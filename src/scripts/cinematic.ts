const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};
const _rangeProgress = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
const segmentInOut = (value: number, enter: [number, number], exit: [number, number]) =>
  smoothstep(enter[0], enter[1], value) * (1 - smoothstep(exit[0], exit[1], value));

const beats = {
  introExit: [0.03, 0.18] as const,
  folioOpen: [0.15, 0.25] as const,
  visit: { enter: [0.22, 0.27] as [number, number], exit: [0.35, 0.44] as [number, number] },
  panorama: [0.44, 0.48] as const,
  trade: { enter: [0.48, 0.58] as [number, number], exit: [0.69, 0.74] as [number, number] },
  catalog: [0.75, 0.93] as const,
  controls: [0.91, 0.98] as const,
};

const section = document.querySelector<HTMLElement>('[data-cinematic]');
const stage = section?.querySelector<HTMLElement>('.cinematic-stage');
const catalog = section?.querySelector<HTMLElement>('.catalog');
const rail = section?.querySelector<HTMLElement>('[data-rail]');
const railStatus = section?.querySelector<HTMLElement>('[data-rail-status]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

if (section && stage && catalog) {
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
  };

  const setVar = (name: string, value: string | number) => stage.style.setProperty(name, String(value));

  const measure = () => {
    const rect = section.getBoundingClientRect();
    state.top = window.scrollY + rect.top;
    state.travel = Math.max(1, section.offsetHeight - window.innerHeight);
    state.target = clamp((window.scrollY - state.top) / state.travel);
    requestFrame();
  };

  const readScroll = () => {
    state.target = clamp((window.scrollY - state.top) / state.travel);
    requestFrame();
  };

  const render = () => {
    state.frame = 0;
    if (!state.active && state.target > 0 && state.target < 1) {
      return;
    }

    const instant = reducedMotion.matches;
    state.playhead = instant ? state.target : lerp(state.playhead, state.target, 0.105);
    state.pointerX = instant ? 0 : lerp(state.pointerX, state.pointerTargetX, 0.08);
    state.pointerY = instant ? 0 : lerp(state.pointerY, state.pointerTargetY, 0.08);

    const p = state.playhead;
    const introOut = smoothstep(...beats.introExit, p);
    const open = smoothstep(...beats.folioOpen, p);
    const visit = segmentInOut(p, beats.visit.enter, beats.visit.exit);
    const trade = segmentInOut(p, beats.trade.enter, beats.trade.exit);
    const catalogIn = smoothstep(...beats.catalog, p);
    const controls = smoothstep(...beats.controls, p);
    const focusAmount = Math.max(visit * 0.72, trade);
    const push = smoothstep(0.03, 0.46, p) * (1 - smoothstep(0.72, 0.9, p) * 0.28);
    const route = segmentInOut(p, [0.42, 0.5], [0.7, 0.75]);
    const pointerScale = coarsePointer.matches ? 0 : 1;

    setVar('--far-x', `${state.pointerX * -7 * pointerScale}px`);
    setVar('--far-y', `${state.pointerY * -4 * pointerScale + push * -4}px`);
    setVar('--far-scale', lerp(1.04, 1.105, push).toFixed(4));
    setVar('--mid-x', `${state.pointerX * 13 * pointerScale}px`);
    setVar('--mid-y', `${state.pointerY * 8 * pointerScale + push * -10}px`);
    setVar('--mid-scale', lerp(1.045, 1.15, push).toFixed(4));
    setVar('--world-blur', `${instant ? 0 : focusAmount * 4.5}px`);
    setVar('--world-brightness', lerp(0.84, 0.66, focusAmount).toFixed(3));
    setVar('--shade-opacity', lerp(0.32, 0.72, Math.max(focusAmount, catalogIn * 0.7)).toFixed(3));
    setVar('--route-opacity', route.toFixed(3));

    setVar('--intro-opacity', (1 - introOut).toFixed(3));
    setVar('--intro-y', `${introOut * -28}px`);
    setVar('--intro-blur', `${introOut * 4}px`);
    setVar('--folio-left-x', `${open * -112}%`);
    setVar('--folio-right-x', `${open * 112}%`);
    setVar('--folio-opacity', (1 - smoothstep(0.34, 0.44, p)).toFixed(3));

    setVar('--panel-a-opacity', visit.toFixed(3));
    setVar(
      '--panel-a-y',
      `${lerp(28, 0, smoothstep(...beats.visit.enter, p)) + smoothstep(...beats.visit.exit, p) * -18}px`,
    );
    setVar('--panel-b-opacity', trade.toFixed(3));
    setVar(
      '--panel-b-y',
      `${lerp(28, 0, smoothstep(...beats.trade.enter, p)) + smoothstep(...beats.trade.exit, p) * -18}px`,
    );
    setVar('--catalog-opacity', catalogIn.toFixed(3));
    setVar('--catalog-y', `${lerp(72, 0, catalogIn)}px`);
    setVar('--controls-opacity', controls.toFixed(3));

    catalog.style.pointerEvents = instant || p > 0.82 ? 'auto' : 'none';

    const needsScrollSmoothing = Math.abs(state.playhead - state.target) > 0.0005;
    const needsPointerSmoothing =
      Math.abs(state.pointerX - state.pointerTargetX) > 0.002 ||
      Math.abs(state.pointerY - state.pointerTargetY) > 0.002;
    if (!instant && (needsScrollSmoothing || needsPointerSmoothing)) {
      requestFrame();
    }
  };

  function requestFrame() {
    if (!state.frame) {
      state.frame = requestAnimationFrame(render);
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (coarsePointer.matches || reducedMotion.matches) {
      return;
    }
    state.pointerTargetX = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
    state.pointerTargetY = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    requestFrame();
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      state.active = Boolean(entry?.isIntersecting);
      if (state.active) {
        readScroll();
        requestFrame();
      }
    },
    { rootMargin: '30% 0px' },
  );
  observer.observe(section);

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  reducedMotion.addEventListener('change', measure);

  const sceneImages = [...stage.querySelectorAll<HTMLImageElement>('.world img')];
  Promise.all(
    sceneImages.map((image) =>
      image.complete ? image.decode().catch(() => undefined) : image.decode().catch(() => undefined),
    ),
  ).finally(() => {
    stage.classList.add('is-ready');
    measure();
    readScroll();
  });

  section.querySelectorAll<HTMLElement>('[data-jump]').forEach((control) => {
    control.addEventListener('click', () => {
      if (reducedMotion.matches) {
        document.querySelector(control.dataset.target ?? '#experience')?.scrollIntoView({ behavior: 'auto' });
        return;
      }
      const progress = Number(control.dataset.jump ?? 0);
      window.scrollTo({
        top: state.top + state.travel * progress,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    });
  });

  Object.assign(window, {
    __bridgeCanada: {
      setProgress(progress: number) {
        window.scrollTo({ top: state.top + state.travel * clamp(progress), behavior: 'auto' });
      },
      beats,
    },
  });
}

if (rail) {
  const cards = [...rail.querySelectorAll<HTMLElement>('.rail-card')];
  let statusTimer = 0;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragged = false;

  const activeIndex = () => {
    const railLeft = rail.getBoundingClientRect().left;
    return cards.reduce(
      (closest, card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
        return distance < closest.distance ? { index, distance } : closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;
  };

  const announce = () => {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      if (railStatus) {
        railStatus.textContent = `Itinerary item ${activeIndex() + 1} of ${cards.length}`;
      }
    }, 180);
  };

  const move = (direction: -1 | 1) => {
    const index = clamp(activeIndex() + direction, 0, cards.length - 1);
    cards[index]?.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  };

  document.querySelector<HTMLElement>('[data-rail-prev]')?.addEventListener('click', () => move(-1));
  document.querySelector<HTMLElement>('[data-rail-next]')?.addEventListener('click', () => move(1));
  rail.addEventListener('scroll', announce, { passive: true });
  rail.addEventListener('dragstart', (event) => event.preventDefault());
  rail.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }
    dragStartX = event.clientX;
    dragStartScroll = rail.scrollLeft;
    dragged = false;
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener('pointermove', (event) => {
    if (!rail.hasPointerCapture(event.pointerId)) {
      return;
    }
    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 5) {
      dragged = true;
      rail.classList.add('is-dragging');
      rail.scrollLeft = dragStartScroll - distance;
    }
  });
  rail.addEventListener('pointerup', (event) => {
    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
    rail.classList.remove('is-dragging');
    announce();
  });
  rail.addEventListener(
    'click',
    (event) => {
      if (dragged) {
        event.preventDefault();
        event.stopPropagation();
        dragged = false;
      }
    },
    true,
  );
  rail.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      cards[0]?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', inline: 'start' });
    } else if (event.key === 'End') {
      event.preventDefault();
      cards.at(-1)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', inline: 'start' });
    }
  });
}
