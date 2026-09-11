/** Design animation: ease-in-out scroll, swipe-hint loop, rubber-band overscroll */

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * iOS-style rubber band: maps unbounded overscroll into a soft diminishing offset.
 * @param overscroll signed px past the edge (negative = before start, positive = past end)
 * @param dimension typically the rail clientWidth
 */
export function rubberBandOffset(overscroll: number, dimension: number, constant = 0.55): number {
  if (overscroll === 0 || dimension <= 0) return 0;
  const limit = Math.max(dimension * 0.35, 48);
  const o = Math.abs(overscroll);
  const damped = (o * limit) / (limit + constant * o);
  return Math.sign(overscroll) * damped;
}

/** Animate element.scrollLeft with ease-in-out cubic. */
export function animateScrollLeft(
  el: HTMLElement,
  to: number,
  durationMs = 480,
  shouldCancel?: () => boolean
): Promise<void> {
  return new Promise((resolve) => {
    const from = el.scrollLeft;
    const delta = to - from;
    if (Math.abs(delta) < 0.5) {
      resolve();
      return;
    }
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      if (shouldCancel?.()) {
        cancelAnimationFrame(raf);
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      el.scrollLeft = from + delta * easeInOutCubic(t);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    raf = requestAnimationFrame(tick);
  });
}

/** Spring rubber translateX back to 0 (edge bounce). */
export function animateRubberRelease(
  setOffset: (px: number) => void,
  from: number,
  durationMs = 420,
  shouldCancel?: () => boolean
): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(from) < 0.5) {
      setOffset(0);
      resolve();
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      if (shouldCancel?.()) {
        cancelAnimationFrame(raf);
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      const overshoot = Math.sin(t * Math.PI) * from * -0.08 * (1 - t);
      setOffset(from * (1 - eased) + overshoot);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setOffset(0);
        resolve();
      }
    };
    raf = requestAnimationFrame(tick);
  });
}

/**
 * Map a desired scroll position into { scrollLeft, rubber }.
 * rubber is applied as translateX on the track.
 */
export function clampScrollWithRubber(
  desired: number,
  maxScroll: number,
  clientWidth: number
): { scrollLeft: number; rubber: number } {
  if (desired < 0) {
    return { scrollLeft: 0, rubber: rubberBandOffset(desired, clientWidth) };
  }
  if (desired > maxScroll) {
    return {
      scrollLeft: maxScroll,
      rubber: rubberBandOffset(desired - maxScroll, clientWidth),
    };
  }
  return { scrollLeft: desired, rubber: 0 };
}

export type SwipeHintOptions = {
  idleMs?: number;
  peekPx?: number | ((el: HTMLElement) => number);
  durationMs?: number;
  shouldCancel?: () => boolean;
};

/**
 * Repeated idle swipe hint: wait idleMs → ease peek → ease back → repeat.
 * Cancels permanently once shouldCancel() becomes true.
 */
export function runSwipeHintLoop(
  el: HTMLElement,
  options: SwipeHintOptions = {}
): () => void {
  const idleMs = options.idleMs ?? 2000;
  const durationMs = options.durationMs ?? 480;
  const shouldCancel = options.shouldCancel ?? (() => false);
  const peekOf =
    typeof options.peekPx === 'function'
      ? options.peekPx
      : () => options.peekPx ?? Math.round(Math.min(48, el.clientWidth * 0.14));

  let cancelled = false;
  let timer = 0;

  const stop = () => {
    cancelled = true;
    window.clearTimeout(timer);
  };

  const cycle = async () => {
    if (cancelled || shouldCancel()) {
      stop();
      return;
    }

    timer = window.setTimeout(async () => {
      if (cancelled || shouldCancel()) {
        stop();
        return;
      }

      const origin = el.scrollLeft;
      const peek = peekOf(el);

      await animateScrollLeft(el, origin + peek, durationMs, () => cancelled || shouldCancel());
      if (cancelled || shouldCancel()) {
        stop();
        return;
      }
      await animateScrollLeft(el, origin, durationMs, () => cancelled || shouldCancel());

      if (!cancelled && !shouldCancel()) {
        void cycle();
      } else {
        stop();
      }
    }, idleMs);
  };

  void cycle();
  return stop;
}
