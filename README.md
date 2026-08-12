# Loquia

> Transforme reuniões em contexto pronto para IA. / Turn meetings into AI-ready context.

Loquia records, transcribes and organizes meetings into a structured,
evidence-linked **AI Pack** that you can export to any AI tool. This repository
contains the **Milestone 1** deliverable: the definitive frontend application in
Next.js + TypeScript, running entirely on a **MockAdapter** — no real backend.

---

## Handoff note (read first)

This app is built on the validated Claude Design **handoff**
(`prototype/Loquia.dc.html`, `docs/*`, `assets/`, `MANIFEST.md`), which is the
source of truth for product, UX, brand and behavior.

History: the handoff was **absent** when Milestone 1 started, so that milestone
built the app from the task spec (reconstructions) and was correctly reproved.
In **Milestone 1.1** the real handoff was imported verbatim and the app was
reconciled against it — canonical AI Pack (14 sections), the real design tokens
(Iris/Sage/Amber/Danger, Manrope + Geist Mono), the convergence brand mark, the
validated headline, 4-step onboarding, and the prototype imagery. The full
before/after is in [`docs/HANDOFF-GAP.md`](docs/HANDOFF-GAP.md); the audit is in
[`docs/MILESTONE-1.1-REPORT.md`](docs/MILESTONE-1.1-REPORT.md). The prototype is
preserved under `prototype/` as an immutable reference and is never required at
runtime.

---

## Stack

- **Next.js** (App Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** with a semantic design-token system (light/dark/system)
- **next-intl** (pt-BR, en-US active; es-ES/es-MX/fr-FR/de-DE architecture-ready)
- **TanStack Query** (server-state), **Zustand** (transient recorder state only)
- **React Hook Form** + **Zod** (forms/validation)
- **Radix UI** primitives, **lucide-react** icons
- **Vitest** + **React Testing Library**, **Playwright** (e2e), **Storybook**
- **pnpm workspaces** monorepo

## Monorepo structure

```
apps/
  web/        ← the real frontend (implemented)
  api/        ← scaffolding only (Milestone 2)
  worker/     ← scaffolding only (Milestone 2)
packages/
  domain/         domain types incl. ProcessingJob & AI Pack model
  contracts/      service interfaces, Zod schemas, browser-adapter ports
  export-engine/  single md/txt/json engine (preview = clipboard = download)
  i18n/           locale config + pt-BR/en-US message bundles
  ui/             design-system primitives (Button, Card, Badge, …)
  config/         design tokens (CSS vars) + Tailwind preset
```

The prototype/handoff directories (`prototype/`, `docs/`, `assets/`,
`MANIFEST.md`) are preserved when present and are **never** required at runtime.

## Install & run

Requires Node ≥ 20.11 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000  → redirects to /pt-BR
```

## Mock mode

There is **no backend** in Milestone 1. The UI depends only on the `Services`
contract (`packages/contracts`); the concrete implementation is a **MockAdapter**
(`apps/web/src/lib/mock`) backed by a persisted store.

- All state (users, workspaces, access requests, invitations, audit, meetings,
  transcripts, edits, speaker names, settings, locale, theme, export history,
  onboarding, archive status) is persisted via a `BrowserStorageAdapter`
  (localStorage in the browser, in-memory on the server). **A refresh never
  resets the product.**
- The recorder uses a `MediaRecorderAdapter` that performs a real permission
  flow when a mic is available but **synthesizes** the captured signal, so it
  works deterministically in tests and on machines without a microphone.
- Processing (`ProcessingJob`) is simulated stage-by-stage; when it reaches
  `ready`, deterministic demo transcript + AI Pack are generated. No real
  STT/diarization/LLM.

### How the future ApiAdapter replaces the MockAdapter

Components never import adapters — they consume `useServices()`, which resolves a
`Services` container from `apps/web/src/lib/services.ts`. In Milestone 2, swapping
`createMockServices(...)` for a `createApiservices(...)` that implements the same
`Services` interface is the **only** change required; no UI code changes. The
same is true for the four browser ports (storage/clipboard/download/recorder).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the web app |
| `pnpm build` | Production build of the web app |
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests (all packages) |
| `pnpm test:e2e` | Playwright e2e (auto-detects the environment Chromium) |
| `pnpm storybook` | Storybook dev server |
| `pnpm build-storybook` | Static Storybook build |
| `pnpm format` | Prettier write |

## Tests

- **Unit (Vitest):** export engine (presets/sizes/formats, evidence, speaker
  rename), mock services (access + admin workflows, processing pipeline,
  settings persistence, export history), storage adapter, theme persistence, i18n.
- **E2E (Playwright):** marketing → request access → success, login → app,
  AI-Pack-as-default tab, theme + locale persistence, recorder + persistent
  mini-recorder, export download.

> Playwright note: the pinned `@playwright/test` revision differs from the
> Chromium pre-installed in this environment, so the config auto-detects the
> browser under `/opt/pw-browsers`. Override with `PW_CHROMIUM_PATH` if needed.

## Storybook

Built with the `@storybook/react-vite` framework and intl+theme toolbar globals.
Stories cover UI primitives and key product components (ProcessingTimeline,
AIPackView, Waveform) across light/dark and pt-BR/en-US.

## Limitations (by design, Milestone 1)

- No real backend, database, queue, STT, diarization, LLM, email, storage, or
  auth. Everything is mock.
- Planned locales (es/fr/de) are routable but fall back to en-US messages (not
  advertised as complete).
- Optional enhancements not yet built (non-blocking): custom preset manager,
  extended AudioPlayer transport. See `docs/MILESTONE-1.1-REPORT.md` §Gaps.

## Next milestone

Milestone 2 introduces the real backend (API + worker + persistence + AI
pipeline). It is intentionally **not** started here.
