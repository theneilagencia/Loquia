# Handoff gap — Milestone 1

## What was expected

The Milestone 1 brief instructed building on a Claude Design handoff already
present in the repository, using this priority order as the source of truth:

1. `docs/decisions.md`
2. the other `docs/*` documents
3. `prototype/Loquia.dc.html`
4. `README.md`

Specifically referenced: `README.md`, `MANIFEST.md`, `docs/decisions.md`,
`docs/routes.md`, `docs/domain-types.md`, `docs/services-adapters.md`,
`docs/ai-pack-spec.md`, `docs/design-tokens.md`, `docs/component-inventory.md`,
`docs/test-plan.md`, `docs/migration-checklist.md`, `docs/brandbook.md`,
`prototype/Loquia.dc.html`, and `assets/`.

## What was actually in the repository

Nothing. At the start of Milestone 1 the repository was **completely empty** —
no commits, no branches, no tags, no files. Verified three ways:

- `git ls-remote origin` → no refs
- GitHub API `list_branches` → `[]`
- GitHub API file listing → `409 Git Repository is empty`

None of the handoff artifacts above existed. The BTS-Global `Loquia-frontend` /
`Loquia-backend` repositories were out of session scope (access denied).

## Decision

The brief's rule "if a file is missing, log the gap and continue" is written for
an isolated missing file. With the **entire** handoff absent, continuing meant
reconstructing — from the task specification alone — everything the missing docs
would have defined. The user was consulted and delegated the choice; the agreed
path was to build a real, compiling, tested frontend from the spec and to be
explicit about what is reconstructed vs. specified.

## What is specified vs. reconstructed

**Followed from the task spec (authoritative):**

- Route list (all routes in the brief's §14 are implemented)
- Domain model contract incl. the fully-specified `ProcessingJob` and its
  statuses/stages
- Service list (Auth/Access/Admin/Meeting/Recording/Transcript/Export/
  Settings/Storage) and browser adapters
- Export presets, sizes, formats; the `TranscriptSegment → AIPack →
  ExportEngine → md/txt/json` flow (no reverse Markdown parsing)
- Processing stages, i18n axes (UI vs meeting vs transcript vs export language),
  the access lifecycle, admin actions mutating real mock state

**Reconstructed (the missing docs would have pinned these; reconcile later):**

- Visual design language and **design tokens** (`packages/config/tokens.css`)
- **Brandbook** content and logo mark
- The **14 AI Pack canonical section keys** (names/order) — the invariants the
  spec did state are honoured: never invent, explicit ≠ inferred, uncertainty
  preserved, evidence links to a `TranscriptSegment` and keeps its original
  language, empty sections do not render
- Component visuals and micro-copy beyond the translated message keys

Files created as reconstructions carry a header comment noting it.

---

## Update — Milestone 1.1 (handoff imported and reconciled)

**Timeline**
1. Handoff originally **absent** → Milestone 1 built the app from the task spec
   (reconstructions) and was correctly **REPROVADA**.
2. The validated handoff was later delivered as a ZIP
   (`loquia-claude-design-handoff-2026-08-12.zip`) and **imported verbatim**
   (`chore: import validated Claude Design handoff`). Prototype files verified
   byte-identical (sha256). The Milestone 1 reconstructed report was moved to
   `docs/reconstruction/`.
3. A systematic parity audit compared the app against the real docs + prototype.

**Divergences found and corrected (reconciliation)**

| Area | Before (reconstruction) | Status | Resolution |
|---|---|---|---|
| AI Pack sections | invented 14 keys (overview/risks/…) | MAJOR | replaced with the canonical 14 (instructions…transcript), titles, order |
| AI Pack empty behavior | generic hide | MAJOR | required→negative phrase; optional→omit |
| Presets / sizes / formats | ai_pack/clean/… + wrong rules | MAJOR | ai/transcript/analysis/writing/full; compact drops Questions+Numbers; exact JSON keys |
| Evidence language | mixed | MAJOR | statements/evidence/transcript stay original; synthesized follows output language |
| Filename | `<slug>-<preset>-<size>.<ext>` | MINOR | `loquia-<slug>-<ai-pack\|transcript>.<ext>` |
| Design tokens | indigo HSL guess | MAJOR | canonical canvas/surface/ink/iris/sage/amber/danger, light+dark |
| Typography | system stack | MISSING | Manrope + Geist Mono |
| Logo | speech-balloon + sparkle | MAJOR | convergence mark (Iris 100/55/30 → Ink vector+dot); sparkle removed |
| Headline | "…pronto para IA" | MINOR | "…pronto para usar" / "context you can use" |
| Onboarding | 3 steps | MINOR | 4 steps (idioma, IA, preset, pronto) |
| Mini recorder | bottom-center | MINOR | bottom-right, z-index 94 |
| Sidebar | canvas | MINOR | inverse-surface (decisions §21) |
| Terminology | "quem falou" | MINOR | "Participante" (pt glossary) |
| Assets | none | MISSING | hero/portability/CTA migrated to public/images |

**Accepted internal divergences (behavior-preserving, not corrected)**
- Domain field names differ from `docs/domain-types.md` (e.g. `speakerId` vs
  `speakerKey`; nested `Settings` vs flat `UserSettings`) and service method
  names differ from `docs/services-adapters.md` (`login` vs `signIn`, …). The UI
  still depends only on the `Services` contract, adapters remain substitutable,
  and behavior matches — so these were kept to avoid a from-scratch rewrite
  (task §4/§13: refactor only for real benefit).

**Result:** critical divergences (AI Pack, design tokens, prototype behavior,
brand) reconciled; all gates green. See `docs/MILESTONE-1.1-REPORT.md`.
