---
name: report-generator
description: >
  Activate this skill whenever the agent needs to produce a structured,
  standardized formal report — specifically during automatic periodic analyses
  and on-demand analyses with "complete" scope. Ensures output always follows
  the same consistent format with fixed sections, a campaign health score,
  language accessible to both the traffic manager and the founder Prof Jaque
  Mendes, and prioritized action items. Do not activate for quick chat
  responses — only for formal reports saved to history. Always respond in
  Brazilian Portuguese (pt-BR).
---

# Report Generator

## Purpose

Ensure all formal AdInsight Analyst reports follow a standardized, consistent,
and readable format — suitable for both the traffic manager (operational view)
and Prof Jaque Mendes (executive view). The report must be complete enough to
be useful and concise enough to actually be read.

---

## Report Types

### Automatic Daily Report
Generated automatically by the scheduled job. Covers the last 24 hours with
a 7-day comparison. Tone is more concise — highlights only what changed
significantly.

### Automatic Weekly Report
Covers the last 7 days compared to the prior 7 weeks. More complete — includes
trends, analysis by business channel, and optimization suggestions.

### On-Demand Full Report
Generated manually by the user. Scope and period defined by the user.
Follows the full structure below.

---

## Standard Report Structure

```markdown
# Relatório AdInsight — [Período]
**Gerado em:** [date and time]
**Escopo:** [channel(s) | platform(s)]
**Comparativo:** [previous period]

---

## 1. Resumo Executivo

> [2–4 sentences in plain language, no technical jargon, describing the overall
> result of the period. Ideal for Prof Jaque to read in 30 seconds.]

---

## 2. Score de Saúde das Campanhas

**Score geral: [X]/100** [🟢 Saudável | 🟡 Atenção | 🔴 Crítico]

| Dimensão | Score | Tendência |
|---|---|---|
| ROAS geral | X/20 | ↑ ↓ → |
| Eficiência de custo (CPL/CPC) | X/20 | ↑ ↓ → |
| Volume de conversões | X/20 | ↑ ↓ → |
| Saúde dos criativos (frequência) | X/20 | ↑ ↓ → |
| Distribuição de budget | X/20 | ↑ ↓ → |

**Scoring criteria:**
- ROAS: 20 pts if > 4x | 14 pts if 2–4x | 7 pts if 1–2x | 0 pts if < 1x
- CPL/CPC: 20 pts if below benchmark | 14 pts if within | 7 pts if up to 50% above | 0 pts if > 50% above
- Conversions: 20 pts if above prior period | 14 pts if equal | 7 pts if drop < 20% | 0 pts if drop > 20%
- Creatives: 20 pts if frequency < 2x | 14 pts if 2–3x | 7 pts if 3–4x | 0 pts if > 4x
- Budget: 20 pts if distribution is optimized | proportional to misalignment

---

## 3. Métricas do Período

| Métrica | Período atual | Período anterior | Variação |
|---|---|---|---|
| Investimento total | R$ X | R$ X | +/-X% |
| Impressões | X | X | +/-X% |
| Alcance | X | X | +/-X% |
| Cliques | X | X | +/-X% |
| CTR médio | X% | X% | +/-X pp |
| CPM médio | R$ X | R$ X | +/-X% |
| CPC médio | R$ X | R$ X | +/-X% |
| Leads gerados | X | X | +/-X% |
| CPL médio | R$ X | R$ X | +/-X% |
| Conversões | X | X | +/-X% |
| ROAS médio | Xx | Xx | +/-X% |
| Receita atribuída | R$ X | R$ X | +/-X% |

---

## 4. Performance por Canal de Negócio

[Present only when data from multiple channels is available]

| Canal | Investimento | ROAS | Conversões | CPL | Status |
|---|---|---|---|---|---|
| Loja das Profs | R$ X | Xx | X | R$ X | 🟢/🟡/🔴 |
| Clube das Profs | R$ X | Xx | X | R$ X | 🟢/🟡/🔴 |
| Tudo de Prof | R$ X | Xx | X | R$ X | 🟢/🟡/🔴 |
| Mentoria | R$ X | — | X | R$ X | 🟢/🟡/🔴 |

---

## 5. Performance por Plataforma

| Plataforma | Investimento | ROAS | CTR | CPL | Frequência | Status |
|---|---|---|---|---|---|---|
| Meta Ads | R$ X | Xx | X% | R$ X | Xx | 🟢/🟡/🔴 |
| Google Ads | R$ X | Xx | X% | R$ X | — | 🟢/🟡/🔴 |
| TikTok Ads | R$ X | Xx | X% | R$ X | — | 🟢/🟡/🔴 |
| Pinterest Ads | R$ X | Xx | X% | R$ X | — | 🟢/🟡/🔴 |

---

## 6. Campanhas em Destaque

### 🏆 Top 3 — Melhor Performance (ROAS)
[list with name, channel, platform, spend, and ROAS]

### ⚠️ Atenção — Piora Significativa
[campaigns with > 20% drop in key metrics vs. prior period]

### 🚨 Alertas Ativos
[paused, rejected, or critically poor CPL/ROAS campaigns]

---

## 7. Faturamento Real (quando disponível)

[Present only when WooCommerce data is synchronized]

| Loja | Receita | Pedidos | Ticket médio | vs. período anterior |
|---|---|---|---|---|
| Loja das Profs | R$ X | X | R$ X | +/-X% |
| Clube das Profs | R$ X | X assinantes ativos | R$ X | +/-X% |
| Tudo de Prof (próprio) | R$ X | X | R$ X | +/-X% |

**ROAS Real vs. ROAS Atribuído:**
[Comparison and analysis of the attribution discrepancy]

---

## 8. Oportunidades Identificadas

[Prioritized list — maximum 5 items]

| Prioridade | Oportunidade | Ação sugerida | Impacto estimado |
|---|---|---|---|
| 🔴 Alta | [description] | [specific action] | [estimate] |
| 🟡 Média | [description] | [specific action] | [estimate] |
| 🟢 Baixa | [description] | [specific action] | [estimate] |

---

## 9. Riscos Identificados

[List of active risks — maximum 3 items]

| Risco | Campanhas afetadas | Urgência | Ação recomendada |
|---|---|---|---|
| [description] | [list] | Alta/Média/Baixa | [action] |

---

## 10. Próximos Passos

[Action list ordered by priority — what to do first]

- [ ] **[Action 1]** — [suggested owner] — deadline: [today/this week/next week]
- [ ] **[Action 2]** — ...
- [ ] **[Action 3]** — ...

---

*Relatório gerado pelo AdInsight Analyst | Próxima análise automática: [date and time]*
```

---

## Formatting Rules

- **Language:** technical in metric tables, plain language in the Executive Summary and Next Steps
- **Variations:** always show as +X% (improvement) or -X% (decline)
- **Score:** never give a score of 0 without explaining what drove it down
- **Next steps:** maximum 5 actions, prioritized — a report with 15 actions is not useful
- **Missing data:** when a data point is unavailable, write "—" and never invent values
- **Executive Summary tone:** write as if having a conversation with Prof Jaque — direct, no jargon, focused on what matters for her business
