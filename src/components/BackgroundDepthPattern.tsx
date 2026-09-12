import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';

/**
 * Soft 3D atmosphere.
 * Dark: glow orbs + frosted glass pebbles on top (extra depth).
 * Light: warm canvas + silver / steel slabs (unchanged).
 */

const SLIDE_MS = 1100;
const THEME_FADE_MS = 520;
const BLOB_OPACITY_DARK = 0.95;
const BLOB_OPACITY_LIGHT = 0.9;
const PEBBLE_OPACITY = 0.78;
const DRIFT_SCALE = 0.16;

const OCEAN = {
  dark: {
    /* black-weighted maroon night */
    base: ['#0a0203', '#120406', '#000000'] as const,
    colors: [
      'rgba(233, 69, 96, 0.42)',   // rose glow (soft)
      'rgba(127, 29, 29, 0.55)',   // maroon 55%
      'rgba(0, 0, 0, 0.40)',       // black depth
      'rgba(136, 19, 55, 0.45)',   // wine
      'rgba(90, 20, 30, 0.50)',    // oxblood
      'rgba(255, 255, 255, 0.05)', // white 5% sparkle
    ] as const,
  },
  light: {
    base: ['#f3f2f1', '#ebe9e7', '#f7f6f5'] as const,
    colors: [
      'rgba(255, 255, 255, 0.95)',
      'rgba(113, 113, 122, 0.42)',
      'rgba(82, 82, 91, 0.38)',
      'rgba(228, 228, 231, 0.90)',
      'rgba(100, 116, 139, 0.40)',
      'rgba(255, 255, 255, 0.88)',
      'rgba(71, 85, 105, 0.36)',
      'rgba(161, 161, 170, 0.55)',
      'rgba(51, 65, 85, 0.32)',
    ] as const,
  },
};

/** Soft circular glow orbs — dark theme only (reference atmosphere) */
const ORB_SPECS = [
  { size: 0.95, top: -0.18, left: -0.35, blur: 48 },
  { size: 0.78, top: 0.08, left: 0.42, blur: 56 },
  { size: 0.70, top: 0.38, left: -0.28, blur: 44 },
  { size: 0.88, top: 0.52, left: 0.28, blur: 60 },
  { size: 0.62, top: 0.72, left: -0.12, blur: 40 },
  { size: 0.74, top: 0.82, left: 0.38, blur: 52 },
] as const;

/**
 * Frosted glass pebbles sit ABOVE the glow orbs (dark only).
 * Sparse — continuous slow float + tab-switch drift on parent.
 */
const GLASS_PEBBLE_SPECS = [
  { w: 0.52, h: 0.24, top: 0.06, left: -0.12, rotate: -14, radius: 42 },
  { w: 0.40, h: 0.32, top: 0.36, left: 0.52, rotate: 16, radius: 34 },
  { w: 0.46, h: 0.22, top: 0.68, left: 0.04, rotate: -10, radius: 36 },
  { w: 0.36, h: 0.28, top: 0.82, left: 0.48, rotate: 12, radius: 30 },
] as const;

/** Rounded rectangle / cube slabs (light theme) */
const SLAB_SPECS = [
  { w: 0.72, h: 0.38, top: -0.04, left: -0.18, angle: '125deg', rotate: -18, radius: 48 },
  { w: 0.48, h: 0.55, top: 0.06, left: 0.52, angle: '210deg', rotate: 22, radius: 40 },
  { w: 0.58, h: 0.28, top: 0.22, left: 0.08, angle: '95deg', rotate: -8, radius: 36 },
  { w: 0.36, h: 0.48, top: 0.34, left: -0.12, angle: '300deg', rotate: 14, radius: 32 },
  { w: 0.64, h: 0.30, top: 0.42, left: 0.38, angle: '160deg', rotate: -24, radius: 44 },
  { w: 0.42, h: 0.42, top: 0.55, left: -0.06, angle: '45deg', rotate: 6, radius: 28 },
  { w: 0.70, h: 0.34, top: 0.66, left: 0.28, angle: '200deg', rotate: -12, radius: 42 },
  { w: 0.40, h: 0.52, top: 0.78, left: -0.14, angle: '320deg', rotate: 28, radius: 34 },
  { w: 0.54, h: 0.26, top: 0.88, left: 0.22, angle: '110deg', rotate: -6, radius: 30 },
] as const;

type BlobLayout = {
  width: number;
  height: number;
  top: number;
  left: number;
  gradient: string;
  driftMul: number;
  shape: 'circle' | 'rect';
  rotate: number;
  radius: number;
  blur: number;
};

type GlassPebbleLayout = {
  width: number;
  height: number;
  top: number;
  left: number;
  rotate: number;
  radius: number;
  driftMul: number;
};

type Drift = { x: number; y: number; scale: number };

function buildGlowOrbs(
  frameW: number,
  frameH: number,
  colors: readonly string[]
): BlobLayout[] {
  const size = Math.max(frameW, frameH);
  return ORB_SPECS.map((spec, i) => {
    const color = colors[i % colors.length];
    const dim = size * spec.size;
    return {
      width: dim,
      height: dim,
      top: frameH * spec.top,
      left: frameW * spec.left,
      gradient: `radial-gradient(circle at 40% 40%, ${color} 0%, transparent 68%)`,
      driftMul: i % 2 === 0 ? 1.2 : 1,
      shape: 'circle' as const,
      rotate: 0,
      radius: 9999,
      blur: spec.blur,
    };
  });
}

function buildGlassPebbles(frameW: number, frameH: number): GlassPebbleLayout[] {
  const size = Math.max(frameW, frameH);
  return GLASS_PEBBLE_SPECS.map((spec, i) => ({
    width: size * spec.w,
    height: size * spec.h,
    top: frameH * spec.top,
    left: frameW * spec.left,
    rotate: spec.rotate,
    radius: spec.radius,
    driftMul: i % 2 === 0 ? 0.85 : 1.1,
  }));
}

function buildSlabBlobs(
  frameW: number,
  frameH: number,
  colors: readonly string[]
): BlobLayout[] {
  const size = Math.max(frameW, frameH);
  return SLAB_SPECS.map((spec, i) => {
    const color = colors[i % colors.length];
    return {
      width: size * spec.w,
      height: size * spec.h,
      top: frameH * spec.top,
      left: frameW * spec.left,
      gradient: `linear-gradient(${spec.angle}, ${color} 0%, ${color} 35%, transparent 88%)`,
      driftMul: i % 3 === 0 ? 1.15 : 1,
      shape: 'rect' as const,
      rotate: spec.rotate,
      radius: spec.radius,
      blur: 0,
    };
  });
}

function AtmosphereLayer({
  base,
  blobs,
  drifts,
  motionKey,
  blobOpacity,
  pebbles,
  pebbleDrifts,
}: {
  base: readonly [string, string, string];
  blobs: BlobLayout[];
  drifts: Drift[];
  motionKey: string;
  blobOpacity: number;
  pebbles?: GlassPebbleLayout[];
  pebbleDrifts?: Drift[];
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${base[0]} 0%, ${base[1]} 50%, ${base[2]} 100%)`,
        }}
      />

      {/* Layer 1 — soft glow orbs / slabs */}
      {blobs.map((blob, i) => {
        const d = drifts[i] ?? { x: 0, y: 0, scale: 1 };
        const floatClass = `animate-orb-drift-${(i % 4) + 1}`;
        return (
          <div
            key={`glow-${i}`}
            className="absolute"
            style={{
              width: blob.width,
              height: blob.height,
              top: blob.top,
              left: blob.left,
              opacity: blobOpacity,
              transform: `translate3d(${d.x}px, ${d.y}px, 0) scale(${d.scale}) rotate(${blob.rotate}deg)`,
              transition: `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              willChange: 'transform',
            }}
          >
            <div
              className={`absolute inset-0 overflow-hidden ${floatClass}`}
              style={{
                borderRadius: blob.shape === 'circle' ? '9999px' : `${blob.radius}px`,
                filter: blob.blur > 0 ? `blur(${blob.blur}px)` : undefined,
              }}
            >
              <div className="absolute inset-0" style={{ background: blob.gradient }} />
            </div>
          </div>
        );
      })}

      {/* Layer 2 — sparse white frost pebbles; forever-float on child */}
      {pebbles?.map((pebble, i) => {
        const d = pebbleDrifts?.[i] ?? { x: 0, y: 0, scale: 1 };
        const floatClass = `animate-pebble-float-${(i % 4) + 1}`;
        return (
          <div
            key={`pebble-${i}`}
            className="absolute"
            style={{
              width: pebble.width,
              height: pebble.height,
              top: pebble.top,
              left: pebble.left,
              opacity: PEBBLE_OPACITY,
              transform: `translate3d(${d.x}px, ${d.y}px, 0) scale(${d.scale}) rotate(${pebble.rotate}deg)`,
              transition: `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              willChange: 'transform',
            }}
          >
            <div
              className={`absolute inset-0 ${floatClass}`}
              style={{
                borderRadius: `${pebble.radius}px`,
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.12), 0 10px 24px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(18px) saturate(150%)',
                WebkitBackdropFilter: 'blur(18px) saturate(150%)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export const BackgroundDepthPattern: React.FC = () => {
  const { theme, activeScreen } = useTransactions();
  const isLight = theme === 'light';

  const rootRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 390, h: 844 });
  const [drifts, setDrifts] = useState<Drift[]>(() =>
    ORB_SPECS.map(() => ({ x: 0, y: 0, scale: 1 }))
  );
  const [pebbleDrifts, setPebbleDrifts] = useState<Drift[]>(() =>
    GLASS_PEBBLE_SPECS.map(() => ({ x: 0, y: 0, scale: 1 }))
  );
  const [themeFade, setThemeFade] = useState(isLight ? 1 : 0);
  const mountedTheme = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setFrame({ w: r.width, h: r.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!mountedTheme.current) {
      mountedTheme.current = true;
      setThemeFade(isLight ? 1 : 0);
      return;
    }
    const id = requestAnimationFrame(() => setThemeFade(isLight ? 1 : 0));
    return () => cancelAnimationFrame(id);
  }, [isLight]);

  const motionKey = `${activeScreen}-ocean`;
  useEffect(() => {
    const size = Math.max(frame.w, frame.h);
    const count = isLight ? SLAB_SPECS.length : ORB_SPECS.length;
    setDrifts(
      Array.from({ length: count }, (_, i) => {
        const spread = size * 0.22 * DRIFT_SCALE * (i % 3 === 0 ? 1.25 : 1) * 8;
        return {
          x: (Math.random() - 0.5) * spread,
          y: (Math.random() - 0.5) * spread,
          scale: 0.94 + Math.random() * 0.1,
        };
      })
    );
    /* Pebbles drift on a slightly different plane (parallax depth) */
    setPebbleDrifts(
      GLASS_PEBBLE_SPECS.map((spec, i) => {
        const spread = size * Math.max(spec.w, spec.h) * DRIFT_SCALE * 5.5 * (i % 2 === 0 ? 0.9 : 1.15);
        return {
          x: (Math.random() - 0.5) * spread,
          y: (Math.random() - 0.5) * spread,
          scale: 0.96 + Math.random() * 0.08,
        };
      })
    );
  }, [motionKey, frame.w, frame.h, isLight]);

  const darkBlobs = useMemo(
    () => buildGlowOrbs(frame.w, frame.h, OCEAN.dark.colors),
    [frame.w, frame.h]
  );
  const darkPebbles = useMemo(
    () => buildGlassPebbles(frame.w, frame.h),
    [frame.w, frame.h]
  );
  const lightBlobs = useMemo(
    () => buildSlabBlobs(frame.w, frame.h, OCEAN.light.colors),
    [frame.w, frame.h]
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      id="app-atmosphere-background"
      data-theme={isLight ? 'light' : 'dark'}
      className="pointer-events-none fixed inset-y-0 w-full max-w-md left-1/2 -translate-x-1/2 overflow-hidden z-0 select-none"
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: 1 - themeFade,
          transition: `opacity ${THEME_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <AtmosphereLayer
          base={OCEAN.dark.base}
          blobs={darkBlobs}
          drifts={drifts}
          motionKey={`${motionKey}-dark`}
          blobOpacity={BLOB_OPACITY_DARK}
          pebbles={darkPebbles}
          pebbleDrifts={pebbleDrifts}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          opacity: themeFade,
          transition: `opacity ${THEME_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <AtmosphereLayer
          base={OCEAN.light.base}
          blobs={lightBlobs}
          drifts={drifts}
          motionKey={`${motionKey}-light`}
          blobOpacity={BLOB_OPACITY_LIGHT}
        />
      </div>
    </div>
  );
};

export const BotanicalXIcon: React.FC<{
  className?: string;
  strokeColor?: string;
  opacity?: number;
  strokeWidth?: number;
}> = ({
  className = 'w-6 h-6',
  strokeColor = '#dc2626',
  opacity = 1,
  strokeWidth = 2.4,
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 500 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <g
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 175 490 L 244 355" />
        <path d="M 188 490 L 257 355" />
        <path d="M 175 490 L 188 490" />
        <path d="M 244 355 L 257 355" />
        <path d="M 271 300 L 284 300" />
        <path d="M 271 300 L 338 165" />
        <path d="M 284 300 L 351 165" />
        <path d="M 338 165 L 351 165" />
        <path d="M 234 148 C 242 225, 268 340, 345 488" />
        <path d="M 240 150 C 248 227, 274 342, 351 490" />
        <path d="M 345 488 L 351 490" />
        <path d="M 235 148 C 228 115, 244 88, 266 80 C 277 100, 263 135, 239 150" />
        <path d="M 236 149 C 246 126, 256 102, 266 80" />
        <path d="M 233 176 L 218 166" />
        <path d="M 218 166 C 198 144, 178 132, 160 132 C 174 165, 202 178, 218 166" />
        <path d="M 218 166 C 196 152, 178 142, 160 132" />
        <path d="M 241 236 L 228 238" />
        <path d="M 228 238 C 205 208, 175 218, 162 238 C 178 268, 214 266, 228 238" />
        <path d="M 228 238 C 204 236, 182 236, 162 238" />
        <path d="M 240 482 C 255 455, 288 460, 305 476 C 288 498, 255 498, 240 482" />
        <path d="M 240 482 C 265 478, 286 477, 305 476" />
        <path d="M 318 444 L 322 432" />
        <path d="M 322 432 C 312 370, 326 332, 350 312 C 365 338, 358 402, 322 432" />
        <path d="M 322 432 C 332 388, 340 348, 350 312" />
      </g>
    </svg>
  );
};
