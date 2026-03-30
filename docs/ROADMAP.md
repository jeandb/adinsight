# AdInsight — Roadmap de Implementação (Fase 1)

Divisão do PRD em etapas ordenadas por dependência técnica.
Cada etapa termina com um entregável visual testável.

**Legenda:** ✅ Concluída · 🔄 Em andamento · ⏳ Pendente

---

## Etapa 1 — Fundação do Monorepo + Autenticação ✅

**Status:** Concluída

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

## Etapa 2 — Painel Admin: Usuários e Integrações de Plataforma ⏳

**Status:** Pendente

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

## Etapa 3 — Canais de Negócio ⏳

**Status:** Pendente

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

## Etapa 4 — Dashboard com Dados Seed ⏳

**Status:** Pendente

> Etapa mais trabalhosa. Após ela o produto parece real para demonstração.

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

## Etapa 5 — Integração Real com Plataformas de Anúncio ⏳

**Status:** Pendente

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

## Etapa 6 — Associação de Campanhas a Canais ⏳

**Status:** Pendente

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

## Etapa 7 — Alertas ⏳

**Status:** Pendente

**O que construir:**

*Backend:*
- Migration: tabela `alert_rules` (tipo, plataforma, métrica, operador, threshold, destinatários)
- Migration: tabela `alert_events` (histórico de disparos)
- Módulo `alerts`: CRUD de regras + job de avaliação (BullMQ) + dispatch (email + WebSocket)

*Frontend:*
- Seção **Admin → Alertas**: criar/editar/remover regras por tipo
- Badge de notificações in-app no header
- Semáforo de saúde (🟢/🟡/🔴) na visão executiva

**Teste visual:**
- Criar regra "ROAS < threshold" → disparar manualmente → ver notificação in-app e email

**Dependências:** Etapas 4, 5

---

## Etapa 8 — Integração WooCommerce (Faturamento) ⏳

**Status:** Pendente

**O que construir:**

*Backend:*
- Migration: `woo_stores`, `woo_orders`, `woo_subscriptions`
- Adapters: `woocommerce/loja-das-profs/`, `woocommerce/clube-das-profs/`, `woocommerce/tudo-de-prof/`
- Jobs BullMQ `sync-woocommerce` (a cada 6h)
- Cálculo de ROAS real: receita WooCommerce / gasto de campanhas por canal

*Frontend:*
- Seção **Admin → Lojas & Faturamento**: cadastro com Consumer Key/Secret + teste de conexão
- Aba **Faturamento** no dashboard: KPIs de receita, gráfico temporal por loja, donut de distribuição, tabela de pedidos
- ROAS real vs ROAS atribuído (quando WooCommerce sincronizado)

**Teste visual:**
- Configurar loja WooCommerce → ver receita real → cruzamento com campanhas gerando ROAS real

**Dependências:** Etapas 2, 4

---

## Etapa 9 — Módulo de IA ⏳

**Status:** Pendente

**O que construir:**

*Backend:*
- Migration: `ai_providers`, `ai_scenario_assignments`, `ai_history`
- `src/modules/ai/llm-adapter/` — abstração de provider (Anthropic, OpenAI, Gemini)
- `src/modules/ai/skill-composer/` — monta prompt combinando skills `.md`
- `src/modules/ai/intent-detector/` — detecta skills a ativar por requisição
- Skills em `src/modules/ai/skills/`: `business-context`, `campaign-performance-analyst`, `period-comparator`, `budget-optimizer`, `creative-analyzer`, `copy-reviewer`, `report-generator`, `cross-data-analyst`
- Job `ai-analysis` (BullMQ) para análise automática diária (padrão: 07h00)
- Endpoints: chat, análise sob demanda, histórico

*Frontend:*
- Seção **Admin → Modelos de IA**: cadastrar providers, configurar por cenário
- Chat sidebar persistente em todas as telas
- Painel de análise sob demanda ("Analisar com IA")
- Aba **Insights de IA**: histórico de análises automáticas

**Teste visual:**
- Cadastrar chave Claude → perguntar "qual campanha tem o pior ROAS?" → resposta contextualizada com dados reais

**Dependências:** Etapas 4, 5, 8

---

## Etapa 10 — Exportação e Relatórios Automáticos ⏳

**Status:** Pendente

**O que construir:**

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
