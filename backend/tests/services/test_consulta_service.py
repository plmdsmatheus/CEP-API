import pytest

from app.exceptions import CepInvalido
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
    ["", "123", "5900000", "590000000", "5900000a", "abcdefgh", "59 000 000"],
)
def test_cep_invalido_levanta_erro_sem_consultar_nem_gravar(service, client, repository, cep):
    with pytest.raises(CepInvalido):
        service.consultar(cep)

    assert client.ceps_consultados == []
    assert repository.salvos == []
