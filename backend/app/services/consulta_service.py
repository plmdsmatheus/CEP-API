import re
from dataclasses import dataclass

from app.exceptions import CepInvalido, CepNaoEncontrado
from app.models.consulta import Consulta, StatusConsulta

# Espaços, pontos e hífens são só formatação; qualquer outro caractere invalida o CEP.
_SEPARADORES = re.compile(r"[\s.\-]")
_CEP_REGEX = re.compile(r"\d{8}")


def normalizar_cep(cep: str) -> str:
    """Remove separadores e devolve os 8 dígitos do CEP, ou levanta CepInvalido."""
    somente_digitos = _SEPARADORES.sub("", cep)
    if not _CEP_REGEX.fullmatch(somente_digitos):
        raise CepInvalido()
    return somente_digitos


@dataclass(frozen=True)
class Resumo:
    """Contagem do histórico inteiro, sem considerar filtro nem paginação."""

    total: int
    encontrados: int
    nao_encontrados: int


@dataclass(frozen=True)
class Historico:
    items: list[Consulta]
    total: int  # itens que batem com o filtro (base da paginação)
    resumo: Resumo


class ConsultaService:
    def __init__(self, client, repository) -> None:
        self._client = client
        self._repository = repository

    def consultar(self, cep: str) -> Consulta:
        cep_normalizado = normalizar_cep(cep)
        try:
            endereco = self._client.buscar(cep_normalizado)
        except CepNaoEncontrado:
            # CEP inexistente também entra no histórico; o erro segue para o chamador.
            self._repository.salvar(Consulta(cep=cep_normalizado, status=StatusConsulta.NAO_ENCONTRADO))
            raise
        consulta = Consulta(
            cep=cep_normalizado,
            logradouro=endereco.logradouro,
            bairro=endereco.bairro,
            cidade=endereco.cidade,
            status=StatusConsulta.ENCONTRADO,
        )
        return self._repository.salvar(consulta)

    def listar(
        self, status: StatusConsulta | None = None, limit: int = 50, offset: int = 0
    ) -> Historico:
        por_status = self._repository.contar_por_status()
        resumo = Resumo(
            total=sum(por_status.values()),
            encontrados=por_status[StatusConsulta.ENCONTRADO],
            nao_encontrados=por_status[StatusConsulta.NAO_ENCONTRADO],
        )
        return Historico(
            items=self._repository.listar(status=status, limit=limit, offset=offset),
            total=self._repository.contar(status=status),
            resumo=resumo,
        )
