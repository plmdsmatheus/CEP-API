"""Dublês de teste para as dependências do service (client do ViaCEP e repository)."""

from datetime import UTC, datetime

from app.clients.viacep import Endereco
from app.models.consulta import Consulta


class FakeViaCepClient:
    """Devolve sempre o mesmo endereço e registra os CEPs recebidos."""

    def __init__(self) -> None:
        self.ceps_consultados: list[str] = []
        self.endereco = Endereco(logradouro="Rua Teste", bairro="Centro", cidade="Natal")

    def buscar(self, cep: str) -> Endereco:
        self.ceps_consultados.append(cep)
        return self.endereco


class FakeConsultaRepository:
    """Guarda em memória e preenche id e data como o banco faria."""

    def __init__(self) -> None:
        self.salvos: list[Consulta] = []

    def salvar(self, consulta: Consulta) -> Consulta:
        consulta.id = len(self.salvos) + 1
        consulta.consultado_em = datetime.now(UTC)
        self.salvos.append(consulta)
        return consulta
