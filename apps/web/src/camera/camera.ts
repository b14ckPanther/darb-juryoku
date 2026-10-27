// The camera service: permission states, the device list and the stream, nothing else. Frames are
// read from the stream in memory by the sampler and never stored or sent (agent manual 1.3).

export type CameraState =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'live'; stream: MediaStream; deviceId: string; label: string }
  | { kind: 'denied' }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

export interface CameraDevice {
  id: string;
  label: string;
}

type Media = Pick<MediaDevices, 'getUserMedia' | 'enumerateDevices'>;

/** Maps a getUserMedia failure to the state the UI explains (Welcome's denied and missing copy). */
export function stateForError(e: unknown): CameraState {
  const name = e instanceof DOMException || e instanceof Error ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return { kind: 'denied' };
  // Not found, or found but busy in another app: both are fixed by freeing or connecting a camera.
  if (['NotFoundError', 'OverconstrainedError', 'NotReadableError', 'AbortError'].includes(name))
    return { kind: 'missing' };
  return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
}

export class CameraService {
  private stream: MediaStream | null = null;

  constructor(
    private media: Media | undefined,
    private size: { width: number; height: number },
  ) {}

  async start(deviceId?: string): Promise<CameraState> {
    if (!this.media?.getUserMedia) return { kind: 'missing' };
    this.stop();
    try {
      const stream = await this.media.getUserMedia({
        audio: false,
        video: {
          width: { ideal: this.size.width },
          height: { ideal: this.size.height },
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
        },
      });
      this.stream = stream;
      const track = stream.getVideoTracks()[0];
      return {
        kind: 'live',
        stream,
        deviceId: track?.getSettings().deviceId ?? deviceId ?? '',
        label: track?.label ?? '',
      };
    } catch (e) {
      return stateForError(e);
    }
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  /** Video inputs. Labels are empty until the user has allowed the camera once. */
  async devices(): Promise<CameraDevice[]> {
    if (!this.media?.enumerateDevices) return [];
    const all = await this.media.enumerateDevices();
    return all
      .filter((d) => d.kind === 'videoinput')
      .map((d) => ({ id: d.deviceId, label: d.label }));
  }
}
