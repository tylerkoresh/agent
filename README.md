# Agent Skills for Founders

A Skillry-style marketplace/library of Agent Skills, focused on founders and startups.
The catalog is the product: browse, search, open a Skill, see who made it, where it comes from,
its license, which agents it works with and whether it is verified, then install it.

"Agent Skills for Founders" is a working name. It lives in one file: `src/config/site.ts`.

## Run it

```bash
npm install
cp .env.example .env.local      # set ADMIN_* values
npm run catalog:samples         # dev only: loads clearly-labelled sample fixtures
npm run dev
```

Production: `npm run build && npm start`, or build the included `Dockerfile` and mount a volume at `/data`.
The database (`DATABASE_PATH`) is created and migrated automatically on first request.
Back it up by copying the `.db` file, or with `npm run catalog:export`.

## Stack

Next.js (App Router) · TypeScript · Tailwind · SQLite (better-sqlite3) via Drizzle · FTS5 search · Zod · Vitest · Playwright.
All free and open source. No external services.
`.npmrc` sets `ignore-scripts=true`: `better-sqlite3` ships prebuilt binaries (Linux/macOS/Windows, x64/arm64, glibc/musl), so no compiler is needed.

## How the catalog works

Skills are data. Adding Skill #301 changes no code.

- **Add or edit** in `/admin` (single operator login from `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`),
  or write YAML/JSON files in `content/skills/` and run `npm run catalog:validate`, then `npm run catalog:import`
  (`-- --dry-run` first). Imports are all-or-nothing and update by slug.
- **Export** from `/admin` or `npm run catalog:export`. Exports re-import cleanly.
- Pages read through one layer, `src/server/repository.ts`. Swapping SQLite for Postgres means changing the Drizzle
  driver and that file, not the UI.

### Rules enforced in the data (`src/lib/skill-schema.ts`)

- To publish: full description, creator, source URL, license (use `NOASSERTION` if the source states none) and at least one agent with evidence.
- Compatibility is per agent, with evidence `tested` (we ran it) or `declared` (the source says so). No row means unknown.
- `verified` requires a last-tested date and at least one `tested` agent. Existing on GitHub never makes a Skill Verified.
- `distribution` defaults to `link_only`. `hostable` requires a recorded redistribution permission note. No file hosting exists in Stage 1.
- Every Skill keeps creator, source URL, repository, path, pinned ref, license, license URL and attribution.

### Agent-readable install guide

`/skills/<slug>/install.md` returns plain Markdown (`text/markdown`) generated from stored data only: source, license,
verification, per-agent evidence, steps, and a safety preamble telling agents to treat the Skill's files as untrusted
and to confirm with the user. It does not guess agent skill directories; add per-agent instructions in the catalog.
Unpublished and unknown slugs return 404.

## Tests

```bash
npm run typecheck
npm test                                   # 24 unit/integration tests: validation, search, repository, import/export, install guide, auth
npx playwright install chromium            # once
npm run test:e2e                           # 14 browser tests against the production build (run `npm run build` first)
```

E2E covers browsing, search, categories, Skill pages, install.md, 404s, 375px layout, axe accessibility, internal links,
console errors, and the full admin flow (validation, publish, edit, unpublish, import, export).

## Sample data

`content/samples/` holds 9 fixtures flagged `isSample`. They are labelled "Sample data" in the UI and hidden when
`NODE_ENV=production` unless `SHOW_SAMPLES=true`. `catalog:samples` refuses to run in production.
The real catalog goes in `content/skills/`.

## Not built (by design)

Payments, accounts, reviews, ratings, download counts, file hosting, AI features, workflows.
