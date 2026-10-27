import { useId, useState, type CSSProperties } from 'react';
import { designSeed } from '../../demo/seed';
import type { RendererChoice } from '../../overlay/GoldenOutline';
import { webglAvailable } from '../../overlay/webgl-renderer';
import { SegmentedControl } from '../../ui/controls';
import { DesignShell } from './DesignShell';
import { MirrorPanel } from './MirrorPanel';

function initialState() {
  // Query parameters let screenshots and E2E tests open the lab in a known state.
  const q = new URLSearchParams(window.location.search);
  const m = Number(q.get('m'));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    match: q.has('m') && Number.isFinite(m) ? Math.min(1, Math.max(0, m)) : 1,
    renderer: (q.get('renderer') === 'canvas' ? 'canvas' : 'webgl') as Exclude<
      RendererChoice,
      'auto'
    >,
    reduced: q.get('motion') === 'reduced' || (q.get('motion') !== 'full' && prefersReduced),
  };
}

/** The golden outline prototype: match strength, renderer and motion are all switchable. */
export default function OverlayLab() {
  const { overlay } = designSeed;
  const [init] = useState(initialState);
  const [match, setMatch] = useState(init.match);
  const [renderer, setRenderer] = useState(webglAvailable() ? init.renderer : 'canvas');
  const [reduced, setReduced] = useState(init.reduced);
  const sliderId = useId();
  const rendererNames = overlay.renderers;
  const motionNames = overlay.motion_options;

  return (
    <DesignShell current="/design/overlay" themeSwitch={false}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <h1 className="text-display">{overlay.title}</h1>
          <p className="m-0 max-w-[60ch] text-body text-text-secondary">{overlay.intro}</p>
          <div className="mt-2">
            <MirrorPanel match={match} renderer={renderer} reducedMotion={reduced} />
          </div>
          <p className="m-0 text-footnote text-text-secondary">{overlay.figure_label}</p>
        </div>
        <div className="grid gap-6 rounded-container bg-surface-raised p-5 lg:sticky lg:top-6">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor={sliderId} className="text-body">
                {overlay.match_label}
              </label>
              <output htmlFor={sliderId} className="num text-subhead text-accent-text">
                {Math.round(match * 100)}%
              </output>
            </div>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={100}
              value={Math.round(match * 100)}
              aria-valuetext={`${Math.round(match * 100)}%`}
              onChange={(e) => setMatch(Number(e.target.value) / 100)}
              className="jr-slider"
              style={{ '--fill': `${match * 100}%` } as CSSProperties}
            />
          </div>
          <div className="grid gap-2">
            <p className="m-0 text-body">{overlay.renderer_label}</p>
            <SegmentedControl
              label={overlay.renderer_label}
              options={[rendererNames.webgl, rendererNames.canvas]}
              value={rendererNames[renderer]}
              onChange={(v) => setRenderer(v === rendererNames.canvas ? 'canvas' : 'webgl')}
            />
          </div>
          <div className="grid gap-2">
            <p className="m-0 text-body">{overlay.motion_label}</p>
            <SegmentedControl
              label={overlay.motion_label}
              options={[motionNames.full, motionNames.reduced]}
              value={reduced ? motionNames.reduced : motionNames.full}
              onChange={(v) => setReduced(v === motionNames.reduced)}
            />
          </div>
        </div>
      </div>
    </DesignShell>
  );
}
