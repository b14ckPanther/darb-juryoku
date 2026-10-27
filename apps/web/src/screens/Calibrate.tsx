import { Check, RotateCcw, ScanFace } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useData } from '../app/data';
import { useRouter } from '../app/router';
import { useToast } from '../app/toast';
import { settingsConfig } from '../config/runtime';
import { copy, t } from '../copy';
import { poseFixture } from '../demo/seed';
import { GoldenOutline } from '../overlay/GoldenOutline';
import { longDate } from '../report/format';
import { Button } from '../ui/button';
import { cx } from '../ui/cx';
import { GroupedList, ListRow } from '../ui/list';
import { Sheet } from '../ui/sheet';
import { TextField } from '../ui/field';
import { Notice, Page } from './Page';

type Step = 'frame' | 'hold' | 'confirm';
const order: Step[] = ['frame', 'hold', 'confirm'];
const HOLD = settingsConfig.calibration_hold_seconds;

/** The hold countdown: a ring that empties over the hold, with the seconds left in the middle. */
function HoldRing({ left }: { left: number }) {
  const reduce = useReducedMotion();
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative grid size-32 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-text/15"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={cx(
              'text-accent',
              !reduce && 'transition-[stroke-dashoffset] duration-1000 ease-linear',
            )}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - left / HOLD)}
          />
        </svg>
        <span className="num font-display text-display text-text">{left}</span>
      </div>
    </div>
  );
}

export default function Calibrate() {
  const { data, dispatch } = useData();
  const { navigate } = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('frame');
  const [left, setLeft] = useState(HOLD);
  const [naming, setNaming] = useState(false);
  const lib = data.library;
  const camera = lib?.calibrations.find((c) => c.active)?.camera ?? lib?.cameras[0] ?? '';
  const [name, setName] = useState(t(copy.calibrate.default_name, { camera }));

  useEffect(() => {
    if (step !== 'hold') return;
    const id = setTimeout(() => {
      if (left <= 1) setStep('confirm');
      setLeft(left - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [step, left]);

  if (!data.demo || !lib) {
    return (
      <Page title={copy.calibrate.title}>
        <Notice
          icon={ScanFace}
          title={copy.states.pending_title}
          body={copy.states.pending_body}
          action={copy.states.pending_action}
          onAction={() => window.location.assign('/calibrate?demo=1')}
        />
      </Page>
    );
  }

  const n = order.indexOf(step) + 1;
  const text = {
    frame: [copy.calibrate.steps.frame_title, copy.calibrate.steps.frame_body],
    hold: [copy.calibrate.steps.hold_title, t(copy.calibrate.steps.hold_body, { seconds: HOLD })],
    confirm: [copy.calibrate.steps.confirm_title, copy.calibrate.steps.confirm_body],
  }[step];

  return (
    <Page title={copy.calibrate.title}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          data-theme="dark"
          className="relative aspect-[4/3] overflow-hidden rounded-mirror bg-surface text-text shadow-raised"
        >
          <GoldenOutline
            fixture={poseFixture}
            match={step === 'frame' ? 0.55 : 1}
            label={step === 'confirm' ? copy.calibrate.outline_label : copy.calibrate.guide_label}
            className="absolute inset-0"
          />
          {step === 'frame' && (
            <svg
              aria-hidden
              viewBox="0 0 400 300"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 size-full"
            >
              <defs>
                <mask id="guide-cut">
                  <rect width="400" height="300" fill="white" />
                  <ellipse cx="200" cy="82" rx="54" ry="66" fill="black" />
                  <path
                    d="M40 300 C 60 200, 120 178, 200 172 C 280 178, 340 200, 360 300 Z"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="400" height="300" className="fill-surface/55" mask="url(#guide-cut)" />
              <ellipse
                cx="200"
                cy="82"
                rx="54"
                ry="66"
                fill="none"
                className="stroke-outline-ideal/70"
                strokeDasharray="4 6"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M40 300 C 60 200, 120 178, 200 172 C 280 178, 340 200, 360 300"
                fill="none"
                className="stroke-outline-ideal/70"
                strokeDasharray="4 6"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {step === 'hold' && <HoldRing left={left} />}
          <p className="sr-only" aria-live="polite">
            {step === 'hold' ? t(copy.calibrate.seconds_left, { n: left }) : ''}
          </p>
        </div>
        <div className="grid content-start gap-5">
          <div className="grid gap-2">
            <p className="num m-0 text-footnote text-text-secondary">
              {t(copy.calibrate.step_label, { n, total: order.length })}
            </p>
            <h2 className="text-title1">{text[0]}</h2>
            <p className="m-0 text-body text-text-secondary">{text[1]}</p>
          </div>
          <ol aria-hidden className="m-0 flex list-none gap-1.5 p-0">
            {order.map((s, i) => (
              <li
                key={s}
                className={cx(
                  'h-1 flex-1 rounded-control transition-colors',
                  i < n ? 'bg-accent' : 'bg-surface-overlay',
                )}
              />
            ))}
          </ol>
          <div className="grid gap-2">
            {step === 'frame' && (
              <Button onClick={() => setStep('hold')}>{copy.calibrate.ready}</Button>
            )}
            {step === 'hold' && (
              <Button
                variant="quiet"
                onClick={() => {
                  setStep('frame');
                  setLeft(HOLD);
                }}
              >
                {copy.calibrate.cancel}
              </Button>
            )}
            {step === 'confirm' && (
              <>
                <Button icon={Check} onClick={() => setNaming(true)}>
                  {copy.calibrate.use}
                </Button>
                <Button
                  variant="quiet"
                  icon={RotateCcw}
                  onClick={() => {
                    setStep('frame');
                    setLeft(HOLD);
                  }}
                >
                  {copy.calibrate.redo}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 max-w-xl">
        <GroupedList
          title={copy.calibrate.saved_title}
          footer={copy.calibrate.saved_footer}
          level={2}
        >
          {[...lib.calibrations].reverse().map((c) => (
            <ListRow
              key={c.id}
              label={c.name}
              value={
                c.active
                  ? copy.calibrate.in_use
                  : t(copy.calibrate.created, { date: longDate(c.created, copy.locale) })
              }
              onPress={
                c.active
                  ? undefined
                  : () => {
                      dispatch({ type: 'use_calibration', id: c.id });
                      toast(t(copy.calibrate.switched, { name: c.name }));
                    }
              }
            />
          ))}
        </GroupedList>
      </div>
      <Sheet open={naming} onClose={() => setNaming(false)} title={copy.calibrate.save_title}>
        <form
          className="grid gap-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = name.trim() || t(copy.calibrate.default_name, { camera });
            dispatch({
              type: 'add_calibration',
              calibration: { id: `cal-${Date.now()}`, name: clean, camera, created: data.today },
            });
            setNaming(false);
            setStep('frame');
            setLeft(HOLD);
            toast(copy.calibrate.saved);
            navigate('/');
          }}
        >
          <TextField
            label={copy.calibrate.name_label}
            hint={copy.calibrate.name_hint}
            value={name}
            onChange={setName}
          />
          <Button type="submit">{copy.calibrate.save}</Button>
        </form>
      </Sheet>
    </Page>
  );
}
