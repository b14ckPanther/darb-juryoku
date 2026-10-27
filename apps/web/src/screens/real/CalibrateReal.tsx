import { Camera, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useLive } from '../../app/live';
import { useRouter } from '../../app/router';
import { useToast } from '../../app/toast';
import { settingsConfig } from '../../config/runtime';
import { copy, t } from '../../copy';
import { LiveMirror } from '../../live/LiveMirror';
import type { Landmarks } from '../../posture/features';
import { shortDate } from '../../report/format';
import { Button } from '../../ui/button';
import { cx } from '../../ui/cx';
import { TextField } from '../../ui/field';
import { GroupedList, ListRow } from '../../ui/list';
import { Sheet } from '../../ui/sheet';
import { PermissionPrompt } from '../../ui/states';
import { Page } from '../Page';

type Step = 'frame' | 'hold' | 'confirm';
const order: Step[] = ['frame', 'hold', 'confirm'];
const HOLD = settingsConfig.calibration_hold_seconds;

/** Calibrate on the real camera: frame, hold still while landmarks are collected, confirm, save. */
export default function CalibrateReal() {
  const live = useLive();
  const { navigate } = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('frame');
  const [captured, setCaptured] = useState<Landmarks | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const label = live.camera.kind === 'live' ? live.camera.label : '';
  const [name, setName] = useState(t(copy.calibrate.default_name, { camera: label }));
  const running = live.camera.kind === 'live';
  const seen = live.landmarks !== null;

  const startHold = async () => {
    setProblem(null);
    setStep('hold');
    const ideal = await live.hold(HOLD);
    if (!ideal) {
      setProblem(copy.calibrate.hold_failed);
      setStep('frame');
      return;
    }
    setCaptured(ideal);
    setStep('confirm');
  };

  const n = order.indexOf(step) + 1;
  const text = {
    frame: [copy.calibrate.steps.frame_title, copy.calibrate.steps.frame_body],
    hold: [copy.calibrate.steps.hold_title, t(copy.calibrate.steps.hold_body, { seconds: HOLD })],
    confirm: [copy.calibrate.steps.confirm_title, copy.calibrate.steps.confirm_body],
  }[step];

  if (live.camera.kind === 'denied' || live.camera.kind === 'missing') {
    const kind = live.camera.kind;
    return (
      <Page title={copy.calibrate.title}>
        <PermissionPrompt
          state={kind}
          {...copy.welcome.permission[kind]}
          onAction={() => void live.start()}
        />
      </Page>
    );
  }

  return (
    <Page title={copy.calibrate.title}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <LiveMirror ideal={step === 'confirm' ? captured : null}>
          {!running && (
            <div className="absolute inset-0 grid place-items-center">
              <Button
                icon={Camera}
                loading={live.camera.kind === 'requesting'}
                onClick={() => void live.start()}
              >
                {copy.live.camera_on}
              </Button>
            </div>
          )}
          {step === 'hold' && (
            <p
              className="absolute inset-x-0 top-6 m-0 text-center font-display text-title1 text-text"
              aria-live="polite"
            >
              {copy.calibrate.holding}
            </p>
          )}
        </LiveMirror>
        <div className="grid content-start gap-5">
          <div className="grid gap-2">
            <p className="num m-0 text-footnote text-text-secondary">
              {t(copy.calibrate.step_label, { n, total: order.length })}
            </p>
            <h2 className="text-title1">{text[0]}</h2>
            <p className="m-0 text-body text-text-secondary">{text[1]}</p>
            {running && step === 'frame' && !seen && (
              <p className="m-0 text-subhead text-drift-text">{copy.calibrate.need_person}</p>
            )}
            {live.pose.kind === 'failed' && (
              <p className="m-0 text-subhead text-drift-text" role="alert">
                {t(copy.live.pose_failed_body, { detail: live.pose.message })}
              </p>
            )}
            {problem && (
              <p className="m-0 text-subhead text-drift-text" role="alert">
                {problem}
              </p>
            )}
          </div>
          <ol aria-hidden className="m-0 flex list-none gap-1.5 p-0">
            {order.map((s, i) => (
              <li
                key={s}
                className={cx(
                  'h-1 flex-1 rounded-control',
                  i < n ? 'bg-accent' : 'bg-surface-overlay',
                )}
              />
            ))}
          </ol>
          <div className="grid gap-2">
            {step === 'frame' && (
              <Button
                disabled={!running || !seen || live.pose.kind !== 'ready'}
                onClick={() => void startHold()}
              >
                {copy.calibrate.ready}
              </Button>
            )}
            {step === 'confirm' && (
              <>
                <Button icon={Check} onClick={() => setNaming(true)}>
                  {copy.calibrate.use}
                </Button>
                <Button variant="quiet" icon={RotateCcw} onClick={() => setStep('frame')}>
                  {copy.calibrate.redo}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {live.calibrations.length > 0 && (
        <div className="mt-10 max-w-xl">
          <GroupedList
            title={copy.calibrate.saved_title}
            footer={copy.calibrate.saved_footer}
            level={2}
          >
            {[...live.calibrations].reverse().map((c) => (
              <ListRow
                key={c.id}
                label={c.name}
                value={
                  c.active
                    ? copy.calibrate.in_use
                    : t(copy.calibrate.created, { date: shortDate(c.created, copy.locale) })
                }
                onPress={
                  c.active
                    ? undefined
                    : () => {
                        void live.use(c.id);
                        toast(t(copy.calibrate.switched, { name: c.name }));
                      }
                }
              />
            ))}
          </GroupedList>
        </div>
      )}
      <Sheet open={naming} onClose={() => setNaming(false)} title={copy.calibrate.save_title}>
        <form
          className="grid gap-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!captured) return;
            void live
              .save(name.trim() || t(copy.calibrate.default_name, { camera: label }), captured)
              .then(() => {
                setNaming(false);
                setStep('frame');
                toast(copy.calibrate.saved);
                navigate('/');
              });
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
