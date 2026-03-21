# Relatório de Analytics - Cobertura Máxima

## Objetivo
Este documento descreve todas as métricas e eventos atualmente coletados no projeto para maximizar observabilidade de uso, performance e falhas.

## Pré-requisito
Definir a variável de ambiente `VITE_GA_MEASUREMENT_ID` para habilitar envio ao Google Analytics 4.

## Camadas de Coleta

### 1) Inicialização e navegação
- Evento: `Navegação / App Boot`
- Page view: enviado via `trackPageView`
- User properties registradas no início da sessão:
  - `viewport`
  - `timezone`
  - `language`
  - `platform`

### 2) Performance de carregamento
- Timing: `TTFB`
- Timing: `DOM Ready`
- Timing: `Page Load`
- Resumo de recursos em evento `Performance / Resource Summary` com:
  - total de resources
  - total de scripts
  - total de CSS
  - total de imagens
  - total de fetch
  - valor numérico em KB transferidos
- Timing: `Used JS Heap (MB)` quando suportado pelo navegador

### 3) Web Vitals e UX performance
- Timing: `FCP`
- Timing: `LCP`
- Evento: `Performance / CLS`
- Timing: `INP Candidate`

### 4) Ciclo de vida da sessão
- Evento: `Engajamento / Visibility Change` (visible/hidden)
- Timing: `Session Duration (ms)` em mudanças de visibilidade e no page hide
- Timing: `Session Heartbeat (s)` a cada 60 segundos

### 5) Rede e conectividade
- Evento: `Navegação / Network Status` com labels `online` e `offline`

### 6) Erros e exceções
- `trackError` para erros de domínio
- Captura global de `window.error`
- Captura global de `unhandledrejection`
- Error Boundary envia evento `Erro / React Error Boundary`

### 7) Interações globais
- Evento: `UI Interaction / Global Click`
- Coleta cliques em:
  - button
  - link
  - role=button
  - input button/submit
- Label inclui papel do elemento e melhor descrição disponível (`aria-label`, `title` ou texto)

## Métricas de negócio já existentes no projeto
- Seleção de linha e parada
- Eventos de busca/filtro
- Eventos de detalhe de linha, itinerário e horários
- Eventos de tema e localização

## Métricas prioritárias de produto (foco principal)

### Linhas
- Evento: `Engajamento / Selecionar Linha no Menu`
  - O que responde: quais linhas são mais escolhidas por categoria de dia
- Evento: `Engajamento / Clique Card Linha`
  - O que responde: interesse por linha em relação ao status e próximo horário
- Evento: `Navegação Principal / Resumo Lista Linhas`
  - O que responde: tamanho da lista apresentada por categoria e por termo de busca

### Horários
- Evento: `Horarios / Abrir Modal Horarios`
  - O que responde: quais linhas têm maior consulta de horários
- Evento: `Horarios / Distribuicao Horarios`
  - O que responde: relação entre horários passados e próximos no momento da consulta
- Evento: `Horarios / Fechar Modal Horarios`
  - O que responde: frequência de fechamento e possível abandono da consulta

### Botões e ações de UI
- Evento: `UI Interaction / Abrir Menu Mobile`
- Evento: `UI Interaction / Fechar Menu Mobile`
- Evento: `Engajamento / Abrir Detalhes pelo Menu`
- Evento: `Engajamento Detalhes / Fechar Modal Detalhes Linha`

Esses eventos dão visão clara de intenção de uso: descoberta de linhas, consulta de horários e interação com botões-chave.

## Como montar dashboards no GA4

### Dashboard 1: Uso geral
- Métricas: Event count, Users, Sessions
- Dimensões: Event name, Device category, Country, Page path
- Filtros recomendados:
  - `event_name contains App Boot`
  - `event_name contains Global Click`

### Dashboard 2: Performance
- Métricas customizadas por evento/timing:
  - TTFB
  - DOM Ready
  - Page Load
  - FCP
  - LCP
  - INP Candidate
  - CLS (valor derivado do label/value)
- Quebras por:
  - Browser
  - Device category
  - Operating system

### Dashboard 3: Erros
- Métricas: event count de categoria `Erro`
- Dimensões: action, label
- Segmentação:
  - Fatal vs não fatal
  - Página atual

### Dashboard 4: Engajamento
- Sessão média por heartbeat e session duration
- Visibility changes
- Global click por tipo de elemento

## Recomendações para ainda mais dados
- Adicionar BigQuery export no GA4 para análises avançadas.
- Criar eventos de funil por fluxo crítico (ex.: seleção de linha -> abertura de detalhes -> clique em horário).
- Criar alertas no GA4 para picos de erro e regressão de LCP/INP.

## Limites práticos
Mesmo com cobertura máxima no frontend, não existe coleta literal de "tudo" sem custo.
- Coletar eventos demais pode gerar ruído e custo.
- GA4 possui limites de cardinalidade e volume.
- Dados sensíveis não devem ser enviados.

A implementação atual prioriza alta cobertura com segurança, sem capturar dados pessoais.
