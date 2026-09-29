from datetime import UTC, datetime

import pytest
from sqlalchemy import select

from app.models.consulta import Consulta, StatusConsulta
from app.repositories.consulta_repository import ConsultaRepository


@pytest.fixture
def repository(session) -> ConsultaRepository:
    return ConsultaRepository(session)


def _encontrada(cep: str = "59000000", **campos) -> Consulta:
    return Consulta(
        cep=cep,
        logradouro="Rua Teste",
        bairro="Centro",
        cidade="Natal",
        status=StatusConsulta.ENCONTRADO,
        **campos,
    )


def test_salvar_grava_no_banco_e_preenche_id_e_data(repository, session):
    salva = repository.salvar(_encontrada())

    assert salva.id is not None
    assert salva.consultado_em.tzinfo is not None
    no_banco = session.scalars(select(Consulta)).all()
    assert [c.id for c in no_banco] == [salva.id]


def test_salvar_cep_inexistente_persiste_campos_de_endereco_nulos(repository, session):
    salva = repository.salvar(Consulta(cep="99999999", status=StatusConsulta.NAO_ENCONTRADO))

    session.expire_all()  # força a leitura do que realmente ficou no banco
    do_banco = session.get(Consulta, salva.id)
    assert do_banco.cep == "99999999"
    assert do_banco.status == StatusConsulta.NAO_ENCONTRADO
    assert do_banco.logradouro is None
    assert do_banco.bairro is None
    assert do_banco.cidade is None


def test_mesmo_cep_salvo_duas_vezes_gera_duas_linhas(repository):
    repository.salvar(_encontrada("59000000"))
    repository.salvar(_encontrada("59000000"))

    assert len(repository.listar()) == 2


def test_listar_sem_consultas_devolve_lista_vazia(repository):
    assert repository.listar() == []


def test_listar_devolve_da_mais_recente_para_a_mais_antiga(repository):
    repository.salvar(_encontrada("11111111", consultado_em=datetime(2026, 1, 2, tzinfo=UTC)))
    repository.salvar(_encontrada("33333333", consultado_em=datetime(2026, 1, 3, tzinfo=UTC)))
    repository.salvar(_encontrada("22222222", consultado_em=datetime(2026, 1, 1, tzinfo=UTC)))

    assert [c.cep for c in repository.listar()] == ["33333333", "11111111", "22222222"]


def test_listar_desempata_pela_ordem_de_gravacao_quando_a_data_e_igual(repository):
    mesmo_instante = datetime(2026, 1, 1, tzinfo=UTC)
    repository.salvar(_encontrada("11111111", consultado_em=mesmo_instante))
    repository.salvar(_encontrada("22222222", consultado_em=mesmo_instante))

    assert [c.cep for c in repository.listar()] == ["22222222", "11111111"]


def test_listar_respeita_limit_e_offset(repository):
    for dia in range(1, 6):  # 5 consultas, a de dia 5 é a mais recente
        repository.salvar(_encontrada(f"0000000{dia}", consultado_em=datetime(2026, 1, dia, tzinfo=UTC)))

    pagina = repository.listar(limit=2, offset=1)

    assert [c.cep for c in pagina] == ["00000004", "00000003"]


def _inexistente(cep: str) -> Consulta:
    return Consulta(cep=cep, status=StatusConsulta.NAO_ENCONTRADO)


def _salvar_historico_misto(repository: ConsultaRepository) -> None:
    repository.salvar(_encontrada("11111111"))
    repository.salvar(_inexistente("22222222"))
    repository.salvar(_encontrada("33333333"))


def test_listar_filtra_por_status(repository):
    _salvar_historico_misto(repository)

    encontradas = repository.listar(status=StatusConsulta.ENCONTRADO)
    inexistentes = repository.listar(status=StatusConsulta.NAO_ENCONTRADO)

    assert [c.cep for c in encontradas] == ["33333333", "11111111"]
    assert [c.cep for c in inexistentes] == ["22222222"]


def test_listar_com_filtro_tambem_respeita_limit_e_offset(repository):
    _salvar_historico_misto(repository)

    pagina = repository.listar(status=StatusConsulta.ENCONTRADO, limit=1, offset=1)

    assert [c.cep for c in pagina] == ["11111111"]


def test_contar_sem_filtro_conta_todas_as_consultas(repository):
    _salvar_historico_misto(repository)

    assert repository.contar() == 3


def test_contar_com_filtro_conta_so_o_status_pedido(repository):
    _salvar_historico_misto(repository)

    assert repository.contar(status=StatusConsulta.ENCONTRADO) == 2
    assert repository.contar(status=StatusConsulta.NAO_ENCONTRADO) == 1


def test_contar_por_status_devolve_todos_os_status_inclusive_os_zerados(repository):
    assert repository.contar_por_status() == {
        StatusConsulta.ENCONTRADO: 0,
        StatusConsulta.NAO_ENCONTRADO: 0,
    }

    _salvar_historico_misto(repository)

    assert repository.contar_por_status() == {
        StatusConsulta.ENCONTRADO: 2,
        StatusConsulta.NAO_ENCONTRADO: 1,
    }
