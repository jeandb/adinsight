---
name: creative-analyzer
description: >
  Activate this skill when the user uploads an image or video of an ad,
  mentions "criativo", "arte", "imagem do anúncio", "banner", "vídeo",
  "reels", "stories", "carrossel", or requests visual analysis of any
  advertising material. Also activates when an on-demand analysis includes
  creatives. Requires a LLM provider with vision (image) support enabled.
  This skill teaches the agent to evaluate ad creatives with criteria specific
  to the pedagogical audience of Prof Jaque Mendes: visual composition,
  readability, visual CTA, brand alignment, fatigue potential, and platform
  policy compliance. Always respond in Brazilian Portuguese (pt-BR).
---

# Creative Analyzer

## Purpose

Evaluate images and video frames of advertisements using criteria specific
to Prof Jaque Mendes's pedagogical niche — identifying strengths, issues,
and improvement opportunities with actionable suggestions.

---

## Evaluation Criteria

### 1. Visual Hierarchy and Composition
Assess whether the viewer's eye is guided naturally in the right order:
- **Initial attention:** does the most important element appear first? (product, face, headline)
- **Visual flow:** is there a clear attention path (top→bottom, left→right)?
- **Balance:** are elements distributed evenly, or does the piece feel cluttered?
- **Negative space:** is there enough breathing room, or is everything cramped?

### 2. Text Readability
- Is the text legible on a mobile screen (the primary device of this audience)?
- Is the font large enough for feed viewing (minimum equivalent to 16px)?
- Is there sufficient contrast between text and background? (especially white text on light backgrounds)
- Is there too much text in the image? (Meta penalizes creatives with > 20% text coverage)
- Is the main text complete or will it be cropped by the format (Stories vs. Feed)?

### 3. Value Proposition Clarity
- Within 3 seconds of viewing, is it clear WHAT is being advertised?
- Is the main benefit explicit or too implied?
- Is the value proposition specific ("60 ready-to-use activities for 1st grade") or generic ("resources for teachers")?
- Is the product/service identifiable without reading the ad copy?

### 4. Visual CTA
- Is there a clear visual call-to-action (button, arrow, action text)?
- Is the CTA positioned where the eye naturally lands after processing the creative?
- Is the requested action clear and singular (one CTA, not three)?

### 5. Alignment with the Pedagogical Audience
Check whether the creative speaks to teachers:
- Visual elements recognizable by the audience (classroom, school supplies, children learning, teacher instructing)?
- Colors and aesthetics compatible with the educational environment (avoid overly aggressive colors)?
- Welcoming visual language vs. overtly salesy?
- Could the creative be mistaken for a different niche? (e.g., generic "digital infoproduct" aesthetic)

### 6. Brand Consistency with Prof Jaque
- Are the colors aligned with the brand's visual identity?
- Is the logo or brand name present and visible?
- Is the visual tone (welcoming, practical, inspiring) represented?
- Does the visual quality match the brand's positioning?

### 7. Fatigue Potential
- Is the creative sufficiently different from others currently running?
- Are there novelty elements that capture attention even from users who've already seen the brand?
- Is the visual hook (first frame for video, central element for image) strong enough?

### 8. Platform Policy Compliance
Check for common red flags:
- Excessive text in image (Meta: 20% rule)
- Guaranteed result claims ("Earn R$5,000/month")
- Content that could be interpreted as discriminatory or sensationalist
- Use of third-party brand symbols without authorization
- For TikTok: aspect ratio, overlay elements outside the safe area

---

## Video Analysis (via Frames)

When the creative is a video (frames extracted via ffmpeg), additionally evaluate:

### First 3 Seconds (Hook)
- Does the opening hook capture attention immediately?
- Does the first scene justify watching the rest?
- Is there text/subtitle from the first second? (essential — most users watch without sound)

### Pacing and Editing
- Is the editing pace appropriate for the platform? (TikTok/Reels: fast; Pinterest: slower)
- Are transitions smooth or too abrupt?
- Is the video too long for the format? (Stories: ≤ 15s; Reels/TikTok: 15–60s ideal)

### Subtitles and Accessibility
- Are auto or manual subtitles visible?
- Are subtitles positioned outside the platform's button overlay area?
- Does the content make sense watched without sound?

---

## Output Format

```
## Análise do Criativo: [file name/description]
**Tipo:** [static image / carousel / video]
**Formato identificado:** [feed / stories / reels / etc.]

## Pontos Fortes
[What is working well in the creative]

## Problemas Identificados
[Prioritized list of issues, from most to least critical]
| Problema | Severidade | Impacto esperado |
|---|---|---|

## Sugestões de Melhoria
[Specific, actionable suggestions — not generic advice]

## Score do Criativo
[Score 1–10 with justification, by dimension]
- Hierarquia visual: X/10
- Legibilidade: X/10
- Proposta de valor: X/10
- Aderência ao público: X/10
- Conformidade com políticas: X/10
- **Score geral: X/10**

## Recomendação Final
🟢 Aprovado para veiculação | 🟡 Aprovar com ajustes menores | 🔴 Revisar antes de veicular
```

---

## Limitations

- The analysis is based on visual and communication criteria — it does not replace real A/B testing
- For videos, analysis is performed on static frames — audio and narration elements are not evaluated
- Platform policies change frequently — always verify current guidelines before publishing
