/**
 * Purposeful Anime.js motion orchestration for Accounting Universe.
 *
 * Follows the unslop motion contract:
 * - Never animate layout properties (width, height, top, left, margin) — only transform & opacity.
 * - No continuous loops, pulsing glows, or bouncy springs.
 * - One calm easing curve (`cubicBezier(0.22, 1, 0.36, 1)`), fast feedback, short staggered entrance.
 * - Immediately bypassed in `prefers-reduced-motion: reduce`, `projector` mode, and headless/jsdom tests,
 *   and never drops text opacity below contrast-safe bounds during axe-core runs.
 */
import { animate, cubicBezier, remove, stagger } from 'animejs';
import { reducedMotion } from './dom';

const CALM_EASE = cubicBezier(0.22, 1, 0.36, 1);

function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (/jsdom/i.test(navigator.userAgent ?? '')) return false;
  if (reducedMotion()) return false;
  if (document.documentElement.classList.contains('projector')) return false;
  return true;
}

/**
 * Subtle route-transition entrance: translates top-level sections & cards up by a few pixels
 * without fading text opacity (preserving WCAG contrast on every intermediate frame).
 */
export function animatePageEntrance(container: HTMLElement): void {
  if (!canAnimate()) return;
  const targets = Array.from(
    container.querySelectorAll<HTMLElement>(
      ':scope > .hero, :scope > .labhead, :scope > .panel, :scope > .steps3 > .step3, :scope > .cards > .card, .simlab-core-grid > .card, .simlab-page > .panel, .simlab-stage .simlab-card',
    ),
  ).slice(0, 14);
  if (targets.length === 0) return;
  remove(targets);
  animate(targets, {
    translateY: [10, 0],
    duration: 320,
    delay: stagger(28, { start: 0 }),
    ease: CALM_EASE,
    onComplete: () => {
      for (const el of targets) {
        el.style.transform = '';
      }
    },
  });
}

/**
 * Slides a shared active pill indicator smoothly to the active navigation link (`aria-current="page"`).
 */
export function syncNavIndicator(navEl: HTMLElement, pillEl: HTMLElement): void {
  const active = navEl.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!active || window.innerWidth <= 720) {
    pillEl.style.opacity = '0';
    return;
  }
  const x = active.offsetLeft;
  const w = active.offsetWidth;
  if (w <= 0) {
    pillEl.style.opacity = '0';
    return;
  }
  pillEl.style.width = `${w}px`;
  pillEl.style.opacity = '1';
  if (!canAnimate()) {
    pillEl.style.transform = `translate3d(${x}px, 0, 0)`;
    return;
  }
  remove(pillEl);
  animate(pillEl, {
    translateX: x,
    duration: 240,
    ease: CALM_EASE,
  });
}

/**
 * Tactile micro-feedback when a simulator card, ledger balance, or verification banner updates.
 */
export function pulseLedgerConfirmation(el: HTMLElement | null): void {
  if (!el || !canAnimate()) return;
  remove(el);
  animate(el, {
    scale: [0.985, 1],
    translateY: [4, 0],
    duration: 240,
    ease: CALM_EASE,
    onComplete: () => {
      el.style.transform = '';
    },
  });
}
