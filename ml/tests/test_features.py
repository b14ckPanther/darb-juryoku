"""Posture features: invariances, signs, calibration and the golden file the app checks against."""

import json
import math

import numpy as np
from hypothesis import given, settings
from hypothesis import strategies as st

from pg_ml.config import repo_root
from pg_ml.features import (
    base_features,
    calibrate,
    feature_names,
    feature_vector,
    features_hash,
    golden_cases,
    load_features_config,
)

CFG = load_features_config(repo_root() / "config" / "features.yaml")
IDX = CFG.landmarks
ASPECT = 4 / 3


def pose(
    cx: float = 0.5,
    shoulder_y: float = 0.7,
    half_width: float = 0.15,
    ear_y: float = 0.45,
    nose_y: float = 0.42,
    lean: float = 0.0,
    head_x: float = 0.0,
    vis: float = 0.95,
) -> np.ndarray:
    lm = np.zeros((33, 4))
    lm[:, 3] = vis
    lm[IDX["left_shoulder"]] = [cx + half_width, shoulder_y - lean, 0, vis]
    lm[IDX["right_shoulder"]] = [cx - half_width, shoulder_y + lean, 0, vis]
    lm[IDX["left_ear"]] = [cx + 0.05 + head_x, ear_y, 0, vis]
    lm[IDX["right_ear"]] = [cx - 0.05 + head_x, ear_y, 0, vis]
    lm[IDX["nose"]] = [cx + head_x, nose_y, 0, vis]
    return lm


poses = st.builds(
    pose,
    cx=st.floats(0.35, 0.65),
    shoulder_y=st.floats(0.6, 0.8),
    half_width=st.floats(0.08, 0.2),
    ear_y=st.floats(0.3, 0.5),
    nose_y=st.floats(0.3, 0.52),
    lean=st.floats(-0.05, 0.05),
    head_x=st.floats(-0.05, 0.05),
)


def transform(lm: np.ndarray, scale: float, dx: float, dy: float) -> np.ndarray:
    out = lm.copy()
    out[:, 0] = 0.5 + (lm[:, 0] - 0.5) * scale + dx
    out[:, 1] = 0.5 + (lm[:, 1] - 0.5) * scale + dy
    return out


@settings(max_examples=60, deadline=None)
@given(poses, st.floats(0.6, 1.6), st.floats(-0.1, 0.1), st.floats(-0.1, 0.1))
def test_angles_and_ratios_ignore_distance_and_position(
    lm: np.ndarray, scale: float, dx: float, dy: float
) -> None:
    a = base_features(lm, ASPECT, CFG)
    b = base_features(transform(lm, scale, dx, dy), ASPECT, CFG)
    invariant = (
        "head_forward",
        "neck_tilt_deg",
        "shoulder_roll_deg",
        "head_drop",
        "shoulder_hunch",
    )
    for name in invariant:
        assert math.isclose(a[name], b[name], rel_tol=1e-9, abs_tol=1e-9), name
    assert math.isclose(b["shoulder_width"], a["shoulder_width"] * scale, rel_tol=1e-9)


@settings(max_examples=60, deadline=None)
@given(poses)
def test_lean_left_and_right_have_opposite_signs(lm: np.ndarray) -> None:
    mirrored = lm.copy()
    ls, rs = IDX["left_shoulder"], IDX["right_shoulder"]
    mirrored[ls, 1], mirrored[rs, 1] = lm[rs, 1], lm[ls, 1]
    a = base_features(lm, ASPECT, CFG)["shoulder_roll_deg"]
    b = base_features(mirrored, ASPECT, CFG)["shoulder_roll_deg"]
    assert math.isclose(a, -b, abs_tol=1e-9)


def test_level_shoulders_have_no_roll_and_an_upright_head_no_tilt() -> None:
    f = base_features(pose(), ASPECT, CFG)
    assert math.isclose(f["shoulder_roll_deg"], 0, abs_tol=1e-9)
    assert math.isclose(f["neck_tilt_deg"], 0, abs_tol=1e-9)
    assert math.isclose(f["head_forward"], 0, abs_tol=1e-9)


def test_a_dropped_head_lowers_head_drop_and_hunch() -> None:
    up = base_features(pose(), ASPECT, CFG)
    down = base_features(pose(ear_y=0.55, nose_y=0.55), ASPECT, CFG)
    assert down["head_drop"] < up["head_drop"]
    assert down["shoulder_hunch"] < up["shoulder_hunch"]


def test_vector_is_base_then_deltas_against_calibration() -> None:
    ideal = pose()
    names = feature_names(CFG)
    assert names[: len(CFG.features)] == [f.name for f in CFG.features]
    assert names[len(CFG.features) :] == [f"{f.name}_delta" for f in CFG.features]
    vec = feature_vector(pose(half_width=0.18), base_features(ideal, ASPECT, CFG), ASPECT, CFG)
    by_name = dict(zip(names, vec, strict=True))
    assert math.isclose(by_name["shoulder_width_delta"], 0.18 / 0.15 - 1, rel_tol=1e-9)
    assert math.isclose(by_name["head_forward_delta"], 0, abs_tol=1e-9)


def test_calibration_takes_the_median_of_each_landmark() -> None:
    frames = [pose(shoulder_y=y) for y in (0.69, 0.7, 0.95)]
    median = calibrate(frames)
    assert math.isclose(median[IDX["left_shoulder"], 1], 0.7)


def test_hash_changes_when_the_feature_list_changes(tmp_path) -> None:  # type: ignore[no-untyped-def]
    text = (repo_root() / "config" / "features.yaml").read_text()
    other = tmp_path / "features.yaml"
    other.write_text(text.replace("version: 1", "version: 2"))
    assert features_hash(repo_root() / "config" / "features.yaml") != features_hash(other)


def test_golden_file_is_current() -> None:
    path = repo_root() / "ml" / "tests" / "fixtures" / "features.golden.json"
    committed = json.loads(path.read_text())
    assert committed == golden_cases(CFG, repo_root() / "config" / "features.yaml")
