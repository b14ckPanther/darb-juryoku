# Vision

## Intent

Nour codes for long hours and slouches without noticing. Darb Juryoku watches quietly from a small window while they work, knows what **their** good posture looks like because they trained the model on it, and tells them gently when they drift. At the end of the day it gives an honest report. It is a tool they use every working day, and it is the public proof that they can collect data, train a model, evaluate it properly and ship it on-device.

## Goals

1. **Daily use.** Nour runs it during every coding session for at least two weeks after launch, and the daily report changes their habits (measured: bad-posture minutes per hour, week over week).
2. **A model they trained themself.** A PyTorch classifier trained on landmark recordings Nour collected and labelled, with a held-out test set split by session, a committed evaluation report (per-class precision and recall, macro F1, confusion matrix) and a model card.
3. **Beats the obvious baseline.** The trained model must beat a hand-written angle-threshold heuristic on the same test set (both reported side by side). If it does not, the report says so honestly.
4. **Fast on-device.** End-to-end (pose + classifier) runs at the configured sample rate on Nour's laptop with p95 classifier latency in single-digit milliseconds and no noticeable CPU fan. Latency is measured in the browser and committed.
5. **Private by construction.** Frames never leave the device or touch storage, and a test proves it.
6. **Signature moment.** The golden outline and glow make people say "wait, show me that again" in a 10-second GIF.
7. **Darb Budokai-ready.** Emits `posture.session.recorded` v1 when Nour turns the integration on.

## Non-goals

- Medical or ergonomic advice. It reports what the model sees; it does not diagnose.
- Multi-user accounts, a backend, sync between devices, or a cloud API.
- A mobile camera app. The live surface is desktop; the phone is for reading the report (installable PWA).
- Full-body fitness tracking, exercise counting, or gaze tracking.
- Training on other people's data in v1 (open question whether to add a calibration-only path for visitors).

## Anti-goals (failure even if it works)

- **It nags.** If nudges feel like an alarm, Nour turns it off and the project is dead. Nudges are rare, soft and dismissible, with cooldowns from config.
- **It looks like a fitness-app template.** Rounded cards, stock gradients, emoji, a pile of charts. Fail.
- **The ML is fake depth.** A model that is just the heuristic with extra steps, a test set that leaks frames from training sessions, or metrics without a confusion matrix. Fail.
- **Privacy theatre.** Any frame or landmark stream leaving the device, or a runtime CDN request, breaks the core promise.
- **Background death.** If it stops working when the tab is hidden while Nour codes, it is useless for its main job (see ARCHITECTURE §5, Document Picture-in-Picture).
- **Heavy.** If it slows their IDE or drains the battery, they will close it.

## Why this stack for the Israeli junior market

- AI appears in 287 of 431 Israeli listings (66%), and Python in 178 (41%). Almost every junior shows a chatbot wrapper around someone else's model. A model **trained on data you collected**, evaluated with precision, recall and a confusion matrix, and shipped on-device, is rare and easy to talk about in an interview.
- PyTorch is the default training framework in Israeli computer vision teams (Mobileye, NVIDIA Israel, Hailo, medical imaging startups). ONNX export and quantization are what those teams do to get models onto devices.
- MediaPipe and ONNX Runtime Web show applied CV in the browser, which also connects to React (213 listings), Nour's existing strength.
- DVC and versioned experiments show MLOps habits that interviewers ask about ("how do you know the new model is better?").
- Skills proven: PyTorch training loops, dataset collection and labelling, pose landmarks, ONNX export and quantization, ONNX Runtime Web with WebGPU, model evaluation. Darb Jiru, the sibling CV project, covers YOLO object detection and transfer learning.
