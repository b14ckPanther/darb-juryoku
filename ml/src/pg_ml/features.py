"""Posture features from MediaPipe landmarks, shared with the app.

config/features.yaml defines the landmarks and the feature list. apps/web/src/posture/features.ts
implements the same functions; tests/fixtures/features.golden.json (written by
`python -m pg_ml.features golden`) is the contract both sides are tested against.
"""

import argparse
import hashlib
import json
import math
from collections.abc import Sequence
from pathlib import Path
from typing import Any, Literal

import numpy as np
import yaml
from numpy.typing import NDArray
from pydantic import BaseModel, ConfigDict

from pg_ml.config import ConfigError, _read_yaml, _validator, repo_root

Landmarks = NDArray[np.float64]  # shape (33, 4): x, y, z, visibility; x and y normalised 0..1


class FeatureSpec(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    name: Literal[
        "head_forward",
        "neck_tilt_deg",
        "shoulder_roll_deg",
        "shoulder_width",
        "head_drop",
        "shoulder_hunch",
        "visibility",
    ]
    delta: Literal["difference", "ratio"]


class FeaturesConfig(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    version: int
    landmarks: dict[str, int]
    used: list[str]
    features: list[FeatureSpec]


def load_features_config(path: Path) -> FeaturesConfig:
    data = _read_yaml(path)
    errors = list(_validator("features").iter_errors(data))
    if errors:
        details = "; ".join(f"/{'/'.join(map(str, e.path))}: {e.message}" for e in errors)
        raise ConfigError(f"Invalid config in {path}: {details}")
    return FeaturesConfig.model_validate(data)


def canonical_json(value: Any) -> str:
    """Sorted keys, no spaces: the same text the app builds before hashing."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def features_hash(path: Path) -> str:
    """SHA-256 of the parsed features.yaml, so comments and layout do not change it."""
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return hashlib.sha256(canonical_json(data).encode("utf-8")).hexdigest()


def feature_names(cfg: FeaturesConfig) -> list[str]:
    base = [f.name for f in cfg.features]
    return base + [f"{n}_delta" for n in base]


EPS = 1e-9


def base_features(lm: Landmarks, aspect: float, cfg: FeaturesConfig) -> dict[str, float]:
    """Features of one frame. `aspect` (width over height) makes x and y the same unit."""
    idx = cfg.landmarks

    def p(name: str) -> tuple[float, float]:
        row = lm[idx[name]]
        return float(row[0]) * aspect, float(row[1])

    lsx, lsy = p("left_shoulder")
    rsx, rsy = p("right_shoulder")
    lex, ley = p("left_ear")
    rex, rey = p("right_ear")
    _, ny = p("nose")
    smx, smy = (lsx + rsx) / 2, (lsy + rsy) / 2
    emx, emy = (lex + rex) / 2, (ley + rey) / 2
    sw = max(math.hypot(lsx - rsx, lsy - rsy), EPS)
    values = {
        "head_forward": (emx - smx) / sw,
        "neck_tilt_deg": math.degrees(math.atan2(emx - smx, smy - emy)),
        "shoulder_roll_deg": math.degrees(math.atan2(lsy - rsy, abs(lsx - rsx))),
        "shoulder_width": sw,
        "head_drop": (smy - ny) / sw,
        "shoulder_hunch": (smy - emy) / sw,
        "visibility": float(np.mean([lm[idx[n], 3] for n in cfg.used])),
    }
    return {f.name: values[f.name] for f in cfg.features}


def feature_vector(
    lm: Landmarks, ideal: dict[str, float], aspect: float, cfg: FeaturesConfig
) -> list[float]:
    """Base features then their deltas from the calibrated ideal, in features.yaml order."""
    now = base_features(lm, aspect, cfg)
    deltas = [
        now[f.name] - ideal[f.name]
        if f.delta == "difference"
        else now[f.name] / max(ideal[f.name], EPS) - 1
        for f in cfg.features
    ]
    return [now[f.name] for f in cfg.features] + deltas


def calibrate(frames: Sequence[Landmarks]) -> Landmarks:
    """The ideal pose: the median of each landmark coordinate over the hold."""
    return np.median(np.stack(frames), axis=0)


GOLDEN_SEED = 20261027
GOLDEN_CASES = 24
GOLDEN_ASPECT = 4 / 3


def _synthetic_pose(rng: np.random.Generator, cfg: FeaturesConfig) -> Landmarks:
    """A random but plausible upper body: synthetic numbers, never a recording of a person."""
    idx = cfg.landmarks
    lm = np.zeros((33, 4))
    cx, sy, hw = rng.uniform(0.4, 0.6), rng.uniform(0.62, 0.8), rng.uniform(0.1, 0.2)
    tilt, head_x = rng.uniform(-0.04, 0.04), rng.uniform(-0.05, 0.05)
    ear_y = rng.uniform(0.32, 0.52)
    lm[:, 3] = rng.uniform(0.6, 1.0, 33)
    lm[idx["left_shoulder"], :2] = [cx + hw, sy - tilt]
    lm[idx["right_shoulder"], :2] = [cx - hw, sy + tilt]
    lm[idx["left_ear"], :2] = [cx + 0.05 + head_x, ear_y]
    lm[idx["right_ear"], :2] = [cx - 0.05 + head_x, ear_y + rng.uniform(-0.02, 0.02)]
    lm[idx["nose"], :2] = [cx + head_x, ear_y - rng.uniform(-0.04, 0.03)]
    lm[idx["left_eye"], :2] = [cx + 0.03 + head_x, ear_y - 0.03]
    lm[idx["right_eye"], :2] = [cx - 0.03 + head_x, ear_y - 0.03]
    return np.round(lm, 6)


def golden_cases(cfg: FeaturesConfig, config_path: Path) -> dict[str, Any]:
    rng = np.random.default_rng(GOLDEN_SEED)
    cases = []
    for _ in range(GOLDEN_CASES):
        ideal_lm = _synthetic_pose(rng, cfg)
        now_lm = _synthetic_pose(rng, cfg)
        ideal = base_features(ideal_lm, GOLDEN_ASPECT, cfg)
        cases.append(
            {
                "ideal": ideal_lm.tolist(),
                "landmarks": now_lm.tolist(),
                "vector": feature_vector(now_lm, ideal, GOLDEN_ASPECT, cfg),
            }
        )
    return {
        "note": "Synthetic poses for the feature parity test. Not a recording of a person.",
        "features_hash": features_hash(config_path),
        "names": feature_names(cfg),
        "aspect": GOLDEN_ASPECT,
        "cases": cases,
    }


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m pg_ml.features")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("golden", help="rewrite tests/fixtures/features.golden.json")
    parser.parse_args(argv)
    config_path = repo_root() / "config" / "features.yaml"
    cfg = load_features_config(config_path)
    out = repo_root() / "ml" / "tests" / "fixtures" / "features.golden.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(golden_cases(cfg, config_path), indent=1) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
