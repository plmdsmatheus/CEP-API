# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Já definido pelo projeto (não é decisão em aberto): Vue 3 + Vite + TypeScript, Tailwind CSS v4 e shadcn-vue (reka, estilo nova, base neutral), com Vitest + Vue Test Utils. Backend FastAPI em `/api`, acessado via `fetch` nativo.

## Users

Avaliador do desafio técnico (processo seletivo de Desenvolvedor Júnior), que abre a tela por poucos minutos para ver se a solução funciona e julgar a qualidade do trabalho. O produto simula uma ferramenta interna de uma empresa que consulta endereços e mantém histórico para análises; o usuário fictício dessa ferramenta é o funcionário que consulta CEPs.

## Product Purpose

Consultar o endereço de um CEP (via API pública ViaCEP, através do backend próprio) e manter o histórico das consultas realizadas, para futuras consultas e análises. Sucesso: consultar um CEP e ver o resultado ou um erro claro; visualizar o histórico com resumo, filtro por status e paginação.

## Operating Context

Página única. Fluxos: informar CEP (máscara automática, só dígitos, hífen automático), consultar, ver o resultado ou o erro, e ver o histórico (resumo com total, encontrados e não encontrados; filtro por status; tabela paginada de 10 em 10, da mais recente para a mais antiga). Toda consulta de CEP válido é gravada (encontrado ou não encontrado); CEP com formato inválido e falha do ViaCEP não são gravados.

## Capabilities and Constraints

- Estados de erro com significados distintos: CEP inválido (formato), CEP inexistente (aviso, é gravado), serviço do ViaCEP indisponível ou falha de rede (erro, não gravado).
- `59000000` não existe no ViaCEP (serve de exemplo de inexistente); `01001000` (Praça da Sé) é um CEP real.
- Idioma da interface: português do Brasil.
- Comportamento dos componentes é desenvolvido em TDD; o visual não é coberto por testes.

## Brand Commitments

Nenhuma marca ou logo pré-existentes. Nome de trabalho: "Consulta de CEP".

## Evidence on Hand

Sem depoimentos, clientes ou métricas (e nada disso deve ser inventado). Dados de demonstração reais vêm da API ViaCEP.

## Product Principles

- O resultado da consulta e o motivo de qualquer erro devem ser compreendidos de relance.
- Cada estado (carregando, vazio, erro, aviso, sucesso) é projetado, não improvisado.
- O histórico deve ser fácil de varrer e filtrar.
- Cuidado visível em detalhes pequenos vale mais que decoração.

## Accessibility & Inclusion

pt-BR, WCAG AA, uso completo por teclado (Enter envia o formulário), foco visível, suporte a modo claro e escuro e a `prefers-reduced-motion`.
