# Loquia — especificação de rotas (App Router)

Locale sempre no path: `/[locale]/...`, locale ∈ {pt-BR, en-US}; preparado para es-ES, es-MX, fr-FR, de-DE.
Fallback: `en-US`. Preferência persistida em cookie + `user.locale`.
No protótipo estas rotas existem como estados de `state.route` — a coluna "protótipo" dá o valor equivalente.

| Rota | protótipo | Propósito | Estados | Ações | Depende de |
|---|---|---|---|---|---|
| `/[locale]` | landing | Comunicar o benefício e levar a request-access | default | requestAccess, seeHow, signIn, brandbook | — |
| `/[locale]/product` | landing (âncoras) | Detalhar gravar→transcrever→estruturar→exportar | default | — | — |
| `/[locale]/security` | landing (seção) | Consentimento, retenção, exclusão, exportação | default | — | — |
| `/[locale]/request-access` | request | Formulário de solicitação | idle, submitting, invalid, submitted | submit | AccessService.submit |
| `/[locale]/request-access/success` | request (requestSent) | Confirmar recebimento | default | goAdmin (demo) | — |
| `/[locale]/login` | login | Autenticar usuário ativo | idle, error, submitting | signIn, forgot, requestAccess, activate | AuthService.signIn |
| `/[locale]/forgot-password` | forgot | Pedir link de redefinição | idle, sent | submit | AuthService.requestReset |
| `/[locale]/activate-account/[token]` | activate | Ativar conta a partir de convite | valid, expired, revoked, already_used, invalid | activate | AccessService.getInvitation, activate |
| `/[locale]/onboarding` | onboarding | 4 etapas: idioma, IA, preset, pronto | step 1..4 | next, back, finish | SettingsService.save |
| `/[locale]/app` | home | "Suas reuniões, prontas para usar em IA" | loading, empty, ready | record, upload, openMeeting, copyPack, export | MeetingService.list |
| `/[locale]/app/meetings` | meetings | Lista/busca/filtro de reuniões | loading, empty, filtered, ready | search, filter, open | MeetingService.list |
| `/[locale]/app/meetings/[id]` | meeting | AI Pack (default), Transcript, Details | ready, processing, error, archived | copy, export, seek, rename | MeetingService.get, ExportService |
| `/[locale]/app/meetings/[id]/processing` | upload (processing) | Pipeline de 7 etapas | queued, running, partial, error, done | cancel, retry, open | MeetingService.processing |
| `/[locale]/app/record` | record | Gravação MediaRecorder | permission_unknown/requested/granted/denied, device_missing, unsupported, recording, paused, finishing, error | start, pause, resume, marker, finish | RecordingService |
| `/[locale]/app/upload` | upload | Envio de áudio/vídeo | idle, dragging, uploading, paused, processing, completed, unsupported, too_large, network_error, cancelled, retrying | select, drop, cancel, retry | MeetingService.upload |
| `/[locale]/app/settings` | settings | General, Recording, Export, Language, Privacy, Appearance | ready, saving, saved | setSetting, savePreset, deletePreset, resetDemo, downloadData | SettingsService |
| `/[locale]/admin` | admin | Métricas + fila "precisa de análise" | ready, empty | openRequest | AdminService.stats |
| `/[locale]/admin/access-requests` | adminRequests | Lista de solicitações | ready, empty, filtered | open | AdminService.listRequests |
| `/[locale]/admin/access-requests/[id]` | adminRequest | Detalhe + histórico + notas | ready, not_found | startReview, requestInfo, approve, reject, cancel, reopen | AdminService |
| `/[locale]/admin/invitations` | adminInvites | Convites e prazos | ready, empty | resend, revoke, openActivation | AdminService.invitations |
| `/[locale]/admin/users` | adminUsers | Usuários e situação | ready, empty | suspend, reactivate, deactivate | AdminService.users |
| `/[locale]/admin/workspaces` | adminWorkspaces | Workspaces, owner, membros | ready, empty | changeOwner, suspend, reactivate | AdminService.workspaces |
| `/[locale]/admin/audit` | adminAudit | Log somente leitura | ready, empty | — | AdminService.audit |
| `/[locale]/brandbook` | brand | Marca, paleta, tipografia, voz, glossário | default | — | brandbook-content.json |
