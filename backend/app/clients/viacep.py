from dataclasses import dataclass

import httpx

from app.exceptions import CepNaoEncontrado, ViaCepIndisponivel


@dataclass(frozen=True)
class Endereco:
    logradouro: str
    bairro: str
    cidade: str


class ViaCepClient:
    """Isola a API externa: traduz respostas e falhas do ViaCEP para o vocabulário da aplicação."""

    def __init__(
        self,
        base_url: str,
        timeout_seconds: float,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._http = httpx.Client(base_url=base_url, timeout=timeout_seconds, transport=transport)

    def buscar(self, cep: str) -> Endereco:
        try:
            resposta = self._http.get(f"/{cep}/json/")
            resposta.raise_for_status()
            dados = resposta.json()
        except (httpx.HTTPError, ValueError) as erro:
            # Timeout, falha de conexão, status de erro ou corpo que não é JSON.
            raise ViaCepIndisponivel() from erro

        if not isinstance(dados, dict):
            raise ViaCepIndisponivel()

        # Para CEP inexistente o ViaCEP responde 200 com {"erro": "true"} (texto, não booleano).
        if str(dados.get("erro", "")).lower() == "true":
            raise CepNaoEncontrado()

        return Endereco(
            logradouro=dados.get("logradouro", ""),
            bairro=dados.get("bairro", ""),
            cidade=dados.get("localidade", ""),
        )
