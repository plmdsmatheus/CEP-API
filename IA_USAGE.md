# Uso de Inteligência Artificial

Registro do uso de IA neste projeto, conforme pedido no desafio técnico. Atualizado a cada etapa do desenvolvimento.

## 1. Ferramentas utilizadas

- **Claude Code** (CLI da Anthropic), modelo Sonnet 5.5.

## 2. Etapas em que a IA foi utilizada

| Etapa | Uso da IA |
|---|---|
| Configuração do repositório | Ajuste do `.gitignore` para excluir o `.docx` do enunciado e arquivos de ambiente/dependências. |
| Leitura do enunciado | Leitura do `.docx` do desafio e resumo dos requisitos. |
| Planejamento | Geração do plano de desenvolvimento (estrutura de pastas, regras de negócio, etapas de commit, verificação) a partir da arquitetura definida por mim. |

## 3. Exemplos de prompts utilizados

- "Dentro da pasta existe um docx, altera para mim, o .gitignore para excluir o arquivo .docx na hora de subir pro github"
- "Gera para mim um plano de desenvolvimento, seguindo a arquitetura proposta, usaremos de stack, backend: poetry, SQLAlchemy 2 com Alembic. Frontend: Vue 3 com Vite e TypeScript com Tailwind. Ambiente: usaremos Docker e docker-compose. Regras de negócios: [...]"

## 4. Como as respostas foram validadas

A preencher.

## 5. Sugestões da IA aproveitadas

- Estrutura de pastas em camadas (`routers`, `services`, `clients`, `repositories`, `models`, `schemas`) seguindo a arquitetura que defini.
- Padronização do corpo de erro da API (`code` + `message`) para o front tratar CEP inválido, inexistente e serviço indisponível do mesmo jeito.

## 6. Sugestões da IA descartadas

A preencher.

## 7. Desenvolvido ou ajustado manualmente

- Definição da arquitetura (Vue.js → FastAPI → Service → ViaCEP Client / Repository → PostgreSQL) e da stack (Poetry, SQLAlchemy 2, Alembic, Vue 3, Vite, TypeScript, Tailwind, Docker).
- Definição das regras de negócio: CEP inválido não é gravado; CEP inexistente é gravado; CEP repetido consulta o ViaCEP de novo e grava nova linha.
