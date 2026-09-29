# CEP-API

Aplicação que consulta endereços pelo CEP na API pública [ViaCEP](https://viacep.com.br/) e mantém o histórico das consultas realizadas. Desenvolvida como desafio técnico para Desenvolvedor Júnior.

## Arquitetura

```
Vue 3 ──HTTP/JSON──▶ FastAPI (router) ──▶ Service (regra de negócio) ──▶ ViaCEP Client (API externa)
                                                                      └─▶ Repository (PostgreSQL)
```

Cada camada tem uma responsabilidade: o router só lida com HTTP, o service concentra as regras de negócio, o client isola a API externa e o repository isola o acesso ao banco.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Poetry, pytest.
- **Frontend:** Vue 3, Vite, TypeScript, Tailwind CSS.
- **Ambiente:** Docker e Docker Compose.

## Regras de negócio

| Situação | Resultado | Vai para o histórico? |
|---|---|---|
| CEP com formato inválido | Erro claro para o usuário | Não |
| CEP válido, mas inexistente | Erro claro para o usuário | Sim |
| CEP válido e encontrado | Endereço exibido | Sim |
| CEP já consultado antes | Consulta o ViaCEP novamente | Sim (nova entrada) |

## Status

Em desenvolvimento. As seções de instalação, execução (com e sem Docker), endpoints, decisões técnicas e limitações serão adicionadas conforme o projeto avança.
