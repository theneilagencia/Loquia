# Loquia — inventário de componentes

Extraído do protótipo. `p:` props principais, `s:` estados, `v:` variantes, `a11y:` requisitos.

## Primitives
Box, Stack, Inline, Grid, Text, Heading, Icon, FocusRing (outline 2px iris, offset 2px), VisuallyHidden.

## UI
- **Button** — p: variant(primary|secondary|ghost|danger), size, disabled, onClick. s: default/hover/active/focus/disabled. a11y: alvo ≥44px em mobile, nunca só cor.
- **IconButton** — p: label(obrigatório), icon. a11y: aria-label.
- **Input / Textarea** — p: value, onChange, label, error, placeholder. s: default/focus/error/readonly. a11y: label associado, `aria-invalid`, erro em texto.
- **Select** — p: value, options[{v,l}], onChange, label.
- **Toggle** — p: on, onToggle, stateLabel. a11y: `aria-pressed`, rótulo textual On/Off além da cor.
- **Checkbox / Radio** — accent iris.
- **Pill / SegmentedControl** — p: options, selected, onSelect. v: light (sobre surface) e dark (sobre inverse-surface).
- **Badge / StatusBadge** — p: tone(neutral|iris|sage|amber|danger), label. Regra: rótulo textual sempre presente.
- **Tag / Timestamp** — mono, clicável, seek no player.
- **Tooltip / Popover / Menu**.
- **Dialog** — p: open, onClose, title, role(dialog|alertdialog). s: open/closing. a11y: focus trap, Escape, `aria-modal`, retorno de foco.
- **Drawer / Sheet** — mobile: full-screen.
- **Toast** — p: message, duration. a11y: `role=status`.
- **Command (⌘K)** — p: items, query, onSelect. s: empty/results. a11y: navegação por teclado, hints visíveis.
- **Table** — mobile: vira lista de cartões (padrão adotado no admin).
- **Card, EmptyState, Skeleton, Progress, Avatar, FileDropzone, Timeline, AudioPlayer, EvidenceReference**.

## Product
- **MeetingCard** — p: meeting, onOpen, onCopy, onExport. s: ready/transcribing/error/archived.
- **MeetingHeader** — título, data, duração, idioma, fonte, status.
- **AIPackView** — p: pack, plan. s: locked (meeting não pronta), ready. Aba padrão.
- **PackSection** — p: section, showTimestamps. Regra: não renderizar seção vazia.
- **ExportModal** — p: meeting, config, onChange, onCopy, onDownload, onSavePreset. Fluxo: uso → preset → tamanho → formato → preview → copy/download. Mobile: sheet full-screen.
- **ExportPreview** — mono, reflete preset/size/format/idioma/rename/toggles; é o mesmo texto que sai no clipboard e no arquivo.
- **PresetManager** — criar, aplicar, tornar padrão, remover.
- **TranscriptViewer** — p: segments, query, onSeek, onRenameSpeaker. Linha ativa destacada por `iris-tint`.
- **SpeakerRenameDialog** — p: speakerKey, currentName, onApplyAll.
- **Recorder** — p: state, seconds, level, onStart/Pause/Resume/Marker/Finish. Atalhos Space, ⌘M, ⌘⏎. a11y: waveform nunca é o único indicador (texto GRAVANDO/PAUSADA + timer).
- **MiniRecorder** — fixo bottom-right quando gravando fora de /record; timer, pause/resume, finalizar, abrir. Não bloqueia navegação.
- **ProcessingTimeline** — 7 etapas, estados running/partial/error/done, retry.
- **UploadDropzone** — estados de arquivo e rede.
- **AudioPlayer** — persistente; play, ±10s, velocidade, volume, waveform, tempo, falante atual, compacto/expandido.
- **OfflineBanner / ErrorDialog** — toda mensagem diz: o que aconteceu, o que foi preservado, próxima ação.

## Admin
AdminNav, AdminStatCard, RequestTable/RequestList, RequestDetail, ApproveDialog, RejectDialog, InvitationRow, UserRow, WorkspaceRow, AuditList.

## Brand
Logo (symbol, wordmark, lockup h/v, light/dark/mono), BrandPalette, TypeSpecimen, VoiceTable, GlossaryTable.
