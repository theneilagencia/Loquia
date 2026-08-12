# Loquia — checklist de migração para Next.js

1. Bootstrap Next.js App Router + TypeScript strict.
2. Tailwind consumindo `docs/design-tokens.md` como CSS variables (`:root` + `[data-theme=dark]`).
3. next-intl com `/[locale]`, fallback en-US, persistência em cookie; namespaces: common, navigation, marketing, access, auth, dashboard, meetings, recording, processing, pack, export, transcript, settings, admin, errors, notifications, emails, brand.
4. Tokens → primitives → UI components (Radix/shadcn como base).
5. Domain types de `docs/domain-types.md`.
6. Services + adapters de `docs/services-adapters.md`; `NEXT_PUBLIC_APP_MODE=mock`.
7. MockAdapter sobre localStorage + IndexedDB, com latência e erros injetáveis.
8. Marketing: landing, product, security.
9. Access: request-access + success.
10. Auth: login, forgot-password, activate-account/[token].
11. Onboarding (4 etapas, persistido).
12. App shell + Home.
13. Meetings list + detail (AI Pack como aba padrão).
14. Recorder (MediaRecorder) + MiniRecorder persistente no layout do app.
15. Upload + Processing (7 etapas, partial/error/retry).
16. TranscriptViewer + AudioPlayer + speaker rename.
17. Export engine único (`buildPack` → `render`) + ExportModal + presets + histórico.
18. Settings (General, Recording, Export, Language, Privacy, Appearance).
19. Theme provider (system/light/dark) sem flash na hidratação.
20. Admin completo + audit.
21. Estados de erro/offline nomeados, com a regra "o que aconteceu / o que foi preservado / próxima ação".
22. Storybook: default, loading, empty, error, disabled, dark, mobile, pt-BR, en-US, long text, reduced motion.
23. Vitest + RTL + Playwright conforme `docs/test-plan.md`.
24. Build gates: build, typecheck, lint, test, test:e2e, build-storybook.

## Regras herdadas do protótipo (não renegociar)
- AI Pack é a aba padrão da reunião; transcrição nunca é o default.
- Um único motor de exportação alimenta preview, clipboard e download.
- Evidência sempre no idioma original, mesmo com export em outro idioma.
- Nada de CRM, tarefas, decision tracker, loops, chatbot de reunião ou automações.
- Mensagem de login nunca revela se o email existe.
- Contradição/erro de alta severidade nunca é resolvido automaticamente.
