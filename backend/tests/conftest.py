import os
from collections.abc import Iterator
from pathlib import Path

# Precisa vir antes de qualquer import de `app`: as settings são lidas uma única vez.
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+psycopg://cep:cep@localhost:5434/cep_test"
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _criar_banco_se_nao_existir(url: str) -> None:
    alvo = make_url(url)
    admin = create_engine(alvo.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        existe = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :nome"), {"nome": alvo.database}
        ).scalar()
        if not existe:
            conn.execute(text(f'CREATE DATABASE "{alvo.database}"'))
    admin.dispose()


@pytest.fixture(scope="session")
def engine_de_teste() -> Iterator:
    """Banco `cep_test` no Postgres do docker-compose, com o schema criado pelas migrations reais."""
    _criar_banco_se_nao_existir(TEST_DATABASE_URL)
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(config, "head")

    engine = create_engine(TEST_DATABASE_URL)
    yield engine
    engine.dispose()


@pytest.fixture
def session(engine_de_teste) -> Iterator[Session]:
    """Sessão isolada: tudo o que o teste gravar (inclusive commits) é desfeito no final."""
    with engine_de_teste.connect() as conexao:
        transacao = conexao.begin()
        with Session(conexao, join_transaction_mode="create_savepoint", expire_on_commit=False) as sessao:
            yield sessao
        transacao.rollback()
