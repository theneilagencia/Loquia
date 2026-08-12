# Loquia — plano de testes

## Unitários (Vitest + RTL)
- **exportPlan** — preset × size × sections → plano; compact remove questions/numbers; transcript preset gera só metadata+participants+transcript.
- **render md/txt/json** — mesmo pack nos três formatos; JSON passa em `JSON.parse`; seção desligada vira array vazio.
- **filename** — slug sem acento, extensão por formato, sufixo ai-pack vs transcript.
- **renameSpeaker** — aplica a todos os segmentos e aparece em transcript, md e json.
- **packSection** — seção vazia não renderiza placeholder.
- **auth** — usuário ativo entra; pending_activation, suspended, inexistente e senha vazia recebem a MESMA mensagem genérica.
- **activation** — valid, expired, revoked, already_used, invalid.
- **approve** — cria user pending_activation + invitation com prazo + audit; request → approved.
- **reject / cancel / reopen / requestInformation** — transições e audit.
- **invitations** — resend renova prazo; revoke bloqueia ativação.
- **users / workspaces** — suspend, reactivate, deactivate, changeOwner.
- **settings** — cada patch persiste e altera comportamento (defaultPreset/format/size afetam ExportConfig inicial).
- **presets** — create, update, delete, setDefault.
- **theme** — system segue `prefers-color-scheme`; light/dark persistem.
- **i18n** — sem chave faltando entre pt-BR e en-US; plural; Intl de data/número/tempo relativo; strings longas (de-DE) não quebram layout.
- **recorder** — permissão negada, device ausente, unsupported; pause preserva buffer; markers.

## E2E (Playwright)
1. **Access lifecycle** — landing → request access → admin approve → invite → activate → onboarding → app.
2. **Recording** — record → pause → resume → marker → finish → processing → meeting.
3. **Mini recorder** — iniciar gravação → navegar → mini visível → pause → finalizar sem perder o tempo gravado.
4. **Upload** — drag&drop → progress → cancel → retry → processing → ready.
5. **Processing error** — falha na etapa 4 → mensagem diz o que foi preservado → retry conclui.
6. **Transcript** — buscar → clicar timestamp → player faz seek → renomear falante → export reflete o novo nome.
7. **Export** — meeting → export → AI Pack → Standard → Markdown → preview → copy (clipboard real).
8. **Download** — baixar .md, .txt e .json; asserir nome do arquivo e `JSON.parse` do conteúdo.
9. **Custom preset** — salvar preset → aplicar → tornar padrão → persistir após refresh.
10. **Settings** — trocar idioma padrão de export → nova exportação nasce com ele.
11. **i18n** — pt-BR → en-US → refresh → locale persiste; reunião pt-BR exportada em en-US mantém transcript em português.
12. **Theme** — light → dark → system → refresh → preferência persiste.
13. **Admin** — request detail → approve → invitations → resend → revoke → activation bloqueada → audit registra tudo.
14. **Persistence** — criar estado, refresh, estado intacto; reset demo volta ao seed.
15. **Responsivo** — 320/375/430/768/1024/1280/1440 sem overflow em transcript, export modal, admin e player.

## Acessibilidade
axe-core em todas as rotas; foco visível; Escape fecha diálogos; contraste AA em light e dark; alvos ≥44px; status nunca só por cor; `prefers-reduced-motion`.
