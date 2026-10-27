import { Camera, CircleSlash, Database, ScanFace, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import markUrl from '../../../../brand/exports/svg/mark-gold.svg?url';
import { useData } from '../app/data';
import { previewState } from '../app/preview';
import { useRouter } from '../app/router';
import { useLive } from '../app/live';
import { rememberDemoMode } from '../data/mode';
import { copy } from '../copy';
import { Button } from '../ui/button';
import { PostureGlyph } from '../ui/glyphs';
import { PermissionPrompt } from '../ui/states';

type CameraState = 'idle' | 'denied' | 'missing' | 'error';

function Node({
  icon,
  title,
  note,
  kept,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  kept?: boolean;
}) {
  return (
    <li className="relative grid content-start justify-items-center gap-2 text-center">
      <span
        className={
          kept
            ? 'grid size-14 place-items-center rounded-full border border-accent bg-surface-raised text-accent-text'
            : 'grid size-14 place-items-center rounded-full border border-rule bg-surface-raised text-text-secondary'
        }
      >
        {icon}
      </span>
      <span className="text-subhead font-medium">{title}</span>
      <span className="max-w-[12ch] text-footnote text-text-secondary">{note}</span>
    </li>
  );
}

/** First run: what it does, where your image goes (nowhere), then the camera. */
export default function Welcome() {
  const { data } = useData();
  const { navigate } = useRouter();
  const live = useLive();
  const preview = previewState(data.demo);
  const [camera, setCamera] = useState<CameraState>(
    preview === 'denied' || preview === 'missing' ? preview : 'idle',
  );
  const d = copy.welcome.diagram;

  const allow = async () => {
    if (data.demo) return navigate('/calibrate');
    const state = await live.start();
    if (state.kind === 'live') navigate('/calibrate');
    else if (state.kind === 'denied' || state.kind === 'missing' || state.kind === 'error')
      setCamera(state.kind);
  };

  return (
    <div className="grid gap-12 pt-8 pb-4 lg:pt-14">
      <header className="grid max-w-2xl gap-5">
        <img src={markUrl} alt="" width={56} height={56} />
        <h1 className="text-large-title sm:text-display">{copy.welcome.title}</h1>
        <p className="m-0 max-w-[52ch] text-body text-text-secondary">{copy.welcome.lede}</p>
      </header>

      <section
        aria-labelledby="privacy"
        className="grid gap-6 rounded-container bg-surface-raised p-5 sm:p-8"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden
            size={26}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0 text-accent-text"
          />
          <div className="grid gap-1">
            <h2 id="privacy" className="text-title2">
              {copy.welcome.privacy_title}
            </h2>
            <p className="m-0 text-subhead text-text-secondary">{copy.welcome.privacy_body}</p>
          </div>
        </div>
        <figure className="m-0 grid gap-4">
          <figcaption className="sr-only">{copy.welcome.diagram_label}</figcaption>
          <ol className="relative m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 sm:grid-cols-4">
            <span
              aria-hidden
              className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-rule via-rule to-accent sm:block"
            />
            <Node
              icon={<Camera aria-hidden size={24} strokeWidth={1.75} />}
              title={d.camera}
              note={d.camera_note}
            />
            <Node
              icon={<ScanFace aria-hidden size={24} strokeWidth={1.75} />}
              title={d.points}
              note={d.points_note}
            />
            <Node icon={<PostureGlyph posture="upright" />} title={d.state} note={d.state_note} />
            <Node
              icon={<Database aria-hidden size={24} strokeWidth={1.75} />}
              title={d.stored}
              note={d.stored_note}
              kept
            />
          </ol>
        </figure>
        <p className="m-0 flex items-center gap-2 border-t border-rule pt-4 text-subhead">
          <CircleSlash
            aria-hidden
            size={18}
            strokeWidth={1.75}
            className="shrink-0 text-text-secondary"
          />
          <span>
            <span className="font-medium">{copy.welcome.never_title}:</span>{' '}
            <span className="text-text-secondary">{copy.welcome.never_body}</span>
          </span>
        </p>
      </section>

      {camera === 'idle' && (
        <div className="flex flex-wrap gap-3">
          <Button icon={Camera} onClick={() => void allow()}>
            {copy.welcome.allow}
          </Button>
          {!data.demo && (
            <Button
              variant="quiet"
              onClick={() => {
                rememberDemoMode(true);
                window.location.assign('/?demo=1');
              }}
            >
              {copy.welcome.demo}
            </Button>
          )}
        </div>
      )}
      {camera !== 'idle' && (
        <PermissionPrompt
          state={camera === 'denied' ? 'denied' : 'missing'}
          {...copy.welcome.permission[camera === 'denied' ? 'denied' : 'missing']}
          onAction={() => void allow()}
        />
      )}
    </div>
  );
}
