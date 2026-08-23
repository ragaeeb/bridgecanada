export interface TiltController {
  destroy(): void;
}

const activeElementCleanups = new WeakMap<HTMLElement, () => void>();

export function initCardTilts(container: HTMLElement = document.body): TiltController {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (reducedMotion || coarsePointer) {
    return {
      destroy() {},
    };
  }

  const cleanups: (() => void)[] = [];
  const tiltElements = container.querySelectorAll<HTMLElement>('[data-tilt]');

  tiltElements.forEach((el) => {
    activeElementCleanups.get(el)?.();

    let frameId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const maxTilt = Number(el.dataset.tiltMax ?? 8);
    const maxLift = Number(el.dataset.tiltLift ?? 6);

    // BR-077: Clean up any preexisting glare node before attaching new one (idempotent)
    const existingGlare = el.querySelector(':scope > .card-glare');
    if (existingGlare) {
      existingGlare.remove();
    }

    // Create glare layer if requested
    let glareEl: HTMLDivElement | null = null;
    if (el.dataset.tiltGlare !== 'false') {
      glareEl = document.createElement('div');
      glareEl.className = 'card-glare';
      el.appendChild(glareEl);
    }

    const update = () => {
      frameId = 0;
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      const rotateX = -currentY * maxTilt;
      const rotateY = currentX * maxTilt;
      const lift = Math.hypot(currentX, currentY) * maxLift;

      el.style.setProperty('--tilt-rx', `${rotateX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-ry', `${rotateY.toFixed(2)}deg`);
      el.style.setProperty('--tilt-tz', `${lift.toFixed(1)}px`);

      if (glareEl) {
        const angle = Math.atan2(currentY, currentX) * (180 / Math.PI) + 90;
        const opacity = Math.min(0.35, Math.hypot(currentX, currentY) * 0.4);
        glareEl.style.background = `linear-gradient(${angle}deg, rgba(255, 255, 255, ${opacity.toFixed(3)}) 0%, transparent 60%)`;
      }

      if (Math.abs(targetX - currentX) > 0.005 || Math.abs(targetY - currentY) > 0.005) {
        frameId = requestAnimationFrame(update);
      }
    };

    const requestUpdate = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(update);
      }
    };

    const onPointerEnter = () => {
      // BR-045: Apply will-change only during active interaction
      el.style.willChange = 'transform';
      if (glareEl) {
        glareEl.style.willChange = 'background';
      }
      el.classList.add('is-tilting');
    };

    const onPointerMove = (e: PointerEvent) => {
      // BR-032: Do not retain stale bounds across scroll/resize; compute fresh bounds
      const bounds = el.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        return;
      }

      const x = (e.clientX - bounds.left) / bounds.width;
      const y = (e.clientY - bounds.top) / bounds.height;
      targetX = (x - 0.5) * 2;
      targetY = (y - 0.5) * 2;
      requestUpdate();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      requestUpdate();
      el.classList.remove('is-tilting');
      // BR-045: Remove will-change hint when inactive
      el.style.willChange = '';
      if (glareEl) {
        glareEl.style.willChange = '';
      }
    };

    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);

    const cleanup = () => {
      if (activeElementCleanups.get(el) !== cleanup) {
        return;
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.classList.remove('is-tilting');
      el.style.willChange = '';
      el.style.removeProperty('--tilt-rx');
      el.style.removeProperty('--tilt-ry');
      el.style.removeProperty('--tilt-tz');
      if (glareEl && glareEl.parentNode === el) {
        glareEl.remove();
      }
      if (activeElementCleanups.get(el) === cleanup) {
        activeElementCleanups.delete(el);
      }
    };

    activeElementCleanups.set(el, cleanup);
    cleanups.push(cleanup);
  });

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
}
