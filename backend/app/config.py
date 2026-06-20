from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./application-dashboard.db"
    cors_origins: str = "http://localhost:5173"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    class Config:
        env_file = ".env"


settings = Settings()
