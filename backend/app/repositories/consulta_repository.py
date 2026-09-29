from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consulta import Consulta


class ConsultaRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def salvar(self, consulta: Consulta) -> Consulta:
        self._session.add(consulta)
        self._session.commit()
        # Traz de volta o que o banco preencheu (id e, se não informada, a data da consulta).
        self._session.refresh(consulta)
        return consulta

    def listar(self, limit: int = 50, offset: int = 0) -> list[Consulta]:
        """Histórico da consulta mais recente para a mais antiga."""
        # O id desempata consultas com a mesma data (o now() do Postgres vale para a transação toda).
        consultas = select(Consulta).order_by(Consulta.consultado_em.desc(), Consulta.id.desc())
        return list(self._session.scalars(consultas.limit(limit).offset(offset)))
