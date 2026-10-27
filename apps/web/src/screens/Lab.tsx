import { CircleCheck, CircleX, FlaskConical, Gauge } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useData } from '../app/data';
import { previewState } from '../app/preview';
import { useToast } from '../app/toast';
import { copy, t } from '../copy';
import { checkGates, classMetrics } from '../lab/metrics';
import { longDate } from '../report/format';
import { Button } from '../ui/button';
import { ConfusionMatrix } from '../ui/charts';
import { SegmentedControl } from '../ui/controls';
import { cx } from '../ui/cx';
import { Banner } from '../ui/feedback';
import { PostureGlyph } from '../ui/glyphs';
import { GroupedList, ListRow } from '../ui/list';
import { Notice, Page } from './Page';

const toggle = { show: copy.charts.show_table, hide: copy.charts.hide_table };
const two = (n: number) => n.toFixed(2);

/** Proof the model is real: metrics on held-out sessions, the confusion matrix, gates, and latency. */
export default function Lab() {
  const { data, dispatch } = useData();
  const toast = useToast();
  const lib = data.library;
  const preview = previewState(data.demo);
  const active = lib?.models.find((m) => m.active);
  const [viewing, setViewing] = useState<string>(active?.name ?? copy.lab.heuristic);
  const [bench, setBench] = useState<'idle' | 'running' | 'done'>('idle');

  const heuristic = useMemo(() => (lib ? classMetrics(lib.heuristic.confusion) : null), [lib]);
  if (!lib || !heuristic) {
    return (
      <Page title={copy.lab.title}>
        <Notice
          icon={FlaskConical}
          title={copy.states.pending_title}
          body={copy.states.pending_body}
          action={copy.states.pending_action}
          onAction={() => window.location.assign('/lab?demo=1')}
        />
      </Page>
    );
  }

  const label = (m: { name: string; version: string }) => `${m.name} ${m.version}`;
  // The switcher names versions only, so it fits a phone; the heading names the model in full.
  const options = [...lib.models.map((m) => m.version), copy.lab.heuristic];
  const model = lib.models.find((m) => m.version === viewing || m.name === viewing);
  const isHeuristic = !model;
  const confusion = model?.confusion ?? lib.heuristic.confusion;
  const metrics = classMetrics(confusion);
  const slouch = lib.classes.indexOf('slouch');
  const inUse = model ? model.active : !lib.models.some((m) => m.active);
  const className = (c: string) => (copy.classes as Record<string, string>)[c] ?? c;
  const gates = model
    ? checkGates(
        {
          macroF1: metrics.macroF1,
          slouchRecall: metrics.perClass[slouch]?.recall ?? 0,
          heuristicMacroF1: heuristic.macroF1,
          wasmP95: model.latency_ms.wasm.p95,
        },
        lib.gates,
      )
    : [];
  const vs = metrics.macroF1 - heuristic.macroF1;

  const runBench = () => {
    setBench('running');
    window.setTimeout(() => setBench('done'), 900);
  };

  return (
    <Page title={copy.lab.title}>
      <p className="m-0 mb-8 max-w-[52ch] text-body text-text-secondary">{copy.lab.intro}</p>
      <div className="grid gap-10">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            label={copy.lab.switcher_label}
            options={options}
            value={model ? model.version : copy.lab.heuristic}
            onChange={(v) => {
              setViewing(v);
              setBench('idle');
            }}
          />
          {inUse ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-surface-overlay px-3 text-footnote font-medium">
              <CircleCheck aria-hidden size={16} strokeWidth={1.75} className="text-accent-text" />
              {copy.lab.in_use}
            </span>
          ) : (
            <Button
              variant="quiet"
              onClick={() => {
                dispatch({ type: 'use_model', name: model?.name ?? null });
                toast(t(copy.lab.now_using, { name: model ? label(model) : copy.lab.heuristic }));
              }}
            >
              {t(copy.lab.use, { name: model ? label(model) : copy.lab.heuristic })}
            </Button>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="grid content-start gap-8">
            <div className="grid gap-1">
              <h2 className="font-ui text-subhead font-medium text-text-secondary">
                {model ? label(model) : copy.lab.heuristic}
              </h2>
              <p className="num m-0 font-display text-hero text-accent-text">
                {two(metrics.macroF1)}
              </p>
              <p className="m-0 text-subhead text-text-secondary">{copy.lab.facts.macro_f1}</p>
            </div>
            {isHeuristic ? (
              <p className="m-0 text-subhead text-text-secondary">{copy.lab.heuristic_note}</p>
            ) : (
              <GroupedList level={2}>
                <ListRow
                  label={copy.lab.facts.slouch_recall}
                  value={two(metrics.perClass[slouch]?.recall ?? 0)}
                />
                <ListRow
                  label={copy.lab.facts.vs_heuristic}
                  value={t(copy.lab.vs_value, {
                    sign: vs >= 0 ? copy.units.plus : copy.units.minus,
                    n: two(Math.abs(vs)),
                  })}
                />
                <ListRow label={copy.lab.facts.data} value={model.data_version} />
                <ListRow
                  label={copy.lab.facts.released}
                  value={longDate(model.released, copy.locale)}
                />
                <ListRow
                  label={copy.lab.facts.size}
                  value={t(copy.units.kilobytes, { n: model.size_kb })}
                />
              </GroupedList>
            )}
            {model && (
              <section aria-labelledby="gates" className="grid gap-2">
                <h2
                  id="gates"
                  className="px-4 font-ui text-footnote font-medium text-text-secondary"
                >
                  {copy.lab.gates_title}
                </h2>
                <ul className="m-0 grid list-none overflow-hidden rounded-container bg-surface-raised p-0 [&>li+li]:border-t [&>li+li]:border-rule">
                  {gates.map((g) => (
                    <li
                      key={g.id}
                      className="flex min-h-(--touch-min) items-center gap-3 px-4 py-2"
                    >
                      {g.pass ? (
                        <CircleCheck
                          aria-hidden
                          size={20}
                          strokeWidth={1.75}
                          className="shrink-0 text-accent-text"
                        />
                      ) : (
                        <CircleX
                          aria-hidden
                          size={20}
                          strokeWidth={1.75}
                          className="shrink-0 text-drift-text"
                        />
                      )}
                      <span className="flex-1 text-subhead">
                        {t(copy.lab.gates[g.id], {
                          value: g.id === 'wasm_p95_ms' ? g.threshold : two(g.threshold),
                        })}
                      </span>
                      <span
                        className={cx(
                          'text-footnote font-medium',
                          g.pass ? 'text-text-secondary' : 'text-drift-text',
                        )}
                      >
                        {g.pass ? copy.lab.pass : copy.lab.fail}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <div className="grid content-start gap-8">
            <section className="rounded-container bg-surface-raised p-4 sm:p-5">
              <ConfusionMatrix
                title={copy.lab.confusion_title}
                classes={lib.classes}
                labels={copy.classes}
                matrix={confusion}
                axis={{ actual: copy.lab.actual, predicted: copy.lab.predicted }}
                toggle={toggle}
              />
            </section>
            <section aria-labelledby="per-class" className="grid gap-3">
              <h2
                id="per-class"
                className="px-4 font-ui text-footnote font-medium text-text-secondary"
              >
                {copy.lab.compare_title}
              </h2>
              <div className="overflow-x-auto rounded-container bg-surface-raised">
                <table className="num w-full border-collapse text-subhead">
                  <thead>
                    <tr className="text-left text-footnote text-text-secondary">
                      <th scope="col" className="px-3 py-2.5 sm:px-4 font-medium">
                        {copy.lab.class}
                      </th>
                      <th scope="col" className="px-2 py-2.5 sm:px-3 font-medium">
                        {copy.lab.precision}
                      </th>
                      <th scope="col" className="px-2 py-2.5 sm:px-3 font-medium">
                        {copy.lab.recall}
                      </th>
                      <th scope="col" className="px-2 py-2.5 sm:px-3 font-medium">
                        {copy.lab.f1}
                      </th>
                      {!isHeuristic && (
                        <th scope="col" className="px-3 py-2.5 sm:px-4 font-medium">
                          {copy.lab.compare_heuristic}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lib.classes.map((c, i) => {
                      const m = metrics.perClass[i];
                      const h = heuristic.perClass[i];
                      return (
                        <tr key={c} className="border-t border-rule">
                          <th scope="row" className="px-3 py-2.5 sm:px-4 text-left font-normal">
                            <span className="flex items-center gap-2">
                              <PostureGlyph posture={c} size={18} />
                              {className(c)}
                            </span>
                          </th>
                          <td className="px-2 py-2.5 sm:px-3">{two(m?.precision ?? 0)}</td>
                          <td className="px-2 py-2.5 sm:px-3">{two(m?.recall ?? 0)}</td>
                          <td className="px-2 py-2.5 sm:px-3 font-medium">{two(m?.f1 ?? 0)}</td>
                          {!isHeuristic && (
                            <td className="px-3 py-2.5 sm:px-4 text-text-secondary">
                              {two(h?.f1 ?? 0)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            {model && (
              <section aria-labelledby="bench" className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4">
                  <h2 id="bench" className="font-ui text-footnote font-medium text-text-secondary">
                    {copy.lab.bench_title}
                  </h2>
                  <Button
                    variant="quiet"
                    icon={Gauge}
                    loading={bench === 'running'}
                    onClick={runBench}
                  >
                    {bench === 'running'
                      ? t(copy.lab.bench_running, { runs: model.latency_ms.runs })
                      : copy.lab.bench_run}
                  </Button>
                </div>
                {preview === 'nogpu' && <Banner tone="warning">{copy.lab.webgpu_missing}</Banner>}
                {bench === 'done' && (
                  <div className="grid gap-2">
                    <div className="overflow-x-auto rounded-container bg-surface-raised">
                      <table className="num w-full border-collapse text-subhead">
                        <thead>
                          <tr className="text-left text-footnote text-text-secondary">
                            <td className="px-3 py-2.5 sm:px-4" />
                            {(['p50', 'p95', 'p99'] as const).map((p) => (
                              <th key={p} scope="col" className="px-2 py-2.5 sm:px-3 font-medium">
                                {copy.lab[p]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(['webgpu', 'wasm'] as const)
                            .filter((b) => !(b === 'webgpu' && preview === 'nogpu'))
                            .map((b) => (
                              <tr key={b} className="border-t border-rule">
                                <th
                                  scope="row"
                                  className="px-3 py-2.5 sm:px-4 text-left font-normal"
                                >
                                  {copy.lab[b]}
                                </th>
                                {(['p50', 'p95', 'p99'] as const).map((p) => (
                                  <td key={p} className="px-2 py-2.5 sm:px-3">
                                    {t(copy.units.ms, { n: model.latency_ms[b][p] })}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="m-0 px-4 text-footnote text-text-secondary">
                      {t(copy.lab.bench_note, { runs: model.latency_ms.runs })}{' '}
                      {data.demo && copy.lab.bench_demo}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
