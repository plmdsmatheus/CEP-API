from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_consulta_service
from app.models.consulta import StatusConsulta
from app.schemas.consulta import ConsultaRequest, ConsultaResponse, ErroResponse, HistoricoResponse
from app.services.consulta_service import ConsultaService

router = APIRouter(prefix="/api/consultas", tags=["consultas"])

Service = Annotated[ConsultaService, Depends(get_consulta_service)]


@router.post(
    "",
    response_model=ConsultaResponse,
    summary="Consulta um CEP no ViaCEP e registra a consulta no histórico",
    responses={
        404: {"model": ErroResponse, "description": "CEP inexistente (a consulta é registrada)"},
        422: {"model": ErroResponse, "description": "CEP ou requisição inválidos (não registra)"},
        502: {"model": ErroResponse, "description": "ViaCEP indisponível (não registra)"},
    },
)
def consultar_cep(corpo: ConsultaRequest, service: Service):
    return service.consultar(corpo.cep)


@router.get(
    "",
    response_model=HistoricoResponse,
    summary="Histórico de consultas, da mais recente para a mais antiga",
)
def listar_historico(
    service: Service,
    status: StatusConsulta | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    historico = service.listar(status=status, limit=limit, offset=offset)
    return {
        "items": historico.items,
        "total": historico.total,
        "limit": limit,
        "offset": offset,
        "resumo": historico.resumo,
    }
