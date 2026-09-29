import pytest

from app.exceptions import CepInvalido
from app.models.consulta import StatusConsulta
from app.services.consulta_service import ConsultaService
from tests.fakes import FakeConsultaRepository, FakeViaCepClient


@pytest.fixture
def client() -> FakeViaCepClient:
    return FakeViaCepClient()


@pytest.fixture
def repository() -> FakeConsultaRepository:
    return FakeConsultaRepository()


@pytest.fixture
def service(client, repository) -> ConsultaService:
    return ConsultaService(client=client, repository=repository)


@pytest.mark.parametrize(
    "cep",
    ["", "123", "5900000", "590000000", "5900000a", "abcdefgh", "59.000-00a", "   "],
)
def test_cep_invalido_levanta_erro_sem_consultar_nem_gravar(service, client, repository, cep):
    with pytest.raises(CepInvalido):
        service.consultar(cep)

    assert client.ceps_consultados == []
    assert repository.salvos == []


@pytest.mark.parametrize(
    "cep",
    ["59000000", "59000-000", "59 000 000", "59.000-000", "59.000000", " 59000-000 "],
)
def test_cep_com_separadores_e_valido(service, cep):
    service.consultar(cep)  # não deve levantar CepInvalido


def test_cep_valido_consulta_o_client_com_o_cep_normalizado(service, client):
    service.consultar("59.000-000")

    assert client.ceps_consultados == ["59000000"]


def test_cep_encontrado_grava_consulta_com_endereco_e_status_encontrado(service, repository):
    service.consultar("59000-000")

    assert len(repository.salvos) == 1
    gravada = repository.salvos[0]
    assert gravada.cep == "59000000"
    assert gravada.logradouro == "Rua Teste"
    assert gravada.bairro == "Centro"
    assert gravada.cidade == "Natal"
    assert gravada.status == StatusConsulta.ENCONTRADO


def test_cep_encontrado_retorna_a_consulta_gravada(service, repository):
    resultado = service.consultar("59000000")

    assert resultado is repository.salvos[0]
    assert resultado.id == 1
    assert resultado.consultado_em is not None
