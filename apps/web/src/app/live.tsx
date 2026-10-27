// Real mode's live session: camera, pose worker, posture pipeline and storage, shared by Live,
// Calibrate and the sentinel. Frames are read in memory and closed; only landmarks of the
// calibrated pose and minute totals are stored, on this device.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CameraService, type CameraState } from '../camera/camera';
import { startSampler } from '../camera/sampler';
import { appConfig } from '../config/app-config';
import {
  featuresConfig,
  heuristicConfig,
  poseConfig,
  rawFeaturesYaml,
  sessionConfig,
} from '../config/posture';
import { createPoseClientWithFallback, type PoseClient } from '../pose/client';
import { baseFeatures, calibrate, featuresHash, type Landmarks } from '../posture/features';
import { PosturePipeline, type Step } from '../posture/pipeline';
import { localTime } from '../posture/session';
import {
  activeCalibration,
  listCalibrations,
  saveCalibration,
  selectCalibration,
} from '../storage/calibrations';
import { db, type StoredCalibration } from '../storage/db';
import { writeMinutes } from '../storage/minutes';
import { useData } from './data';

export type PoseState =
  | { kind: 'off' }
  | { kind: 'loading' }
  | { kind: 'ready'; delegate: string }
  | { kind: 'failed'; message: string };

export interface LiveValue {
  camera: CameraState;
  pose: PoseState;
  stream: MediaStream | null;
  /** Width over height of the camera image. */
  aspect: number;
  /** The newest landmarks (for calibration and the framing check). */
  landmarks: Landmarks | null;
  step: Step | null;
  calibration: StoredCalibration | null;
  calibrations: StoredCalibration[];
  paused: boolean;
  start: (deviceId?: string) => Promise<CameraState>;
  stop: () => void;
  togglePause: () => void;
  /** Collects landmarks for `seconds`; resolves with the median pose, or null if nobody was seen enough. */
  hold: (seconds: number) => Promise<Landmarks | null>;
  save: (name: string, ideal: Landmarks) => Promise<void>;
  use: (id: string) => Promise<void>;
  /** Seconds the live loop has been running, for the nudge timer. */
  elapsed: () => number;
}

export const LiveContext = createContext<LiveValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const camera = useMemo(
    () =>
      new CameraService(
        typeof navigator === 'undefined' ? undefined : navigator.mediaDevices,
        appConfig.camera,
      ),
    [],
  );
  const [cam, setCam] = useState<CameraState>({ kind: 'idle' });
  const [pose, setPose] = useState<PoseState>({ kind: 'off' });
  const [aspect, setAspect] = useState(appConfig.camera.width / appConfig.camera.height);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [calibration, setCalibration] = useState<StoredCalibration | null>(null);
  const [calibrations, setCalibrations] = useState<StoredCalibration[]>([]);
  const [paused, setPaused] = useState(false);
  const client = useRef<PoseClient | null>(null);
  const pipeline = useRef<PosturePipeline | null>(null);
  const holdSink = useRef<((lm: Landmarks | null) => void) | null>(null);
  const pausedRef = useRef(false);
  const { dispatch } = useData();
  const store = useRef(dispatch);
  useEffect(() => {
    store.current = dispatch;
  }, [dispatch]);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  const load = useCallback(async () => {
    const [all, active, hash] = await Promise.all([
      listCalibrations(db()),
      activeCalibration(db()),
      featuresHash(rawFeaturesYaml),
    ]);
    // A calibration taken with another feature list cannot be compared with: calibrate again.
    return { all, active: active && active.featuresHash === hash ? active : null };
  }, []);

  const refresh = useCallback(async () => {
    const r = await load();
    setCalibrations(r.all);
    setCalibration(r.active);
  }, [load]);

  useEffect(() => {
    let live = true;
    load().then(
      (r) => {
        if (!live) return;
        setCalibrations(r.all);
        setCalibration(r.active);
      },
      () => undefined, // No IndexedDB (private window, tests): nothing calibrated yet.
    );
    return () => {
      live = false;
    };
  }, [load]);

  // A new pipeline (and session) whenever the calibration in use changes.
  useEffect(() => {
    const previous = pipeline.current;
    if (previous) void writeMinutes(db(), previous.finish(Date.now()));
    pipeline.current = calibration
      ? new PosturePipeline(
          {
            features: featuresConfig,
            heuristic: heuristicConfig,
            session: sessionConfig,
            pose: poseConfig,
          },
          {
            landmarks: calibration.landmarks,
            features: calibration.features,
            aspect: calibration.aspect,
          },
          `live-${Date.now()}`,
        )
      : null;
    if (calibration && pipeline.current) {
      const now = Date.now();
      const { day, minute } = localTime(now);
      void db().sessions.put({
        id: pipeline.current ? `live-${now}` : '',
        date: day,
        start: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
        startedAt: now,
        endedAt: null,
        model: 'heuristic',
        device: calibration.camera,
      });
    }
  }, [calibration]);

  const stop = useCallback(() => {
    camera.stop();
    client.current?.close();
    client.current = null;
    setCam({ kind: 'idle' });
    setPose({ kind: 'off' });
    setStep(null);
    setLandmarks(null);
    if (pipeline.current) void writeMinutes(db(), pipeline.current.finish(Date.now()));
  }, [camera]);

  const start = useCallback(
    async (deviceId?: string) => {
      setCam({ kind: 'requesting' });
      const state = await camera.start(deviceId);
      setCam(state);
      if (state.kind !== 'live') return state;
      if (!client.current) {
        setPose({ kind: 'loading' });
        client.current = createPoseClientWithFallback(poseConfig, window.location.origin);
        client.current.ready.then(
          (delegate) => setPose({ kind: 'ready', delegate }),
          (e: unknown) =>
            setPose({ kind: 'failed', message: e instanceof Error ? e.message : String(e) }),
        );
      }
      return state;
    },
    [camera],
  );

  // The sampling loop: one hidden video element per stream, 1/sample_hz frames to the worker.
  useEffect(() => {
    if (cam.kind !== 'live' || pose.kind !== 'ready' || !client.current) return;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = cam.stream;
    void Promise.resolve(video.play()).catch(() => undefined);
    const onMeta = () => video.videoHeight && setAspect(video.videoWidth / video.videoHeight);
    video.addEventListener('loadedmetadata', onMeta);
    const pc = client.current;
    const stopSampler = startSampler(video, appConfig.sample_hz, async (frame, t) => {
      const { landmarks: lm } = await pc.detect(frame, t);
      setLandmarks(lm);
      holdSink.current?.(lm);
      if (pausedRef.current || !pipeline.current) return;
      const s = pipeline.current.step(t, lm);
      setStep(s);
      if (s.minutes.length) {
        void writeMinutes(db(), s.minutes);
        store.current({ type: 'add_minutes', minutes: s.minutes });
      }
    });
    return () => {
      stopSampler();
      video.removeEventListener('loadedmetadata', onMeta);
      video.srcObject = null;
    };
  }, [cam, pose]);

  useEffect(() => () => stop(), [stop]);

  const hold = useCallback(
    (seconds: number) =>
      new Promise<Landmarks | null>((resolve) => {
        const frames: Landmarks[] = [];
        let total = 0;
        holdSink.current = (lm) => {
          total += 1;
          if (lm) frames.push(lm);
        };
        window.setTimeout(() => {
          holdSink.current = null;
          // Most of the hold must show a person, or the median would be built from too little.
          resolve(frames.length > 0 && frames.length * 2 >= total ? calibrate(frames) : null);
        }, seconds * 1000);
      }),
    [],
  );

  const save = useCallback(
    async (name: string, ideal: Landmarks) => {
      const now = Date.now();
      await saveCalibration(db(), {
        id: `cal-${now}`,
        name,
        camera: cam.kind === 'live' ? cam.label : '',
        created: localTime(now).day,
        createdAt: now,
        landmarks: ideal,
        features: baseFeatures(ideal, aspect, featuresConfig),
        aspect,
        featuresHash: await featuresHash(rawFeaturesYaml),
      });
      await refresh();
    },
    [aspect, cam, refresh],
  );

  const value: LiveValue = {
    camera: cam,
    pose,
    stream: cam.kind === 'live' ? cam.stream : null,
    aspect,
    landmarks,
    step,
    calibration,
    calibrations,
    paused,
    start,
    stop,
    togglePause: () => {
      pausedRef.current = !pausedRef.current;
      setPaused(pausedRef.current);
    },
    hold,
    save,
    use: async (id) => {
      await selectCalibration(db(), id);
      await refresh();
    },
    elapsed: () => (performance.now() - startedAt.current) / 1000,
  };
  return <LiveContext value={value}>{children}</LiveContext>;
}

export function useLive(): LiveValue {
  const value = use(LiveContext);
  if (!value) throw new Error('useLive needs a LiveProvider');
  return value;
}
