# PRD — AdInsight: Dashboard de Performance de Campanhas
**Prof Jaque Mendes — SaaS Interno (Fase 1)**

---

| Campo | Valor |
|---|---|
| **Produto** | AdInsight — Dashboard de Campanhas |
| **Empresa** | Prof Jaque Mendes |
| **Fase** | 1 de N (SaaS Interno) |
| **Status** | Em Produção |
| **Versão** | 1.8 |
| **Data** | Abril 2026 |
| **Responsável** | Equipe de Tecnologia / Prof Jaque Mendes |

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Personas e Perfis de Acesso](#2-personas-e-perfis-de-acesso)
3. [Arquitetura de Acesso e Autenticação](#3-arquitetura-de-acesso-e-autenticação)
4. [Painel de Administração](#4-painel-de-administração)
5. [Canais de Negócio](#5-canais-de-negócio)
6. [Dashboard de Performance](#6-dashboard-de-performance)
7. [Módulo de Inteligência Artificial](#7-módulo-de-inteligência-artificial)
8. [Integração com WooCommerce — Faturamento das Lojas](#8-integração-com-woocommerce--faturamento-das-lojas)
9. [Exportação e Relatórios](#9-exportação-e-relatórios)
10. [Arquitetura de Projeto](#10-arquitetura-de-projeto)
11. [Arquitetura Técnica Recomendada](#11-arquitetura-técnica-recomendada)
12. [Requisitos Não Funcionais](#12-requisitos-não-funcionais)
13. [Métricas de Sucesso do Produto](#13-métricas-de-sucesso-do-produto)
14. [Roadmap Sugerido — Fase 1](#14-roadmap-sugerido--fase-1)
15. [Visão de Próximas Fases do SaaS Interno](#15-visão-de-próximas-fases-do-saas-interno)

---

## 1. Visão Geral do Produto

### 1.1 Contexto e Motivação

A Prof Jaque Mendes opera um ecossistema digital multifacetado composto por:

- **Loja das Profs** (lojadasprofs.com.br) — loja WooCommerce de infoprodutos (PDFs pedagógicos para download)
- **Clube das Profs** (clubedasprofs.com.br) — assinatura anual com acesso a todo o acervo (WooCommerce + YITH Subscription & Membership)
- **Tudo de Prof** (tudodeprof.com.br) — marketplace de recursos pedagógicos em expansão, para o qual a Loja das Profs está migrando
- **Mentoria Do Giz ao Digital** — programa que ensina pedagogas a criarem e venderem recursos pedagógicos no digital, com acesso privilegiado ao marketplace

Esse ecossistema é sustentado por campanhas de tráfego pago distribuídas em Meta (Facebook/Instagram), Google Ads, TikTok Ads e Pinterest Ads. A ausência de uma visão centralizada de performance obriga a equipe a acessar individualmente cada plataforma, dificultando decisões ágeis e aumentando o risco de desperdício de verba ou queda silenciosa no ROAS.

O **AdInsight** é a Fase 1 de um SaaS interno que centralizará a gestão do negócio digital da Prof Jaque Mendes. Nesta fase, o foco é exclusivamente o monitoramento e análise de performance das campanhas de anúncios pagos.

### 1.2 Objetivo do Produto

Entregar um painel web centralizado que permita à equipe de gestão de tráfego e à direção da empresa acompanhar em tempo quase real os indicadores de performance das campanhas pagas, identificar anomalias, comparar períodos e exportar relatórios — tudo a partir de uma interface única, segura e de fácil uso.

### 1.3 Fora do Escopo (Fase 1)

- Gestão de conteúdo orgânico / social listening
- CRM ou gestão de leads/clientes
- Funcionalidades para múltiplos clientes externos (uso somente interno)

---

## 2. Personas e Perfis de Acesso

| Perfil | Quem é | Objetivo principal | Necessidade no dashboard |
|---|---|---|---|
| **Admin** | Responsável técnico / TI | Configurar o sistema, gerenciar usuários e integrações | Acesso total: configurações, APIs, usuários, alertas |
| **Gestor de Tráfego** | Especialista em mídia paga | Otimizar campanhas e identificar problemas rapidamente | Visão operacional: métricas granulares por campanha, alertas, comparações |
| **Diretora / Dono** | Prof Jaque Mendes | Decisão estratégica sobre verba e canais | Visão executiva: resumo consolidado, ROAS, Leads, tendências |
| **Visualizador** | Colaborador / parceiro | Acompanhar resultados sem alterar configurações | Leitura somente, sem acesso a configurações |

---

## 3. Arquitetura de Acesso e Autenticação

### 3.1 Primeiro Acesso — Setup do Admin

Na primeira vez que o sistema for acessado (sem nenhum usuário cadastrado no banco), o sistema deve reconhecer o estado "virgem" e exibir automaticamente um assistente de configuração inicial, similar ao fluxo do Portainer.

> **Fluxo de Primeiro Acesso**
> - Sistema detecta ausência de usuários no banco de dados
> - Exibe tela exclusiva de criação do administrador principal
> - Campos obrigatórios: nome completo, e-mail, senha (mín. 12 caracteres, com força validada) e confirmação de senha
> - Após criação, redireciona ao painel admin para continuar a configuração
> - Essa tela não deve ser acessível novamente após o cadastro do primeiro admin

### 3.2 Gestão de Usuários

O administrador poderá convidar, editar e remover usuários através do painel de administração. Cada usuário terá um nível de acesso associado conforme a tabela de perfis da seção 2.

- Convite por e-mail com link de ativação (válido por 48 h)
- Edição de nível de acesso a qualquer momento
- Desativação de conta sem exclusão de histórico
- Log de acessos por usuário (data/hora, IP)

### 3.3 Segurança

- Autenticação via JWT com refresh token
- Sessões com expiração configurável (padrão: 8 h)
- Senhas armazenadas com bcrypt (custo mínimo 12)
- Rate limiting no endpoint de login (máx. 5 tentativas / 10 min)
- HTTPS obrigatório em produção
- Variáveis sensíveis (chaves API) armazenadas criptografadas no banco (AES-256)

---

## 4. Painel de Administração

### 4.1 Módulo de Integrações (APIs das Plataformas)

O admin poderá cadastrar e gerenciar as credenciais necessárias para cada plataforma de anúncios. As chaves são armazenadas de forma criptografada e nunca exibidas em texto claro após o salvamento (apenas `•••••••• [Editar]`).

| Plataforma | Credenciais necessárias | Observações |
|---|---|---|
| **Meta Ads** | App ID, App Secret, Access Token, Ad Account ID | Token de longa duração (60 dias); renovação automática |
| **Google Ads** | Client ID, Client Secret, Refresh Token, Developer Token, Customer ID | OAuth 2.0; requer conta Google Ads Manager |
| **TikTok Ads** | App ID, App Secret, Access Token, Advertiser ID | Token com validade de 24 h; renovação automática via refresh |
| **Pinterest Ads** | App ID, App Secret, Access Token, Ad Account ID | OAuth 2.0; token de longa duração |

**Funcionalidades do módulo:**
- Botão "Testar Conexão" para validar credenciais antes de salvar
- Status de conexão visível (Ativo / Erro / Não configurado) com timestamp da última sincronização bem-sucedida
- Alerta visual e notificação por e-mail ao admin quando um token expirar ou a conexão falhar

### 4.2 Configuração de Alertas

O admin (e usuários com permissão) poderá configurar regras de alerta que disparam notificações automáticas. Alertas são configurados por plataforma ou de forma consolidada.

| Tipo de Alerta | Condição de Disparo | Canal de Notificação |
|---|---|---|
| Campanha parou | Status ativo → inativo / rejeitado | E-mail + notificação in-app |
| CPL/CPC piorou | Aumento > X% em relação à média dos últimos 7 dias | E-mail + notificação in-app |
| ROAS caiu | ROAS < threshold configurado por período | E-mail + notificação in-app |
| Conversões caíram | Queda > X% em relação ao período anterior configurado | E-mail + notificação in-app |
| Gasto próx. ao limite | Gasto diário/mensal atingiu X% do orçamento definido | E-mail + notificação in-app |

Cada regra permite configurar: plataforma alvo, métrica, operador (`>`, `<`, `% variação`), valor de referência e lista de e-mails destinatários.

### 4.3 Configuração de Relatórios Automáticos

O admin poderá agendar o envio automático de relatórios por e-mail, definindo:

- Frequência: diário, semanal (dia da semana) ou mensal (dia do mês)
- Formato: PDF e/ou CSV/Excel
- Destinatários: lista de e-mails
- Escopo: todas as plataformas ou plataformas específicas
- Período coberto: últimos 7 dias / mês corrente / mês anterior

---

## 5. Canais de Negócio

### 5.1 Conceito

Canais de Negócio são uma camada de organização própria do AdInsight, independente das plataformas de anúncio. Um canal representa um produto, projeto ou linha de negócio da Prof Jaque Mendes — como a Loja das Profs, o Clube das Profs ou um lançamento específico de curso. Campanhas de qualquer plataforma podem ser associadas a um canal, permitindo visualizar o desempenho consolidado daquele produto independentemente de onde os anúncios estão rodando.

> **Canais pré-cadastrados no sistema**
> - Loja das Profs — campanhas de tráfego e conversão para lojadasprofs.com.br
> - Clube das Profs — campanhas de assinatura anual
> - Tudo de Prof — campanhas do marketplace
> - Mentoria Do Giz ao Digital — campanhas de captação para a mentoria
> - Lançamentos — canais temporários criados por evento (ex: Curso Canva para Professoras - Jan/2025)

### 5.2 Cadastro e Gestão de Canais

Admin e Gestor de Tráfego podem criar, editar e arquivar canais a qualquer momento. Um canal arquivado preserva seu histórico de dados mas não aparece nos filtros ativos do dashboard.

**Campos de um Canal:**
- Nome do canal (obrigatório)
- Descrição / objetivo (opcional)
- Cor de identificação visual — usada nos gráficos e badges do dashboard
- Status: Ativo / Arquivado
- Orçamento (campo reservado para versão futura — não obrigatório na Fase 1)
- Data de criação e último usuário a editar (preenchido automaticamente)

### 5.3 Associação de Campanhas a Canais

#### 5.3.1 Associação Automática por Palavras-chave

No cadastro de cada canal, o Admin ou Gestor define palavras-chave. Quando uma nova campanha é sincronizada das plataformas, o sistema verifica se o nome da campanha contém alguma das palavras-chave e associa automaticamente ao canal correspondente.

| Canal | Palavras-chave (exemplo) | Resultado |
|---|---|---|
| Loja das Profs | loja, lojadasprofs, loja-profs | Campanhas com esses termos no nome associadas automaticamente |
| Clube das Profs | clube, clubedasprofs, assinatura | Idem |
| Mentoria Do Giz ao Digital | mentoria, giz, digital, dgd | Idem |
| Tudo de Prof | tudodeprof, marketplace, tdp | Idem |

Se uma campanha não corresponde a nenhuma regra, ela fica com status **"Sem canal"** e aparece em uma fila de revisão no painel admin para classificação manual.

#### 5.3.2 Correção Manual

Qualquer campanha pode ter seu canal alterado manualmente pelo Admin ou Gestor, sobrescrevendo a associação automática. A alteração é registrada em log e não é sobrescrita por sincronizações futuras — a menos que o usuário desbloqueie a campanha para re-avaliação automática.

- Associação manual disponível diretamente na tabela de campanhas do dashboard (ação inline)
- Disponível também na fila de revisão do painel admin (campanhas sem canal)
- Cada campanha pertence a exatamente 1 canal (ou permanece como "Sem canal")

### 5.4 Canais no Dashboard

O filtro de Canal fica no topo do dashboard, ao lado dos filtros de plataforma e período, com as opções:

- **Todos os canais** (padrão) — exibe dados de todas as campanhas
- **Canal específico** — filtra todos os KPIs, gráficos e tabela para o canal selecionado
- **Sem canal** — exibe apenas campanhas ainda não classificadas (triagem pelo gestor)

Quando um canal específico está ativo, o dashboard exibe uma tag de contexto bem visível (ex: `Visualizando: Clube das Profs`) para evitar confusão de leitura. Todos os gráficos, KPI cards e a tabela de campanhas refletem o filtro combinado de canal + período + plataforma.

O gráfico de distribuição de gastos (donut) pode ser alternado entre dois modos:
- **Por Plataforma** — distribuição entre Meta, Google, TikTok, Pinterest
- **Por Canal** — distribuição entre Loja das Profs, Clube das Profs, Mentoria, etc.

---

## 6. Dashboard de Performance

### 6.1 Modos de Visualização

O dashboard oferece dois modos alternáveis via toggle no topo da página:

| Modo | Descrição | Público-alvo |
|---|---|---|
| **Consolidado** | Todos os dados de todas as plataformas somados em um único painel. Ideal para visão macro do investimento e resultados globais. | Diretora, reuniões estratégicas |
| **Por Plataforma** | Cada plataforma (Meta, Google, TikTok, Pinterest) exibida de forma independente com abas de navegação. Permite comparação entre canais. | Gestor de tráfego, otimização |

### 6.2 Filtros e Seleção de Período

Todos os filtros são persistidos na URL para facilitar compartilhamento de views específicas.

- **Seletor de período:** Hoje, Ontem, Últimos 7 dias, Últimos 14 dias, Últimos 30 dias, Este mês, Mês anterior, Personalizado (date picker)
- **Comparação de períodos:** toggle para ativar comparação com período anterior equivalente (ex: últimos 7 dias vs 7 dias anteriores), exibindo variação percentual em cada métrica
- **Filtro por Canal de Negócio:** Todos / canal específico / Sem canal — conforme seção 5
- **Filtro por plataforma:** checkboxes para selecionar quais plataformas incluir
- **Filtro por campanha:** busca e seleção de campanhas específicas dentro da plataforma
- **Filtro por objetivo de campanha:** Conversão, Geração de Leads, Tráfego, Reconhecimento

### 6.3 Atualização de Dados

- Atualização automática em background a cada 1 hora
- Botão de atualização manual com seletor de intervalo: 5 min, 15 min, 30 min, 1 hora
- Indicador visual de "última atualização" com timestamp em todas as páginas do dashboard
- Badge de status por plataforma (dados atualizados / erro de sincronização / sincronizando)

### 6.4 Cards de Métricas Resumidas (KPI Cards)

Exibidos no topo do dashboard, com valor atual, variação em relação ao período de comparação (se ativo) e ícone de tendência (↑ verde / ↓ vermelho / → neutro).

| Métrica | Plataformas | Descrição |
|---|---|---|
| Investimento Total | Todas | Valor total gasto no período selecionado |
| Alcance | Meta, TikTok, Pinterest | Usuários únicos alcançados |
| Impressões | Todas | Total de exibições dos anúncios |
| Cliques | Todas | Total de cliques nos anúncios |
| CTR | Todas | Taxa de cliques (Cliques / Impressões) |
| CPM | Todas | Custo por mil impressões |
| CPC | Todas | Custo por clique |
| CPL | Meta, Google, TikTok | Custo por lead gerado |
| Leads Gerados | Meta, Google, TikTok | Total de leads captados no período |
| Conversões | Todas | Ações de conversão configuradas (compras, cadastros) |
| ROAS | Todas | Retorno sobre investimento em anúncios (Receita / Gasto) |
| Receita Atribuída | Todas (pixel/tag) | Receita de conversões atribuída às campanhas |

### 6.5 Visualizações Gráficas

#### 6.5.1 Gráfico de Evolução Temporal

Gráfico de linha interativo exibindo a evolução das métricas selecionadas ao longo do período filtrado. Permite:

- Selecionar quais métricas exibir (multi-seleção)
- Eixo Y duplo quando métricas têm escalas muito diferentes (ex: Investimento vs CTR)
- Tooltip com todos os valores ao passar o mouse em um ponto
- Linha pontilhada para o período de comparação (quando ativo)

#### 6.5.2 Gráfico de Distribuição por Plataforma / Canal

Gráfico de rosca (donut) alternável entre dois modos:
- **Por Plataforma** — distribuição percentual do investimento entre Meta, Google, TikTok, Pinterest
- **Por Canal** — distribuição percentual do investimento entre os Canais de Negócio cadastrados

#### 6.5.3 Gráfico de Barras — Desempenho por Campanha

Ranking visual das campanhas pelo indicador selecionado (ROAS, CPL, Conversões, Gasto), com barra horizontal ordenada do melhor ao pior resultado.

#### 6.5.4 Heatmap de Desempenho por Horário/Dia

Mapa de calor exibindo a distribuição de impressões, cliques ou conversões por dia da semana × hora do dia. Disponível por plataforma.

### 6.6 Tabela Detalhada de Campanhas

Tabela paginada (50 por página) com todas as campanhas ativas e pausadas no período. Colunas:

- Nome da campanha
- Canal de Negócio (badge colorido conforme cor do canal)
- Plataforma (ícone + nome)
- Status (Ativo / Pausado / Encerrado / Rejeitado)
- Objetivo
- Período de veiculação
- Investimento
- Impressões
- Cliques / CTR
- CPM / CPC / CPL
- Conversões / ROAS

A tabela permite: ordenação por qualquer coluna, busca por nome da campanha, filtro por status, atribuição/edição inline de canal e exportação da seleção para CSV/Excel.

### 6.7 Visão Executiva (Modo Diretora)

Uma view simplificada ativada automaticamente para o perfil Diretora/Dono, com:

- Resumo em linguagem natural: *"Você investiu R$ X neste mês e obteve Y leads e Z conversões com ROAS de W"*
- Semáforo de saúde por plataforma (🟢 / 🟡 / 🔴) baseado nos thresholds de alerta configurados
- Top 3 campanhas com melhor ROAS do período
- Top 3 campanhas com pior performance (para revisão)
- Comparativo mês atual vs mês anterior para as métricas principais

---

## 7. Módulo de Inteligência Artificial

### 7.1 Visão Geral

O AdInsight incorpora um módulo de IA para análise de performance, criativos e copy, além de sugestões de otimização de orçamento. O sistema foi projetado com uma **camada de abstração de providers** (LLM Adapter), que permite cadastrar múltiplos modelos de linguagem no painel admin e selecionar qual usar — globalmente como padrão ou individualmente por cenário de uso — sem alterar código.

**Acesso ao módulo:** Admin, Gestor de Tráfego e Diretora. Perfil Visualizador não tem acesso.

> **Nota sobre vídeos:** nenhum modelo de linguagem processa vídeo nativo frame a frame. A estratégia adotada é extrair frames-chave via `ffmpeg` no backend (ex: 1 frame a cada 2 segundos) e enviá-los como imagens para análise multimodal.

---

### 7.2 Gestão de Providers de LLM

**Acesso:** Admin e Gestor de Tráfego.

Uma aba **"Modelos de IA"** no painel admin permite cadastrar, testar e gerenciar os providers de LLM disponíveis no sistema. Funciona de forma análoga ao cadastro de APIs das plataformas de anúncio — cada provider tem suas credenciais armazenadas de forma criptografada.

#### 7.2.1 Cadastro de um Provider

Campos de cada provider cadastrado:

| Campo | Descrição |
|---|---|
| **Nome de exibição** | Nome livre para identificação (ex: "Claude Opus", "GPT-4o Rápido") |
| **Provider** | Seleção: Anthropic / OpenAI / Google Gemini / outro (custom endpoint) |
| **Modelo** | Nome exato do modelo (ex: `claude-opus-4-6`, `gpt-4o`, `gemini-1.5-pro`) |
| **Chave de API** | Campo criptografado — exibido como `••••••` após salvo |
| **Suporta visão (imagens)** | Toggle — habilita análise de criativos com esse provider |
| **Status** | Ativo / Inativo |
| **Botão "Testar conexão"** | Faz uma chamada simples para validar a chave e o modelo |

#### 7.2.2 Seleção de Modelo por Cenário

Após cadastrar os providers, Admin e Gestor configuram qual modelo usar em cada cenário. O sistema opera em dois níveis:

**Nível 1 — Modelo padrão global:**
Um provider marcado como padrão é usado em todos os cenários que não tiverem configuração específica. Se nenhum cenário for configurado individualmente, o padrão global cobre tudo.

**Nível 2 — Modelo por cenário (opcional):**
Para cada cenário de uso, é possível selecionar um provider diferente do padrão global. Isso permite, por exemplo, usar um modelo mais econômico para o chat e um modelo multimodal mais poderoso para análise de criativos.

| Cenário | Descrição | Provider selecionável |
|---|---|---|
| **Análise automática periódica** | Relatório diário/agendado de performance | Sim — ou usar padrão |
| **Análise sob demanda** | Botão "Analisar com IA" no dashboard | Sim — ou usar padrão |
| **Análise de criativos** | Imagens e vídeos (requer suporte a visão) | Sim — filtra apenas providers com visão ativa |
| **Chat interativo** | Sidebar de conversa | Sim — ou usar padrão |

> Se um cenário estiver configurado para usar um provider específico e esse provider for desativado, o sistema faz fallback automaticamente para o modelo padrão global e notifica o admin.

#### 7.2.3 Visão Geral da Tela de Modelos de IA

A tela exibe uma lista de todos os providers cadastrados com seu status, e abaixo a tabela de atribuição por cenário:

```
┌─────────────────────────────────────────────────────────┐
│  PROVIDERS CADASTRADOS                    [+ Adicionar]  │
├──────────────────┬──────────────┬──────────┬────────────┤
│ Nome             │ Modelo       │ Visão    │ Status     │
├──────────────────┼──────────────┼──────────┼────────────┤
│ Claude Opus ⭐   │ claude-op... │ ✅       │ Ativo      │
│ GPT-4o           │ gpt-4o       │ ✅       │ Ativo      │
│ Gemini Flash     │ gemini-fl... │ ❌       │ Ativo      │
└──────────────────┴──────────────┴──────────┴────────────┘
  ⭐ = Modelo padrão global

┌─────────────────────────────────────────────────────────┐
│  ATRIBUIÇÃO POR CENÁRIO                                  │
├───────────────────────────┬─────────────────────────────┤
│ Cenário                   │ Provider                    │
├───────────────────────────┼─────────────────────────────┤
│ Análise automática        │ ⭐ Padrão global            │
│ Análise sob demanda       │ Claude Opus                 │
│ Análise de criativos      │ Claude Opus                 │
│ Chat interativo           │ GPT-4o                      │
└───────────────────────────┴─────────────────────────────┘
```

---

### 7.3 Modos de Uso

O módulo opera em três modos complementares, todos acessíveis a partir do dashboard:

#### 7.3.1 Análise Automática Periódica

Um job agendado (configurável no painel admin, padrão: diário às 07h00) executa automaticamente uma análise completa das campanhas do período e gera um relatório de insights estruturado, salvo no banco de dados e disponível na aba **"Insights de IA"** do dashboard.

**O relatório automático cobre:**
- Diagnóstico geral de performance do período (por canal e por plataforma)
- Campanhas que melhoraram ou pioraram significativamente vs. período anterior
- Alertas de oportunidade (ex: campanha com CPL baixo e verba limitada — candidata a escalar)
- Alertas de risco (ex: ROAS caindo consistentemente há 3 dias)
- Sugestões de realocação de orçamento entre canais e campanhas
- Score de saúde geral das campanhas (0–100), com justificativa

**Configurações no painel admin:**
- Frequência: diário (padrão), semanal ou personalizado (cron expression)
- Hora de execução
- Escopo: todas as campanhas ou por canal específico
- Provider de LLM a usar (ou padrão global)
- Notificação por e-mail quando o relatório for gerado

#### 7.3.2 Análise Manual Sob Demanda

Disponível em qualquer tela do dashboard através do botão **"Analisar com IA"**. O usuário define o escopo antes de solicitar:

- **Escopo:** campanha específica, conjunto de campanhas, canal de negócio ou todas
- **Período:** herdado do filtro ativo no dashboard (pode ser ajustado)
- **Foco da análise:** métricas de performance / criativos / copy / orçamento / análise completa
- **Provider:** usar o configurado para este cenário ou selecionar outro manualmente
- **Upload de criativo:** o usuário pode anexar imagens ou vídeos para análise, mesmo que não estejam nas APIs (ex: criativo ainda não publicado)

O resultado é exibido em painel lateral estruturado, com seções colapsáveis por tema, e fica salvo no histórico.

#### 7.3.3 Chat Interativo

Uma sidebar persistente de chat está disponível em todas as telas do dashboard. A IA recebe automaticamente o contexto das campanhas visíveis na tela atual (filtros de canal, período e plataforma aplicados), permitindo conversas naturais sem necessidade de copiar dados.

**Exemplos de perguntas:**
- *"Por que o ROAS do Clube das Profs caiu essa semana?"*
- *"Qual campanha do Meta está com o melhor CPL do mês?"*
- *"Analisa esse criativo que vou subir amanhã"* (com upload de imagem)
- *"Se eu tivesse R$ 500 a mais para investir hoje, em qual campanha colocaria?"*
- *"Compara o desempenho da Loja das Profs no Meta vs. Google nos últimos 30 dias"*

O chat mantém memória da conversa durante a sessão. O histórico completo é salvo por usuário no banco de dados.

---

### 7.4 Arquitetura Técnica — LLM Adapter

O backend implementa um **LLM Adapter** — uma camada de abstração que isola todo o código de negócio (análise, chat, relatórios) da implementação específica de cada provider. Nenhuma parte do sistema chama diretamente a API de um provider; tudo passa pelo Adapter.

```
┌─────────────────────────────────────────────────┐
│           AI Service Module                      │
│  (monta contexto, prompts, processa imagens)     │
└───────────────────┬─────────────────────────────┘
                    │ chama sempre
┌───────────────────▼─────────────────────────────┐
│              LLM Adapter                         │
│  - Lê provider ativo para o cenário (do banco)   │
│  - Normaliza entrada e saída entre providers     │
│  - Fallback automático se provider falhar        │
└───┬──────────────┬──────────────┬───────────────┘
    │              │              │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│Claude │    │ OpenAI  │   │ Gemini  │   ...
│  API  │    │   API   │   │   API   │
└───────┘    └─────────┘   └─────────┘
```

**Benefícios dessa arquitetura:**
- Troca de provider sem alterar nenhum código de negócio — apenas configuração no painel admin
- Testes A/B futuros entre providers para o mesmo cenário
- Adição de novos providers sem refatoração (apenas novo adaptador específico)
- Log unificado de todas as chamadas independente do provider

---

### 7.5 Estrutura do Prompt

A qualidade das respostas depende diretamente do contexto montado pelo AI Service Module antes de cada chamada ao LLM Adapter.

**Prompt de sistema (fixo, por cenário):**

```
Você é um especialista em tráfego pago para infoprodutos pedagógicos digitais.
Está analisando campanhas da Prof Jaque Mendes, que opera:
- Loja das Profs: infoprodutos em PDF para professoras
- Clube das Profs: assinatura anual de acesso ao acervo
- Tudo de Prof: marketplace pedagógico
- Mentoria Do Giz ao Digital: programa de capacitação para pedagogas

Público-alvo: professoras da educação básica, 25–45 anos.
Tom de comunicação da marca: acolhedor, prático, inspirador.

Ao responder:
1. Baseie-se nos dados fornecidos — não invente métricas
2. Explique o raciocínio de cada diagnóstico e sugestão
3. Priorize sugestões por impacto: alto / médio / baixo
4. Considere o contexto do nicho pedagógico ao avaliar criativos e copies
5. Seja direto — o usuário é gestor de tráfego ou a própria empreendedora
```

**Contexto dinâmico injetado a cada chamada:**

```
PERÍODO: [início] a [fim] | CANAL: [nome ou "Todos"] | PLATAFORMAS: [lista]

MÉTRICAS CONSOLIDADAS:
Investimento: R$X | Impressões: X | Alcance: X | Cliques: X | CTR: X%
CPL: R$X | Leads: X | Conversões: X | ROAS: Xx | Receita: R$X
Variação vs. período anterior: ROAS [+/-X%], CPL [+/-X%], Conversões [+/-X%]

TOP CAMPANHAS: [lista com métricas individuais]
CAMPANHAS COM PIORA > 20%: [lista]

[SE CRIATIVO]: [imagem em base64 ou frames de vídeo extraídos via ffmpeg]
[SE COPY]: "[texto do anúncio]"
```

---

### 7.6 Armazenamento do Histórico

Todos os registros de IA são salvos no PostgreSQL:

| Campo | Descrição |
|---|---|
| `id` | UUID do registro |
| `tipo` | `automatico` / `sob_demanda` / `chat` |
| `provider_id` | Qual LLM foi usado (referência ao cadastro de providers) |
| `usuario_id` | Quem gerou (null para automático) |
| `canal_id` | Canal de negócio analisado (null = todos) |
| `periodo_inicio` / `periodo_fim` | Janela de dados analisada |
| `contexto_snapshot` | JSON com as métricas usadas |
| `prompt_enviado` | Texto completo do prompt (para auditoria) |
| `resposta_ia` | Resposta completa em Markdown |
| `tokens_entrada` / `tokens_saida` | Para controle de custo por provider |
| `created_at` | Timestamp da geração |

O campo `provider_id` permite rastrear qual modelo gerou cada análise — útil para comparar qualidade entre providers ao longo do tempo.

---

### 7.7 Considerações de Custo

O custo varia conforme o provider e modelo selecionados. O painel admin exibe o consumo acumulado de tokens por provider no mês corrente. Estimativa para uso típico com `claude-opus-4-6`:

| Tipo de uso | Frequência | Tokens est./chamada | Custo aprox./mês |
|---|---|---|---|
| Análise automática diária | 30×/mês | ~8.000 tokens | ~USD 3–6 |
| Análises sob demanda | ~20×/mês | ~6.000 tokens | ~USD 2–4 |
| Chat interativo | ~100 msgs/mês | ~2.000 tokens/msg | ~USD 4–8 |
| **Total estimado** | | | **~USD 10–20/mês** |

> Recomenda-se configurar um limite mensal de tokens por provider no painel admin para controle de custo. Quando o limite for atingido, o sistema notifica o admin e pode bloquear novas chamadas ou fazer fallback para um provider mais econômico.

---

### 7.8 Arquitetura do Agente — AdInsight Analyst

O módulo de IA opera como um **agente único com skills especializadas**: o **AdInsight Analyst**. Ele é instanciado pelo AI Service Module a cada interação, recebe o contexto do dashboard e responde com diagnósticos e sugestões — nunca age de forma autônoma sobre os dados.

A escolha por agente único (vs. múltiplos agentes orquestrados) é deliberada e alinha-se ao nível de autonomia definido no produto: **sugere e explica o raciocínio, o humano decide**. Isso mantém o sistema simples, auditável e de baixo custo operacional.

#### 7.8.1 O que são Skills neste contexto

Skills **não são módulos separados de código** — são **blocos de prompt em arquivos `.md`** armazenados no backend, que o AI Service Module combina dinamicamente antes de cada chamada ao LLM Adapter, de acordo com a intenção detectada na requisição.

```
# Estrutura de arquivos no backend
/ai
  /skills
    business-context.md          ← injetada em TODAS as chamadas
    campaign-performance.md
    budget-optimizer.md
    creative-analyzer.md
    copy-reviewer.md
    report-generator.md
    period-comparator.md
    cross-data-analyst.md
  /prompts
    system-base.md               ← template base do system prompt
  skill-composer.js              ← monta o prompt combinando as skills
  intent-detector.js             ← detecta quais skills ativar por requisição
```

O prompt final enviado ao LLM é construído assim:

```javascript
// skill-composer.js — simplificado
const systemPrompt = [
  load('business-context'),      // sempre presente
  ...detectSkills(request),      // skills detectadas por intenção
].join('\n\n---\n\n')
```

#### 7.8.2 Skills — Fase 1 (obrigatórias)

---

**`business-context`** — *Contexto permanente do negócio*

Injetada em todas as interações sem exceção. Contém o conhecimento fixo sobre o ecossistema da Prof Jaque Mendes: produtos, público-alvo, tom de voz da marca, canais de negócio, benchmarks esperados do nicho pedagógico e instruções gerais de comportamento do agente.

Ativação: **sempre**

---

**`campaign-performance-analyst`** — *Análise de métricas de campanhas*

Especializada em interpretar indicadores de tráfego pago: ROAS, CPL, CTR, CPC, CPM, alcance, impressões e conversões. Sabe identificar tendências, anomalias, outliers e distinguir variação estatística relevante de ruído. Orienta o agente a contextualizar cada métrica dentro dos padrões do nicho (ex: CTR esperado para anúncios pedagógicos no Meta vs. Google).

Ativação: análise automática, análise sob demanda, chat com perguntas sobre métricas

---

**`period-comparator`** — *Comparação entre períodos*

Especializada em análises comparativas: calcula variações percentuais, identifica se uma mudança é significativa, contextualiza sazonalidades relevantes para o negócio pedagógico (início de ano letivo em fevereiro, férias de julho, Black Friday, períodos de lançamento da Mentoria). Evita que o agente trate variações naturais de sazonalidade como problemas.

Ativação: qualquer análise que envolva comparação de períodos (automática, sob demanda ou chat com "semana passada", "mês anterior", "comparado a")

---

**`budget-optimizer`** — *Otimização e realocação de orçamento*

Analisa a distribuição de verba entre plataformas e campanhas. Sugere realocações baseadas em ROAS histórico, CPL por canal, potencial de escala e saturação de público. Cada sugestão inclui: justificativa, impacto estimado (alto/médio/baixo) e valor sugerido de movimentação.

Ativação: análise automática diária, perguntas sobre orçamento no chat, análise sob demanda com foco em "orçamento"

---

**`creative-analyzer`** — *Análise visual de criativos* *(requer provider com suporte a visão)*

Avalia imagens e frames extraídos de vídeos de anúncios. Analisa: composição visual e hierarquia de informação, legibilidade do texto no criativo, força e clareza do CTA visual, emoção transmitida e aderência ao público pedagógico, elementos de fadiga de anúncio (criativo muito similar a outros já rodando), conformidade com políticas visuais das plataformas (Meta, TikTok, Pinterest).

Ativação: upload de imagem ou vídeo pelo usuário, análise sob demanda com foco em "criativo"

---

**`copy-reviewer`** — *Revisão de texto de anúncios*

Avalia o copy dos anúncios: clareza e força da proposta de valor, adequação do CTA ao objetivo da campanha, uso de gatilhos emocionais pertinentes ao público (professoras buscando praticidade e renda extra), tom de voz alinhado à marca (acolhedor, prático, inspirador), possíveis violações de política de anúncio por linguagem proibida. Sugere variações alternativas de headline e copy quando identificar oportunidades.

Ativação: upload de copy pelo usuário, análise sob demanda com foco em "texto" ou "copy", análise de criativo que inclua texto

---

**`report-generator`** — *Geração de relatórios estruturados*

Garante que a saída da análise automática siga um formato padronizado e consistente em Markdown, com seções fixas: resumo executivo, diagnóstico por canal/plataforma, oportunidades identificadas, riscos identificados, sugestões priorizadas por impacto e score de saúde geral (0–100 com justificativa). Evita que o agente produza respostas livres e não estruturadas nos relatórios automáticos.

Ativação: análise automática periódica, análise sob demanda completa

---

**`cross-data-analyst`** — *Cruzamento de dados de campanhas + faturamento*

Cruza dados de gasto de campanhas (Meta/Google/TikTok/Pinterest) com receita das lojas WooCommerce por canal de negócio e período. Calcula o **ROAS real** (receita efetiva da loja / gasto de campanhas) e compara com o **ROAS atribuído** pelas plataformas, sinalizando discrepâncias de atribuição. Só é ativada quando dados de WooCommerce estiverem disponíveis para o período.

Ativação: análise automática (quando WooCommerce sincronizado), perguntas sobre ROAS real, faturamento ou "quanto vendeu"

---

#### 7.8.3 Skills — Fase futura (reservadas)

| Skill | Descrição | Ativação prevista |
|---|---|---|
| `subscription-analyst` | Métricas de assinatura: churn, LTV, MRR, cohort analysis, previsão de receita recorrente | Quando dados do Clube das Profs forem aprofundados |
| `marketplace-analyst` | Performance do Tudo de Prof: GMV, participação por vendedora, taxa de conversão por categoria | Quando acesso admin completo ao WCFM for disponibilizado |
| `launch-strategist` | Análise de campanhas de lançamento com janela definida: aquecimento, carrinho aberto, recuperação | Quando Mentoria tiver integração de pagamento |

---

#### 7.8.4 Mapeamento de Skills por Cenário de Uso

| Cenário | Skills ativadas |
|---|---|
| **Análise automática diária** | `business-context` + `campaign-performance-analyst` + `period-comparator` + `budget-optimizer` + `cross-data-analyst` + `report-generator` |
| **Chat — pergunta sobre métricas** | `business-context` + `campaign-performance-analyst` + `period-comparator` |
| **Chat — pergunta sobre orçamento** | `business-context` + `campaign-performance-analyst` + `budget-optimizer` |
| **Chat — pergunta sobre faturamento/ROAS real** | `business-context` + `campaign-performance-analyst` + `cross-data-analyst` |
| **Análise sob demanda — completa** | todas as skills Core |
| **Análise sob demanda — criativo** | `business-context` + `creative-analyzer` + `copy-reviewer` |
| **Análise sob demanda — copy** | `business-context` + `copy-reviewer` |
| **Análise sob demanda — orçamento** | `business-context` + `campaign-performance-analyst` + `budget-optimizer` |

---

#### 7.8.5 Detecção de Intenção

O `intent-detector.js` analisa a requisição recebida (tipo de análise, texto do chat, foco selecionado pelo usuário) e retorna a lista de skills a ativar. Para o chat, a detecção usa palavras-chave e padrões semânticos simples — não requer um segundo LLM, apenas lógica de classificação local:

```javascript
// intent-detector.js — lógica simplificada
function detectSkills(request) {
  const skills = []
  const text = request.message?.toLowerCase() || ''

  // Métricas sempre entram quando há dados de campanha
  if (request.hasCampaignData)
    skills.push('campaign-performance-analyst')

  // Comparação de período
  if (request.comparisonPeriod || /anterior|passad|comparad|semana|mês/.test(text))
    skills.push('period-comparator')

  // Orçamento
  if (request.focus === 'budget' || /orçamento|verba|investir|realocar|escalar/.test(text))
    skills.push('budget-optimizer')

  // Criativo
  if (request.hasImage || request.hasVideo || /criativo|imagem|vídeo|arte/.test(text))
    skills.push('creative-analyzer')

  // Copy
  if (request.hasCopy || /copy|texto|headline|anúncio|mensagem/.test(text))
    skills.push('copy-reviewer')

  // Faturamento cruzado
  if (request.hasWooData || /roas real|faturamento|vendeu|receita|loja/.test(text))
    skills.push('cross-data-analyst')

  // Relatório estruturado
  if (request.type === 'automatic' || request.type === 'full-report')
    skills.push('report-generator')

  return skills
}
```





---

## 8. Integração com WooCommerce — Faturamento das Lojas

### 8.1 Visão Geral

Esta seção documenta a integração do AdInsight com as três lojas da Prof Jaque Mendes para exibição de dados de faturamento, pedidos e assinaturas no dashboard. A integração é **somente leitura** — o sistema nunca escreve dados nas lojas.

A Mentoria Do Giz ao Digital não possui integração nesta fase por não ter um sistema de pagamento próprio mapeado. O campo será reservado para integração futura quando houver um meio definido.

| Loja | Tecnologia | Tipo de acesso | Status |
|---|---|---|---|
| Loja das Profs | WooCommerce (WordPress próprio) | API REST WooCommerce — admin | ✅ Fase 1 |
| Clube das Profs | WooCommerce + YITH Subscription & Membership (WordPress próprio) | API REST WooCommerce + YITH REST API | ✅ Fase 1 |
| Tudo de Prof | WooCommerce + WCFM Marketplace (WordPress próprio) | WooCommerce REST API (admin parcial) + WCFM REST API | ✅ Fase 1 |
| Mentoria Do Giz ao Digital | — | Não definido | 🔲 Fase futura |

---

### 8.2 Loja das Profs — lojadasprofs.com.br

**Tecnologia:** WooCommerce padrão, WordPress independente.
**Produto:** Infoprodutos em PDF para download, sem produto físico.

#### 8.2.1 Credenciais (painel admin do AdInsight)

- Consumer Key e Consumer Secret da API REST WooCommerce (geradas em WooCommerce → Configurações → Avançado → API REST, permissão **Leitura**)
- URL base da loja

#### 8.2.2 Endpoints utilizados

| Dado | Endpoint WooCommerce |
|---|---|
| Pedidos por período | `GET /wp-json/wc/v3/orders?after=&before=&per_page=100` |
| Faturamento bruto | Calculado a partir dos pedidos com status `completed` |
| Ticket médio | Calculado: receita total / número de pedidos concluídos |
| Produtos mais vendidos | `GET /wp-json/wc/v3/reports/top_sellers?period=custom` |
| Receita por produto | Derivado dos itens de cada pedido |

#### 8.2.3 Dados exibidos no dashboard

- Receita bruta do período (pedidos com status `completed`)
- Total de pedidos / pedidos concluídos / pedidos cancelados/reembolsados
- Ticket médio
- Top 10 produtos mais vendidos (quantidade + receita)
- Receita por categoria de produto
- Comparativo vs. período anterior (variação %)

---

### 8.3 Clube das Profs — clubedasprofs.com.br

**Tecnologia:** WooCommerce + YITH WooCommerce Subscription & Membership, WordPress independente.
**Produto:** Assinatura anual com acesso a todo o acervo da Loja das Profs.

#### 8.3.1 Credenciais (painel admin do AdInsight)

- Consumer Key e Consumer Secret WooCommerce (permissão **Leitura**)
- URL base da loja
- Chave de API YITH (se disponível via REST) ou acesso via WooCommerce com meta queries

#### 8.3.2 Endpoints utilizados

| Dado | Endpoint |
|---|---|
| Receita de assinaturas | `GET /wp-json/wc/v3/orders` filtrado por produto de assinatura |
| Assinantes ativos | `GET /wp-json/wc/v3/subscriptions?status=active` (via YITH REST ou WC Subscriptions compat.) |
| Novas assinaturas no período | `GET /wp-json/wc/v3/subscriptions?after=&before=&status=active` |
| Cancelamentos / churn | `GET /wp-json/wc/v3/subscriptions?status=cancelled&after=&before=` |
| Renovações | Pedidos vinculados a subscription com `renewal_order = true` |

#### 8.3.3 Dados exibidos no dashboard

- Total de assinantes ativos (snapshot atual)
- Novas assinaturas no período
- Cancelamentos no período
- Taxa de churn do período (cancelamentos / total de assinantes ativos no início do período)
- Receita de assinaturas do período (novas + renovações)
- MRR estimado (Monthly Recurring Revenue) — baseado no valor da assinatura anual ÷ 12

> **Nota técnica:** O YITH WooCommerce Subscription não tem uma REST API pública tão madura quanto o WooCommerce Subscriptions (WooCommerce.com). A implementação exigirá validação dos endpoints disponíveis na versão instalada. Caso a REST API do YITH não exponha os dados necessários, a alternativa é criar um plugin WordPress simples (endpoint customizado `/wp-json/adinsight/v1/subscriptions`) que consulta diretamente as tabelas do YITH e retorna os dados no formato esperado.

---

### 8.4 Tudo de Prof — tudodeprof.com.br

**Tecnologia:** WooCommerce + WCFM Marketplace (WC Vendors Frontend Manager), WordPress.
**Situação de acesso:** Acesso admin parcial ao WooCommerce; acesso principal via painel frontend do WCFM como administradora do marketplace.

O Tudo de Prof exige **duas integrações paralelas** para cobrir os dois escopos de dados necessários:

| Escopo | Fonte | Dados obtidos |
|---|---|---|
| Vendas da Prof Jaque (como vendedora) | WCFM REST API — conta da Prof Jaque | Receita própria, pedidos próprios, produtos próprios |
| Visão geral do marketplace | WooCommerce REST API (admin parcial) + WCFM Admin API | Faturamento total, todas as vendedoras, comissões |

#### 8.4.1 Credenciais (painel admin do AdInsight)

- Consumer Key e Consumer Secret WooCommerce (permissão **Leitura** — acesso admin parcial)
- WCFM Vendor Token ou credenciais de acesso ao painel WCFM da Prof Jaque
- URL base do marketplace

#### 8.4.2 Integração 1 — Vendas próprias da Prof Jaque via WCFM REST API

O WCFM expõe endpoints REST para cada vendedora autenticada:

| Dado | Endpoint WCFM |
|---|---|
| Pedidos da vendedora | `GET /wp-json/wcfmmp/v1/orders?vendor_id={id}&after=&before=` |
| Receita bruta da vendedora | Calculada a partir dos pedidos com status `completed` |
| Comissão recebida | `GET /wp-json/wcfmmp/v1/vendor-store/{id}/overview` |
| Produtos da vendedora | `GET /wp-json/wcfmmp/v1/products?vendor_id={id}` |
| Top produtos | Derivado dos itens dos pedidos |

#### 8.4.3 Integração 2 — Visão geral do marketplace

Com o acesso admin parcial ao WooCommerce, combinado com os endpoints administrativos do WCFM:

| Dado | Endpoint |
|---|---|
| Faturamento total do marketplace | `GET /wp-json/wc/v3/reports/sales` (requer permissão admin) |
| Total de pedidos do marketplace | `GET /wp-json/wc/v3/orders` |
| Número de vendedoras ativas | `GET /wp-json/wcfmmp/v1/vendors?status=active` |
| Receita total por vendedora | `GET /wp-json/wcfmmp/v1/vendor-store/overview` (endpoint admin) |

> **Nota técnica:** A disponibilidade dos endpoints administrativos do WCFM depende da versão instalada e das permissões configuradas. Caso o acesso admin parcial não permita a visão geral do marketplace via API, a alternativa é solicitar ao administrador do Tudo de Prof a criação de um endpoint customizado ou a concessão de permissão de leitura nos endpoints necessários. Essa limitação deve ser validada durante o sprint de integração.

#### 8.4.4 Dados exibidos no dashboard

**Visão da Prof Jaque como vendedora:**
- Receita bruta própria no período
- Total de pedidos próprios
- Ticket médio próprio
- Comissão retida pelo marketplace (taxa aplicada)
- Receita líquida (bruta − comissão)
- Top 10 produtos próprios mais vendidos

**Visão geral do marketplace:**
- Faturamento total do Tudo de Prof no período
- Total de pedidos do marketplace
- Número de vendedoras ativas
- Participação da Prof Jaque no faturamento total (%)

---

### 8.5 Faturamento Consolidado no Dashboard

Uma seção **"Faturamento"** no dashboard exibe a visão unificada das três lojas, com as seguintes funcionalidades:

- **Seletor de loja:** Todas / Loja das Profs / Clube das Profs / Tudo de Prof (vendas próprias)
- **KPI cards:** Receita bruta total, Pedidos totais, Ticket médio, Assinantes ativos (Clube)
- **Gráfico de evolução de receita:** linha temporal por loja, comparativo vs. período anterior
- **Gráfico de distribuição de receita por loja:** donut com participação percentual de cada loja no faturamento total
- **Tabela de pedidos:** listagem paginada com loja de origem, data, valor, status
- **Cruzamento com campanhas (ROAS real):** quando disponível, o sistema cruza a receita das lojas com o gasto de campanhas do mesmo período para calcular o ROAS efetivo por Canal de Negócio, complementando o ROAS atribuído pelas plataformas de anúncio

#### 8.5.1 Mentoria Do Giz ao Digital — Reserva para integração futura

O campo "Mentoria" aparece na interface como canal reconhecido, mas com estado **"Integração não configurada"** e um botão **"Configurar quando disponível"**. Quando a Mentoria passar a ter um sistema de pagamento definido (ex: plataforma de cursos com API, checkout próprio, etc.), a integração poderá ser adicionada sem alteração estrutural no dashboard.

---

### 8.6 Configuração no Painel Admin

Uma aba **"Lojas & Faturamento"** no painel admin centraliza o cadastro das integrações WooCommerce, seguindo o mesmo padrão visual das APIs de anúncio:

- Cadastro de cada loja com: nome, URL, Consumer Key, Consumer Secret (criptografado), tipo (WooCommerce padrão / WooCommerce + YITH / WooCommerce + WCFM)
- Botão **"Testar conexão"** por loja
- Status de sincronização por loja (última atualização, erros)
- Frequência de sincronização dos dados de faturamento (padrão: a cada 6 horas — dados de vendas mudam com menos frequência que dados de anúncios)

---

## 9. Exportação e Relatórios

### 9.1 Exportação Manual

- **Exportar PDF:** gera snapshot do dashboard atual com os filtros aplicados, formatado para apresentação
- **Exportar CSV/Excel:** exporta os dados brutos da tabela de campanhas com todas as métricas disponíveis
- Exportação disponível em qualquer tela do dashboard
- PDFs incluem: logotipo, período, data de geração, nome do usuário que gerou

### 9.2 Relatórios Automáticos por E-mail

Configurados no painel admin (seção 4.3). O e-mail gerado contém:

- Sumário executivo com os principais KPIs do período
- Variação em relação ao período anterior
- Alertas ativos no período
- Arquivo PDF e/ou CSV em anexo

---

## 10. Arquitetura de Projeto

Esta seção documenta a organização do repositório, estrutura de pastas, convenções de nomenclatura e padrões de código que guiam o desenvolvimento do AdInsight. É a referência técnica para onboarding de novos desenvolvedores e para os agentes de IA (Claude Code) que trabalharão no projeto.

### 10.1 Estrutura do Repositório — Monorepo

O AdInsight é organizado como um **monorepo único**, com frontend e backend em subpastas separadas dentro do mesmo repositório Git. Isso permite compartilhamento de tipos TypeScript, CI/CD unificado e navegação simplificada para o agente de desenvolvimento.

| App / Pacote | Caminho | Descrição | Stack principal |
|---|---|---|---|
| Backend | `apps/api/` | API REST + WebSocket + jobs | Node.js + TypeScript + Express |
| Frontend | `apps/web/` | Dashboard e painel admin | React + TypeScript + Vite |
| Tipos compartilhados | `packages/shared-types/` | Interfaces TypeScript usadas nos dois lados | TypeScript |

---

### 10.2 Estrutura Completa do Monorepo

```
adinsight/                               ← raiz do repositório Git
├── CLAUDE.md                            ← contexto geral do projeto para Claude Code
├── .claude/
│   └── skills/                          ← skills do AdInsight Analyst (produto)
│       ├── business-context/
│       ├── campaign-performance-analyst/
│       ├── budget-optimizer/
│       ├── creative-analyzer/
│       ├── copy-reviewer/
│       ├── report-generator/
│       ├── period-comparator/
│       └── cross-data-analyst/
├── apps/
│   ├── api/                             ← backend
│   │   ├── CLAUDE.md                    ← contexto específico do backend
│   │   ├── .claude/
│   │   │   └── skills/                  ← skills de desenvolvimento do backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── channels/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── platforms/
│   │   │   │   │   ├── meta/
│   │   │   │   │   ├── google/
│   │   │   │   │   ├── tiktok/
│   │   │   │   │   └── pinterest/
│   │   │   │   ├── woocommerce/
│   │   │   │   │   ├── loja-das-profs/
│   │   │   │   │   ├── clube-das-profs/
│   │   │   │   │   └── tudo-de-prof/
│   │   │   │   ├── ai/
│   │   │   │   │   ├── llm-adapter/
│   │   │   │   │   ├── skill-composer/
│   │   │   │   │   ├── intent-detector/
│   │   │   │   │   ├── chat/
│   │   │   │   │   └── analysis/
│   │   │   │   ├── alerts/
│   │   │   │   └── reports/
│   │   │   ├── shared/
│   │   │   │   ├── database/
│   │   │   │   ├── cache/
│   │   │   │   ├── queue/
│   │   │   │   ├── websocket/
│   │   │   │   ├── crypto/
│   │   │   │   ├── mailer/
│   │   │   │   ├── middleware/
│   │   │   │   └── utils/
│   │   │   ├── config/
│   │   │   └── app.ts
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── schema.sql
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   └── package.json
│   │
│   └── web/                             ← frontend
│       ├── CLAUDE.md                    ← contexto específico do frontend
│       ├── .claude/
│       │   └── skills/                  ← skills de desenvolvimento do frontend
│       ├── src/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── revenue/
│       │   │   ├── ai/
│       │   │   └── admin/
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   ├── layout/
│       │   │   ├── data-display/
│       │   │   └── feedback/
│       │   ├── hooks/
│       │   ├── stores/
│       │   ├── lib/
│       │   │   ├── api/
│       │   │   ├── websocket/
│       │   │   └── formatters/
│       │   ├── types/
│       │   └── router.tsx
│       ├── tests/
│       │   ├── unit/
│       │   └── e2e/
│       ├── public/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared-types/                    ← interfaces TypeScript compartilhadas
│       ├── src/
│       │   ├── campaign.types.ts
│       │   ├── user.types.ts
│       │   ├── platform.types.ts
│       │   ├── ai.types.ts
│       │   └── index.ts
│       └── package.json
│
├── PRD.md                               ← este documento
├── docs/
│   └── ROADMAP.md                      ← divisão em etapas de implementação
│
├── docker-compose.yml                   ← sobe API + Web + PostgreSQL + Redis
├── docker-compose.prod.yml
├── .github/
│   └── workflows/                       ← CI/CD pipelines
├── package.json                         ← workspace root (pnpm workspaces)
└── pnpm-workspace.yaml
```

---

### 10.3 Hierarquia dos CLAUDE.md

O monorepo possui três arquivos `CLAUDE.md` em camadas, cada um com escopo diferente. O Claude Code lê automaticamente todos os que encontrar no caminho até o arquivo em edição:

| Arquivo | Escopo | Conteúdo |
|---|---|---|
| `adinsight/CLAUDE.md` | Projeto inteiro | Visão geral, decisões arquiteturais globais, relação entre apps, padrões que se aplicam aos dois lados |
| `adinsight/apps/api/CLAUDE.md` | Somente backend | Estrutura de módulos, padrões de API REST, WebSocket, banco, segurança, filas |
| `adinsight/apps/web/CLAUDE.md` | Somente frontend | Estrutura de features, Tailwind, React Query, Zustand, filtros na URL |

Quando trabalhando em `apps/api/src/modules/campaigns/`, o Claude Code lê os três em cascata — do mais geral ao mais específico.

---

### 10.4 Packages Compartilhados (`packages/shared-types`)

Tipos TypeScript definidos uma vez e usados nos dois apps, eliminando duplicação e garantindo consistência entre o contrato da API e o consumo no frontend.

```typescript
// packages/shared-types/src/campaign.types.ts
export interface Campaign {
  id: string
  name: string
  platformId: string
  channelId: string | null
  status: CampaignStatus
  objective: CampaignObjective
  createdAt: string
  updatedAt: string
}

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  REJECTED = 'rejected',
}
```

Importação nos apps:
```typescript
// Em apps/api ou apps/web
import type { Campaign, CampaignStatus } from '@adinsight/shared-types'
```

---

### 10.5 Estrutura Interna dos Módulos (Backend)

Todos os módulos em `apps/api/src/modules/` seguem o mesmo padrão interno:

```
módulo/
  ├── nome.controller.ts   ← recebe req/res, valida input, chama service
  ├── nome.service.ts      ← lógica de negócio, orquestra repository e outros services
  ├── nome.repository.ts   ← queries no PostgreSQL (sem lógica de negócio)
  ├── nome.types.ts        ← interfaces e enums específicos do módulo
  ├── nome.routes.ts       ← definição das rotas REST do módulo
  └── nome.test.ts         ← testes unitários do módulo
```

**Regras:**
- Controllers nunca contêm lógica de negócio — delegam ao service imediatamente
- Services nunca escrevem SQL direto — delegam ao repository
- Repositories nunca chamam APIs externas — apenas operações no banco
- Tipos específicos do módulo ficam no módulo, não em `shared-types`

---

### 10.6 Regra de Decisão: Feature vs. Componente Compartilhado (Frontend)

Antes de criar um componente em `apps/web/`, aplicar este critério:

- Usado em apenas **1 feature** → vai dentro de `features/nome/components/`
- Usado em **2 ou mais features** → vai em `components/` compartilhado
- É um **primitivo de UI** (botão, input, badge) → vai em `components/ui/`
- É uma **interface TypeScript** usada no backend também → vai em `packages/shared-types/`

---

### 10.7 Convenções de Nomenclatura

#### Arquivos

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `KpiCard.tsx`, `CampaignTable.tsx` |
| Hooks | kebab-case com prefixo `use-` | `use-campaigns.ts`, `use-url-filters.ts` |
| Services, controllers, repositories | `[nome].[camada].ts` | `auth.service.ts`, `campaigns.controller.ts` |
| Types e interfaces | `[nome].types.ts` | `campaign.types.ts`, `auth.types.ts` |
| Stores (Zustand) | `[nome].store.ts` | `dashboard.store.ts`, `ai.store.ts` |
| Testes | mesmo nome + `.test` | `auth.service.test.ts`, `KpiCard.test.tsx` |
| Migrations | `YYYYMMDD_HHMMSS_descricao.sql` | `20250601_120000_create_campaigns.sql` |

#### Código (TypeScript)

| Elemento | Convenção | Exemplo |
|---|---|---|
| Variáveis e funções | camelCase | `getCampaigns()`, `totalSpend` |
| Classes e interfaces | PascalCase | `CampaignService`, `IUserRepository` |
| Enums | PascalCase | `UserRole`, `PlatformType` |
| Constantes globais | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE` |
| Rotas REST | kebab-case, plural | `/api/campaigns`, `/api/business-channels` |
| Tabelas e colunas do banco | snake_case | `campaign_metrics`, `created_at` |
| Variáveis de ambiente | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

---

### 10.8 Padrões Arquiteturais Obrigatórios

Decisões tomadas no PRD que **não devem ser revertidas** sem change request formal:

| Decisão | Regra | Motivo |
|---|---|---|
| LLM Adapter | Nunca chamar API de LLM diretamente — sempre via `llm-adapter/` | Portabilidade de provider |
| Skill Composer | Nunca montar prompts inline no código — sempre via `skill-composer/` | Consistência e manutenção |
| Criptografia de chaves | Toda chave de API de terceiros criptografada com AES-256 antes de salvar | Segurança |
| Cache first | Dados de campanhas servidos do cache — nunca chamar APIs de anúncio em tempo de requisição | Performance |
| Filtros na URL | Todos os filtros do dashboard persistidos como query params na URL | Compartilhamento de views |
| WebSocket para updates | Atualizações em tempo real via WebSocket — nunca polling do frontend | Performance e UX |
| Idioma do código | Todo código, variáveis, funções e rotas em inglês | Consistência e compatibilidade com agentes |
| Tipos compartilhados | Interfaces usadas nos dois apps vivem em `packages/shared-types` | Single source of truth |

---

### 10.9 Variáveis de Ambiente

#### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/adinsight
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Encryption (AES-256 para chaves de API)
ENCRYPTION_KEY=          # 32 bytes hex

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=AdInsight
```

---

### 10.10 CLAUDE.md — Contexto para Agentes de Desenvolvimento

O monorepo possui três `CLAUDE.md` em hierarquia de escopo:

- `adinsight/CLAUDE.md` — visão geral, decisões globais, relação entre apps
- `adinsight/apps/api/CLAUDE.md` — backend completo
- `adinsight/apps/web/CLAUDE.md` — frontend completo

**O CLAUDE.md não substitui o PRD.** O PRD documenta decisões de produto e arquitetura. O CLAUDE.md traduz essas decisões em instruções operacionais para o agente — estrutura de pastas, exemplos de código, o que nunca fazer.

**Skills de desenvolvimento** em `apps/api/.claude/skills/` e `apps/web/.claude/skills/` complementam os CLAUDE.md com instruções especializadas por módulo. São distintas das skills do AdInsight Analyst em `.claude/skills/` na raiz — as primeiras guiam o desenvolvimento do sistema, as segundas são o produto em si.

---

### 10.11 Padrões de Resposta da API

Todas as respostas da API REST seguem envelope padronizado:

```typescript
// Sucesso
{ success: true, data: T, meta?: { page, total, limit } }

// Erro
{ success: false, error: { code: string, message: string, details?: unknown } }
```

| Status | Uso |
|---|---|
| `200` | Sucesso (GET, PUT, PATCH) |
| `201` | Recurso criado (POST) |
| `204` | Sucesso sem conteúdo (DELETE) |
| `400` | Erro de validação de input |
| `401` | Não autenticado |
| `403` | Autenticado mas sem permissão |
| `404` | Recurso não encontrado |
| `422` | Erro de lógica de negócio |
| `429` | Rate limit atingido |
| `500` | Erro inesperado do servidor |

Nunca retornar `500` para erros de negócio esperados — usar `422` com `code` descritivo.

---

### 10.12 Eventos WebSocket

```
sync:started      { platformId, platformName }
sync:completed    { platformId, recordsUpdated, timestamp }
sync:failed       { platformId, error }
alert:triggered   { alertId, type, campaignId, message }
ai:ready          { analysisId, type }
dashboard:refresh { scope: 'campaigns' | 'revenue' | 'all' }
```

Clientes se inscrevem em eventos por sessão autenticada. Dados sensíveis nunca trafegam pelo WebSocket.



---

## 11. Arquitetura Técnica Recomendada

### 11.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | React + TypeScript | Componentização, tipagem forte, ecossistema rico |
| **UI Library** | Shadcn/UI + Tailwind CSS | Componentes acessíveis, customizáveis e performáticos |
| **Gráficos** | Recharts ou Tremor | Integração nativa com React, responsivos |
| **Backend** | Node.js + Express / Fastify | Mesma linguagem no stack, performance, comunidade |
| **Banco de Dados** | PostgreSQL | Relacional robusto, suporte a JSONB para dados flexíveis das APIs |
| **Cache / Filas** | Redis | Cache de respostas das APIs e fila de jobs de sincronização |
| **Agendador** | node-cron / BullMQ | Sincronização automática a cada hora, análises de IA agendadas e envio de relatórios |
| **Autenticação** | JWT + bcrypt | Padrão seguro, stateless |
| **Envio de E-mail** | Nodemailer + SMTP / SendGrid | Alertas e relatórios automáticos |
| **IA — Engine** | Claude API (padrão) / OpenAI / Gemini via LLM Adapter | Provider configurável no painel admin por cenário de uso; arquitetura de adapter isola o código de negócio |
| **IA — Processamento de vídeo** | ffmpeg | Extração de frames-chave de vídeos para análise visual pela IA |
| **WooCommerce** | WooCommerce REST API v3 | Integração com Loja das Profs, Clube das Profs e Tudo de Prof para dados de faturamento |
| **WCFM** | WCFM Marketplace REST API | Dados de vendas da Prof Jaque como vendedora e visão geral do marketplace Tudo de Prof |
| **Containerização** | Docker + Docker Compose | Deploy simplificado, consistência entre ambientes |

### 11.2 Integração com as APIs das Plataformas

#### Meta Ads — Marketing API

- Endpoint base: `graph.facebook.com/v19.0`
- Objetos consultados: AdAccount, Campaign, AdSet, Ad, Insights
- Métricas: `impressions`, `reach`, `clicks`, `ctr`, `spend`, `cpm`, `cpc`, `actions` (leads, purchases), `action_values` (revenue), `roas`
- Limitação: rate limit de 200 chamadas/hora por token — usar batch requests e cache

#### Google Ads — Google Ads API

- Client library: `google-ads-api` (Node.js)
- Queries via GAQL (Google Ads Query Language)
- Recursos: campaign, ad_group, ad, metrics, segments
- Métricas: `impressions`, `clicks`, `ctr`, `cost_micros`, `cpm`, `cpc`, `conversions`, `conversion_value`, `all_conversions_value`

#### TikTok Ads — TikTok for Business API

- Endpoint base: `business-api.tiktok.com/open_api/v1.3`
- Reports: integrated / basic / audience
- Métricas: `impressions`, `clicks`, `ctr`, `spend`, `cpm`, `cpc`, `conversions`, `cost_per_conversion`
- Limitação: token expira em 24 h — refresh automático obrigatório

#### Pinterest Ads — Pinterest API v5

- Endpoint base: `api.pinterest.com/v5`
- Recursos: ad_accounts, campaigns, ad_groups, ads, reports
- Métricas: `IMPRESSION`, `CLICKTHROUGH`, `CTR`, `SPEND_IN_MICRO_DOLLAR`, `CPM`, `CPC`, `TOTAL_CONVERSIONS`, `TOTAL_CONVERSION_VALUE_IN_MICRO_DOLLAR`

### 11.3 Estratégia de Sincronização e Cache

- **Job agendado:** sincronização completa a cada 1 hora para todos os dados do dia corrente
- **Sincronização manual:** disponível a qualquer momento via botão no dashboard (throttled: máx. 1 vez a cada 5 min por usuário)
- **Cache de respostas:** resultados das APIs armazenados no PostgreSQL por período — dados históricos não são re-consultados nas APIs
- **Dados de hoje:** sempre re-consultados (dados intraday podem mudar)
- **Dados de dias anteriores:** considerados imutáveis após 48 h — cache permanente

---

## 12. Requisitos Não Funcionais

| Requisito | Critério de Aceitação |
|---|---|
| **Performance** | Dashboard carregado (dados do cache) em < 2 s. Sincronização com APIs em background, sem bloquear a UI |
| **Disponibilidade** | 99,5% uptime mensal (exceto janelas de manutenção programadas) |
| **Segurança** | Chaves API criptografadas em repouso (AES-256). HTTPS obrigatório. Logs de acesso mantidos por 90 dias |
| **Responsividade** | Interface funcional em desktop (1280px+) e tablet (768px+). Mobile: leitura dos KPI cards e gráficos simplificados |
| **Auditabilidade** | Log de todas as ações de configuração (quem alterou, o quê, quando) |
| **Escalabilidade** | Arquitetura preparada para receber novos módulos do SaaS interno nas fases seguintes sem refatoração estrutural |

---

## 13. Métricas de Sucesso do Produto

- Redução do tempo gasto em coleta manual de dados de campanhas em ≥ 80%
- 100% das plataformas integradas e com dados atualizados sem intervenção manual
- Alertas disparados em até 15 min após a condição ser detectada
- Relatórios automáticos entregues com 100% de confiabilidade no horário agendado
- Análise automática de IA gerada diariamente sem falhas de execução
- ≥ 70% das sugestões da IA avaliadas como "úteis" ou "muito úteis" pelo time após 30 dias
- NPS interno ≥ 8 após 30 dias de uso pela equipe

---

## 14. Roadmap Sugerido — Fase 1

| Sprint | Duração | Entregas |
|---|---|---|
| 1 | 2 semanas | Setup do projeto, autenticação (primeiro acesso, login, JWT), gestão de usuários |
| 2 | 2 semanas | Painel admin: CRUD de credenciais de API de anúncios e lojas, criptografia de chaves |
| 3 | 2 semanas | Módulo de Canais de Negócio: cadastro, palavras-chave, associação automática/manual, fila de revisão |
| 4 | 2 semanas | Integração Meta Ads: sincronização, modelo de dados, exibição básica no dashboard |
| 5 | 2 semanas | Integração Google Ads + sistema de cache e job de sincronização automática |
| 6 | 2 semanas | Integração TikTok Ads + Pinterest Ads |
| 7 | 2 semanas | Dashboard de campanhas consolidado: KPI cards, filtro de canal, gráficos, filtros de período |
| 8 | 2 semanas | Dashboard por plataforma, tabela de campanhas, comparação de períodos, visão executiva |
| 9 | 2 semanas | Integração WooCommerce: Loja das Profs + Clube das Profs (pedidos, receita, ticket médio, YITH assinaturas) |
| 10 | 2 semanas | Integração Tudo de Prof: WCFM vendas próprias + visão geral marketplace; dashboard de faturamento consolidado |
| 11 | 2 semanas | Sistema de alertas, exportação PDF/CSV, relatórios automáticos por e-mail |
| 12 | 2 semanas | Módulo de IA: LLM Adapter, gestão de providers, análise automática periódica, prompt builder |
| 13 | 2 semanas | Chat interativo de IA, análise sob demanda, análise de criativos (imagem + vídeo via ffmpeg), histórico |
| 14 | 1 semana | Testes, ajustes de UX, documentação, deploy em produção |

**Duração estimada total: 27 semanas (~6,5 meses).** Prazo pode ser ajustado conforme tamanho da equipe de desenvolvimento.

---

## 15. Visão de Próximas Fases do SaaS Interno

Este PRD cobre exclusivamente a Fase 1. As fases seguintes do SaaS interno Prof Jaque Mendes poderão incluir, mas não se limitam a:

- **Fase 2:** Aprofundamento do módulo de faturamento — LTV de clientes, cohort analysis de assinantes, integração da Mentoria quando disponível
- **Fase 3:** Gestão do marketplace Tudo de Prof — vendedoras, comissões, planos, transações
- **Fase 4:** CRM e gestão de leads da Mentoria Do Giz ao Digital
- **Fase 5:** Módulo financeiro consolidado — DRE simplificado, fluxo de caixa, projeções

---

> **Nota Final**
> Este documento deve ser revisado e aprovado pela Prof Jaque Mendes e pela equipe técnica antes do início do desenvolvimento. Alterações de escopo após aprovação devem passar por processo formal de change request. Versões subsequentes deste PRD devem manter histórico de revisões.

---

*Confidencial — Uso Interno | AdInsight v1.7 | Prof Jaque Mendes*
