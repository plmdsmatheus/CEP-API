import re

from app.exceptions import CepInvalido

# 8 dígitos, com hífen opcional depois do quinto (ex.: 59000000 ou 59000-000).
_CEP_REGEX = re.compile(r"^\d{5}-?\d{3}$")


class ConsultaService:
    def __init__(self, client, repository) -> None:
        self._client = client
        self._repository = repository

    def consultar(self, cep: str):
        if not _CEP_REGEX.fullmatch(cep):
            raise CepInvalido()
