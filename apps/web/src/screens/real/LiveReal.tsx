import {
  Camera,
  CircleAlert,
  Pause,
  PictureInPicture2,
  Play,
  ScanFace,
  UserRoundX,
} from 'lucide-react';
import { useLive } from '../../app/live';
import { useRouter } from '../../app/router';
import { useSentinel } from '../../app/sentinel';
import { copy, t } from '../../copy';
import { describeLive } from '../../live/live-words';
import { LiveMirror } from '../../live/LiveMirror';
import { Button } from '../../ui/button';
import { GroupedList, ListRow } from '../../ui/list';
import { Notice, Page } from '../Page';

/** The live mirror on the real camera: heuristic posture, golden outline, sentinel and pause. */
export default function LiveReal() {
  const live = useLive();
  const sentinel = useSentinel();
  const { navigate } = useRouter();

  if (!live.calibration) {
    return (
      <Page title={copy.live.title}>
        <Notice
          icon={ScanFace}
          title={copy.live.calibrate_first_title}
          body={copy.live.calibrate_first_body}
          action={copy.live.calibrate_first_action}
          href="/calibrate"
        />
      </Page>
    );
  }

  if (live.pose.kind === 'failed') {
    return (
      <Page title={copy.live.title}>
        <Notice
          icon={CircleAlert}
          tone="warning"
          title={copy.live.pose_failed_title}
          body={t(copy.live.pose_failed_body, { detail: live.pose.message })}
        />
      </Page>
    );
  }

  const running = live.camera.kind === 'live';
  const state = live.step ? describeLive(live.step.state, live.paused, copy) : null;
  const absent = live.step?.state === 'absent';

  return (
    <Page title={copy.live.title}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="relative">
          <LiveMirror ideal={live.calibration.landmarks} state={running ? state : null} announce>
            {!running && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div className="grid justify-items-center gap-3">
                  <Camera
                    aria-hidden
                    size={32}
                    strokeWidth={1.75}
                    className="text-text-secondary"
                  />
                  <p className="m-0 font-display text-title2">{copy.live.camera_off_title}</p>
                  <p className="m-0 max-w-[34ch] text-subhead text-text-secondary">
                    {live.camera.kind === 'requesting'
                      ? copy.live.starting
                      : copy.live.camera_off_body}
                  </p>
                </div>
              </div>
            )}
            {running && absent && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <UserRoundX
                  aria-hidden
                  size={40}
                  strokeWidth={1.5}
                  className="text-text-secondary"
                />
              </div>
            )}
          </LiveMirror>
          {running && live.pose.kind === 'loading' && (
            <p className="m-0 mt-2 text-footnote text-text-secondary" role="status">
              {copy.live.starting}
            </p>
          )}
        </div>
        <div className="grid gap-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {running ? (
              <>
                <Button
                  icon={PictureInPicture2}
                  onClick={() =>
                    sentinel.isOpen
                      ? sentinel.close()
                      : sentinel.supported
                        ? void sentinel.open()
                        : navigate('/sentinel')
                  }
                >
                  {sentinel.isOpen ? copy.sentinel.close : copy.live.open_sentinel}
                </Button>
                <Button
                  variant="quiet"
                  icon={live.paused ? Play : Pause}
                  onClick={live.togglePause}
                >
                  {live.paused ? copy.live.resume : copy.live.pause}
                </Button>
              </>
            ) : (
              <Button
                icon={Camera}
                loading={live.camera.kind === 'requesting'}
                onClick={() => void live.start()}
              >
                {copy.live.camera_on}
              </Button>
            )}
          </div>
          <GroupedList title={copy.live.calibration_label} level={2}>
            <ListRow
              label={live.calibration.name}
              value={live.calibration.camera}
              onPress={() => navigate('/calibrate')}
            />
          </GroupedList>
          {running && (
            <Button variant="quiet" onClick={live.stop} className="w-fit">
              {copy.live.end}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}
