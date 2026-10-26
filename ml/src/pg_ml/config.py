"""Load runtime config shared with the web app.

Each file is validated against its JSON Schema in packages/schemas/config/ (the same
schema the app uses with Ajv), then parsed into a typed Pydantic model.
"""

import json
from functools import cache
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator
from pydantic import BaseModel, ConfigDict, PositiveFloat, PositiveInt


class ConfigError(ValueError):
    """Raised when a config file is missing, unreadable or fails its schema."""


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CameraConfig(_Strict):
    width: PositiveInt
    height: PositiveInt


class AppConfig(_Strict):
    name: str
    sample_hz: PositiveFloat
    camera: CameraConfig
    classify_every_samples: PositiveInt
    window_samples: PositiveInt
    retention_days: PositiveInt


def repo_root() -> Path:
    """The repository root (the folder holding config/ and packages/)."""
    return Path(__file__).resolve().parents[3]


@cache
def _validator(schema_name: str) -> Draft202012Validator:
    schema_path = repo_root() / "packages" / "schemas" / "config" / f"{schema_name}.schema.json"
    schema: dict[str, Any] = json.loads(schema_path.read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def _read_yaml(path: Path) -> Any:
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise ConfigError(f"Cannot read config {path}: {exc}") from exc


def load_app_config(path: Path) -> AppConfig:
    """Load and validate an app.yaml file."""
    data = _read_yaml(path)
    errors = sorted(_validator("app").iter_errors(data), key=lambda e: list(e.path))
    if errors:
        details = "; ".join(f"/{'/'.join(map(str, e.path))}: {e.message}" for e in errors)
        raise ConfigError(f"Invalid config in {path}: {details}")
    return AppConfig.model_validate(data)
