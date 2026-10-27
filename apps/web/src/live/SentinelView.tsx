import { Pause, Play } from 'lucide-react';
import { useData } from '../app/data';
import { useLiveMatch, useSession } from '../app/session';
import { copy } from '../copy';
import { IconButton } from '../ui/button';
import { describeMatch } from './live-state';
import { Mirror } from './Mirror';

/** The sentinel: a mini mirror, one word and a pause button. Rendered in the PiP window and as a preview. */
export function SentinelView() {
  const { data } = useData();
  const session = useSession();
  const match = useLiveMatch();
  const playback = data.library?.playback;
  if (!playback || match === null) return null;
  const s = describeMatch(playback, match, session.paused, copy);
  return (
    <div className="relative size-full">
      <Mirror
        size="mini"
        match={session.paused ? 0.5 : match}
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
