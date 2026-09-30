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
| Frontend base (etapa 3) | Scaffold do Vue 3 + Vite + TypeScript, Tailwind v4, shadcn-vue (Button, Input, Card, Table, Badge, Alert, Label) e Vitest + Vue Test Utils; proxy de `/api` no Vite; remoção do boilerplate. |
| Direção visual do frontend | Uso da skill `impeccable`: entrevista de produto (`frontend/PRODUCT.md`), rodada de decisão visual com direções sorteadas e alternativas, e definição dos tokens (paleta em OKLCH, tipografia, modo claro e escuro, utilitários do tema) em `src/style.css`, com contraste WCAG AA conferido por cálculo. |
| Verificação visual do frontend | Capturas de tela automatizadas (Playwright, fora do repositório) da página em desktop e celular, nos modos claro e escuro, cobrindo consulta encontrada, CEP inexistente, serviço fora do ar, filtro e paginação, contra a API e o Postgres reais (banco descartável). A revisão das imagens achou dois defeitos de layout, corrigidos em seguida, e o detector do `impeccable` não apontou problemas. |
| Docker (etapa 4) | Dockerfiles da API (Python 3.14, Poetry, usuário sem privilégios, migrations na subida) e do frontend (build em várias etapas e nginx com proxy de `/api`), `docker-compose.yml` com `db`, `api` e `web` e healthchecks, e `.env.example`. Testei a subida completa num projeto Compose isolado (portas e volume próprios), conferindo o site, a API pelo proxy, o Swagger e o cache dos assets. |
| Client do ViaCEP (TDD) | Ciclo red/green do `ViaCepClient` com `httpx.MockTransport` (sem chamar a internet nos testes): mapeia CEP inexistente, timeout, erro HTTP e resposta inválida. Também chamei a API real do ViaCEP para conferir o formato da resposta de CEP inexistente. |

## 3. Exemplos de prompts utilizados
Os exemplos abaixo representam prompts relevantes para as decisões e etapas descritas neste documento; não constituem a totalidade das interações realizadas durante o desenvolvimento.

- "Testando em aparelhos mobiles notei um erro de responsividade, teste com Playwright em um aparelho com 366px por 768px."
- "Gera para mim um plano de desenvolvimento, seguindo a arquitetura proposta, usaremos de stack. Backend: poetry, SQLAlchemy 2 com Alembic. Frontend: Vue 3 com Vite e TypeScript com Tailwind. Ambiente: usaremos Docker e docker-compose. Regras de negócios: [...]"
- "Ok, antes de começarmos a seguir com o desenvolvimento, utilizararemos uma técnica de software: TDD"
- "Separaremos o desenvolvimento por etapas: sendo a primeira etapa o planejamento, a segunda etapa sendo o ciclo de Red/Green do backend e regras de negocios, a terceira etapa sendo o ciclo Red/Green do frontend e por fim, a ultima etapa sendo o Docker/docker-compose."

## 4. Como as respostas foram validadas

- **Testes automatizados:** cada ciclo Red foi executado antes da implementação para confirmar a falha esperada; após cada Green, a suíte completa (`poetry run pytest`) era executada para verificar regressões.
- **Revisão do código:** li o código gerado a cada ciclo antes de commitar.
- **Testes manuais:** com o Postgres real no ar, testei a API simulando consultas com CEPs, e depois a aplicação completa no Docker (`docker compose up --build`, em http://localhost:8080). Depois dos testes, resetei o banco de dados. Juntamente no desenvolvimento da API, utilizei o POSTMAN para conferir mais a fundo as requisições e respostas da API.
- **Verificação visual:** capturas de tela em desktop e celular, nos modos claro e escuro, contra a API e o ViaCEP reais. A revisão das imagens apontou defeitos de layout que foram corrigidos, e um texto repetido no aviso de CEP inexistente, corrigido em um ciclo de TDD.
- **Conferência de fatos externos:** o comportamento do ViaCEP (resposta `{"erro": "true"}` e o fato de o CEP `59000000` do enunciado não existir) foi conferido chamando a API real, e os CEPs de exemplo do README também.

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

- **SQLite em memória nos testes de integração:** alternativa apresentada pela IA e descartada em favor do PostgreSQL via Docker Compose.
- **Teste e código no mesmo commit:** era a opção recomendada pela IA; escolhi commits separados (`Test:` para o red e `Feat:` para o green) para tornar o ciclo Red/Green explicitamente observável no histórico de commits.
- **Formato de CEP restrito:** a primeira versão da IA aceitava apenas hífen depois do quinto dígito, e a IA ofereceu escrever testes para rejeitar entradas estranhas como `59-000-000`. Decidi aceitar espaços, pontos e hífens e tratar entradas estranhas com máscara no frontend.

## 7. Decisões e intervenções manuais
Esta seção registra decisões de arquitetura, regras de negócio, escolhas de implementação e intervenções realizadas após avaliar as sugestões da IA.

- Arquitetura e stack: definição da arquitetura em camadas (Vue.js → FastAPI → Service → ViaCEP Client / Repository → PostgreSQL) e da stack utilizada (Poetry, SQLAlchemy 2, Alembic, Vue 3, Vite, TypeScript, Tailwind CSS e Docker).
- Estratégia de testes: decisão de utilizar TDD de dentro para fora, começando pela camada de serviço, com commits separados para os ciclos Test: (Red) e Feat: (Green). Nos testes de integração, optei por utilizar PostgreSQL via Docker Compose, em vez de SQLite em memória, para manter os testes alinhados ao mesmo banco utilizado pela aplicação.
- Tratamento de indisponibilidade do ViaCEP: definição de que, caso o serviço externo esteja indisponível, a API deve retornar HTTP 502 com uma mensagem clara e não registrar a consulta no histórico.
- Regras de negócio: definição do comportamento para CEPs inválidos, inexistentes e repetidos: CEPs com formato inválido não são gravados; CEPs válidos, mas inexistentes no ViaCEP, são registrados; e consultas repetidas ao mesmo CEP realizam nova consulta ao ViaCEP e geram um novo registro no histórico.
- Histórico: decisão de enriquecer o endpoint de histórico com envelope de resposta, filtros por status e resumo das consultas (total, encontrados e não encontrados). O status “inválido” no resumo passou a representar CEPs inexistentes, pois CEPs com formato inválido não chegam a ser registrados.
- Frontend: escolha de TDD com Vitest, fetch nativo com composables, sem TanStack Query, shadcn-vue para os componentes e uma página única, sem Vue Router. Embora a IA recomendasse utilizar Tailwind CSS diretamente em vez do shadcn-vue, optei por manter a biblioteca por decisão própria, buscando maior consistência visual e uma interface menos genérica.
- Paginação: decisão de implementar a paginação manualmente, utilizando limit e offset no repository e no router, sem adotar fastapi-pagination, buscando reduzir o acoplamento a bibliotecas de terceiros e manter maior controle sobre as consultas ao banco.
- Validação do comportamento do ViaCEP: verificação direta do comportamento da API para CEPs inexistentes, incluindo a confirmação de que o campo erro é retornado como texto ("true"). Também foi verificado que o CEP utilizado como exemplo no enunciado (59000000) não correspondia a um CEP existente no serviço.
- Normalização do CEP: decisão de aceitar espaços, pontos e hífens como separadores na entrada, normalizando o valor antes do processamento.
- Revisão dos ciclos Red/Green: revisão e refatoração dos testes e implementações produzidos ao longo do TDD, garantindo consistência de nomenclatura, estrutura e padrões de código.
- Ordenação determinística do histórico: inclusão do id como critério de desempate na ordenação, pois o now() do PostgreSQL pode produzir o mesmo timestamp para diferentes registros inseridos dentro de uma mesma transação.

## 8. Papel da IA no desenvolvimento

A IA foi utilizada como ferramenta de apoio ao desenvolvimento, principalmente para planejamento, geração inicial de código e testes, revisão de implementação, exploração de alternativas e identificação de possíveis problemas.

As decisões de arquitetura, regras de negócio, escolhas de stack e critérios de aceitação foram definidas e revisadas manualmente. As implementações geradas pela IA não foram consideradas válidas apenas por terem sido produzidas; cada etapa foi submetida a testes automatizados, revisão do código, testes manuais ou validação contra serviços externos, conforme aplicável.

Sugestões da IA também foram descartadas quando não estavam alinhadas às decisões do projeto, como documentado na seção de sugestões descartadas.