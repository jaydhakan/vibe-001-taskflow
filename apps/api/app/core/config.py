"""Application configuration via pydantic-settings."""

import pathlib

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Environment-overridable application settings."""

    DATA_FILE: str = str(pathlib.Path(__file__).parents[3] / "data" / "tasks.json")


settings = Settings()
