"""Dublês de teste para as dependências do service (client do ViaCEP e repository)."""


class FakeViaCepClient:
    def __init__(self) -> None:
        self.ceps_consultados: list[str] = []

    def buscar(self, cep: str) -> dict[str, str]:
        self.ceps_consultados.append(cep)
        return {
            "cep": cep,
            "logradouro": "Rua Teste",
            "bairro": "Centro",
            "cidade": "Natal",
        }


class FakeConsultaRepository:
    def __init__(self) -> None:
        self.salvos: list[object] = []

    def salvar(self, consulta: object) -> object:
        self.salvos.append(consulta)
        return consulta
