import httpx
import pytest

from app.clients.viacep import Endereco, ViaCepClient
from app.exceptions import CepNaoEncontrado, ViaCepIndisponivel

BASE_URL = "https://viacep.test/ws"


def _client(handler) -> ViaCepClient:
    """Client do ViaCEP com transporte simulado: nenhum teste chama a internet."""
    return ViaCepClient(base_url=BASE_URL, timeout_seconds=1, transport=httpx.MockTransport(handler))


def test_cep_encontrado_devolve_endereco_com_cidade_vinda_de_localidade():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "cep": "59000-000",
                "logradouro": "Rua Teste",
                "bairro": "Centro",
                "localidade": "Natal",
                "uf": "RN",
            },
        )

    endereco = _client(handler).buscar("59000000")

    assert endereco == Endereco(logradouro="Rua Teste", bairro="Centro", cidade="Natal")


def test_consulta_a_url_do_viacep_com_o_cep():
    urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        urls.append(str(request.url))
        return httpx.Response(200, json={"logradouro": "", "bairro": "", "localidade": "Natal"})

    _client(handler).buscar("59000000")

    assert urls == ["https://viacep.test/ws/59000000/json/"]


def test_cep_generico_de_cidade_aceita_logradouro_e_bairro_vazios():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"logradouro": "", "bairro": "", "localidade": "Natal"})

    endereco = _client(handler).buscar("59000000")

    assert endereco == Endereco(logradouro="", bairro="", cidade="Natal")


@pytest.mark.parametrize("marcador", [True, "true"])
def test_cep_inexistente_levanta_cep_nao_encontrado(marcador):
    # O ViaCEP responde 200 com {"erro": true} (às vezes como texto) para CEP que não existe.
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"erro": marcador})

    with pytest.raises(CepNaoEncontrado):
        _client(handler).buscar("99999999")


def test_timeout_levanta_viacep_indisponivel():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("tempo esgotado", request=request)

    with pytest.raises(ViaCepIndisponivel):
        _client(handler).buscar("59000000")


def test_falha_de_conexao_levanta_viacep_indisponivel():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("sem rede", request=request)

    with pytest.raises(ViaCepIndisponivel):
        _client(handler).buscar("59000000")


@pytest.mark.parametrize("status", [400, 429, 500, 502, 503])
def test_resposta_de_erro_http_levanta_viacep_indisponivel(status):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status)

    with pytest.raises(ViaCepIndisponivel):
        _client(handler).buscar("59000000")


def test_resposta_que_nao_e_json_levanta_viacep_indisponivel():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<html>manutenção</html>")

    with pytest.raises(ViaCepIndisponivel):
        _client(handler).buscar("59000000")
