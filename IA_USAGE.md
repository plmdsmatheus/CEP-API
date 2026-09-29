# Uso de Inteligência Artificial

Registro do uso de IA neste projeto, conforme pedido no desafio técnico. Atualizado a cada etapa do desenvolvimento.

## 1. Ferramentas utilizadas

- **Claude Code** (CLI da Anthropic), modelo Sonnet 5.5.

## 2. Etapas em que a IA foi utilizada

| Etapa | Uso da IA |
|---|---|
| Planejamento | Geração do plano de desenvolvimento (estrutura de pastas, regras de negócio, etapas de commit, verificação) a partir da arquitetura definida por mim. |
| Backend base (etapa 2) | Instalação do Poetry (o existente estava quebrado), criação do `pyproject.toml`, das dependências, de `config.py`, `db/session.py`, `db/base.py` e de `main.py` com `/health` e CORS. |
| Regras de negócio do service (TDD) | Escrita dos testes (red) e da implementação mínima (green) de cada regra do `ConsultaService`, um ciclo por vez: validação e normalização do CEP, CEP encontrado, CEP inexistente, ViaCEP indisponível e CEP repetido. Resultado: 22 testes unitários, com dublês de client e repository (`tests/fakes.py`). |
| Repository e Postgres (TDD) | Criação do `docker-compose.yml` com o `db`, configuração do Alembic e da migration inicial, fixtures de teste em `tests/conftest.py` (banco `cep_test`, migrations reais e rollback por teste) e o ciclo red/green do `ConsultaRepository` (7 testes de integração no Postgres). |
| Router e histórico (TDD) | Ciclos red/green do `POST /api/consultas` (mapeamento de erros para 422, 404 e 502 com `code` + `message`) e do `GET /api/consultas` com paginação manual (`limit`/`offset`), filtro por `status` e envelope com `total` e `resumo`, atravessando router, service e repository. Também rodei a API contra o Postgres e o ViaCEP reais para conferir as respostas. |
| Client do ViaCEP (TDD) | Ciclo red/green do `ViaCepClient` com `httpx.MockTransport` (sem chamar a internet nos testes): mapeia CEP inexistente, timeout, erro HTTP e resposta inválida. Também chamei a API real do ViaCEP para conferir o formato da resposta de CEP inexistente. |

## 3. Exemplos de prompts utilizados

- "Dentro da pasta existe um docx, altera para mim, o .gitignore para excluir o arquivo .docx na hora de subir pro github"
- "Gera para mim um plano de desenvolvimento, seguindo a arquitetura proposta, usaremos de stack, backend: poetry, SQLAlchemy 2 com Alembic. Frontend: Vue 3 com Vite e TypeScript com Tailwind. Ambiente: usaremos Docker e docker-compose. Regras de negócios: [...]"
- "Ok, antes de começarmos a seguir com o desenvolvimento, gostaria de utilizar uma técnica de software (TDD)"

## 4. Como as respostas foram validadas

- **Testes automatizados:** cada green só foi aceito com a suíte inteira passando (`poetry run pytest`), e cada red foi executado antes para confirmar que falhava pelo motivo esperado.
- **Revisão do código:** li o código gerado a cada ciclo. Até esta etapa essa foi a minha única validação manual, porque ainda não há banco de dados real para testes manuais.
- **Próximas etapas:** com o Postgres rodando (Docker Compose), farei testes manuais simulando consultas com CEPs válidos, inválidos, inexistentes e repetidos, e conferindo o que foi gravado no banco.

## 5. Sugestões da IA aproveitadas

- Estrutura de pastas em camadas (`routers`, `services`, `clients`, `repositories`, `models`, `schemas`) seguindo a arquitetura que defini.
- Dependências e configuração do backend: `pydantic-settings` para ler `.env`, SQLAlchemy 2 síncrono com `psycopg` 3 e sessão por requisição via `Depends`.
- Padronização do corpo de erro da API (`code` + `message`) para o front tratar CEP inválido, inexistente e serviço indisponível do mesmo jeito.
- Exceções de negócio (`CepInvalido`, `CepNaoEncontrado`, `ViaCepIndisponivel`) com código estável e mensagem clara, herdando de uma base comum.
- Normalização do CEP no service removendo só espaços, pontos e hífens; letras continuam tornando o CEP inválido.
- Status da consulta guardado como texto no banco (sem tipo enum nativo do Postgres), para simplificar as migrations.
- Porta 5434 para o Postgres do Compose, porque a IA identificou que a 5432 e a 5433 já estavam em uso na máquina.
- Sessão de teste com rollback por teste (transação externa + savepoint), para os testes de integração não interferirem entre si.
- Testes do client com transporte simulado (`httpx.MockTransport`), sem depender da internet nem do ViaCEP no ar.
- Tratamento de qualquer falha do ViaCEP (timeout, conexão, status HTTP de erro, corpo que não é JSON) como `ViaCepIndisponivel`.
- Envelope do histórico (`items`, `total`, `limit`, `offset`, `resumo`) com resumo global e total filtrado à parte, para a paginação funcionar mesmo com filtro.
- Handlers de erro centralizados (`error_handlers.py`) que mapeiam as exceções de negócio para o status HTTP, mantendo o service sem conhecer HTTP.
- Teste de caracterização para o CEP repetido: ele passou de primeira, por proteger uma regra que já era verdadeira (sem cache).

## 6. Sugestões da IA descartadas

- **SQLite em memória nos testes de integração:** a IA apresentou essa alternativa, mas optei por utilizar PostgreSQL via Docker Compose para que os testes fossem executados sobre o mesmo banco utilizado pela aplicação, reduzindo possíveis diferenças de comportamento.
- **Teste e código no mesmo commit:** era a opção recomendada pela IA; escolhi commits separados (`Test:` para o red e `Feat:` para o green) para mostrar o ciclo TDD no histórico.
- **Formato de CEP restrito:** a primeira versão da IA aceitava apenas hífen depois do quinto dígito, e a IA ofereceu escrever testes para rejeitar entradas estranhas como `59-000-000`. Decidi aceitar espaços, pontos e hífens e tratar entradas estranhas com máscara no frontend.

## 7. Desenvolvido ou ajustado manualmente

- Definição da arquitetura (Vue.js → FastAPI → Service → ViaCEP Client / Repository → PostgreSQL) e da stack (Poetry, SQLAlchemy 2, Alembic, Vue 3, Vite, TypeScript, Tailwind, Docker).
- Decisão de usar TDD (de dentro para fora, começando pelo service), com commits separados `Test:` (red) e `Feat:` (green) e Postgres via Docker Compose nos testes de integração.
- Escolha do Python 3.14 e decisão de que, se o ViaCEP estiver fora do ar, a API retorna 502 com mensagem clara e não grava no histórico.
- Definição das regras de negócio: CEP inválido não é gravado; CEP inexistente é gravado; CEP repetido consulta o ViaCEP de novo e grava nova linha.
- Decisão de enriquecer o histórico com envelope, filtro por status e resumo (total, encontrados, não encontrados); o "inválido" do resumo passou a ser o CEP inexistente, já que CEP de formato inválido não é gravado.
- Decisão de implementar a paginação do histórico manualmente (`limit` e `offset` no repository e no router), sem `fastapi-pagination`, para reduzir o acoplamento a bibliotecas de terceiros e ter controle total das consultas ao banco.
- Correção da IA sobre o formato do erro do ViaCEP: informei que ele responde `{"erro": "true"}` (texto) para CEP inexistente; a IA confirmou chamando a API real e descobriu que o CEP do exemplo do enunciado (`59000000`) não existe no ViaCEP.
- Decisão sobre o formato do CEP: aceitar espaços, pontos e hífens como separadores.
- Revisão e Refatoração de cada Red (testes) e Greens (Implementações) que estavam fora do padrão 
- Desempate por `id` na listagem do histórico, porque o `now()` do Postgres é igual para todas as linhas de uma mesma transação.