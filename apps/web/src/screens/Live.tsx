import {
  CirclePause,
  PictureInPicture2,
  Pause,
  Play,
  ScanFace,
  Square,
  UserRoundX,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../app/toast';
import { nudgeConfig } from '../config/runtime';
import { answerNudge, initialNudgeTimer, stepNudge } from '../live/nudge-timer';
import { clockAfter } from '../report/format';
import { Nudge } from '../ui/feedback';
import { PostureGlyph } from '../ui/glyphs';
import { useData } from '../app/data';
import { previewState } from '../app/preview';
import { Link, useRouter } from '../app/router';
import { useSentinel } from '../app/sentinel';
import { useLiveMatch, useSession } from '../app/session';
import { copy, t } from '../copy';
import { describeMatch } from '../live/live-state';
import { Mirror } from '../live/Mirror';
import { goodShare } from '../report/engine';
import { duration } from '../report/format';
import { Button } from '../ui/button';
import { Banner } from '../ui/feedback';
import { GroupedList, ListRow } from '../ui/list';
import { Sheet } from '../ui/sheet';
import { Notice, Page } from './Page';

/** The home screen: the mirror with the golden outline, one status line, and the session actions. */
export default function Live() {
  const { data } = useData();
  const { navigate } = useRouter();
  const session = useSession();
  const sentinel = useSentinel();
  const match = useLiveMatch();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const preview = previewState(data.demo);
  const playback = data.library?.playback;
  const toast = useToast();
  const timer = useRef(initialNudgeTimer);
  const [nudging, setNudging] = useState(false);
  const drifting =
    playback !== undefined &&
    match !== null &&
    !session.paused &&
    !session.ended &&
    match < playback.state_from.upright;

  useEffect(() => {
    if (!playback) return;
    timer.current = stepNudge(
      timer.current,
      session.elapsed(),
      drifting,
      playback.nudge_after_seconds,
    );
    setNudging(timer.current.showing);
  }, [drifting, match, playback, session]);

  const answer = (text: string) => {
    if (!playback) return;
    timer.current = answerNudge(
      timer.current,
      session.elapsed(),
      playback.quiet_after_nudge_seconds,
    );
    setNudging(false);
    toast(text);
  };

  if (!data.demo || !playback || match === null) {
    return (
      <Page title={copy.live.title}>
        <Notice
          icon={ScanFace}
          title={copy.states.pending_title}
          body={copy.states.pending_body}
          action={copy.states.pending_action}
          onAction={() => {
            window.location.assign('/?demo=1');
          }}
        />
      </Page>
    );
  }

  // The tally for the latest session of the demo day, from the minutes, not typed in.
  const today = data.buckets.filter((b) => b.day === data.today);
  const lastId = today.at(-1)?.sessionId;
  const last = today.filter((b) => b.sessionId === lastId);
  const sat = last.filter((b) => b.good_s + b.drift_s > 0).length;
  const good = Math.round((goodShare(last) ?? 0) * sat);
  const calibration = data.library?.calibrations.find((c) => c.active);
  const absent = preview === 'absent';
  const s = describeMatch(playback, match, session.paused, copy);

  if (session.ended) {
    return (
      <Page title={copy.live.title}>
        <Notice icon={Square} title={copy.live.ended_title} body={copy.live.ended_body} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={RotateCcw} onClick={session.restart}>
            {copy.live.start}
          </Button>
          <Button variant="quiet" icon={Sun} onClick={() => navigate('/today')}>
            {copy.live.report}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={copy.live.title}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="grid gap-3">
          {preview === 'fallback' && <Banner tone="warning">{copy.live.fallback}</Banner>}
          <div className="relative">
            <Mirror
              match={absent || session.paused ? 0.5 : match}
              label={copy.live.image_label}
              state={absent ? copy.posture.absent : s.word}
              posture={s.posture}
              good={!absent && s.good}
              announce
              aside={{
                label: copy.live.session_label,
                value: t(copy.live.session_value, {
                  good: duration(good, copy.units),
                  total: duration(sat, copy.units),
                }),
              }}
            />
            {absent && (
              <div
                data-theme="dark"
                className="absolute inset-0 grid place-items-center rounded-mirror bg-surface/70 p-6 text-center text-text"
              >
                <div className="grid justify-items-center gap-2">
                  <UserRoundX
                    aria-hidden
                    size={32}
                    strokeWidth={1.75}
                    className="text-text-secondary"
                  />
                  <p className="m-0 font-display text-title2">{copy.live.absent_title}</p>
                  <p className="m-0 text-subhead text-text-secondary">{copy.live.absent_body}</p>
                </div>
              </div>
            )}
            {session.paused && !absent && (
              <div
                data-theme="dark"
                className="pointer-events-none absolute inset-0 grid place-items-center rounded-mirror bg-surface/45"
              >
                <CirclePause aria-hidden size={56} strokeWidth={1.25} className="text-text/80" />
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-5">
          {nudging && (
            <Nudge
              title={t(copy.nudge.titles[playback.drift_class], {
                minutes: nudgeConfig.notify_after_minutes,
              })}
              body={copy.nudge.bodies[playback.drift_class]}
              primary={copy.nudge.primary}
              secondary={t(copy.nudge.secondary, { minutes: nudgeConfig.snooze_minutes })}
              glyph={<PostureGlyph posture={playback.drift_class} />}
              onPrimary={() => answer(copy.nudge.sitting_up)}
              onSecondary={() =>
                answer(t(copy.nudge.snoozed, { time: clockAfter(nudgeConfig.snooze_minutes) }))
              }
            />
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button
              icon={PictureInPicture2}
              onClick={() => (sentinel.supported ? void sentinel.open() : navigate('/sentinel'))}
            >
              {sentinel.isOpen ? copy.sentinel.close : copy.live.open_sentinel}
            </Button>
            <Button
              variant="quiet"
              icon={session.paused ? Play : Pause}
              onClick={session.togglePause}
            >
              {session.paused ? copy.live.resume : copy.live.pause}
            </Button>
          </div>
          <GroupedList title={copy.live.calibration_label} level={2}>
            <ListRow
              label={calibration?.name ?? copy.units.none}
              value={calibration?.camera}
              onPress={() => navigate('/calibrate')}
            />
          </GroupedList>
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="pressable inline-flex min-h-(--touch-min) w-fit items-center gap-2 text-subhead text-text-secondary hover:text-text"
          >
            <Square aria-hidden size={16} strokeWidth={1.75} />
            {copy.live.end}
          </button>
          <p className="m-0 hidden text-footnote text-text-secondary lg:block">
            <Link
              href="/nudges"
              className="text-text-secondary underline decoration-rule underline-offset-4 hover:text-text"
            >
              {copy.nudge.title}
            </Link>
          </p>
        </div>
      </div>
      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title={copy.live.end_title}>
        <p className="mt-0 text-subhead text-text-secondary">{copy.live.end_body}</p>
        <div className="grid gap-2 pb-2 sm:grid-cols-2">
          <Button variant="quiet" onClick={() => setConfirmEnd(false)}>
            {copy.live.end_cancel}
          </Button>
          <Button
            onClick={() => {
              setConfirmEnd(false);
              session.end();
              sentinel.close();
            }}
          >
            {copy.live.end_confirm}
          </Button>
        </div>
      </Sheet>
    </Page>
  );
}
