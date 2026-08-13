# Loquia — decisões registradas

## Produto
1. A unidade central é a **reunião como entrada** e o **AI Pack como saída**. Nada de decision ledger, promises, loops ou conflicts como módulos de navegação — reposicionamento de 11/08/2026.
2. AI Pack é a aba padrão do detalhe da reunião. Transcrição nunca é o default.
3. Navegação principal limitada a Início, Reuniões, Configurações + ações Gravar e Enviar arquivo. Um item por tipo de informação é proibido.
4. Complexidade fica no motor. A interface não expõe vocabulário interno (knowledge graph, event sourcing, open loops).
5. Sem signup público. AccessRequest e User são entidades separadas; o usuário só existe como `pending_activation` após aprovação.
6. Mensagem de login é genérica para email inexistente, pendente, suspenso ou senha vazia.
7. Toda mensagem de erro declara: o que aconteceu, o que foi preservado, próxima ação.
8. Seção vazia não é renderizada com placeholder. Nas seções obrigatórias, usa-se a frase negativa explícita.

## Marca
9. Nome tratado no feminino em português ("a Loquia").
10. Tagline conceitual anterior ("Close your laptop...") descartada — já usada em outro produto. Headline oficial é o benefício direto.
11. Símbolo é convergência abstrata. Microfone, balão, cérebro, robô e sparkle proibidos.
12. Iris é a única cor de ação. Máximo dois fundos por tela.

## Técnicas
13. Protótipo em arquivo único é referência, não fundação. A aplicação definitiva nasce em Next.js/TypeScript conforme `docs/migration-checklist.md`.
14. **Um único motor de exportação**: `plano → pack → render`. `packJSONLegacy()` e `exportText()` foram removidos; preview, clipboard e download consomem a mesma função.
15. Clipboard usa a API real com fallback `textarea+execCommand`; toast apenas após sucesso.
16. Download usa Blob + Object URL com revoke; JSON deve passar em `JSON.parse`.
17. Cores são tokens CSS (`var(--*)`), nunca hex inline, para que dark mode seja um tema real e não inversão.
18. Dark mode: superfícies com matiz roxa, accents com luminosidade elevada; `color-scheme` declarado.
19. Persistência mock em localStorage com uma chave versionada; Blob de áudio iria para IndexedDB na versão final.
20. Tema `system` observa `prefers-color-scheme` via `matchMedia` e reage a mudanças.
21. Locale na URL fica para a versão Next.js; no protótipo a preferência é persistida.
22. Layout responsivo por `clamp()` e `repeat(auto-fit,minmax())`; tabelas de admin são listas de cartões.

## Milestone 4 — geração do AI Pack
23. Nunca `Transcript → LLM → Markdown` como fonte de verdade. A fonte é o AIPack
    canônico validado; Markdown/TXT/JSON são só renderizações.
24. Provider de geração é abstraído (`AIPackGenerator`), substituível por env
    (`AI_PACK_PROVIDER=anthropic|mock`), sem fallback silencioso para mock em
    produção. Model default `claude-sonnet-5`, configurável via `AI_PACK_MODEL`.
25. Saída do modelo é estruturada (structured output) e **revalidada** com Zod;
    candidato inválido não é persistido e passa por retry controlado
    (`AI_PACK_MAX_RETRIES`).
26. Evidência referencia `TranscriptSegment.id`; timestamp/speaker/excerpt são
    resolvidos do banco, nunca do LLM. IDs alucinados são rejeitados.
27. Geração é um `ProcessingJob` assíncrono (`type=ai_pack`), idempotente
    (`generation_key`), com versionamento — uma única versão `current` por
    reunião; regeneração mantém a atual até a nova concluir. Falha preserva o
    transcript.
28. Prompt e schema são versionados (`promptVersion`/`schemaVersion`) e persistidos
    para reprodução.

## Milestone 5 REVISADA — Local First

29. **Canonical:** the local recording is the primary copy; remote object storage
    is temporary processing infrastructure by default. The audio stays on the
    device; a temporary copy is sent for STT and deleted after the transcript
    persists. The product keeps working after the remote copy is gone.
30. `LocalMediaStore` (OPFS → IndexedDB → memory) and `ObjectStorageProvider`
    (R2) are separate abstractions with different lifetimes. No destructive
    rename of `ObjectStorageProvider`/`MediaAsset`; the remote row is documented
    as a temporary RemoteProcessingAsset.
31. Remote cleanup runs only AFTER the transcript is persisted, is retryable
    (`delete_processing_media` job + cleanup cron + `REMOTE_MEDIA_MAX_TTL_HOURS`
    backstop), and never blocks or reprocesses transcription.
32. Privacy language is factual: the audio DOES leave the device for cloud STT,
    so absolute claims ("nunca sai do dispositivo", "100% privado") are forbidden.
    Permanent remote-retention options are removed.
