# Loquia

**Transforme reuniões em contexto pronto para usar.**
*Turn meetings into context you can use.*

Fluxo central do produto:

```text
Gravar
→ Transcrever
→ Estruturar
→ Exportar
```

A Loquia grava reuniões, estrutura a conversa e entrega um pacote de contexto (o **AI Pack**) que você cola direto no ChatGPT, no Claude ou na IA que preferir. Gravação e transcrição são infraestrutura; o produto é o pacote que sai do outro lado.

---

## O que existe neste repositório

Este repositório contém o **protótipo validado** e o **handoff de engenharia** produzidos na fase de design. Não contém a aplicação definitiva.

```text
prototype/Loquia.dc.html    protótipo validado — especificação executável de produto e UX
prototype/support.js        runtime necessário para abrir o protótipo
prototype/uploads/          imagens referenciadas pelo protótipo (caminhos relativos)
prototype/archive/          versões anteriores, preservadas para histórico
docs/                       handoff para engenharia
assets/                     as mesmas imagens com nomes descritivos, para reuso
```

### Como abrir o protótipo

Abra `prototype/Loquia.dc.html` diretamente no navegador. Não há build. Ele precisa de `support.js` e da pasta `uploads/` no mesmo diretório — os caminhos são relativos e já estão corretos.

**Acesso de demonstração:** `rafael@northstar.com` com qualquer senha. `helena@vetorlabs.com` (pendente de ativação) e `andre@northstar.com` (suspenso) são bloqueados de propósito, para demonstrar as regras de acesso.

---

## O protótipo NÃO é a aplicação definitiva

`prototype/Loquia.dc.html` é um arquivo único, sem build, sem TypeScript, sem testes. Ele existe para responder *o que* o produto faz e *como* ele se comporta, não para ser a fundação técnica.

A próxima etapa é **reconstruir o frontend em Next.js + TypeScript com o Claude Code**, consumindo os documentos de `/docs`. O backend ainda não foi implementado.

Trate o protótipo como referência de comportamento, conteúdo, estados e linguagem visual. Não o transforme incrementalmente na aplicação final.

---

## Cobertura atual

```text
Functional requirements: 74/81
Visual requirements: 78/81
```

Os requisitos restantes são predominantemente de engenharia e stack: Next.js, TypeScript strict, Tailwind, locale na URL, services/adapters, Storybook, Vitest, Playwright e os build gates. Somam-se a eles os itens que dependem de backend (transcrição real, estruturação por LLM, autenticação, armazenamento de áudio, persistência em banco).

O detalhamento está em [`docs/status-report.md`](docs/status-report.md).

---

## Handoff de engenharia

| Documento | Conteúdo |
|---|---|
| [`docs/status-report.md`](docs/status-report.md) | O que está pronto, o que falta em engenharia e em backend, ordem sugerida |
| [`docs/routes.md`](docs/routes.md) | 23 rotas: propósito, estados, ações, dependências |
| [`docs/domain-types.md`](docs/domain-types.md) | Tipos TypeScript de todas as entidades |
| [`docs/services-adapters.md`](docs/services-adapters.md) | Contratos de 9 services e 6 adapters |
| [`docs/ai-pack-spec.md`](docs/ai-pack-spec.md) | 14 seções canônicas, presets, tamanhos, formatos, evidência, idioma |
| [`docs/design-tokens.md`](docs/design-tokens.md) | Cor (light/dark), tipografia, spacing, radius, motion, breakpoints, z-index |
| [`docs/component-inventory.md`](docs/component-inventory.md) | Primitives, UI, product, admin, brand |
| [`docs/test-plan.md`](docs/test-plan.md) | Unitários, E2E, acessibilidade |
| [`docs/migration-checklist.md`](docs/migration-checklist.md) | 24 passos para a aplicação definitiva |
| [`docs/brandbook.md`](docs/brandbook.md) | Posicionamento, voz, logo, glossário |
| [`docs/decisions.md`](docs/decisions.md) | Decisões que não devem ser renegociadas |

---

## Decisões que não se renegociam

Registradas em [`docs/decisions.md`](docs/decisions.md) e repetidas aqui porque são as que mais se perdem numa migração:

- **AI Pack é a aba padrão** da reunião; transcrição nunca é o default.
- **AccessRequest e User são entidades distintas.** Não existe signup público: o usuário só passa a existir, como `pending_activation`, depois da aprovação.
- **Evidência aponta para a fala original** e preserva o idioma original. As seções estruturadas podem ser geradas em outro idioma; a transcrição e as citações, não.
- **Seção vazia não mostra placeholder.** Nas seções obrigatórias, usa-se a frase negativa explícita.
- **Login nunca revela se o email existe.** Mensagem genérica para inexistente, pendente, suspenso e senha vazia.
- **Um único motor de exportação** alimenta preview, clipboard e download. O AI Pack é estruturado primeiro e só então renderizado em Markdown, TXT ou JSON — **nunca fazer parsing de Markdown para reconstruir o pack**.
- **A UI acessa dados por Services/Adapters**, nunca `fetch` direto no componente.
- **Fora de escopo:** CRM, tarefas, decision tracker, loops, chatbot de reunião, automações.
- Toda mensagem de erro diz **o que aconteceu, o que foi preservado e a próxima ação**.

---

## Limites conhecidos do protótipo

São limites honestos do mock, não bugs:

- Não transcreve de verdade o arquivo enviado; o pipeline de 7 etapas é simulado.
- Não envia email, não integra calendário nem CRM.
- O áudio do player é simulado.
- Persistência em `localStorage` (chave `loquia.proto.v1`); "Recriar dados de demonstração", em Configurações, volta ao seed.
- Locale não está na URL — o protótipo não tem roteador. Persistido em storage. A versão final usa `/[locale]/...`.

---

## Stack alvo

Next.js App Router · React · TypeScript strict · Tailwind · Radix/shadcn · next-intl · TanStack Query · Zod · React Hook Form · Motion · Lucide · date-fns · Storybook · Vitest + RTL · Playwright
