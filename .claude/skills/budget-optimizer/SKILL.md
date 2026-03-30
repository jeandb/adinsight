---
name: budget-optimizer
description: >
  Activate this skill when the user mentions budget, spend, investment,
  reallocation, scaling, budget distribution, how much to invest, where to
  put more money, or requests suggestions on where to increase or reduce
  ad spend. Also activates in full automatic analyses. This skill teaches
  the agent to suggest budget redistributions across platforms and campaigns
  based on historical ROAS, CPL by channel, scaling potential, and audience
  saturation — always justifying each suggestion with estimated impact and
  clear reasoning. Always respond in Brazilian Portuguese (pt-BR).
---

# Budget Optimizer

## Purpose

Suggest budget allocations and reallocations across platforms, business
channels, and individual campaigns — maximizing return on investment based
on historical data and paid traffic scaling principles.

---

## Core Optimization Principles

### 1. ROAS as the Primary Compass
- Campaigns with ROAS > benchmark (4x for infoproducts): candidates to scale
- Campaigns with ROAS between 2–4x: maintain and gradually optimize
- Campaigns with ROAS < 2x: review before maintaining spend
- Campaigns with ROAS < 1x: pause immediately (net loss)

### 2. Gradual Scaling Rule
Never suggest increasing a campaign budget by more than 20–30% at once.
Abrupt increases destabilize platform optimization algorithms (especially
Meta and TikTok), which can temporarily degrade ROAS.

Recommended scaling cadence:
- Safe increase: 15–20% every 3–5 days
- Moderate increase: 20–30% every 5–7 days
- Never: +50% or more at once (except campaigns with long, stable history)

### 3. Audience Saturation as a Brake
Before scaling, always check:
- Meta frequency: if > 3.5x, scaling will increase CPM without increasing conversions
- Audience size vs. daily budget: small audience with high budget = fast saturation
- CPM trending upward: indicates a more competitive auction or audience exhaustion

### 4. Healthy Platform Distribution
Reference for the pedagogical niche:

| Platform | Suggested share | Rationale |
|---|---|---|
| Meta Ads | 50–60% | Highest volume, best average return in the niche |
| Google Ads | 20–30% | Captures active purchase intent |
| TikTok Ads | 10–20% | Discovery, lower cost, good for creative testing |
| Pinterest Ads | 5–10% | Highly aligned niche, lower volume |

> Note: these are references, not rules. The ideal distribution depends on where each channel is currently performing best for Prof Jaque.

---

## Analysis Process

### Step 1: Current Performance Map
For each active campaign, compile:
- Current daily/monthly budget
- Current ROAS vs. benchmark
- Current CPL vs. benchmark
- Trend (improving / stable / declining over the past 7 days)
- Saturation status (frequency, CPM trend)

### Step 2: Identify Scaling Candidates
Criteria for scaling a campaign:
- ROAS > 4x for at least 7 consecutive days
- CPL within benchmark
- Frequency < 3x (Meta) — audience still has room
- CPM stable or declining
- At least 30+ conversions in the period (sufficient volume to trust the data)

### Step 3: Identify Where to Cut
Criteria for reducing or pausing:
- ROAS < 2x for 5+ consecutive days
- CPL > 2x the channel benchmark
- Frequency > 4x with declining ROAS
- Budget being consumed without recorded conversions

### Step 4: Calculate Reallocation
When suggesting a reallocation, always specify:
- Current value (R$)
- Suggested value (R$)
- Percentage change
- Estimated impact on conversions or revenue
- Timeframe to evaluate the result of the change

---

## Output Format

```
## Resumo do Budget Atual
[Table: platform | monthly budget | % of total | average ROAS]

## Sugestões de Realocação

### 🟢 Escalar
- [Campaign X]: from R$Y to R$Z (+N%)
  Motivo: ROAS of Xx over the past 14 days, frequency of N, audience has room
  Impacto estimado: +N conversions/month with maintained ROAS
  Como fazer: increase 20% now → reassess in 5 days → +10% if stable

### 🔴 Reduzir / Pausar
- [Campaign W]: reduce from R$Y to R$Z or pause
  Motivo: ROAS of Xx for N days, CPL X% above benchmark
  Verba liberada: R$X → reallocate to [suggested campaign]

## Budget Redistribuído
[Comparative table: before vs. after by campaign]

## Resultado Esperado
[Estimated impact on revenue and overall ROAS if suggestions are applied]

## Prazo para Reavaliação
[Suggested date to check the result of the changes]
```

---

## Limitations and Honesty

- Impact estimates are based on historical extrapolation — they are not guarantees
- Actual results depend on external factors: seasonality, competition, creative quality
- Always flag when data volume is insufficient for a confident recommendation
- Never suggest scaling a campaign with less than 7 days of data or fewer than 15 conversions
