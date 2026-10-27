import { describe, expect, it, vi } from 'vitest';
import { CameraService, stateForError } from './camera';

const track = {
  stop: vi.fn(),
  label: 'FaceTime HD Camera',
  getSettings: () => ({ deviceId: 'cam-1' }),
};
const stream = {
  getVideoTracks: () => [track],
  getTracks: () => [track],
} as unknown as MediaStream;
const err = (name: string) => Object.assign(new Error(name), { name });

describe('CameraService', () => {
  it('asks for video only, at the configured size, and reports the live device', async () => {
    const getUserMedia = vi.fn(async () => stream);
    const cam = new CameraService(
      { getUserMedia, enumerateDevices: vi.fn() },
      { width: 640, height: 480 },
    );
    const state = await cam.start();
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    });
    expect(state).toMatchObject({ kind: 'live', deviceId: 'cam-1', label: 'FaceTime HD Camera' });
  });

  it('opens a chosen device exactly and stops the previous stream first', async () => {
    const getUserMedia = vi.fn(async () => stream);
    const cam = new CameraService(
      { getUserMedia, enumerateDevices: vi.fn() },
      { width: 640, height: 480 },
    );
    await cam.start();
    await cam.start('cam-2');
    expect(track.stop).toHaveBeenCalled();
    expect(getUserMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ deviceId: { exact: 'cam-2' } }) }),
    );
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'missing'],
    ['NotReadableError', 'missing'],
    ['TypeError', 'error'],
  ])('%s becomes %s', async (name, kind) => {
    const cam = new CameraService(
      { getUserMedia: vi.fn(async () => Promise.reject(err(name))), enumerateDevices: vi.fn() },
      { width: 640, height: 480 },
    );
    expect((await cam.start()).kind).toBe(kind);
    expect(stateForError(err(name)).kind).toBe(kind);
  });

  it('says missing when the browser has no camera API', async () => {
    expect((await new CameraService(undefined, { width: 1, height: 1 }).start()).kind).toBe(
      'missing',
    );
  });

  it('lists only video inputs', async () => {
    const enumerateDevices = vi.fn(async () => [
      { kind: 'videoinput', deviceId: 'a', label: 'Cam A' },
      { kind: 'audioinput', deviceId: 'b', label: 'Mic' },
    ]);
    const cam = new CameraService({ getUserMedia: vi.fn(), enumerateDevices } as never, {
      width: 1,
      height: 1,
    });
    expect(await cam.devices()).toEqual([{ id: 'a', label: 'Cam A' }]);
  });
});
