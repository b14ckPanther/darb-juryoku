import { Camera, CameraOff, VideoOff, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { Button, ICON_STROKE } from './button';

interface PromptProps {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}

const permissionIcons: Record<'prompt' | 'denied' | 'missing', LucideIcon> = {
  prompt: Camera,
  denied: CameraOff,
  missing: VideoOff,
};

/** Asks for the camera, or explains how to fix a blocked or missing one. */
export function PermissionPrompt({
  state,
  ...prompt
}: PromptProps & { state: 'prompt' | 'denied' | 'missing' }) {
  return <Panel icon={permissionIcons[state]} {...prompt} />;
}

/** What this is, why it is empty, and how to start. */
export function EmptyState(props: PromptProps & { icon: LucideIcon }) {
  return <Panel {...props} />;
}

function Panel({ icon: Icon, title, body, action, onAction }: PromptProps & { icon: LucideIcon }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="grid max-w-sm justify-items-start gap-3 rounded-container bg-surface-raised p-6"
    >
      <span className="grid size-12 place-items-center rounded-control bg-surface-overlay text-accent-text">
        <Icon aria-hidden size={24} strokeWidth={ICON_STROKE} />
      </span>
      <h3 id={titleId} className="text-title3">
        {title}
      </h3>
      <p className="m-0 text-subhead text-text-secondary">{body}</p>
      <Button onClick={onAction} className="mt-1">
        {action}
      </Button>
    </section>
  );
}
