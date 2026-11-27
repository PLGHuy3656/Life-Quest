# LifeQuest AI Pipeline (`ai-pipeline/`)

Standalone Node.js + TypeScript AI service implementing **Branch 5 (AI Plans & Recommendations Engine)** plus direct **Fox Companion UX** and server-mediated **Group Chat AI hooks**.

## Quick Start

```bash
cd ai-pipeline
cp .env.example .env
npm install
npm run dev      # Runs on http://127.0.0.1:8001
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Dual-Path Routing

- **Direct `front-end ↔ ai-pipeline` (`/ai-api/*`, deterministic, 0 LLM quota spend):**
  - `POST /v1/mascot/dialogue` — Fox Companion contextual lines
  - `POST /v1/mascot/parse-intent` — Vietnamese quick-intent extraction (`durationDays`, `availableMinutesPerDay`, `level`, `targetCategory`)
  - `POST /v1/plans/preview` — Unauthenticated AI Plan preview sandbox
  - `POST /v1/recommendations/preview` — Unauthenticated 14-day mock behavioral preview
- **Backend-mediated `front-end → backend → ai-pipeline` (`x-ai-service-key` gated):**
  - `POST /v1/plans/generate` & `POST /v1/plans/regenerate` — Gemini Structured Output JSON + Deterministic Fallback
  - `POST /v1/recommendations/analyze` — Tier 1 (0-token 14-day 4-rule analyzer) + Tier 2 (`AI_ENABLE_TONE_POLISH`)
  - `POST /v1/social/group-assist` — Stateless message payload builder for backend-persisted Group Chat events
