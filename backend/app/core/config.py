from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://cep:cep@localhost:5432/cep"
    cors_origins: list[str] = ["http://localhost:5173"]
    viacep_base_url: str = "https://viacep.com.br/ws"
    viacep_timeout_seconds: float = 5.0


settings = Settings()
