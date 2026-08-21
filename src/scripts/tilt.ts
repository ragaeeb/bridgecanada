export function initCardTilts(container: HTMLElement = document.body) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (reducedMotion || coarsePointer) {
    return;
  }

  const tiltElements = container.querySelectorAll<HTMLElement>('[data-tilt]');

  tiltElements.forEach((el) => {
    let bounds: DOMRect | null = null;
    let frameId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const maxTilt = Number(el.dataset.tiltMax ?? 8);
    const maxLift = Number(el.dataset.tiltLift ?? 6);

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

    el.addEventListener('pointerenter', () => {
      bounds = el.getBoundingClientRect();
      el.classList.add('is-tilting');
    });

    el.addEventListener('pointermove', (e) => {
      if (!bounds) {
        bounds = el.getBoundingClientRect();
      }
      const x = (e.clientX - bounds.left) / bounds.width;
      const y = (e.clientY - bounds.top) / bounds.height;
      targetX = (x - 0.5) * 2;
      targetY = (y - 0.5) * 2;
      requestUpdate();
    });

    el.addEventListener('pointerleave', () => {
      bounds = null;
      targetX = 0;
      targetY = 0;
      requestUpdate();
      el.classList.remove('is-tilting');
    });
  });
}
