import { Circle, Database, Download, Square, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../app/data';
import { downloadJson } from '../app/download';
import { useToast } from '../app/toast';
import { protocolConfig } from '../config/runtime';
import { copy, t } from '../copy';
import type { Recording } from '../data/types';
import { duration, longDate } from '../report/format';
import { Button } from '../ui/button';
import { SegmentedControl, Slider } from '../ui/controls';
import { cx } from '../ui/cx';
import { PostureGlyph } from '../ui/glyphs';
import { GroupedList, SwipeRow } from '../ui/list';
import { Sheet } from '../ui/sheet';
import { Notice, Page } from './Page';

const steps = protocolConfig.steps;
const totalSeconds = steps.reduce((s, x) => s + x.seconds, 0);
const optionLabel = (id: string) => (copy.studio.options as Record<string, string>)[id] ?? id;
const stepLabel = (id: string) => (copy.studio.steps as Record<string, string>)[id] ?? id;

/** Where the guided protocol is after `elapsed` seconds: the step and the seconds left in it. */
function stepAt(elapsed: number) {
  let t0 = 0;
  for (const [i, s] of steps.entries()) {
    if (elapsed < t0 + s.seconds) return { index: i, left: Math.ceil(t0 + s.seconds - elapsed) };
    t0 += s.seconds;
  }
  return null;
}

/** Record labelled landmarks to train the model: guided protocol or passive prompts. Never images. */
export default function Studio() {
  const { data, dispatch } = useData();
  const toast = useToast();
  const lib = data.library;
  const [mode, setMode] = useState(copy.studio.guided);
  const [lighting, setLighting] = useState(protocolConfig.lighting[0] ?? '');
  const [chair, setChair] = useState(protocolConfig.chairs[0] ?? '');
  const [cam, setCam] = useState(protocolConfig.cameras[0] ?? '');
  const [prompts, setPrompts] = useState(protocolConfig.passive.prompts_per_hour.default);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const speed = lib?.studio_speed ?? 1;
  const guided = mode === copy.studio.guided;

  const recording = elapsed !== null;
  // Read at save time, so changing the metadata mid-recording does not restart the protocol.
  const metaRef = useRef({ lighting, chair, camera: cam });
  useEffect(() => {
    metaRef.current = { lighting, chair, camera: cam };
  }, [lighting, chair, cam]);

  const save = useCallback(
    (protocol: Recording['protocol'], seconds: number) => {
      const kbPerSecond = lib?.studio_kb_per_second ?? 1;
      dispatch({
        type: 'add_recording',
        recording: {
          id: `rec-${Date.now()}`,
          date: data.today,
          protocol,
          seconds: Math.max(1, Math.round(seconds)),
          size_kb: Math.max(1, Math.round(seconds * kbPerSecond)),
          ...metaRef.current,
        },
      });
      setElapsed(null);
      toast(copy.studio.saved);
    },
    [lib, dispatch, data.today, toast],
  );

  const at = elapsed === null ? null : stepAt(elapsed);
  const clock = useRef(0);
  useEffect(() => {
    if (!recording) return;
    clock.current = 0;
    const id = window.setInterval(() => {
      clock.current += speed / 4;
      if (guided && clock.current >= totalSeconds) {
        window.clearInterval(id);
        save('guided', totalSeconds);
      } else setElapsed(clock.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [recording, speed, guided, save]);

  if (!lib) {
    return (
      <Page title={copy.studio.title}>
        <Notice
          icon={Database}
          title={copy.states.pending_title}
          body={copy.states.pending_body}
          action={copy.states.pending_action}
          onAction={() => window.location.assign('/studio?demo=1')}
        />
      </Page>
    );
  }

  const step = at ? steps[at.index] : undefined;
  const meta = (label: string, options: string[], value: string, set: (v: string) => void) => (
    <div className="grid gap-2">
      <span className="text-subhead font-medium">{label}</span>
      <SegmentedControl
        label={label}
        options={options.map(optionLabel)}
        value={optionLabel(value)}
        onChange={(l) => set(options.find((o) => optionLabel(o) === l) ?? value)}
      />
    </div>
  );

  return (
    <Page title={copy.studio.title}>
      <p className="m-0 mb-8 max-w-[52ch] text-body text-text-secondary">{copy.studio.intro}</p>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="grid content-start gap-6">
          <SegmentedControl
            label={copy.studio.mode_label}
            options={[copy.studio.guided, copy.studio.passive]}
            value={mode}
            onChange={(m) => !recording && setMode(m)}
          />
          {guided ? (
            <div className="grid gap-4">
              <div className="grid gap-1">
                <h2 className="text-title2">{copy.studio.guided_title}</h2>
                <p className="m-0 text-subhead text-text-secondary">
                  {t(copy.studio.guided_body, { minutes: Math.round(totalSeconds / 60) })}
                </p>
              </div>
              <ol className="m-0 grid list-none gap-0 overflow-hidden rounded-container bg-surface-raised p-0">
                {steps.map((s, i) => {
                  const current = recording && at?.index === i;
                  const done = recording && at !== null && i < at.index;
                  return (
                    <li
                      key={s.id}
                      aria-current={current ? 'step' : undefined}
                      className={cx(
                        'flex min-h-14 items-center gap-3 border-rule px-4 py-2 [&+&]:border-t',
                        current && 'bg-surface-overlay',
                      )}
                    >
                      <span
                        className={cx(
                          'grid size-9 place-items-center rounded-full',
                          current ? 'text-accent-text' : done ? 'text-text' : 'text-text-secondary',
                        )}
                      >
                        <PostureGlyph posture={s.label} size={22} />
                      </span>
                      <span
                        className={cx(
                          'flex-1 text-body',
                          !current && !done && recording && 'text-text-secondary',
                        )}
                      >
                        {stepLabel(s.id)}
                      </span>
                      <span className="num text-subhead text-text-secondary">
                        {current && at
                          ? t(copy.studio.time_left, { n: at.left })
                          : t(copy.units.seconds, { n: s.seconds })}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-1">
                <h2 className="text-title2">{copy.studio.passive_title}</h2>
                <p className="m-0 text-subhead text-text-secondary">{copy.studio.passive_body}</p>
              </div>
              <Slider
                label={copy.studio.prompts_label}
                min={protocolConfig.passive.prompts_per_hour.min}
                max={protocolConfig.passive.prompts_per_hour.max}
                value={prompts}
                valueLabels={Array.from(
                  {
                    length:
                      protocolConfig.passive.prompts_per_hour.max -
                      protocolConfig.passive.prompts_per_hour.min +
                      1,
                  },
                  (_, i) =>
                    t(copy.studio.prompts_value, {
                      n: protocolConfig.passive.prompts_per_hour.min + i,
                    }),
                )}
                onChange={setPrompts}
              />
            </div>
          )}
          {data.demo && guided && (
            <p className="m-0 text-footnote text-text-secondary">
              {t(copy.studio.demo_speed, { n: speed })}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {recording ? (
              <>
                <Button
                  variant="destructive"
                  icon={Square}
                  onClick={() => {
                    if (guided) {
                      setElapsed(null);
                      toast(copy.studio.stopped);
                    } else save('passive', elapsed ?? 0);
                  }}
                >
                  {copy.studio.stop}
                </Button>
                <p className="m-0 flex items-center gap-2 text-subhead" aria-live="polite">
                  <Circle
                    aria-hidden
                    size={10}
                    className="fill-danger text-danger motion-safe:animate-pulse"
                  />
                  {copy.studio.recording}
                  {guided && step && (
                    <span className="text-text-secondary">
                      {t(copy.studio.step_label, { n: (at?.index ?? 0) + 1, total: steps.length })}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <Button icon={Circle} onClick={() => setElapsed(0)}>
                {copy.studio.start}
              </Button>
            )}
          </div>
        </section>
        <section
          aria-labelledby="meta"
          className="grid content-start gap-5 rounded-container bg-surface-raised p-5"
        >
          <h2 id="meta" className="text-title3">
            {copy.studio.metadata_title}
          </h2>
          {meta(copy.studio.lighting, protocolConfig.lighting, lighting, setLighting)}
          {meta(copy.studio.chair, protocolConfig.chairs, chair, setChair)}
          {meta(copy.studio.camera, protocolConfig.cameras, cam, setCam)}
        </section>
      </div>

      <div className="mt-12 grid max-w-3xl gap-4">
        {lib.recordings.length === 0 ? (
          <Notice
            icon={Database}
            title={copy.studio.empty_title}
            body={copy.studio.empty_body}
            action={copy.studio.empty_action}
            onAction={() => {
              setMode(copy.studio.guided);
              setElapsed(0);
            }}
          />
        ) : (
          <>
            <GroupedList
              title={copy.studio.recordings_title}
              footer={copy.history.swipe_hint}
              level={2}
            >
              {[...lib.recordings].reverse().map((r) => {
                const name = t(copy.studio.recording_row, {
                  date: longDate(r.date, copy.locale),
                  protocol:
                    r.protocol === 'guided'
                      ? copy.studio.protocol_guided
                      : copy.studio.protocol_passive,
                });
                const act = (action: string) =>
                  t(copy.history.swipe_action_name, { action, row: name });
                return (
                  <SwipeRow
                    key={r.id}
                    label={name}
                    value={t(copy.studio.recording_value, {
                      duration: duration(r.seconds / 60, copy.units),
                      size: t(copy.units.kilobytes, { n: r.size_kb }),
                    })}
                    actions={[
                      {
                        label: copy.studio.export,
                        accessibleName: act(copy.studio.export),
                        icon: Download,
                        tone: 'neutral',
                        onPress: () => {
                          downloadJson(`${r.id}.manifest.json`, { demo: data.demo, ...r });
                          toast(copy.studio.exported);
                        },
                      },
                      {
                        label: copy.studio.delete,
                        accessibleName: act(copy.studio.delete),
                        icon: Trash2,
                        tone: 'danger',
                        onPress: () => {
                          dispatch({ type: 'delete_recording', id: r.id });
                          toast(copy.studio.deleted);
                        },
                      },
                    ]}
                  />
                );
              })}
            </GroupedList>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="quiet"
                icon={Download}
                onClick={() => {
                  downloadJson('recordings.manifest.json', {
                    demo: data.demo,
                    recordings: lib.recordings,
                  });
                  toast(copy.studio.exported);
                }}
              >
                {copy.studio.export_all}
              </Button>
              <Button variant="destructive" icon={Trash2} onClick={() => setClearing(true)}>
                {copy.studio.clear}
              </Button>
            </div>
          </>
        )}
      </div>
      <Sheet open={clearing} onClose={() => setClearing(false)} title={copy.studio.clear_title}>
        <p className="mt-0 text-subhead text-text-secondary">{copy.studio.clear_body}</p>
        <div className="grid gap-2 pb-2 sm:grid-cols-2">
          <Button variant="quiet" onClick={() => setClearing(false)}>
            {copy.studio.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              dispatch({ type: 'clear_recordings' });
              setClearing(false);
              toast(copy.studio.cleared);
            }}
          >
            {copy.studio.clear_confirm}
          </Button>
        </div>
      </Sheet>
    </Page>
  );
}
