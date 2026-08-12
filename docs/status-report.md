# Loquia — status do frontend e plano de integração com backend

Documento de referência para ligar o frontend ao backend com Claude Code.
Data: 12/08/2026 · Artefato validado: `Loquia.dc.html` (protótipo navegável, arquivo único)

---

## 1. Onde estamos

O protótipo cobre a experiência completa do produto: gravar → transcrever → estruturar → exportar, mais acesso controlado, admin e configurações. Ele está validado visual e funcionalmente, com persistência local, dois idiomas, tema claro/escuro e exportação real de arquivos.

O que ele **não** é: uma aplicação Next.js. Não há build, TypeScript, testes ou services separados. O protótipo é a especificação executável; a aplicação definitiva precisa ser construída na stack alvo consumindo os documentos deste diretório.

**Cobertura medida:** 74/81 requisitos funcionais, 78/81 visuais.

---

## 2. Implementado e validado no protótipo

### Marketing e acesso
- Landing completa: hero, problema, como funciona, AI Pack, presets, portabilidade, privacidade, CTA final
- Solicitação de acesso com 9 campos + consentimento, e estado de confirmação
- Login (regra de mensagem genérica), recuperação de senha
- Ativação por convite com 5 estados: valid, expired, revoked, already_used, invalid
- Onboarding de 4 etapas (idioma, IA principal, preset padrão, resumo)

### Produto
- App shell com sidebar (desktop) e barra superior + tabs inferiores (mobile)
- Home: métricas, ações primárias, lista de reuniões recentes com copiar/exportar
- Lista de reuniões com busca e 5 filtros, estado vazio
- Detalhe da reunião: AI Pack (aba padrão), Transcrição, Detalhes
- Gravação com timer, waveform, pause/resume, marcadores, atalhos (Space, ⌘M, ⌘⏎)
- Mini recorder persistente ao navegar durante a gravação
- Upload com dropzone e pipeline de processamento em 7 etapas
- Player com play/pause, ±10s, velocidade, tempo, falante atual
- Transcrição com busca, timestamps clicáveis e rename de falante editável que propaga para todos os segmentos e todas as exportações
- Command palette (⌘K)

### AI Pack e exportação
- 14 seções canônicas, seção vazia não renderiza placeholder
- 6 presets: AI Pack, Clean Transcript, Analysis, Writing, Full Fidelity, Custom
- 3 tamanhos: Compact, Standard, Full
- 3 formatos: Markdown, TXT, JSON (JSON válido em `JSON.parse`)
- **Motor único**: `packPlan() → packData() → packMarkdown()/packJSON()`, com `packText()` como única saída consumida por preview, clipboard e download
- Clipboard real (API + fallback), download real via Blob com nome derivado do título
- Presets customizados: criar, aplicar, tornar padrão, remover
- Histórico de exportações

### Admin
- Visão geral com 6 métricas e fila de análise
- Solicitações: lista e detalhe com histórico, notas internas e 6 ações de workflow
- Aprovação cria usuário `pending_activation` + convite com prazo + registro de auditoria
- Convites: reenviar (renova prazo), revogar (bloqueia ativação)
- Usuários: suspender, reativar, desativar
- Workspaces: trocar owner, suspender, reativar
- Auditoria somente leitura

### Plataforma
- Persistência em localStorage (chave `loquia.proto.v1`) + reset de demo
- pt-BR e en-US com paridade de 196 chaves, `Intl` para data/número/tempo relativo
- Tema light/dark/system com tokens CSS, respeitando `prefers-color-scheme`
- Estados de erro nomeados (clipboard, export, processing, upload, invite, network) e offline, cada um dizendo o que aconteceu, o que foi preservado e a próxima ação
- Responsivo de 320 a 1440 sem overflow; UI mobile-first com alvos de toque ≥36px
- Linguagem visual consistente: hairlines, superfícies únicas, hover por tinta, raios 7–12px

---

## 3. O que falta — engenharia

Nada disto é demonstrável no navegador; tudo depende da stack alvo.

| Item | Estado | Onde está a especificação |
|---|---|---|
| Projeto Next.js App Router + TypeScript strict | ausente | `docs/migration-checklist.md` |
| Tailwind com os tokens como CSS variables | ausente | `docs/design-tokens.md` |
| next-intl com locale na URL (`/[locale]/...`) | ausente (protótipo persiste em storage) | `docs/routes.md` |
| Tipos de domínio | especificados, não implementados | `docs/domain-types.md` |
| Services + adapters (mock/api) | especificados, não implementados | `docs/services-adapters.md` |
| Storybook | ausente | `docs/migration-checklist.md` |
| Vitest + RTL + Playwright | ausente | `docs/test-plan.md` |
| Build gates (build, typecheck, lint, test, e2e) | ausente | `docs/migration-checklist.md` |
| Assets de marca em `public/brand` | símbolo existe inline; arquivos não exportados | `docs/brandbook.md` |

---

## 4. O que falta — backend

O protótipo declara honestamente seus limites. Cada um deles é um contrato a implementar.

### Crítico
1. **Transcrição real** — hoje o upload não transcreve o arquivo enviado. Precisa de STT com diarização, timestamps por segmento e idioma detectado. Contrato: `MeetingService.upload` → job assíncrono → `processingState` em 7 etapas → `TranscriptSegment[]`.
2. **Estruturação do AI Pack** — as 14 seções são dados fixos no mock. Precisa de um pipeline LLM que produza `AIPackSection[]` a partir da transcrição, marcando explícito vs. inferido e ancorando cada afirmação em `segmentId` + timestamp. Regra herdada: não inventar fato sem suporte na conversa.
3. **Autenticação e sessão** — login, hash de senha, sessão, expiração. Manter a mensagem genérica para email inexistente, pendente ou suspenso.
4. **Armazenamento de áudio** — upload direto, retenção configurável (7/30/90 dias ou não guardar), exclusão em cascata de áudio, transcrição e evidências derivadas.
5. **Persistência real** — substituir localStorage por banco. Entidades em `docs/domain-types.md`.

### Alto
6. **Email transacional** — convite, ativação, redefinição de senha, recusa. Localizados por `user.locale`.
7. **Convites com token seguro** — token assinado, prazo, revogação, reenvio que invalida o anterior.
8. **Autorização** — papéis owner/admin/member; rotas de admin protegidas; isolamento por workspace.
9. **Auditoria server-side** — eventos sensíveis gravados no servidor, não no cliente.
10. **Gravação em navegador → servidor** — chunks de MediaRecorder enviados incrementalmente, resistentes a queda de conexão.

### Médio
11. **Busca** — full-text em reuniões, transcrições e entregáveis.
12. **Idioma de exportação** — traduzir apenas as seções estruturadas, preservando transcrição e evidência no idioma original.
13. **Exportação de dados** — "baixar meus dados" gerado no servidor.
14. **Rate limiting e quotas** — por workspace, em transcrição e geração.

---

## 5. Ordem sugerida para o Claude Code

1. Bootstrap: Next.js, TypeScript strict, Tailwind com os tokens, next-intl com locale routing
2. Tipos de domínio + camada de services com `MockAdapter` (paridade com o protótipo, sem backend ainda)
3. Portar as telas na ordem do `migration-checklist.md`, consumindo services — não fetch direto
4. Trocar `MockAdapter` por `ApiAdapter` rota a rota, mantendo a UI intacta
5. Backend na ordem do item 4 acima: auth → persistência → upload/áudio → transcrição → AI Pack → email
6. Testes conforme `docs/test-plan.md`; fechar os build gates

O ponto de corte importa: a UI deve estar completa e verde no mock **antes** de existir backend. Assim a integração troca só o adapter.

---

## 6. Regras que não devem ser renegociadas

Herdadas do protótipo e das decisões registradas em `docs/decisions.md`:

- AI Pack é a aba padrão da reunião; transcrição nunca é o default
- Um único motor de exportação alimenta preview, clipboard e download
- Evidência sempre aponta para a fala original, mesmo quando o pack é gerado em outro idioma
- Seção vazia não é renderizada com placeholder
- Mensagem de login nunca revela se o email existe
- Sem signup público: AccessRequest e User são entidades separadas
- Toda mensagem de erro diz o que aconteceu, o que foi preservado e a próxima ação
- Fora de escopo: CRM, tarefas, decision tracker, loops, chatbot de reunião, automações

---

## 7. Pacote de handoff

```
README.md                      visão geral, acesso de demo, limites do mock
docs/routes.md                 23 rotas: propósito, estados, ações, dependências
docs/domain-types.md           tipos TypeScript de todas as entidades
docs/services-adapters.md      contratos de 9 services + 6 adapters
docs/ai-pack-spec.md           14 seções, presets, tamanhos, formatos, idioma
docs/design-tokens.md          cor (light/dark), tipografia, espaço, motion, z-index
docs/component-inventory.md    primitives, UI, product, admin, brand
docs/test-plan.md              unitários, E2E, acessibilidade
docs/migration-checklist.md    24 passos para a aplicação definitiva
docs/brandbook.md              posicionamento, voz, logo, glossário
docs/decisions.md              22 decisões de produto, marca e técnicas
```

**Conclusão:** frontend pronto para handoff. A integração com backend deve começar pela camada de services, não pelas telas.
