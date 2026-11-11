# Memory-capture / legacy subscription

- **Concept:** A subscription that emails or texts an elderly parent/grandparent a new prompt question every week, then compiles their written or recorded answers into a printed keepsake book at year's end.
- **Origin:** StoryWorth (US) — a proven, profitable niche subscription business built around exactly this idea.
- **Evidence of demand:** StoryWorth has built a sustainable business on a simple prompts-plus-printed-book model at roughly $99/year, showing people will pay meaningfully for this.
- **Kenya landscape:** No Kenya- or Africa-focused equivalent was found.
- **Opportunity:** Strong cultural fit with oral-history traditions, and a large, often financially comfortable diaspora segment wanting to capture parents'/grandparents' stories before it's too late.
- **Target customers:** Diaspora adult children (roughly 30–55) with aging parents or grandparents still in Kenya.
- **Revenue model:** Flat annual subscription, with an optional printed-book add-on fee.
- **Difficulty:** Low — a content/logistics business (prompts plus printing), no regulatory barrier; book printing/binding can be outsourced to an existing Nairobi printer.
- **Scalability:** Medium — works wherever there's a diaspora with a parent back home; the core product barely changes market to market.
- **Risks:** Niche market size; requires the elder to be comfortable writing/recording answers, which may need a low-tech option (phone call transcription) to work well.
- **MVP:** A simple weekly-prompt email/SMS system plus manual compilation into a printed book via an existing print-on-demand shop, sold to \~20 pilot diaspora families.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app, matching the stack used in `odpc-compliance-saas`. The schema in `src/db/schema.ts` is the current source of truth for the data model; UI, auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance, see .env.example
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply them (migrator script not yet included — copy from odpc-compliance-saas)
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/globals.css`, `.gitignore`, `.env.example`

What is still a stub:
- `src/app/layout.tsx` + `src/app/page.tsx` — not yet included; scaffold against the installed Next version (see `node_modules/next/dist/docs/`). The `odpc-compliance-saas` siblings are a working reference.
- Auth (sessions, password reset, email verify) — copy and adapt the `lib/session.ts`, `lib/password.ts`, `lib/email-verification.ts` set from `odpc-compliance-saas`.
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
- `scripts/migrate.ts`, `scripts/seed.ts` — not yet included; the `package.json` scripts expect them.
