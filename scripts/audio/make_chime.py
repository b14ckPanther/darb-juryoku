"""Synthesise the nudge chime from config/design/tokens.yaml (sound.chime). Original, no samples.

A soft bell: a few sine partials, each with its own exponential decay, a short raised-cosine attack so
it never clicks, and a fade over the last 80 ms. Deterministic: same tokens, same bytes.

    uv run --with numpy --with pyyaml python scripts/audio/make_chime.py          # write the wav
    uv run --with numpy --with pyyaml python scripts/audio/make_chime.py --check  # fail if it drifted
"""

from __future__ import annotations

import io
import sys
import wave
from pathlib import Path

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[2]
TOKENS = ROOT / "config/design/tokens.yaml"
OUT_DIR = ROOT / "apps/web/public/audio"
FADE_OUT_S = 0.08


def synthesise(chime: dict) -> np.ndarray:
    rate = int(chime["sample_rate"])
    t = np.arange(int(rate * float(chime["duration_s"]))) / rate
    signal = np.zeros_like(t)
    for freq, gain, decay in chime["partials"]:
        signal += gain * np.sin(2 * np.pi * freq * t) * np.exp(-t / decay)
    attack = float(chime["attack_s"])
    rise = np.clip(t / attack, 0, 1)
    signal *= 0.5 - 0.5 * np.cos(np.pi * rise)
    fade = np.clip((t[-1] - t) / FADE_OUT_S, 0, 1)
    signal *= fade
    peak = 10 ** (float(chime["peak_dbfs"]) / 20)
    return signal / np.max(np.abs(signal)) * peak


def to_wav(signal: np.ndarray, rate: int) -> bytes:
    pcm = np.round(signal * 32767).astype("<i2")
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    return buffer.getvalue()


def main() -> int:
    chime = yaml.safe_load(TOKENS.read_text(encoding="utf-8"))["sound"]["chime"]
    data = to_wav(synthesise(chime), int(chime["sample_rate"]))
    target = OUT_DIR / chime["file"]
    if "--check" in sys.argv:
        if not target.exists() or target.read_bytes() != data:
            print(f"error: {target.relative_to(ROOT)} does not match sound.chime in tokens.yaml")
            print("fix: run scripts/audio/make_chime.py and commit the wav")
            return 1
        print(f"ok: {target.relative_to(ROOT)} matches the tokens")
        return 0
    target.write_bytes(data)
    print(f"wrote {target.relative_to(ROOT)} ({len(data)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
