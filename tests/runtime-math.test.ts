import { describe, expect, test } from 'bun:test';
import { CONTACT_EMAIL } from '../src/config/contact.ts';
import {
  clamp,
  computeHudThumbY,
  computeRailActiveIndex,
  computeRailNavState,
  dedupeImagesBySource,
  formatDelegationInquiry,
  lerp,
  resolveJumpTarget,
  segmentInOut,
  smoothstep,
} from '../src/scripts/cinematic.ts';
import { computeResponsiveGlobeLayout, disposeThreeRenderer } from '../src/scripts/three-scene.ts';

describe('timeline and interaction math helpers', () => {
  test('clamp bounds values between min and max', () => {
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
  });

  test('lerp interpolates correctly between from and to', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  test('smoothstep computes hermite interpolation', () => {
    expect(smoothstep(0, 1, 0)).toBe(0);
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0.2, 0.8, 0.1)).toBe(0);
    expect(smoothstep(0.2, 0.8, 0.9)).toBe(1);
    expect(smoothstep(0.5, 0.5, 0.5)).toBe(1);
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
  });

  test('segmentInOut ramps up on enter and ramps down on exit', () => {
    const enter: [number, number] = [0.2, 0.3];
    const exit: [number, number] = [0.6, 0.7];

    expect(segmentInOut(0.1, enter, exit)).toBe(0);
    expect(segmentInOut(0.3, enter, exit)).toBe(1);
    expect(segmentInOut(0.45, enter, exit)).toBe(1);
    expect(segmentInOut(0.7, enter, exit)).toBe(0);
    expect(segmentInOut(0.8, enter, exit)).toBe(0);
  });

  test('HUD thumb travel spans full usable track length', () => {
    const trackHeight = 140;
    const thumbHeight = 28;
    // usable = 112
    expect(computeHudThumbY(0, trackHeight, thumbHeight)).toBe(0);
    expect(computeHudThumbY(0.5, trackHeight, thumbHeight)).toBe(56);
    expect(computeHudThumbY(1.0, trackHeight, thumbHeight)).toBe(112);
  });

  test('rail navigation state accurately identifies start and end boundaries', () => {
    expect(computeRailNavState(0, 500)).toEqual({
      canScrollPrev: false,
      canScrollNext: true,
      prevDisabled: true,
      nextDisabled: false,
    });

    expect(computeRailNavState(250, 500)).toEqual({
      canScrollPrev: true,
      canScrollNext: true,
      prevDisabled: false,
      nextDisabled: false,
    });

    expect(computeRailNavState(500, 500)).toEqual({
      canScrollPrev: true,
      canScrollNext: false,
      prevDisabled: false,
      nextDisabled: true,
    });
  });

  test('rail active index pins the first and last cards at scroll boundaries', () => {
    const cardCenters = [150, 474, 798, 1122];

    expect(computeRailActiveIndex(0, 372, 1000, cardCenters)).toBe(0);
    expect(computeRailActiveIndex(500, 372, 1000, cardCenters)).toBe(2);
    expect(computeRailActiveIndex(628, 372, 1000, cardCenters)).toBe(3);
  });

  test('scene images are deduplicated by their resolved source', () => {
    const first = { src: '/hero.webp', currentSrc: '/hero-1440.webp' };
    const duplicate = { src: '/hero-copy.webp', currentSrc: '/hero-1440.webp' };
    const distinct = { src: '/other.webp', currentSrc: '/other.webp' };

    expect(dedupeImagesBySource([first, duplicate, distinct])).toEqual([first, distinct]);
  });

  test('narrow viewports scale and center the globe while desktop preserves the composition', () => {
    expect(computeResponsiveGlobeLayout(1440, 900)).toEqual({ scale: 1, horizontalOffsetScale: 1 });

    const mobile = computeResponsiveGlobeLayout(390, 844);
    expect(mobile.scale).toBeCloseTo(0.58);
    expect(mobile.horizontalOffsetScale).toBeLessThan(0.05);
  });

  test('forces WebGL context loss immediately before disposing the renderer', () => {
    const calls: string[] = [];

    disposeThreeRenderer({
      forceContextLoss: () => calls.push('forceContextLoss'),
      dispose: () => calls.push('dispose'),
    });

    expect(calls).toEqual(['forceContextLoss', 'dispose']);
  });

  test('delegation inquiry formats structured email parameters', () => {
    const res = formatDelegationInquiry({
      mission: 'Government & Ministerial',
      cities: ['Ottawa', 'Toronto'],
      services: ['Airside VIP Greeting', '5-Star Accommodations'],
      size: '5–12 Delegates',
    });

    expect(res.subject).toBe('VIP Delegation Inquiry: Government & Ministerial');
    expect(res.body).toContain('• Mission Focus: Government & Ministerial');
    expect(res.body).toContain('• Delegation Size: 5–12 Delegates');
    expect(res.body).toContain('• Target Canadian Cities: Ottawa, Toronto');
    expect(res.body).toContain('Key Services Requested:\n - Airside VIP Greeting\n - 5-Star Accommodations');
    expect(res.mailtoHref).toContain(`mailto:${CONTACT_EMAIL}?subject=`);
    expect(CONTACT_EMAIL).toBe('info@bridgecanada.ca');
  });

  test('resolveJumpTarget prioritizes explicit target and falls back to corresponding beat sections', () => {
    // Explicit target preserved
    expect(resolveJumpTarget(0.27, '#custom-target')).toBe('#custom-target');
    expect(resolveJumpTarget(0.88, '#itinerary')).toBe('#itinerary');

    // Fallback based on timeline progress
    expect(resolveJumpTarget(0)).toBe('#experience');
    expect(resolveJumpTarget(0.1)).toBe('#experience');
    expect(resolveJumpTarget(0.2)).toBe('#visit');
    expect(resolveJumpTarget(0.27)).toBe('#visit');
    expect(resolveJumpTarget(0.4)).toBe('#visit');
    expect(resolveJumpTarget(0.48)).toBe('#trade');
    expect(resolveJumpTarget(0.58)).toBe('#trade');
    expect(resolveJumpTarget(0.7)).toBe('#trade');
    expect(resolveJumpTarget(0.75)).toBe('#itinerary');
    expect(resolveJumpTarget(0.88)).toBe('#itinerary');
    expect(resolveJumpTarget(1.0)).toBe('#itinerary');

    // Empty or whitespace target falls back to progress resolution
    expect(resolveJumpTarget(0.27, '')).toBe('#visit');
    expect(resolveJumpTarget(0.58, '   ')).toBe('#trade');
  });
});
