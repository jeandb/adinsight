---
name: campaign-performance-analyst
description: >
  Activate this skill whenever there is paid campaign data to interpret.
  Use when the user asks about metrics, results, performance, ROAS, CPL, CTR,
  CPC, CPM, conversions, leads, reach, impressions, or any campaign indicator.
  Also activates during automatic periodic analyses and on-demand analyses.
  This skill teaches the agent to interpret ad performance indicators with
  analytical depth, identify trends and anomalies, and distinguish statistically
  relevant variations from normal noise — always in the context of Brazilian
  pedagogical infoproducts. Always respond in Brazilian Portuguese (pt-BR).
---

# Campaign Performance Analyst

## Purpose

Interpret paid campaign metrics with analytical depth, identifying
opportunities, risks, and anomalies — always contextualized within the
pedagogical infoproducts niche and the specific objectives of each of
Prof Jaque Mendes's business channels.

---

## Metrics and How to Interpret Them

### Top of Funnel (Awareness)
- **Impressions:** total ad displays. Alone this means nothing — always analyze alongside reach and frequency.
- **Reach:** unique users reached. Reach drop with stable impressions = rising frequency (possible audience saturation).
- **Frequency:** impressions / reach. Above 4x on Meta indicates audience saturation — creative or targeting needs refresh.
- **CPM:** cost per thousand impressions. Rising CPM without better results = more competitive auction or saturated audience.

### Middle of Funnel (Consideration)
- **Clicks:** total volume. Distinguish link clicks (real intent) from total clicks (may include likes, comments).
- **CTR (Click-Through Rate):** clicks / impressions. Indicates ad attractiveness. High CTR + high CPL = landing page problem, not the ad.
- **CPC:** cost per click. Always analyze together with the destination page conversion rate.

### Bottom of Funnel (Conversion)
- **CPL (Cost per Lead):** how much it costs to acquire one lead. Varies significantly by platform and objective — compare within the same channel.
- **Leads generated:** absolute volume. Unqualified leads inflate numbers — when possible, cross with sale conversion rate.
- **Conversions:** high-value actions (purchase, registration, subscription). The most important metric for bottom-of-funnel campaigns.
- **ROAS (Return on Ad Spend):** attributed revenue / spend. Warning: each platform uses its own attribution model — double counting between Meta and Google is common. True ROAS is calculated by crossing with WooCommerce data.
- **Attributed revenue:** always question the attribution model (last click vs. data-driven vs. view-through).

---

## Analysis Process

### Step 1: General Health Diagnosis
Before detailing individual campaigns, assess the overall picture:
- Is total spend within the planned budget?
- Is consolidated ROAS above, within, or below benchmark (> 4x = good for infoproducts)?
- Is there any metric with > 20% variation vs. the previous period without an obvious explanation?

### Step 2: Segmentation by Business Channel
Never analyze all campaigns in aggregate without separating by channel:
- **Loja das Profs:** focus on ROAS and average ticket
- **Clube das Profs:** focus on CPL and subscriber acquisition cost
- **Tudo de Prof:** focus on reach and cost per seller registration
- **Mentoria:** focus on CPL and lead quality (when available)

### Step 3: Platform-Level Analysis
Each platform has distinct characteristics:

| Platform | Strength | Watch out for |
|---|---|---|
| Meta | Volume, interest targeting, remarketing | Frequency, creative fatigue |
| Google | Purchase intent, keyword targeting | High CPC, irrelevant search terms |
| TikTok | Discovery, younger audience, lower cost | Lower qualification, misleading CTR |
| Pinterest | Highly aligned pedagogical niche, visual | Lower volume, longer conversion cycle |

### Step 4: Anomaly Detection
Flag as anomaly when:
- > 30% variation in any key metric vs. prior week (without known cause)
- CTR dropped while CPM rose = ad losing relevance in the auction
- High clicks + low conversions = landing page problem or wrong audience
- ROAS dropped + CPL rose simultaneously = systemic issue (creative, offer, or competition)
- Frequency > 4x with falling ROAS = confirmed audience saturation

### Step 5: Campaign Classification
When analyzing a set of campaigns, classify each as:
- 🟢 **Scale:** ROAS above benchmark, controlled CPL, no saturation signs
- 🟡 **Maintain:** performance within expectations, monitor
- 🔴 **Review:** below benchmark for 3+ consecutive days
- ⚫ **Pause:** ROAS below 1x or CPL unviable for the business model

---

## Output Format

When delivering a performance analysis, always structure it as follows:

```
## Diagnóstico Geral
[2–3 sentences summarizing campaign health in the period]

## Destaques Positivos
[Campaigns or metrics performing above expectations]

## Pontos de Atenção
[Anomalies, drops, identified risks]

## Campanhas por Status
[Table: name | channel | status 🟢🟡🔴⚫ | key metric | justification]

## Próximos Passos Sugeridos
[Prioritized list by impact: alto / médio / baixo]
```

---

## What Never to Do

- Do not compare metrics across different platforms as if they were equivalent (Google CTR ≠ Meta CTR)
- Do not classify a campaign as poor with only 1–2 days of data (insufficient volume)
- Do not ignore seasonality when diagnosing drops (always verify with `period-comparator`)
- Do not suggest pausing campaigns based on ROAS alone without checking conversion volume
