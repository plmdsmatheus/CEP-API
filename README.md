# CEP-API

Aplicação que consulta o endereço de um CEP na API pública [ViaCEP](https://viacep.com.br/) e mantém o histórico de todas as consultas realizadas. Desenvolvida como desafio técnico para Desenvolvedor Júnior.

- **Consulta:** informa o CEP, vê o endereço ou um erro claro.
- **Histórico:** resumo (total, encontrados, não encontrados), filtro por status e tabela paginada, da consulta mais recente para a mais antiga.
- **Uso de IA:** o processo está documentado em [`IA_USAGE.md`](IA_USAGE.md).

## Sumário

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Dados de teste](#dados-de-teste)
- [API](#api)
- [Regras de negócio](#regras-de-negócio)
- [Testes](#testes)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Decisões técnicas](#decisões-técnicas)
- [Limitações conhecidas](#limitações-conhecidas)

## Arquitetura

```
Vue 3 ──HTTP/JSON──▶ FastAPI (router) ──▶ Service (regra de negócio) ──▶ ViaCEP Client (API externa)
                                                                      └─▶ Repository (PostgreSQL)
```

Cada camada tem uma responsabilidade:

| Camada | Responsabilidade | Não faz |
|---|---|---|
| **Router** | Receber a requisição, validar o formato do corpo e dos parâmetros, devolver a resposta HTTP | Regra de negócio, SQL |
| **Service** | Normalizar e validar o CEP, decidir o que grava no histórico, montar o resumo | Falar HTTP ou SQL |
| **ViaCEP Client** | Chamar o ViaCEP e traduzir respostas e falhas para o vocabulário da aplicação | Gravar no banco |
| **Repository** | Todo o acesso ao PostgreSQL (gravar, listar, contar) | Regra de negócio |

Em produção (Docker) o navegador acessa só o nginx, que serve o frontend e faz proxy de `/api` para a API. A API não expõe porta no host.

## Stack

- **Backend:** Python 3.14, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 17, `httpx`, Poetry, pytest.
- **Frontend:** Vue 3, Vite, TypeScript, Tailwind CSS v4, shadcn-vue (Reka UI), Vitest + Vue Test Utils.
- **Ambiente:** Docker e Docker Compose (nginx servindo o frontend).

## Como rodar

### Com Docker (recomendado)

Pré-requisito: Docker com Compose.

```bash
docker compose up --build
```

Quando os três containers estiverem saudáveis:

| O quê | Endereço |
|---|---|
| Aplicação | http://localhost:8080 |
| Documentação da API (Swagger) | http://localhost:8080/docs |

As migrations do banco são aplicadas automaticamente na subida da API. As configurações têm valores padrão; para mudá-las, copie `.env.example` para `.env` na raiz (portas do Postgres e do site, usuário e senha do banco, URL e timeout do ViaCEP).

Para parar: `docker compose down`. Para parar **e apagar o banco** (volume): `docker compose down -v`.

### Sem Docker (desenvolvimento)

Pré-requisitos: Python 3.14, [Poetry](https://python-poetry.org/) 2, Node.js 24 e um PostgreSQL. O jeito mais simples de ter o PostgreSQL é subir só o serviço `db` do Compose (porta **5434** no host, para não conflitar com um Postgres local):

```bash
docker compose up -d db
```

**Backend** (http://localhost:8000, Swagger em `/docs`):

```bash
cd backend
cp .env.example .env            # aponta para o Postgres do Compose (localhost:5434)
poetry install
poetry run alembic upgrade head # cria a tabela
poetry run uvicorn app.main:app --reload
```

**Frontend** (http://localhost:5173), em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Em desenvolvimento o Vite encaminha `/api` para `http://localhost:8000`, então não há CORS a configurar.

### Configuração do backend

| Variável | Padrão | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://cep:cep@localhost:5434/cep` | Conexão com o PostgreSQL |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Origens permitidas (só relevante fora do proxy) |
| `VIACEP_BASE_URL` | `https://viacep.com.br/ws` | Base da API externa |
| `VIACEP_TIMEOUT_SECONDS` | `5` | Timeout da chamada ao ViaCEP |

### Resetar o histórico

- Com o Docker (apaga tudo, inclusive a tabela): `docker compose down -v`
- Só apagar as consultas, mantendo a tabela:
  ```bash
  docker compose exec db psql -U cep -d cep -c "TRUNCATE consultas RESTART IDENTITY"
  ```

## Dados de teste

Não há seed: o histórico é gerado pelas próprias consultas. Alguns CEPs para experimentar (conferidos no ViaCEP):

| CEP | Resultado esperado |
|---|---|
| `01001-000` | Encontrado: Praça da Sé, São Paulo |
| `01310-100` | Encontrado: Avenida Paulista, São Paulo |
| `20040-020` | Encontrado (Rio de Janeiro) |
| `30130-010` | Encontrado (Belo Horizonte) |
| `80010-000` | Encontrado (Curitiba) |
| `59000-000` | **Inexistente**: 404 e a consulta é gravada |
| `99999-999` | **Inexistente**: 404 e a consulta é gravada |
| `123` | **Inválido**: 422 e nada é gravado |

> O CEP `59000000` do exemplo do enunciado do desafio **não existe** no ViaCEP (a API responde `{"erro": "true"}`), por isso ele serve aqui como exemplo de CEP inexistente.

## API

Documentação interativa: `/docs` (Swagger UI).

### `POST /api/consultas`

Consulta o CEP no ViaCEP e registra a consulta. Aceita o CEP com ou sem separadores (`59000000`, `59000-000`, `59.000-000`).

```bash
curl -X POST http://localhost:8080/api/consultas \
  -H 'Content-Type: application/json' \
  -d '{"cep": "01001-000"}'
```

```json
{
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "dataConsulta": "2026-09-29T23:20:06.109789Z"
}
```

### `GET /api/consultas`

Histórico, da consulta mais recente para a mais antiga.

| Parâmetro | Padrão | Regras |
|---|---|---|
| `status` | (todos) | `encontrado` ou `nao_encontrado` |
| `limit` | `50` | de 1 a 100 |
| `offset` | `0` | maior ou igual a 0 |

```bash
curl 'http://localhost:8080/api/consultas?status=nao_encontrado&limit=10'
```

```json
{
  "items": [
    {
      "id": 2,
      "cep": "59000000",
      "logradouro": null,
      "bairro": null,
      "cidade": null,
      "status": "nao_encontrado",
      "dataConsulta": "2026-09-29T23:20:06.301220Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "resumo": { "total": 2, "encontrados": 1, "naoEncontrados": 1 }
}
```

- `total` conta os itens que batem com o filtro (base da paginação).
- `resumo` sempre conta o histórico **inteiro**, sem considerar filtro nem paginação.

### `GET /health`

Devolve `{"status": "ok"}` (usado pelo healthcheck do Docker).

### Erros

Todos os erros seguem o mesmo formato, para o frontend tratá-los de forma uniforme:

```json
{ "detail": { "code": "CEP_NAO_ENCONTRADO", "message": "CEP não encontrado. Confira os números digitados e tente novamente." } }
```

| Situação | HTTP | `code` | Grava no histórico? |
|---|---|---|---|
| CEP com formato inválido | 422 | `CEP_INVALIDO` | Não |
| Corpo ou parâmetros inválidos | 422 | `REQUISICAO_INVALIDA` | Não |
| CEP válido que não existe no ViaCEP | 404 | `CEP_NAO_ENCONTRADO` | **Sim** |
| ViaCEP fora do ar, lento ou com resposta inválida | 502 | `VIACEP_INDISPONIVEL` | Não |

## Regras de negócio

- **CEP inválido não é gravado.** Se o formato não tem 8 dígitos, nem o ViaCEP é chamado.
- **CEP inexistente é gravado**, com o endereço vazio e o status `nao_encontrado`. O usuário recebe o erro, mas a tentativa entra no histórico.
- **CEP repetido consulta o ViaCEP de novo** e grava uma nova linha: não há cache, porque toda consulta deve ser registrada.
- **ViaCEP indisponível responde 502 e não grava**, porque a falha não diz nada sobre o CEP.
- **Normalização:** espaços, pontos e hífens são removidos antes de validar. Letras continuam tornando o CEP inválido.

## Testes

Os testes de backend que tocam o banco usam o **PostgreSQL real** do Compose (banco `cep_test`, criado automaticamente, com o schema vindo das migrations do Alembic). Suba o `db` antes:

```bash
docker compose up -d db

cd backend && poetry run pytest    # 71 testes
cd frontend && npm test            # 180 testes
```

- **Backend:** service com dublês de client e repository; repository contra o Postgres (cada teste roda numa transação desfeita no final); client do ViaCEP com `httpx.MockTransport` (nenhum teste chama a internet); router com `TestClient` e o service ligado a dublês.
- **Frontend:** utilitários, cliente da API (`fetch` simulado), composables, componentes e a página inteira, esta contra um backend falso em memória.

O projeto foi desenvolvido com **TDD**, e o histórico do Git mostra o ciclo: um commit `Test:` (red) seguido do `Feat:` (green). O visual (layout, cores, responsivo) não é coberto por testes automatizados; foi conferido com capturas de tela em desktop e celular, nos modos claro e escuro.

## Estrutura do repositório

```
CEP-API/
├── backend/
│   ├── app/
│   │   ├── main.py              # app, CORS, rotas e handlers de erro
│   │   ├── routers/             # HTTP: POST/GET /api/consultas
│   │   ├── services/            # regra de negócio
│   │   ├── clients/             # ViaCEP
│   │   ├── repositories/        # acesso ao PostgreSQL
│   │   ├── models/, schemas/    # tabela (SQLAlchemy) e contrato JSON (Pydantic)
│   │   ├── core/, db/           # configuração e sessão do banco
│   │   ├── dependencies.py      # injeção de dependências
│   │   └── error_handlers.py    # exceções de negócio → respostas HTTP
│   ├── alembic/                 # migrations
│   ├── tests/                   # pytest
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.vue              # a página
│   │   ├── components/          # formulário, resultado, alertas, histórico, ui/ (shadcn-vue)
│   │   ├── composables/         # useConsulta, useHistorico
│   │   ├── api/, types/, utils/ # cliente HTTP, tipos do contrato, máscara de CEP, datas, tema
│   │   └── style.css            # tokens visuais (cores, fontes, modo escuro)
│   ├── nginx.conf, Dockerfile
│   └── PRODUCT.md               # contexto de produto usado no design da interface
├── docker-compose.yml, .env.example
├── README.md, IA_USAGE.md
```

## Decisões técnicas

- **Camadas separadas (router → service → client/repository).** Facilita testar cada regra sem HTTP nem banco e trocar a fonte de dados sem mexer na regra. O service não conhece HTTP; quem decide o status HTTP de cada erro é `error_handlers.py`.
- **Erros com `code` estável e `message` para o usuário.** O frontend escolhe o tipo de alerta pelo `code` (aviso para CEP inexistente, erro para serviço fora do ar) e exibe a `message` do backend.
- **SQLAlchemy 2 síncrono com `psycopg` 3.** O gargalo é a chamada externa ao ViaCEP; endpoints assíncronos não trariam ganho relevante e deixariam o código mais difícil de ler.
- **Status guardado como texto**, sem tipo `ENUM` nativo do Postgres, para simplificar as migrations quando surgirem novos status.
- **Datas em UTC** (`timestamptz`, com `now()` do banco). O frontend mostra no fuso do navegador.
- **Paginação manual com `limit` e `offset`**, sem `fastapi-pagination`, para ter controle total das consultas e não acoplar o projeto a uma biblioteca. O `id` desempata consultas com a mesma data, porque o `now()` do Postgres vale para a transação toda.
- **`resumo` global e `total` filtrado.** Assim o resumo não muda ao filtrar e a paginação continua correta com filtro.
- **Testes do repository no Postgres real**, e não em SQLite, para exercitar tipos, fuso e as migrations verdadeiras. A sessão de teste usa transação externa com rollback, então os testes não interferem entre si.
- **Frontend com `fetch` nativo e composables** (`useConsulta`, `useHistorico`), sem biblioteca de estado nem roteador: são dois endpoints e uma página. O `useHistorico` ignora respostas antigas quando o usuário troca de filtro ou página rápido.
- **Máscara de CEP no cliente** (só dígitos, hífen automático). A validação de verdade continua no backend.
- **nginx com proxy de `/api`** no mesmo endereço do site: sem CORS e sem expor a porta da API.
- **Interface "Guia de Ruas".** A tela segue a linguagem de um guia de ruas impresso (via amarela, contorno tracejado para "rua projetada"). O estado nunca depende só de cor: cada um combina forma do traço, texto e ícone, e a interface atende contraste WCAG AA nos modos claro e escuro.

## Limitações conhecidas

- **Sem autenticação nem usuários:** o histórico é global.
- **Sem cache nem retentativa:** cada consulta chama o ViaCEP, com timeout de 5 s e sem novas tentativas. Se o ViaCEP cair, a API responde 502.
- **O banco expõe a porta 5434 no host** no `docker-compose.yml`, para facilitar o desenvolvimento e os testes fora do Docker. Em produção, essa publicação deve ser removida.
- **Credenciais padrão simples** (`cep`/`cep`) no Compose; são só para desenvolvimento e devem ser trocadas via `.env`.
- **Sem HTTPS**: o nginx atende só em HTTP.
- **A tabela de regiões postais** (primeiro dígito do CEP, usada na régua da tela) está no frontend e foi escrita a partir da divisão conhecida dos Correios, mas não foi conferida contra uma fonte oficial.
- **Uma falha inesperada (HTTP 500) não recarrega o histórico**, pois não se sabe se a consulta foi gravada; ele atualiza na próxima ação.
- **Sem integração contínua (CI) nem linter configurado.**
- **`npm audit`** aponta vulnerabilidades moderadas em dependências de desenvolvimento (cadeia `vite` → `stylus`), que não vão para o navegador.
- **O visual não tem testes automatizados** (só conferência manual por capturas de tela).
