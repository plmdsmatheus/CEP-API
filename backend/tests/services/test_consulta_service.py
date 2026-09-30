import pytest

from app.exceptions import CepInvalido, CepNaoEncontrado, ViaCepIndisponivel
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


def test_cep_inexistente_levanta_erro_para_o_chamador(service, client):
    client.erro = CepNaoEncontrado()

    with pytest.raises(CepNaoEncontrado):
        service.consultar("99999999")


def test_cep_inexistente_grava_consulta_com_status_nao_encontrado_e_sem_endereco(service, client, repository):
    client.erro = CepNaoEncontrado()

    with pytest.raises(CepNaoEncontrado):
        service.consultar("99999-999")

    assert len(repository.salvos) == 1
    gravada = repository.salvos[0]
    assert gravada.cep == "99999999"
    assert gravada.logradouro is None
    assert gravada.bairro is None
    assert gravada.cidade is None
    assert gravada.status == StatusConsulta.NAO_ENCONTRADO
    assert gravada.consultado_em is not None


def test_viacep_indisponivel_levanta_erro_para_o_chamador(service, client):
    client.erro = ViaCepIndisponivel()

    with pytest.raises(ViaCepIndisponivel):
        service.consultar("59000000")


def test_viacep_indisponivel_nao_grava_no_historico(service, client, repository):
    client.erro = ViaCepIndisponivel()

    with pytest.raises(ViaCepIndisponivel):
        service.consultar("59000000")

    assert client.ceps_consultados == ["59000000"]
    assert repository.salvos == []


def test_cep_repetido_consulta_o_client_de_novo_e_grava_nova_linha(service, client, repository):
    primeira = service.consultar("59000-000")
    segunda = service.consultar("59000000")

    assert client.ceps_consultados == ["59000000", "59000000"]
    assert len(repository.salvos) == 2
    assert primeira is not segunda
    assert primeira.id != segunda.id


def _registrar_historico_misto(service, client) -> None:
    """Histórico com 2 encontrados (11111111, 33333333) e 1 inexistente (22222222)."""
    service.consultar("11111111")
    client.erro = CepNaoEncontrado()
    with pytest.raises(CepNaoEncontrado):
        service.consultar("22222222")
    client.erro = None
    service.consultar("33333333")


def test_listar_devolve_pagina_com_total_e_resumo(service, client):
    _registrar_historico_misto(service, client)

    historico = service.listar(limit=2, offset=0)

    assert [c.cep for c in historico.items] == ["33333333", "22222222"]
    assert historico.total == 3
    assert historico.resumo.total == 3
    assert historico.resumo.encontrados == 2
    assert historico.resumo.nao_encontrados == 1


def test_listar_paginado_mantem_o_total_de_todo_o_historico(service, client):
    _registrar_historico_misto(service, client)

    historico = service.listar(limit=1, offset=2)

    assert [c.cep for c in historico.items] == ["11111111"]
    assert historico.total == 3


def test_listar_filtrado_tem_total_do_filtro_e_resumo_global(service, client):
    _registrar_historico_misto(service, client)

    historico = service.listar(status=StatusConsulta.ENCONTRADO, limit=1)

    assert [c.cep for c in historico.items] == ["33333333"]
    assert historico.total == 2
    assert historico.resumo.total == 3
    assert historico.resumo.encontrados == 2
    assert historico.resumo.nao_encontrados == 1
