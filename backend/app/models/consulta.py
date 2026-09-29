import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StatusConsulta(enum.StrEnum):
    ENCONTRADO = "encontrado"
    NAO_ENCONTRADO = "nao_encontrado"


class Consulta(Base):
    __tablename__ = "consultas"

    id: Mapped[int] = mapped_column(primary_key=True)
    cep: Mapped[str] = mapped_column(String(8), index=True)
    # Nulos quando o CEP não existe no ViaCEP (a consulta é gravada mesmo assim).
    logradouro: Mapped[str | None] = mapped_column(String(255))
    bairro: Mapped[str | None] = mapped_column(String(255))
    cidade: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[StatusConsulta] = mapped_column(
        Enum(StatusConsulta, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e])
    )
    consultado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
