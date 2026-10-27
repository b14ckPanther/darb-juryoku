import { useId, useState, type ReactNode } from 'react';
import { cx } from './cx';

// Charts follow the dataviz rules: one meaning per colour (gold good, amber drift), one sequential hue
// for magnitude, tabular figures, selective direct labels, and every chart readable as a table.

interface FrameProps {
  title: string;
  toggle: { show: string; hide: string };
  table: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}

export function ChartFrame({ title, toggle, table, legend, children }: FrameProps) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();
  const tableId = useId();
  return (
    <figure aria-labelledby={titleId} className="m-0 grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <figcaption id={titleId} className="text-subhead font-medium">
          {title}
        </figcaption>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((v) => !v)}
          className="min-h-(--touch-min) text-footnote text-accent-text underline decoration-rule underline-offset-4 hover:decoration-accent-text"
        >
          {showTable ? toggle.hide : toggle.show}
        </button>
      </div>
      {children}
      {legend}
      <div id={tableId} hidden={!showTable} className="overflow-x-auto">
        {table}
      </div>
    </figure>
  );
}

const tableClass =
  'num w-full border-collapse text-footnote [&_td]:py-1.5 [&_td]:pr-4 [&_th]:py-1.5 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-text-secondary [&_tr+tr]:border-t [&_tr+tr]:border-rule';

type RibbonState = 'G' | 'D' | 'A';

interface RibbonProps {
  title: string;
  start: string;
  bucketMinutes: number;
  states: string;
  labels: Record<RibbonState, string>;
  toggle: { show: string; hide: string };
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * The day as a ribbon of time buckets. Good and drift are full-height marks in gold and amber; away is a
 * short neutral tick, so the three states differ in shape as well as colour.
 */
export function TimelineRibbon({
  title,
  start,
  bucketMinutes,
  states,
  labels,
  toggle,
}: RibbonProps) {
  const [h = '0', m = '0'] = start.split(':');
  const startMin = Number(h) * 60 + Number(m);
  const buckets = [...states] as RibbonState[];
  const endMin = startMin + buckets.length * bucketMinutes;
  const ticks = [startMin, Math.round((startMin + endMin) / 2 / 60) * 60, endMin];

  const hours = new Map<number, Record<RibbonState, number>>();
  buckets.forEach((s, i) => {
    const hour = Math.floor((startMin + i * bucketMinutes) / 60);
    const row = hours.get(hour) ?? { G: 0, D: 0, A: 0 };
    row[s] += bucketMinutes;
    hours.set(hour, row);
  });

  const table = (
    <table className={tableClass}>
      <thead>
        <tr>
          <td />
          {(['G', 'D', 'A'] as const).map((s) => (
            <th scope="col" key={s}>
              {labels[s]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...hours].map(([hour, row]) => (
          <tr key={hour}>
            <th scope="row">{clock(hour * 60)}</th>
            <td>{row.G} min</td>
            <td>{row.D} min</td>
            <td>{row.A} min</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const legend = (
    <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-footnote text-text-secondary">
      {(['G', 'D', 'A'] as const).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span
            aria-hidden
            className={cx(
              'inline-block w-2.5 rounded-[2px]',
              s === 'A' ? 'h-1 bg-text-secondary/50' : 'h-3',
              s === 'G' && 'bg-accent',
              s === 'D' && 'bg-drift',
            )}
          />
          {labels[s]}
        </li>
      ))}
    </ul>
  );

  return (
    <ChartFrame title={title} toggle={toggle} table={table} legend={legend}>
      <div>
        <div
          aria-hidden
          className="grid h-10 items-end gap-px"
          style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          {buckets.map((s, i) => (
            <span
              key={i}
              title={`${clock(startMin + i * bucketMinutes)} ${labels[s]}`}
              className={cx(
                'block rounded-[1.5px]',
                s === 'G' && 'h-full bg-accent',
                s === 'D' && 'h-full bg-drift',
                s === 'A' && 'h-1 bg-text-secondary/40',
              )}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="num mt-1.5 flex justify-between text-caption text-text-secondary"
        >
          {ticks.map((t) => (
            <span key={t}>{clock(t)}</span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

interface BarsProps {
  title: string;
  bars: { label: string; value: number }[];
  unit: string;
  toggle: { show: string; hide: string };
}

/** Daily share of good posture. No background tracks; only the latest day is labelled directly. */
export function BarChart({ title, bars, unit, toggle }: BarsProps) {
  const last = bars.length - 1;
  const table = (
    <table className={tableClass}>
      <tbody>
        {bars.map((b) => (
          <tr key={b.label}>
            <th scope="row">{b.label}</th>
            <td>
              {b.value}
              {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartFrame title={title} toggle={toggle} table={table}>
      <div aria-hidden>
        <div className="flex h-36 items-end gap-1 border-b border-rule">
          {bars.map((b, i) => (
            <div
              key={b.label}
              className="relative flex h-full flex-1 flex-col justify-end"
              title={`${b.label}: ${b.value}${unit}`}
            >
              {i === last && (
                <span
                  className="num absolute inset-x-0 text-center text-caption font-medium text-accent-text"
                  style={{ bottom: `calc(${b.value}% + 4px)` }}
                >
                  {b.value}
                  {unit}
                </span>
              )}
              <span
                className={cx(
                  'block rounded-t-[3px]',
                  i === last ? 'bg-accent' : 'bg-text-secondary/35',
                )}
                style={{ height: `${b.value}%` }}
              />
            </div>
          ))}
        </div>
        <div className="num mt-1.5 flex justify-between text-caption text-text-secondary">
          <span>{bars[0]?.label}</span>
          <span>{bars[last]?.label}</span>
        </div>
      </div>
    </ChartFrame>
  );
}

interface HeatmapProps {
  title: string;
  rows: string[];
  columns: string[];
  /** Null where there is no data (nobody sat); such cells are outlined, never shaded as zero. */
  values: (number | null)[][];
  unit: string;
  toggle: { show: string; hide: string };
  emptyLabel?: string;
}

const ramp = (t: number) =>
  `color-mix(in oklab, var(--accent) ${Math.round(22 + t * 78)}%, var(--surface-raised))`;

/** Hour by weekday, one sequential gold ramp from faint (low) to full (high). */
export function Heatmap({
  title,
  rows,
  columns,
  values,
  unit,
  toggle,
  emptyLabel = '',
}: HeatmapProps) {
  const flat = values.flat().filter((v): v is number => v !== null);
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const t = (v: number) => (max === min ? 1 : (v - min) / (max - min));
  const table = (
    <table className={tableClass}>
      <thead>
        <tr>
          <td />
          {columns.map((c) => (
            <th scope="col" key={c}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r}>
            <th scope="row">{r}</th>
            {(values[i] ?? []).map((v, j) => (
              <td key={j}>{v ?? emptyLabel}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  const legend = (
    <div aria-hidden className="num flex items-center gap-2 text-caption text-text-secondary">
      <span>
        {min}
        {unit}
      </span>
      <span
        className="h-2 w-28 rounded-control"
        style={{ background: `linear-gradient(90deg, ${ramp(0)}, ${ramp(1)})` }}
      />
      <span>
        {max}
        {unit}
      </span>
    </div>
  );
  return (
    <ChartFrame title={title} toggle={toggle} table={table} legend={legend}>
      <div
        aria-hidden
        className="grid gap-[3px] text-caption text-text-secondary"
        style={{ gridTemplateColumns: `2.25rem repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        <span />
        {columns.map((c) => (
          <span key={c} className="num text-center">
            {c}
          </span>
        ))}
        {rows.map((r, i) => (
          <Row key={r} label={r}>
            {(values[i] ?? []).map((v, j) =>
              v === null ? (
                <span
                  key={j}
                  title={`${r} ${columns[j] ?? ''}: ${emptyLabel}`}
                  className="aspect-square rounded-[3px] border border-dashed border-rule"
                />
              ) : (
                <span
                  key={j}
                  title={`${r} ${columns[j] ?? ''}: ${v}${unit}`}
                  className="aspect-square rounded-[3px]"
                  style={{ background: ramp(t(v)) }}
                />
              ),
            )}
          </Row>
        ))}
      </div>
    </ChartFrame>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="self-center">{label}</span>
      {children}
    </>
  );
}

interface ConfusionProps {
  title: string;
  classes: string[];
  labels: Record<string, string>;
  matrix: number[][];
  axis: { actual: string; predicted: string };
  toggle: { show: string; hide: string };
}

/** Rows are the actual class, columns the prediction. Shade is the row share; the count is printed. */
export function ConfusionMatrix({ title, classes, labels, matrix, axis, toggle }: ConfusionProps) {
  const name = (c: string) => labels[c] ?? c;
  const table = (
    <table className={tableClass}>
      <thead>
        <tr>
          <th scope="col">
            {axis.actual} / {axis.predicted}
          </th>
          {classes.map((c) => (
            <th scope="col" key={c}>
              {name(c)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {classes.map((c, i) => (
          <tr key={c}>
            <th scope="row">{name(c)}</th>
            {(matrix[i] ?? []).map((v, j) => (
              <td key={j}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartFrame title={title} toggle={toggle} table={table}>
      <div aria-hidden className="grid grid-cols-[auto_1fr] gap-2 text-caption text-text-secondary">
        <span />
        <span className="text-center">{axis.predicted}</span>
        <span className="self-center [writing-mode:vertical-rl] rotate-180">{axis.actual}</span>
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `6.5rem repeat(${classes.length}, minmax(0, 1fr))` }}
        >
          <span />
          {classes.map((c) => (
            <span key={c} className="truncate text-center">
              {name(c)}
            </span>
          ))}
          {classes.map((c, i) => {
            const row = matrix[i] ?? [];
            const total = row.reduce((a, b) => a + b, 0) || 1;
            return (
              <Row key={c} label={name(c)}>
                {row.map((v, j) => {
                  const share = v / total;
                  return (
                    <span
                      key={j}
                      className={cx(
                        'num grid aspect-[4/3] place-items-center rounded-[3px] text-footnote font-medium',
                        share > 0.5 ? 'text-on-accent' : 'text-text',
                      )}
                      style={{
                        background: `color-mix(in oklab, var(--accent-fill) ${Math.round(8 + share * 92)}%, var(--surface-raised))`,
                      }}
                    >
                      {v}
                    </span>
                  );
                })}
              </Row>
            );
          })}
        </div>
      </div>
    </ChartFrame>
  );
}
