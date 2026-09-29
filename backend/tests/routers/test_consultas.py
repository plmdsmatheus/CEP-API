from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_consulta_service
from app.exceptions import CepNaoEncontrado, ViaCepIndisponivel
from app.main import app
from app.services.consulta_service import ConsultaService
from tests.fakes import FakeConsultaRepository, FakeViaCepClient


@pytest.fixture
def viacep() -> FakeViaCepClient:
    return FakeViaCepClient()


@pytest.fixture
def repository() -> FakeConsultaRepository:
    return FakeConsultaRepository()


@pytest.fixture
def api(viacep, repository):
    """API real (rotas, validação, erros) com o service ligado a dublês: sem banco nem internet."""
    app.dependency_overrides[get_consulta_service] = lambda: ConsultaService(
        client=viacep, repository=repository
    )
    yield TestClient(app)
    app.dependency_overrides.clear()


def _erro(resposta) -> dict:
    return resposta.json()["detail"]


# --- POST /api/consultas ---------------------------------------------------------------


def test_post_cep_encontrado_devolve_200_com_o_endereco(api):
    resposta = api.post("/api/consultas", json={"cep": "59000000"})

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert set(corpo) == {"cep", "logradouro", "bairro", "cidade", "dataConsulta"}
    assert corpo["cep"] == "59000000"
    assert corpo["logradouro"] == "Rua Teste"
    assert corpo["bairro"] == "Centro"
    assert corpo["cidade"] == "Natal"
    assert datetime.fromisoformat(corpo["dataConsulta"]).tzinfo is not None


def test_post_normaliza_o_cep_informado_com_separadores(api):
    resposta = api.post("/api/consultas", json={"cep": "59.000-000"})

    assert resposta.status_code == 200
    assert resposta.json()["cep"] == "59000000"


@pytest.mark.parametrize("cep", ["123", "5900000a", ""])
def test_post_cep_invalido_devolve_422_com_mensagem_e_nao_grava(api, repository, cep):
    resposta = api.post("/api/consultas", json={"cep": cep})

    assert resposta.status_code == 422
    assert _erro(resposta)["code"] == "CEP_INVALIDO"
    assert _erro(resposta)["message"]
    assert repository.salvos == []


def test_post_cep_inexistente_devolve_404_com_mensagem_e_grava(api, viacep, repository):
    viacep.erro = CepNaoEncontrado()

    resposta = api.post("/api/consultas", json={"cep": "99999999"})

    assert resposta.status_code == 404
    assert _erro(resposta)["code"] == "CEP_NAO_ENCONTRADO"
    assert _erro(resposta)["message"]
    assert len(repository.salvos) == 1


def test_post_viacep_indisponivel_devolve_502_com_mensagem_e_nao_grava(api, viacep, repository):
    viacep.erro = ViaCepIndisponivel()

    resposta = api.post("/api/consultas", json={"cep": "59000000"})

    assert resposta.status_code == 502
    assert _erro(resposta)["code"] == "VIACEP_INDISPONIVEL"
    assert _erro(resposta)["message"]
    assert repository.salvos == []


@pytest.mark.parametrize("corpo", [{}, {"cep": 59000000}, {"cep": None}])
def test_post_corpo_invalido_devolve_422_no_mesmo_formato_de_erro(api, corpo):
    resposta = api.post("/api/consultas", json=corpo)

    assert resposta.status_code == 422
    assert _erro(resposta)["code"] == "REQUISICAO_INVALIDA"
    assert _erro(resposta)["message"]


# --- GET /api/consultas ----------------------------------------------------------------


def test_get_historico_vazio_devolve_lista_vazia(api):
    resposta = api.get("/api/consultas")

    assert resposta.status_code == 200
    assert resposta.json() == []


def test_get_historico_devolve_da_mais_recente_para_a_mais_antiga_com_status(api, viacep):
    api.post("/api/consultas", json={"cep": "11111111"})
    viacep.erro = CepNaoEncontrado()
    api.post("/api/consultas", json={"cep": "22222222"})

    resposta = api.get("/api/consultas")

    assert resposta.status_code == 200
    historico = resposta.json()
    assert [(c["cep"], c["status"]) for c in historico] == [
        ("22222222", "nao_encontrado"),
        ("11111111", "encontrado"),
    ]
    assert set(historico[0]) == {"id", "cep", "logradouro", "bairro", "cidade", "status", "dataConsulta"}
    assert historico[0]["logradouro"] is None
    assert historico[1]["cidade"] == "Natal"


def test_get_historico_respeita_limit_e_offset(api):
    for cep in ("11111111", "22222222", "33333333"):
        api.post("/api/consultas", json={"cep": cep})

    resposta = api.get("/api/consultas", params={"limit": 2, "offset": 1})

    assert [c["cep"] for c in resposta.json()] == ["22222222", "11111111"]


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}, {"limit": "abc"}],
)
def test_get_historico_com_paginacao_invalida_devolve_422(api, params):
    resposta = api.get("/api/consultas", params=params)

    assert resposta.status_code == 422
    assert _erro(resposta)["code"] == "REQUISICAO_INVALIDA"
