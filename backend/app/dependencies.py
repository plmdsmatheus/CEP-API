from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.clients.viacep import ViaCepClient
from app.core.config import settings
from app.db.session import get_db
from app.repositories.consulta_repository import ConsultaRepository
from app.services.consulta_service import ConsultaService


@lru_cache
def get_viacep_client() -> ViaCepClient:
    # Um client só para a aplicação toda: reaproveita as conexões HTTP entre requisições.
    return ViaCepClient(
        base_url=settings.viacep_base_url, timeout_seconds=settings.viacep_timeout_seconds
    )


def get_consulta_repository(db: Session = Depends(get_db)) -> ConsultaRepository:
    return ConsultaRepository(db)


def get_consulta_service(
    client: ViaCepClient = Depends(get_viacep_client),
    repository: ConsultaRepository = Depends(get_consulta_repository),
) -> ConsultaService:
    return ConsultaService(client=client, repository=repository)
