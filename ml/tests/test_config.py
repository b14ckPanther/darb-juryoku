"""Config loading: the shared app.yaml loads and invalid config fails fast."""

from pathlib import Path

import pytest

from pg_ml.config import AppConfig, ConfigError, load_app_config, repo_root

VALID = """\
name: Test App
sample_hz: 5
camera: {width: 640, height: 480}
classify_every_samples: 1
window_samples: 10
retention_days: 30
"""


def write(tmp_path: Path, text: str) -> Path:
    path = tmp_path / "app.yaml"
    path.write_text(text)
    return path


def test_config_loads() -> None:
    config = load_app_config(repo_root() / "config" / "app.yaml")
    assert isinstance(config, AppConfig)
    assert config.name
    assert config.sample_hz > 0


def test_config_loads_values_from_file(tmp_path: Path) -> None:
    config = load_app_config(write(tmp_path, VALID))
    assert config.name == "Test App"
    assert config.camera.width == 640


def test_config_rejects_invalid(tmp_path: Path) -> None:
    path = write(tmp_path, VALID.replace("sample_hz: 5", "sample_hz: 0"))
    with pytest.raises(ConfigError, match="sample_hz"):
        load_app_config(path)


def test_config_rejects_unknown_key(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="sampel_hz"):
        load_app_config(write(tmp_path, VALID + "sampel_hz: 4\n"))


def test_config_rejects_missing_key(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="name"):
        load_app_config(write(tmp_path, VALID.replace("name: Test App\n", "")))
