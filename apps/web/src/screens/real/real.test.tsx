import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LiveContext, type LiveValue } from '../../app/live';
import { RouterProvider } from '../../app/router';
import { SentinelProvider } from '../../app/sentinel';
import { ToastProvider } from '../../app/toast';
import { copy } from '../../copy';
import type { StoredCalibration } from '../../storage/db';
import CalibrateReal from './CalibrateReal';
import LiveReal from './LiveReal';

const lm = Array.from({ length: 33 }, () => [0.5, 0.5, 0, 0.9]);
const calibration: StoredCalibration = {
  id: 'c',
  name: 'Desk',
  camera: 'FaceTime HD Camera',
  created: '2026-10-27',
  createdAt: 1,
  landmarks: lm,
  features: {},
  aspect: 4 / 3,
  featuresHash: 'h',
  active: true,
};
const stream = { getTracks: () => [] } as unknown as MediaStream;

function fake(over: Partial<LiveValue> = {}): LiveValue {
  return {
    camera: { kind: 'idle' },
    pose: { kind: 'off' },
    stream: null,
    aspect: 4 / 3,
    landmarks: null,
    step: null,
    calibration: null,
    calibrations: [],
    paused: false,
    start: vi.fn(async () => ({ kind: 'idle' as const })),
    stop: vi.fn(),
    togglePause: vi.fn(),
    hold: vi.fn(async () => lm),
    save: vi.fn(async () => undefined),
    use: vi.fn(async () => undefined),
    elapsed: () => 0,
    ...over,
  };
}

function mount(value: LiveValue, ui: ReactNode) {
  return render(
    <RouterProvider initialPath="/">
      <ToastProvider>
        <LiveContext value={value}>
          <SentinelProvider forceUnsupported>{ui}</SentinelProvider>
        </LiveContext>
      </ToastProvider>
    </RouterProvider>,
  );
}

const live = { kind: 'live' as const, stream, deviceId: 'cam', label: 'FaceTime HD Camera' };

describe('Live on the real camera', () => {
  it('asks for a calibration first', () => {
    mount(fake(), <LiveReal />);
    expect(
      screen.getByRole('heading', { name: copy.live.calibrate_first_title }),
    ).toBeInTheDocument();
  });

  it('starts the camera on request', async () => {
    const value = fake({ calibration });
    mount(value, <LiveReal />);
    await userEvent.click(screen.getByRole('button', { name: copy.live.camera_on }));
    expect(value.start).toHaveBeenCalled();
  });

  it('shows the state the session engine reports, and pauses', async () => {
    const value = fake({
      calibration,
      camera: live,
      stream,
      pose: { kind: 'ready', delegate: 'GPU' },
      step: { state: 'forward_head', match: 0.2, probs: null, body: null, minutes: [] },
    });
    mount(value, <LiveReal />);
    expect(screen.getByText(copy.posture.forward_head)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: copy.live.pause }));
    expect(value.togglePause).toHaveBeenCalled();
  });

  it('says Away when nobody is in frame', () => {
    mount(
      fake({
        calibration,
        camera: live,
        stream,
        pose: { kind: 'ready', delegate: 'CPU' },
        step: { state: 'absent', match: 1, probs: null, body: null, minutes: [] },
      }),
      <LiveReal />,
    );
    expect(screen.getByText(copy.posture.absent)).toBeInTheDocument();
  });

  it('explains a pose model that failed to load', () => {
    mount(fake({ calibration, pose: { kind: 'failed', message: 'GPU: x; CPU: y' } }), <LiveReal />);
    expect(screen.getByRole('heading', { name: copy.live.pose_failed_title })).toBeInTheDocument();
    expect(screen.getByText(/GPU: x; CPU: y/)).toBeInTheDocument();
  });
});

describe('Calibrate on the real camera', () => {
  it('waits for a person in frame before the hold', () => {
    mount(
      fake({ camera: live, stream, pose: { kind: 'ready', delegate: 'GPU' } }),
      <CalibrateReal />,
    );
    expect(screen.getByRole('button', { name: copy.calibrate.ready })).toBeDisabled();
    expect(screen.getByText(copy.calibrate.need_person)).toBeInTheDocument();
  });

  it('holds, confirms and saves the median pose under a name', async () => {
    const value = fake({
      camera: live,
      stream,
      landmarks: lm,
      pose: { kind: 'ready', delegate: 'GPU' },
    });
    mount(value, <CalibrateReal />);
    await userEvent.click(screen.getByRole('button', { name: copy.calibrate.ready }));
    expect(
      await screen.findByRole('heading', { name: copy.calibrate.steps.confirm_title }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: copy.calibrate.use }));
    await userEvent.click(await screen.findByRole('button', { name: copy.calibrate.save }));
    expect(value.save).toHaveBeenCalledWith('Desk, FaceTime HD Camera', lm);
  });

  it('says so when nobody was seen during the hold', async () => {
    const value = fake({
      camera: live,
      stream,
      landmarks: lm,
      pose: { kind: 'ready', delegate: 'GPU' },
      hold: vi.fn(async () => null),
    });
    mount(value, <CalibrateReal />);
    await act(async () =>
      userEvent.click(screen.getByRole('button', { name: copy.calibrate.ready })),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(copy.calibrate.hold_failed);
  });

  it('shows the fix for a blocked camera', () => {
    mount(fake({ camera: { kind: 'denied' } }), <CalibrateReal />);
    expect(
      screen.getByRole('heading', { name: copy.welcome.permission.denied.title }),
    ).toBeInTheDocument();
  });
});
