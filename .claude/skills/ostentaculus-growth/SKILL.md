---
name: ostentaculus-growth
description: The Ostentaculus growth engine — capture, sell and retain leads for a Food & Tourism cinema agency. USE THIS whenever the user mentions growth, growth hacking, captar/atrair leads, funil, tráfego, conversão, vendas, follow-up, retenção, churn, LTV/CAC/ROAS, marketing digital, YouTube→CRM, RD Station, or wants to turn the platform's data into more clients. Orchestrates four specialist subagents (capture, sell, retain, analyst) on top of the existing platform (concierge, leads, FASE 6 marketing agents, tourism RAG).
---

# Ostentaculus Growth Engine

An AI-native growth department for a **one-person business**: you (the human)
own Hook–Story–Offer and relationships; the agents run 70%+ of the operational
work. This skill is the **orchestrator** — it decides which specialist to
delegate to and in what order, then hands results back for your strategic review.

## The loop: capture → sell → retain (and measure)

```
        ┌──────────── measure (growth-analyst) ────────────┐
        ▼                                                   │
   CAPTURE ───────────▶ SELL ───────────▶ RETAIN ───────────┘
 growth-capture      growth-sell       growth-retain
 (traffic + audience)(offer + convert) (lifecycle + moat)
```

Delegate with the Agent tool (subagent types below). Run capture/sell/retain
**in sequence per lead cohort**, but fan out **in parallel** across channels or
establishments when the work is independent.

| The user wants to… | Delegate to |
|---|---|
| Find & attract ideal clients, build lead magnets, YouTube/geo funnels | `growth-capture` |
| Present the offer, handle objections, follow up, optimize funnel/landing | `growth-sell` |
| Onboard, deliver weekly value, prevent churn, upsell/expand | `growth-retain` |
| Design experiments, read CAC/LTV/ROAS from POS+GA4+tourism | `growth-analyst` |

## How it plugs into the existing platform

- **Leads** are attributed by the concierge (`packages/core/src/leads`) — the
  source of truth. Capture feeds it; retain reads it.
- **Content** comes from the FASE 6 agents (`packages/ai/src/marketing/*`):
  Chief of Staff plans, storytelling writes HSO scripts, distribution does SEO.
  This skill sits *above* them — it decides what to make and why.
- **Intelligence** comes from the tourism RAG (`packages/ai/src/tourism-rag`) —
  "when/where to capture tourists" grounds capture and campaign timing.
- **CRM:** internal `leads`/`conversions` first; mirror to **RD Station** when
  that connector exists (YouTube→RD Station is the cold funnel; concierge→lead is
  the warm, in-destination funnel).
- **Experiments** persist in `growth_experiments` (hypothesis, variants, CAC,
  LTV, ROAS, result) — `growth-analyst` owns this table.

## Non-negotiables (guardrails)

- **RGPD/LGPD first.** No scraping PII, no cold-DM spam, honor consent and the
  right to be forgotten. Lead contact is pseudonymized + encrypted at rest.
- **Offer before tactics.** Dickerson's rule: AI exposes weak offers fast. If the
  Hook–Story–Offer is weak, fix the *offer*, not the ad spend. Flag it to the human.
- **Brand voice = documentary luxury**, never salesy AI-slop. All copy runs
  through the storytelling agent's HSO frame.
- **Measure or don't ship.** Every capture/sell/retain play declares the metric
  it moves (CAC, conversion, retention, LTV) and how `growth-analyst` will read it.

## A typical run

1. `growth-analyst` reads current KPIs + tourism demand → where the opportunity is.
2. `growth-capture` designs the channel + lead magnet (e.g. "Guia gastronômico de
   outono em Barcelona" PDF) and the YouTube→landing→CRM path for that window.
3. Human records the video (owns authenticity); FASE 6 agents produce metadata.
4. `growth-sell` builds the follow-up sequence + optimizes the landing/funnel.
5. `growth-retain` sets the onboarding + weekly-value cadence and churn-risk signals.
6. `growth-analyst` instruments it as a `growth_experiments` row and reports back.

Keep each delegation scoped and evidence-based. Return a short plan + the metric,
not a wall of copy.
