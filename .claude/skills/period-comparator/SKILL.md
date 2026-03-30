---
name: period-comparator
description: >
  Activate this skill whenever the analysis involves comparing time periods —
  whether automatic or when the user mentions "semana passada", "mês anterior",
  "comparado a", "antes", "tendência", "variação", "subiu", "caiu", "piorou",
  "melhorou", or any temporal comparative reference. This skill teaches the
  agent to contextualize performance variations within the specific seasonality
  of the pedagogical niche, distinguish natural seasonal variations from real
  campaign problems, and calculate and present comparisons in a clear and
  actionable way. Always respond in Brazilian Portuguese (pt-BR).
---

# Period Comparator

## Purpose

Contextualize performance variations between time periods intelligently —
accounting for pedagogical niche seasonality, data sample size, and
statistical relevance of observed differences. Avoid both false alarms and
overlooking real signals.

---

## Pedagogical Niche Seasonality

This is the demand behavior calendar for Prof Jaque Mendes's products.
Always reference this when interpreting period-over-period variations:

### Annual Calendar

| Period | Months | Demand | What to expect |
|---|---|---|---|
| Back to school | Jan–Feb | 🔴 High | Conversion peak, CPL may rise due to competition. ROAS tends to be high |
| Stable first semester | Mar–Jun | 🟡 Medium-high | Consistent demand, good period for scaling |
| July school holidays | Jul | 🟢 Low | Natural 20–40% drop in conversions. This is seasonality, not a problem |
| Recovery | Aug–Sep | 🟡 Medium-high | Gradual return, good for testing new creatives |
| Pedagogical Black Friday | Oct–Nov | 🔴 High | Second peak of the year. Ideal period for Clube promotions |
| End of year | Dec | 🟢 Low | Natural drop. Teachers on recess, lower purchase intent |

### Brand-Specific Events

| Event | Expected impact |
|---|---|
| Mentoria launch period | Concentrated spend and leads, ROAS differs from normal |
| Loja das Profs promotions | Conversion and revenue peak — do not compare with normal weeks |
| Clube subscription renewals | Renewals temporarily inflate revenue |

---

## How to Calculate and Present Variations

### Simple Percentage Variation
```
variation = ((current_value - previous_value) / previous_value) × 100
```

Presentation conventions:
- Improvement: `+X%`
- Decline: `-X%`
- Stable: `≈ 0%` or `→`

### When Is a Variation Relevant?

Not every variation warrants action. Use these criteria:

| Variation | Data volume | Interpretation |
|---|---|---|
| < 10% | Any | Normal variation — monitor |
| 10–20% | < 50 conversions | Statistical noise — do not act yet |
| 10–20% | > 50 conversions | Trend — investigate the cause |
| > 20% | Any | Relevant signal — investigate immediately |
| > 30% | Any | Anomaly — action required |

### Minimum Volume for Reliable Conclusions

| Metric | Recommended minimum |
|---|---|
| ROAS | 15+ conversions in the period |
| CPL | 30+ leads in the period |
| CTR | 500+ impressions |
| CPC | 50+ clicks |

If volume is below threshold, flag: *"Dados insuficientes para conclusão estatisticamente confiável — monitorar mais X dias antes de agir."*

---

## Available Comparison Types

### Period vs. Prior Equivalent Period
Most common — compares windows of the same length:
- Last 7 days vs. prior 7 days
- Last 30 days vs. prior 30 days
- Current month vs. prior month

**Note:** months have different lengths (28–31 days) — normalize per day when necessary.

### Same Period Prior Year (YoY)
Ideal for isolating seasonality. July this year vs. July last year eliminates the holiday effect.

**Limitation:** requires at least 12 months of historical data — verify availability before proposing.

### Week over Week (WoW)
Useful for operational weekly tracking. Quickly identifies if the week is better or worse.

### Day over Day (DoD)
Useful for campaign monitoring during launches or high-volatility periods.

---

## Comparative Analysis Process

### Step 1: Check Temporal Context
Before any comparison, verify:
- Does the compared period include any special event (launch, promotion, holiday)?
- Does either period fall during school holidays?
- Is the number of business days equivalent between periods?

### Step 2: Classify the Variation
For each metric with significant variation (> 10%):
1. Is the variation expected due to seasonality?
2. Is the data volume sufficient for the conclusion?
3. Is the variation consistent across platforms or isolated to one?
4. Does the variation follow the same pattern across multiple correlated metrics?

### Step 3: Separate Cause from Symptom
Example analysis:
- **Symptom:** ROAS dropped 25%
- **Possible causes to investigate:**
  - Did CPL rise? (acquisition problem)
  - Did average ticket drop? (offer problem)
  - Did conversion volume drop? (funnel problem)
  - Did spend increase without proportional results? (scaling problem)

### Step 4: Formulate Hypothesis and Recommendation
Every relevant variation must have:
1. Most likely hypothesis for the cause
2. Data that would confirm or refute the hypothesis
3. Suggested action if the hypothesis is confirmed

---

## Output Format

```
## Análise Comparativa: [current period] vs. [previous period]

### Contexto do Período
[Relevant events that may explain variations — seasonality, promotions, launches]

### Variações Principais

| Métrica | Período atual | Período anterior | Variação | Relevância |
|---|---|---|---|---|
| [metric] | [value] | [value] | +/-X% | Alta/Média/Baixa |

### Variações que Precisam de Atenção
[Only variations > 20% or with a concerning pattern]

**[Metric]:** dropped/rose X%
- Hipótese: [most likely cause]
- Para confirmar: [what to check]
- Ação sugerida: [what to do if confirmed]

### Variações Esperadas (Sazonalidade)
[Natural variations that require no action — with explanation]

### Tendência dos Últimos 30 Dias
[Overall direction of key metrics — improvement, stability, or deterioration]
```

---

## What Never to Do

- Never alarm about July drops without mentioning that it is school holiday season
- Never compare a launch day with a normal day
- Never conclude a campaign is performing poorly with less than 5 days of data
- Never ignore that promotional months are not comparable to normal months
- Never present percentage variation without the absolute value — `-50%` from 2 conversions is not significant
