import { Pause, Play } from 'lucide-react';
import { useData } from '../app/data';
import { useLive } from '../app/live';
import { describeLive } from './live-words';
import { LiveMirror } from './LiveMirror';
import { useLiveMatch, useSession } from '../app/session';
import { copy } from '../copy';
import { IconButton } from '../ui/button';
import { describeMatch } from './live-state';
import { Mirror } from './Mirror';

/** The sentinel: a mini mirror, one word and a pause button. Rendered in the PiP window and as a preview. */
export function SentinelView({ view }: { view?: Window }) {
  const { data } = useData();
  if (!data.demo) return <RealSentinel />;
  return <DemoSentinel view={view} />;
}

function RealSentinel() {
  const live = useLive();
  if (!live.calibration || live.camera.kind !== 'live') return null;
  const s = live.step ? describeLive(live.step.state, live.paused, copy) : null;
  return (
    <div className="relative size-full">
      <LiveMirror size="mini" ideal={live.calibration.landmarks} state={s} />
      <IconButton
        icon={live.paused ? Play : Pause}
        label={live.paused ? copy.live.resume : copy.live.pause}
        onClick={live.togglePause}
        tone="filled"
        data-theme="dark"
        className="absolute right-1.5 bottom-1.5 bg-surface-overlay/80 text-text"
      />
    </div>
  );
}

function DemoSentinel({ view }: { view?: Window }) {
  const { data } = useData();
  const session = useSession();
  const match = useLiveMatch(view);
  const playback = data.library?.playback;
  if (!playback || match === null) return null;
  const s = describeMatch(playback, match, session.paused, copy);
  return (
    <div className="relative size-full">
      <Mirror
        size="mini"
        match={session.paused ? playback.match_when_still : match}
        label={copy.live.image_label}
        state={s.word}
        posture={s.posture}
        good={s.good}
      />
      <IconButton
        icon={session.paused ? Play : Pause}
        label={session.paused ? copy.live.resume : copy.live.pause}
        onClick={session.togglePause}
        tone="filled"
        data-theme="dark"
        className="absolute right-1.5 bottom-1.5 bg-surface-overlay/80 text-text"
      />
    </div>
  );
}
