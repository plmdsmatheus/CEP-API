from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.exceptions import CepInvalido, CepNaoEncontrado, ErroDeNegocio, ViaCepIndisponivel

# O status HTTP é uma decisão da camada web; as exceções de negócio não sabem dele.
_STATUS_POR_ERRO: dict[type[ErroDeNegocio], int] = {
    CepInvalido: 422,
    CepNaoEncontrado: 404,
    ViaCepIndisponivel: 502,
}


def _resposta_de_erro(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": {"code": code, "message": message}})


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ErroDeNegocio)
    async def _erro_de_negocio(_: Request, erro: ErroDeNegocio) -> JSONResponse:
        return _resposta_de_erro(_STATUS_POR_ERRO.get(type(erro), 500), erro.code, erro.message)

    @app.exception_handler(RequestValidationError)
    async def _requisicao_invalida(_: Request, __: RequestValidationError) -> JSONResponse:
        return _resposta_de_erro(
            422,
            "REQUISICAO_INVALIDA",
            "Requisição inválida. Verifique os dados enviados e tente novamente.",
        )
