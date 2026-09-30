from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.models.consulta import StatusConsulta


class _Schema(BaseModel):
    # from_attributes: lê direto dos objetos ORM/dataclasses; JSON de saída em camelCase.
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)


class ConsultaRequest(_Schema):
    cep: str


class ConsultaResponse(_Schema):
    cep: str
    logradouro: str | None
    bairro: str | None
    cidade: str | None
    consultado_em: datetime = Field(serialization_alias="dataConsulta")


class HistoricoItem(ConsultaResponse):
    id: int
    status: StatusConsulta


class ResumoResponse(_Schema):
    total: int
    encontrados: int
    nao_encontrados: int


class HistoricoResponse(_Schema):
    items: list[HistoricoItem]
    total: int
    limit: int
    offset: int
    resumo: ResumoResponse


class ErroDetalhe(BaseModel):
    code: str
    message: str


class ErroResponse(BaseModel):
    detail: ErroDetalhe
