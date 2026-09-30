class ErroDeNegocio(Exception):
    """Erro esperado da aplicação, com código estável e mensagem para o usuário."""

    code: str
    message: str

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        self.message = message or self.message


class CepInvalido(ErroDeNegocio):
    code = "CEP_INVALIDO"
    message = "CEP inválido. Informe 8 dígitos, com ou sem hífen (ex.: 59000-000)."


class CepNaoEncontrado(ErroDeNegocio):
    code = "CEP_NAO_ENCONTRADO"
    message = "CEP não encontrado. Confira os números digitados e tente novamente."


class ViaCepIndisponivel(ErroDeNegocio):
    code = "VIACEP_INDISPONIVEL"
    message = "O serviço de consulta de CEP está indisponível no momento. Tente novamente em instantes."
