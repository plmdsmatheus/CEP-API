from dataclasses import dataclass


@dataclass(frozen=True)
class Endereco:
    logradouro: str
    bairro: str
    cidade: str
