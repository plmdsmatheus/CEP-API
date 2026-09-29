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


def _registrar_historico_misto(api, viacep) -> None:
    """Histórico com 2 encontrados (11111111, 33333333) e 1 inexistente (22222222)."""
    api.post("/api/consultas", json={"cep": "11111111"})
    viacep.erro = CepNaoEncontrado()
    api.post("/api/consultas", json={"cep": "22222222"})
    viacep.erro = None
    api.post("/api/consultas", json={"cep": "33333333"})


def test_get_historico_vazio_devolve_envelope_zerado(api):
    resposta = api.get("/api/consultas")

    assert resposta.status_code == 200
    assert resposta.json() == {
        "items": [],
        "total": 0,
        "limit": 50,
        "offset": 0,
        "resumo": {"total": 0, "encontrados": 0, "naoEncontrados": 0},
    }


def test_get_historico_devolve_itens_da_mais_recente_para_a_mais_antiga_com_status(api, viacep):
    _registrar_historico_misto(api, viacep)

    resposta = api.get("/api/consultas")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert set(corpo) == {"items", "total", "limit", "offset", "resumo"}
    itens = corpo["items"]
    assert [(c["cep"], c["status"]) for c in itens] == [
        ("33333333", "encontrado"),
        ("22222222", "nao_encontrado"),
        ("11111111", "encontrado"),
    ]
    assert set(itens[0]) == {"id", "cep", "logradouro", "bairro", "cidade", "status", "dataConsulta"}
    assert itens[1]["logradouro"] is None
    assert itens[0]["cidade"] == "Natal"


def test_get_historico_traz_resumo_com_totais_por_status(api, viacep):
    _registrar_historico_misto(api, viacep)

    corpo = api.get("/api/consultas").json()

    assert corpo["total"] == 3
    assert corpo["resumo"] == {"total": 3, "encontrados": 2, "naoEncontrados": 1}


def test_get_historico_respeita_limit_e_offset_e_devolve_o_total_completo(api, viacep):
    _registrar_historico_misto(api, viacep)

    corpo = api.get("/api/consultas", params={"limit": 2, "offset": 1}).json()

    assert [c["cep"] for c in corpo["items"]] == ["22222222", "11111111"]
    assert corpo["limit"] == 2
    assert corpo["offset"] == 1
    assert corpo["total"] == 3


def test_get_historico_filtra_por_status_e_mantem_o_resumo_global(api, viacep):
    _registrar_historico_misto(api, viacep)

    corpo = api.get("/api/consultas", params={"status": "encontrado"}).json()

    assert [c["cep"] for c in corpo["items"]] == ["33333333", "11111111"]
    assert corpo["total"] == 2
    assert corpo["resumo"] == {"total": 3, "encontrados": 2, "naoEncontrados": 1}


def test_get_historico_filtrado_por_nao_encontrado(api, viacep):
    _registrar_historico_misto(api, viacep)

    corpo = api.get("/api/consultas", params={"status": "nao_encontrado"}).json()

    assert [c["cep"] for c in corpo["items"]] == ["22222222"]
    assert corpo["total"] == 1


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}, {"limit": "abc"}, {"status": "invalido"}],
)
def test_get_historico_com_parametros_invalidos_devolve_422(api, params):
    resposta = api.get("/api/consultas", params=params)

    assert resposta.status_code == 422
    assert _erro(resposta)["code"] == "REQUISICAO_INVALIDA"
