import { useEffect, useRef, useState } from 'react';
import { designTokens } from '../design';
import { drawCanvasFrame } from './canvas-renderer';
import type { PoseFixture } from './geometry';
import { buildFrame } from './scene';
import { WebGLOverlay, webglAvailable } from './webgl-renderer';

export type RendererChoice = 'auto' | 'webgl' | 'canvas';

interface GoldenOutlineProps {
  fixture: PoseFixture;
  /** Target match strength 0..1; the drawn value follows it on the critically damped "gentle" spring. */
  match: number;
  label: string;
  renderer?: RendererChoice;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * The signature moment: the calibrated outline and the body-edge glow over the darkened image.
 * WebGL with bloom when available, otherwise the 2D fallback with the same meaning.
 */
export function GoldenOutline({
  fixture,
  match,
  label,
  renderer = 'auto',
  reducedMotion = false,
  className,
}: GoldenOutlineProps) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef(match);
  const [used, setUsed] = useState<'webgl' | 'canvas' | null>(null);
  const [settled, setSettled] = useState<number | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'block size-full';
    canvas.setAttribute('aria-hidden', 'true');
    el.replaceChildren(canvas);

    const wantGl = renderer === 'webgl' || (renderer === 'auto' && webglAvailable());
    let gl: WebGLOverlay | null = null;
    if (wantGl) {
      try {
        gl = new WebGLOverlay(canvas);
      } catch {
        gl = null;
      }
    }
    const ctx = gl ? null : canvas.getContext('2d');
    setUsed(gl ? 'webgl' : 'canvas');

    const { stiffness, damping, mass } = designTokens.motion.springs.gentle;
    let m = target.current;
    let velocity = 0;
    let last = performance.now();
    let raf = 0;
    let reported = Number.NaN;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (reducedMotion) {
        m = target.current;
        velocity = 0;
      } else {
        const accel = (-stiffness * (m - target.current) - damping * velocity) / mass;
        velocity += accel * dt;
        m += velocity * dt;
      }
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const frame = buildFrame(fixture, Math.min(1, Math.max(0, m)), w, h);
      if (gl) {
        gl.resize(w, h, dpr);
        gl.render(frame, now, reducedMotion);
      } else if (ctx) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        drawCanvasFrame(ctx, frame, reducedMotion ? 0 : now * 0.006);
      }
      const atRest = Math.abs(m - target.current) < 0.001 && Math.abs(velocity) < 0.001;
      if (atRest && reported !== target.current) {
        reported = target.current;
        setSettled(target.current);
      }
      // With reduced motion nothing moves on its own, so frames are drawn only while the value changes.
      if (!(reducedMotion && atRest)) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    raf = requestAnimationFrame(tick);
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    el.addEventListener('jr-wake', wake);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('jr-wake', wake);
      gl?.dispose();
    };
  }, [fixture, renderer, reducedMotion]);

  useEffect(() => {
    target.current = match;
    host.current?.dispatchEvent(new Event('jr-wake'));
  }, [match]);

  return (
    <div
      role="img"
      aria-label={label}
      data-renderer={used ?? undefined}
      data-settled-match={settled ?? undefined}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={className}
    >
      <div ref={host} className="size-full" />
    </div>
  );
}
