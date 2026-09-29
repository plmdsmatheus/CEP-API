import re

from app.exceptions import CepInvalido
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


class ConsultaService:
    def __init__(self, client, repository) -> None:
        self._client = client
        self._repository = repository

    def consultar(self, cep: str) -> Consulta:
        cep_normalizado = normalizar_cep(cep)
        endereco = self._client.buscar(cep_normalizado)
        consulta = Consulta(
            cep=cep_normalizado,
            logradouro=endereco.logradouro,
            bairro=endereco.bairro,
            cidade=endereco.cidade,
            status=StatusConsulta.ENCONTRADO,
        )
        return self._repository.salvar(consulta)
