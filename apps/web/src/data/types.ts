import type { MinuteBucket, PostureClass, SessionMeta } from '../report/types';

type Latency = { p50: number; p95: number; p99: number };

export interface Calibration {
  id: string;
  name: string;
  camera: string;
  created: string;
  active: boolean;
}

export interface ModelRelease {
  name: string;
  version: string;
  data_version: string;
  released: string;
  size_kb: number;
  active: boolean;
  confusion: number[][];
  latency_ms: { runs: number; webgpu: Latency; wasm: Latency };
}

export interface Recording {
  id: string;
  date: string;
  protocol: 'guided' | 'passive';
  seconds: number;
  size_kb: number;
  lighting: string;
  chair: string;
  camera: string;
}

export interface Playback {
  seconds_per_key: number;
  match: number[];
  state_from: { upright: number };
  match_when_still: number;
  match_example_drift: number;
  match_framing: number;
  tick_ms: number;
  bench_ms: number;
  drift_class: Exclude<PostureClass, 'upright'>;
  nudge_after_seconds: number;
  quiet_after_nudge_seconds: number;
}

/** Calibrations, models and recordings. In demo mode from config/seed/demo/library.yaml. */
export interface Library {
  calibrations: Calibration[];
  cameras: string[];
  classes: PostureClass[];
  gates: { macro_f1: number; slouch_recall: number; beats_heuristic: number; wasm_p95_ms: number };
  heuristic: { confusion: number[][] };
  models: ModelRelease[];
  recordings: Recording[];
  playback: Playback;
  studio_speed: number;
  studio_kb_per_second: number;
}

/** Everything the screens read. Demo mode fills it from the seed; real mode starts empty. */
export interface DataSnapshot {
  demo: boolean;
  /** The local date the reports treat as today ('2026-10-26'). */
  today: string;
  sessions: SessionMeta[];
  buckets: MinuteBucket[];
  library: Library | null;
}
