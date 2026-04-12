# AdInsight — Roadmap de Implementação (Fase 1)

Divisão do PRD em etapas ordenadas por dependência técnica.
Cada etapa termina com um entregável visual testável.

**Legenda:** ✅ Concluída — Fase 1 completa em Abril 2026

---

## Etapa 1 — Fundação do Monorepo + Autenticação ✅

**Status:** Concluída — commit `a17ac66`
**Concluída em:** 2026-03-30

**O que foi construído:**
- Monorepo pnpm workspaces (`apps/api`, `apps/web`, `packages/shared-types`)
- `docker-compose.yml` com PostgreSQL 16 + Redis 7
- `packages/shared-types`: interfaces `User`, `UserSession`, `AuthTokens`, `ApiResponse`
- `apps/api`:
  - Express + TypeScript + Zod (validação de env)
  - Pool PostgreSQL (`pg`), cliente Redis reservado para próximas etapas
  - Migration `20250629_000001_create_users.sql` (tabela `users`, enum `user_role`, trigger `updated_at`)
  - Scripts `db:migrate`, `db:status`, `db:seed`, `db:rollback`
  - Módulo `auth`: controller → service → repository → routes
  - Endpoints: `GET /api/auth/check-setup`, `POST /api/auth/setup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
  - Middleware: `requireAuth` (JWT), `requireRole` (RBAC), `errorMiddleware` (AppError + Zod)
  - Rate limiting no login (5 tentativas / 10 min)
- `apps/web`:
  - React 18 + Vite + TypeScript + Tailwind CSS
  - Alias `@adinsight/shared-types` → source TypeScript (sem build step no dev)
  - `auth.store.ts` (Zustand + persist)
  - `apiClient` (Axios) com interceptor de refresh token automático
  - `SetupPage` — criação do primeiro admin, bloqueada após uso
  - `LoginPage`
  - `AppShell` (sidebar com nav RBAC + topbar com logout)
  - `Router` com `BootstrapCheck` (detecta needsSetup) e `RequireAuth` (guard por role)

**Teste visual confirmado:**
- `/setup` aparece no primeiro acesso → bloqueado após cadastro
- Login → redireciona para `/dashboard` com AppShell

**Dependências:** nenhuma

---

## Etapa 2 — Painel Admin: Usuários e Integrações de Plataforma ✅

**Status:** Concluída — commits `4cc299b` / `53ec133`
**Concluída em:** 2026-03-30

**O que construir:**

*Backend (`apps/api`):*
- Migration: tabela `ad_platforms` (credenciais criptografadas AES-256-GCM)
- Migration: tabela `user_invites` (token, expiração 48h)
- `src/shared/crypto/` — encrypt/decrypt com `ENCRYPTION_KEY`
- Módulo `users`: listar, convidar (email), editar role, desativar
- Módulo `platforms`: CRUD, endpoint `POST /api/platforms/:id/test-connection` (mock por ora)
- `src/shared/mailer/` — Nodemailer para envio de convites
- Endpoint `POST /api/auth/activate` — ativa conta via token de convite

*Frontend (`apps/web`):*
- Rota `/admin` protegida por `ADMIN`
- Seção **Admin → Usuários**: lista, botão convidar (modal com email + role), editar role, desativar
- Seção **Admin → Integrações**: cards por plataforma (Meta, Google, TikTok, Pinterest), formulário de credenciais, botão "Testar conexão", badge de status (Ativo / Erro / Não configurado)
- Página de ativação de conta (`/activate?token=...`)

**Teste visual:**
- Convidar usuário por email → link de ativação → logar como Gestor de Tráfego
- Cadastrar credenciais de plataforma → ver status "Ativo" após teste

**Dependências:** Etapa 1

---

## Etapa 3 — Canais de Negócio ✅

**Status:** Concluída — commit `0a95ff5`
**Concluída em:** 2026-03-30

**O que construir:**

*Backend:*
- Migration: tabela `business_channels` (nome, cor, palavras-chave, status)
- Módulo `channels`: CRUD completo
- Seed: 5 canais pré-cadastrados (Loja das Profs, Clube das Profs, Tudo de Prof, Mentoria Do Giz ao Digital, Lançamentos)

*Frontend:*
- Seção **Admin → Canais**: criar, editar, arquivar, lista com cor e palavras-chave

**Teste visual:**
- Criar canal com cor e palavras-chave, arquivá-lo, verificar que não aparece nos filtros ativos

**Dependências:** Etapa 1

---

## Etapa 4 — Dashboard com Dados Seed ✅

**Status:** Concluída — commit `7c3d3e0`
**Concluída em:** 2026-03-30

**O que construir:**

*Backend:*
- Migrations: `campaigns`, `ad_sets`, `ads`, `metric_snapshots`
- Seed rico: campanhas fictícias com 90 dias de métricas distribuídas entre plataformas e canais
- Endpoints `GET /api/dashboard/*`:
  - KPIs consolidados (investimento, impressões, cliques, CTR, CPC, CPL, leads, conversões, ROAS)
  - Série temporal por métrica e período
  - Distribuição por plataforma e por canal (donut)
  - Ranking de campanhas (top por ROAS, CPL, gasto)
  - Tabela paginada de campanhas com filtros

*Frontend:*
- KPI cards com variação vs período anterior e ícone de tendência
- Gráfico de linha temporal (Recharts) com multi-métrica e eixo Y duplo
- Donut alternável (por plataforma / por canal)
- Ranking horizontal de campanhas
- Heatmap hora × dia
- Tabela paginada (50/página) com ordenação, busca e filtro por status
- Seletor de período (Hoje, 7d, 14d, 30d, Este mês, Mês anterior, Personalizado)
- Comparativo de períodos (toggle)
- Filtros por canal, plataforma, objetivo — persistidos na URL
- Toggle Consolidado / Por Plataforma
- Visão Executiva (perfil Diretora): resumo em linguagem natural, semáforo, top 3

**Teste visual:**
- Dashboard completo com seed, todos os filtros e gráficos funcionando
- Trocar para perfil Diretora → ver visão executiva simplificada

**Dependências:** Etapas 1, 2, 3

---

## Etapa 5 — Integração Real com Plataformas de Anúncio ✅

**Status:** Concluída — commit `be7ef49`
**Concluída em:** 2026-03-30

**O que construir:**

*Backend:*
- Adapters em `src/modules/platforms/`: `meta/`, `google/`, `tiktok/`, `pinterest/`
  - Cada um implementa: `testConnection`, `syncCampaigns`, `syncMetrics`
- BullMQ: queue `sync-campaigns`, jobs agendados a cada 1h por plataforma
- `src/shared/queue/` + `src/shared/websocket/`
- WebSocket events: `sync:started`, `sync:completed`, `sync:failed`

*Frontend:*
- Badge de status por plataforma no dashboard (Atualizado / Sincronizando / Erro)
- Botão de sync manual com seletor de intervalo (5min, 15min, 30min, 1h)
- Indicador "última atualização" com timestamp em todas as páginas

**Teste visual:**
- Conectar conta real do Meta → ver campanhas reais na tabela → badge atualizado

**Dependências:** Etapa 2, 4

---

## Etapa 6 — Associação de Campanhas a Canais ✅

**Status:** Concluída — commit `be7ef49`
**Concluída em:** 2026-03-30

**O que construir:**

*Backend:*
- Lógica de auto-associação por palavras-chave no momento da sync
- Flag `channel_locked` por campanha (evita sobrescrita após associação manual)
- Endpoint `PATCH /api/campaigns/:id/channel`
- Fila de revisão: endpoint `GET /api/campaigns?channel=none`

*Frontend:*
- Atribuição inline de canal na tabela de campanhas (dropdown)
- Seção **Admin → Fila de revisão**: campanhas sem canal para classificação manual

**Teste visual:**
- Campanhas com palavras-chave do canal já associadas automaticamente
- Fila "Sem canal" com associação manual inline

**Dependências:** Etapas 3, 5

---

## Etapa 7 — Alertas ✅

**Status:** Concluída — commit `823caf8`
**Concluída em:** 2026-03-30

**O que foi construído:**

*Backend:*
- Migration `20260330_000008_create_alert_rules.sql`: ENUMs `alert_metric` + `alert_operator`, tabela `alert_rules` (nome, métrica, operador, threshold, período, plataforma, canal, destinatários, ativo)
- Migration `20260330_000009_create_alert_events.sql`: tabela `alert_events` (histórico de disparos com FK em cascade)
- Módulo `alerts`: controller → service → repository → routes → evaluator
  - CRUD completo de regras (`GET/POST/PUT/DELETE /api/alerts`)
  - Histórico de eventos (`GET /api/alerts/events`)
  - Avaliação manual (`POST /api/alerts/evaluate`)
  - `alerts.evaluator.ts`: calcula métricas via SQL, compara threshold, grava evento, emite WS + envia email
- `sendAlertEmail` adicionado ao mailer compartilhado
- Queue `evaluate-alerts` (BullMQ) + worker `evaluate-alerts.worker.ts`
- Scheduler: avaliação de alertas a cada 30min (`:15` e `:45` de cada hora)
- WsEvent `alert:triggered` adicionado ao tipo union do backend e frontend

*Frontend:*
- `apps/web/src/features/admin/alerts/alerts.api.ts` — client para todos os endpoints
- `apps/web/src/features/admin/alerts/AlertsPage.tsx` — CRUD de regras (tabs Regras / Histórico), formulário modal, toggle ativo/inativo, avaliação manual
- TopBar: badge de notificações in-app (incrementa em `alert:triggered`, reseta ao visitar `/alerts`)
- Rota `/alerts` adicionada ao router

**Teste visual:**
- Criar regra "ROAS < 2" → clicar "Avaliar agora" → ver evento no histórico + notificação no sino

**Dependências:** Etapas 4, 5

---

## Etapa 8 — Integração WooCommerce (Faturamento) ✅

**Status:** Concluída
**Concluída em:** a verificar no git log

**O que foi construído:**

*Backend:*
- Migration `20260330_000010_create_woo_stores.sql`: `woo_store_status`, tabela `woo_stores` (3 lojas pré-inseridas: Loja das Profs, Clube das Profs, Tudo de Prof)
- Migration `20260330_000011_create_woo_orders.sql`: `woo_orders` com ENUM `woo_order_status`
- Migration `20260330_000012_create_woo_subscriptions.sql`: `woo_subscriptions` (YITH — Clube das Profs)
- Migration `20260330_000013_flex_woo_stores.sql`: `type` TEXT (livre), `source_type` (`woocommerce`|`manual`), `is_deletable` — lojas pré-cadastradas protegidas de exclusão
- `apps/api/src/modules/woocommerce/`:
  - `woo.adapter.ts` — cliente WooCommerce REST API v3 com Basic Auth (evita Cloudflare WAF), paginação automática, `testConnection`, `syncOrders`, `syncSubscriptions`
  - `revenue.importer.ts` — parser de Excel/CSV: aliases de colunas pt/en, formato BRL, datas BR, serial Excel
  - `woo-stores.repository.ts` — CRUD por UUID, upsert de pedidos/assinaturas, `findAllActive` para worker
  - `woo-stores.service.ts` — CRUD com AES-256 nas credenciais, sync por id, importação de arquivo
  - `woo-stores.controller.ts` + `woo-stores.routes.ts` — REST com multer para upload de arquivo
  - `revenue.repository.ts` — KPIs, timeseries, by-store, ROAS real (JOIN woo_orders × metric_snapshots por canal)
  - `revenue.controller.ts` + `revenue.routes.ts` — `/api/revenue/*`
- Queue `sync-woocommerce` (BullMQ) + worker + scheduler a cada 6h
- Rotas: `POST /api/woo-stores`, `DELETE /api/woo-stores/:id`, `PATCH /api/woo-stores/:id/credentials`, `POST /api/woo-stores/:id/test-connection|sync|import`, `GET /api/woo-stores/template`
- Rotas: `GET /api/revenue/kpis|timeseries|by-store|roas-real`

*Frontend:*
- `apps/web/src/features/admin/woo-stores/WooStoresPage.tsx` — botão "Nova loja" (modal com nome, tipo de integração), cards adaptáveis por `sourceType`: WooCommerce (credenciais, teste, sync) ou Manual (drag-drop upload, download de modelo), exclusão de lojas criadas pelo usuário
- `apps/web/src/features/revenue/RevenuePage.tsx` — seletor de período, KPI cards, gráfico de linha multi-série por loja, barras horizontais por loja, tabela ROAS real por canal, tabela paginada de pedidos
- Sidebar: ítens "Faturamento" (`/revenue`) e "Lojas & Fatur." (`/admin/woo-stores`)

**Teste visual:**
- Criar nova loja Manual → importar planilha Excel → ver pedidos na tabela de faturamento
- Criar loja WooCommerce → configurar credenciais → Testar conexão → Sincronizar → ver pedidos
- ROAS Real aparece quando `store.channel_id` vinculado a um canal com campanhas

**Dependências:** Etapas 2, 4

---

## Etapa 9 — Módulo de IA ✅

**Status:** Concluída
**Concluída em:** a verificar no git log

**O que foi construído:**

*Backend:*
- Migration `20260401_000016_create_ai_providers.sql`: tabelas `ai_providers`, `ai_scenario_assignments` (3 cenários pré-inseridos: chat, daily-analysis, on-demand)
- Migration `20260401_000017_create_ai_history.sql`: tabela `ai_history` com índices em user_id, scenario, created_at
- `src/modules/ai/llm-adapter/`: `llm-adapter.ts` (lê provider do banco por cenário, decripta chave, roteia para provider), `anthropic.provider.ts` (Anthropic SDK)
- `src/modules/ai/skill-composer/skill-composer.ts`: lê SKILL.md do `.claude/skills/`, sempre injeta `business-context` primeiro
- `src/modules/ai/intent-detector/intent-detector.ts`: detecta skills a ativar por palavras-chave na mensagem
- `src/modules/ai/context-builder/context-builder.ts`: monta snapshot de KPIs + top 15 campanhas dos últimos 30 dias
- `src/modules/ai/ai.service.ts`, `ai.repository.ts`, `ai.controller.ts`, `ai.routes.ts`: CRUD de providers, atribuição de cenários, chat, análise sob demanda, histórico
- `src/shared/queue/ai-analysis.worker.ts`: worker BullMQ para análise automática diária
- `src/config/scheduler.ts`: job diário `daily-analysis` às 07h00 registrado
- WsEvent `ai:analysis:ready` adicionado ao tipo union (backend + frontend)

*Frontend:*
- `features/admin/ai-providers/AiProvidersPage.tsx`: CRUD de providers + atribuição por cenário
- `features/ai/chat/AiChatSidebar.tsx`: chat flutuante persistente, botão "Analisar" para análise sob demanda
- `AiChatSidebar` integrado no `AppShell`
- Rota `/admin/ai-providers` no router, link "Modelos de IA" na Sidebar (admin only)
- `packages/shared-types/src/ai.types.ts`: `AiProvider`, `AiScenarioAssignment`, `AiMessage`, etc.

**Teste visual:**
- Cadastrar chave Claude → perguntar "qual campanha tem o pior ROAS?" → resposta contextualizada com dados reais
- Clicar "Analisar" → análise completa com os 4 skills ativos

**Dependências:** Etapas 4, 5, 8

---

## Etapa 10 — Exportação e Relatórios Automáticos ✅

**Status:** Concluída — commit `0e1f6fe`
**Concluída em:** 2026-03-31

**O que foi construído:**

*Backend:*
- Geração de PDF (Puppeteer — snapshot do dashboard com filtros aplicados)
- Geração de CSV/Excel (dados brutos da tabela de campanhas)
- Job `send-report` (BullMQ) para envio agendado por email
- Migration: `scheduled_reports`

*Frontend:*
- Botões "Exportar PDF" e "Exportar CSV" em todas as telas do dashboard
- Seção **Admin → Relatórios**: configurar frequência, formato, destinatários, escopo

**Teste visual:**
- Exportar PDF → arquivo gerado com filtros ativos
- Configurar relatório semanal → disparar manualmente → receber email com PDF/CSV

**Dependências:** Etapas 4, 7, 9

---

## Dependências entre etapas

```
1 (Auth)
├── 2 (Admin: Usuários + Plataformas)
│   └── 5 (Integrações reais)
│       └── 6 (Associação campanha→canal)
│       └── 7 (Alertas)
├── 3 (Canais de Negócio)
│   └── 6 (Associação campanha→canal)
└── 4 (Dashboard + Seed) ← depende de 2 e 3
    ├── 5 (Integrações reais)
    ├── 7 (Alertas)
    ├── 8 (WooCommerce)
    └── 9 (IA) ← depende de 4, 5, 8
        └── 10 (Relatórios) ← depende de 4, 7, 9
```

**Paralelizável a partir da Etapa 2:** etapas 2, 3 podem ser feitas em paralelo.
**Paralelizável a partir da Etapa 5:** etapas 5, 7, 8 podem ser feitas em paralelo.
