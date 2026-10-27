/// <reference lib="webworker" />
// The pose worker. Built as a classic worker: MediaPipe loads its WASM glue with importScripts,
// which module workers do not have.
import { createPoseEngine } from '../pose/engine';
import { mediapipeFactory } from '../pose/mediapipe';
import type { ToWorker } from '../pose/protocol';

const scope = self as unknown as DedicatedWorkerGlobalScope;
const engine = createPoseEngine(mediapipeFactory, (m) => scope.postMessage(m));
scope.onmessage = (e: MessageEvent<ToWorker>) => void engine.handle(e.data);
