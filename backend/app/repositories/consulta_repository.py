from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.consulta import Consulta, StatusConsulta


class ConsultaRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def salvar(self, consulta: Consulta) -> Consulta:
        self._session.add(consulta)
        self._session.commit()
        # Traz de volta o que o banco preencheu (id e, se não informada, a data da consulta).
        self._session.refresh(consulta)
        return consulta

    def listar(
        self, status: StatusConsulta | None = None, limit: int = 50, offset: int = 0
    ) -> list[Consulta]:
        """Histórico da consulta mais recente para a mais antiga, com filtro opcional por status."""
        # O id desempata consultas com a mesma data (o now() do Postgres vale para a transação toda).
        consultas = self._filtrar(select(Consulta), status).order_by(
            Consulta.consultado_em.desc(), Consulta.id.desc()
        )
        return list(self._session.scalars(consultas.limit(limit).offset(offset)))

    def contar(self, status: StatusConsulta | None = None) -> int:
        total = self._filtrar(select(func.count()).select_from(Consulta), status)
        return self._session.scalar(total) or 0

    def contar_por_status(self) -> dict[StatusConsulta, int]:
        """Quantidade de consultas por status; status sem nenhuma consulta aparece com 0."""
        linhas = self._session.execute(
            select(Consulta.status, func.count()).group_by(Consulta.status)
        ).all()
        contagem = {status: 0 for status in StatusConsulta}
        contagem.update({status: quantidade for status, quantidade in linhas})
        return contagem

    @staticmethod
    def _filtrar(consulta: Select, status: StatusConsulta | None) -> Select:
        return consulta if status is None else consulta.where(Consulta.status == status)
