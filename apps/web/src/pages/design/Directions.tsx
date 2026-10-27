import { Check } from 'lucide-react';
import { useId, useState, type CSSProperties } from 'react';
import { designTokens } from '../../design';
import { designSeed } from '../../demo/seed';
import { ICON_STROKE } from '../../ui/button';
import { DesignShell } from './DesignShell';
import { MirrorPanel } from './MirrorPanel';
import { TodayPanel } from './TodayPanel';

const CHOSEN = 'instrument';

/** The three brand-faithful directions side by side on the live mirror and Today, with the pick recorded. */
export default function Directions() {
  const { directions } = designSeed;
  const [match, setMatch] = useState(0.85);
  const sliderId = useId();
  const entries = Object.entries(designTokens.directions);

  return (
    <DesignShell current="/design">
      <div className="grid max-w-[62ch] gap-4">
        <h1 className="text-display">{directions.title}</h1>
        <p className="m-0 text-body text-text-secondary">{directions.intro}</p>
      </div>

      <div className="sticky top-0 z-(--z-sticky) -mx-(--space-gutter) mt-8 px-(--space-gutter) py-3 material border-b border-rule">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <label htmlFor={sliderId} className="text-subhead font-medium">
            {directions.match_label}
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            value={Math.round(match * 100)}
            aria-valuetext={`${Math.round(match * 100)}%`}
            onChange={(e) => setMatch(Number(e.target.value) / 100)}
            className="jr-slider flex-1"
            style={{ '--fill': `${match * 100}%` } as CSSProperties}
          />
          <output htmlFor={sliderId} className="num w-12 text-right text-subhead text-accent-text">
            {Math.round(match * 100)}%
          </output>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {entries.map(([key, direction]) => (
          <section
            key={key}
            data-direction={key}
            aria-labelledby={`dir-${key}`}
            className="grid content-start gap-6 rounded-sheet bg-surface p-5 text-text ring-1 ring-rule"
            style={{ colorScheme: direction.theme } as CSSProperties}
          >
            <header className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2 id={`dir-${key}`} className="text-title1">
                  {direction.label}
                </h2>
                {key === CHOSEN && (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-control bg-accent-fill px-3 text-footnote font-medium text-on-accent">
                    <Check aria-hidden size={16} strokeWidth={ICON_STROKE} />
                    {directions.pick_label}
                  </span>
                )}
              </div>
              <p className="m-0 text-subhead text-text-secondary">{directions.notes[key]}</p>
            </header>
            <MirrorPanel
              match={match}
              frameMarks={direction.features.frame_marks}
              scanGrid={direction.features.scan_grid}
              compact
            />
            <div className="rounded-container bg-surface-raised p-4">
              <TodayPanel />
            </div>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="decision"
        className="mt-14 grid max-w-[62ch] gap-3 border-t border-rule pt-8"
      >
        <h2 id="decision" className="text-title1">
          {directions.decision.title}
        </h2>
        <p className="m-0 text-body text-text-secondary">{directions.decision.body}</p>
      </section>
    </DesignShell>
  );
}
