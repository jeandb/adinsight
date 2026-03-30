---
name: cross-data-analyst
description: >
  Activate this skill when WooCommerce data is synchronized AND campaign data
  is available for the same period, or when the user asks about real ROAS,
  revenue, store sales, "quanto vendeu", "retorno real", attribution
  discrepancy, or wants to cross ad spend data with actual sales. Also
  activates in full automatic analyses when WooCommerce is synchronized.
  This skill teaches the agent to cross campaign spend data with actual
  WooCommerce store revenue by business channel, calculate real ROAS vs.
  platform-attributed ROAS, and identify and explain attribution discrepancies.
  Always respond in Brazilian Portuguese (pt-BR).
---

# Cross Data Analyst

## Purpose

Cross investment data from ad campaigns (Meta, Google, TikTok, Pinterest)
with actual revenue from WooCommerce stores (Loja das Profs, Clube das Profs,
Tudo de Prof) — calculating the real business ROAS and identifying
discrepancies relative to the platform-attributed ROAS.

---

## Core Concepts

### Attributed ROAS vs. Real ROAS

**Attributed ROAS** (reported by the ad platforms):
- Calculated by each platform using its own attribution model
- Meta default attribution: 7-day click + 1-day view window
- Google: data-driven or last-click attribution
- TikTok: last interaction
- **Problem:** each platform claims credit for conversions that others also claim → sum of individual ROAS values > real ROAS

**Real ROAS** (calculated by AdInsight):
```
Real ROAS = Total WooCommerce revenue in the period / Total ad spend in the period
```

This is the number that matters for the business — how much each R$1 invested in ads generated in actual store revenue.

### Why Real ROAS Is Always Lower Than the Sum of Attributed ROAS

Illustrative example:
```
Meta reports: ROAS 4.2x (credits R$8,400 in revenue)
Google reports: ROAS 3.8x (credits R$3,800 in revenue)
Total attributed by platforms: R$12,200

Actual WooCommerce revenue in the period: R$9,500
Total spend: R$2,000 + R$1,000 = R$3,000

Real ROAS = R$9,500 / R$3,000 = 3.17x
```

The difference (R$12,200 attributed vs. R$9,500 actual) is attribution double counting.

---

## Data Sources

### Campaign Data (Ad Platform APIs)
- Spend by platform and campaign in the period
- Conversions and attributed revenue by platform
- Business channel of each campaign (via Business Channels module)

### WooCommerce Data
- **Loja das Profs:** orders with `completed` status in the period
- **Clube das Profs:** revenue from new subscriptions + renewals in the period
- **Tudo de Prof:** Prof Jaque's own sales via WCFM

---

## Cross-Reference Process

### Step 1: Align Periods
Ensure campaign data and WooCommerce data cover identical periods.
Note: campaign data is real-time; WooCommerce data may have a payment
processing delay.

### Step 2: Separate by Business Channel
Distribute campaign spend and WooCommerce revenue by channel:

```
Channel: Clube das Profs
  Campaign spend: R$X (sum of all campaigns in this channel)
  WooCommerce revenue: R$Y (new subscriptions + renewals in the period)
  Channel Real ROAS: Y / X

Channel: Loja das Profs
  Campaign spend: R$X
  WooCommerce revenue: R$Y (completed orders in the period)
  Channel Real ROAS: Y / X
```

### Step 3: Calculate Attribution Discrepancy
```
Discrepancy = (Sum of platform-attributed revenue - Actual WooCommerce revenue)
Percentage = (Discrepancy / Actual revenue) × 100
```

### Step 4: Identify the Platform with the Largest Discrepancy
The platform with the largest discrepancy may be:
- Using an overly long attribution window
- Claiming credit for organic conversions
- Having a pixel/tag configuration issue

---

## Limitations and Complexity Factors

### Attribution Is Imperfect by Nature
Some WooCommerce sales happen without a traceable ad origin:
- Organic / SEO access
- Direct referrals
- Email marketing
- Direct URL access

This means the AdInsight Real ROAS calculation may be **favorable to campaigns**
(organic sales mixed with ad-driven sales) or **unfavorable** (buyers who saw
the ad but purchased much later, outside the attribution window).

### Clube das Profs Subscription Renewals
Automatic subscription renewals are not necessarily a result of recent campaigns
— they result from past acquisition. When calculating Clube ROAS, separate:
- Revenue from new subscriptions (related to current campaigns)
- Revenue from renewals (related to historical campaigns)

### Tudo de Prof — Additional Complexity
Marketplace revenue includes Prof Jaque's own sales and commissions from other
sellers. When calculating ROAS:
- Use only Prof Jaque's own sales revenue for the campaign ROAS calculation
- Total marketplace GMV is a business health metric, not a campaign performance metric

---

## Output Format

```
## Análise Cruzada: Campanhas × Faturamento Real

**Período:** [start date] to [end date]

### ROAS Real vs. ROAS Atribuído

| Canal | Investimento | Receita real (WooCommerce) | ROAS real | ROAS atribuído (plataformas) | Discrepância |
|---|---|---|---|---|---|
| Loja das Profs | R$ X | R$ X | Xx | Xx | +X% |
| Clube das Profs | R$ X | R$ X | Xx | Xx | +X% |
| Tudo de Prof | R$ X | R$ X | Xx | Xx | +X% |
| **Total** | **R$ X** | **R$ X** | **Xx** | **Xx** | **+X%** |

### Interpretação da Discrepância
[Analysis of the gap between attributed and real ROAS — what may explain the difference]

### Plataformas com Maior Discrepância de Atribuição

| Plataforma | Receita atribuída | ROAS reportado | Participação estimada no ROAS real | Avaliação |
|---|---|---|---|---|
| Meta | R$ X | Xx | X% | Superatribuição / Alinhado / Subatribuição |
| Google | R$ X | Xx | X% | [assessment] |
| TikTok | R$ X | Xx | X% | [assessment] |
| Pinterest | R$ X | Xx | X% | [assessment] |

### Vendas WooCommerce Não Atribuídas a Campanhas
[Estimated organic revenue and impact on the calculation]

### Recomendações
[Suggestions to improve attribution accuracy and actions based on the real ROAS]
```

---

## When Not to Use This Skill

- When WooCommerce data is not synchronized for the period — report data absence
- When campaign and WooCommerce data periods do not adequately overlap
- For top-of-funnel metric analyses (reach, impressions, CTR) — real ROAS is not relevant here
