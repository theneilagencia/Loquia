# Loquia — especificação do AI Pack

## Princípio
Um único plano gera todos os formatos: `meeting + preset + size + sections + format + language → pack → render`.
Não existe motor por formato. No protótipo: `packPlan()` → `packData()` → `packMarkdown()` / `packJSON()`, com `packText()` como única porta de saída usada pelo preview, pelo clipboard e pelo download.

## Seções (ordem canônica)

| # | key | Obrigatória | Conteúdo | Comportamento vazio |
|---|---|---|---|---|
| 1 | instructions | opcional (toggle) | Regras para o modelo: não inventar, separar explícito de inferência, preservar nomes/números/datas, citar timestamps, declarar o que falta | omitir bloco |
| 2 | metadata | sim | título, data, duração, idioma, fonte, status | sempre presente |
| 3 | participants | sim | nome + organização; externos marcados | "não identificados" |
| 4 | purpose | sim | uma frase sobre o objetivo da conversa | omitir |
| 5 | executiveContext | opcional | 2–3 linhas de contexto | omitir |
| 6 | topics | sim | assuntos tratados | omitir seção |
| 7 | importantStatements | opcional (evidence) | falas relevantes com timestamp e autor | omitir seção |
| 8 | explicitDecisions | sim | apenas o que foi afirmado como definido | "nenhuma decisão explícita" |
| 9 | openPoints | sim | pendências declaradas | "nenhum ponto aberto" |
| 10 | questions | size≠compact | perguntas levantadas sem resposta | omitir |
| 11 | numbersAndDates | size≠compact | valores, prazos, volumes citados | omitir |
| 12 | ambiguities | opcional (toggle) | o que ficou incerto e por quê | omitir |
| 13 | evidence | derivada | ponteiro segmento→timestamp para cada afirmação | sempre que houver statements |
| 14 | transcript | conforme preset/size | transcrição integral com timestamps e falantes | omitir |

Nunca renderizar seção vazia com placeholder decorativo. Ausência é informação: usar a frase negativa só nas seções obrigatórias.

## Presets

| Preset | Seções | Transcript | Uso |
|---|---|---|---|
| ai (AI Pack) | todas exceto transcript | não (salvo size=full) | continuar em ChatGPT/Claude |
| transcript (Clean transcript) | metadata, participants, transcript | sim | leitura/arquivo |
| analysis (Analysis pack) | todas | sim | análise profunda |
| writing (Writing pack) | todas + `writingGoal` no topo | opcional | redigir documento |
| full (Full fidelity) | todas | sim | exportação completa |
| custom:{id} | definido pelo usuário | definido | preset salvo |

## Tamanhos
- **compact** — remove questions e numbersAndDates; sem transcript.
- **standard** — padrão; transcript conforme toggle.
- **full** — tudo, transcript sempre incluído.

## Idiomas
`outputLanguage` afeta APENAS o conteúdo estruturado (títulos de seção e linhas sintetizadas).
Transcript, citações e evidência permanecem no idioma original da fala, sempre.
Exemplo obrigatório: UI en-US + meeting pt-BR + export en-US → seções em inglês, transcript e evidência em português.

## Formatos
- **md** — `#` por seção, `*` por linha, `[mm:ss]` antes de citações.
- **txt** — mesmo pack sem marcação (`#` e `**` removidos, `*` → `- `).
- **json** — objeto estável: `meeting, participants, context, topics, important_statements[{timestamp,text}], decisions, open_points, questions, numbers_and_dates, ambiguities, transcript[{timestamp,speaker,text}]`. Deve passar em `JSON.parse`. Seções removidas viram array vazio, não ausente.

## Nome de arquivo
`loquia-<slug-do-titulo>-<ai-pack|transcript>.<md|txt|json>` — slug sem acento, minúsculo, hífen, máx. 44 caracteres.

## Geração real (Milestone 4)
A partir da M4 o AI Pack é **gerado de verdade** a partir do transcript, sem nunca
nascer como Markdown. O fluxo canônico é `TranscriptSegment[] → AIPackGenerator →
candidato estruturado → validação de schema (Zod) → validação de evidência →
AIPack persistido (versionado) → ExportEngine`. Detalhes de implementação
(abstração de provider, versionamento de prompt/schema, chunking, consolidação,
evidência ancorada em `segmentId`, idempotência e regeneração) em
`docs/ai-pack-pipeline.md`.

Regras desta especificação preservadas na geração real:
- As 14 seções canônicas, sua ordem, obrigatoriedade e comportamento vazio.
- Idioma: conteúdo sintetizado no `outputLanguage`; statements, evidência,
  números e transcript permanecem no idioma original.
- Seção vazia não é renderizada com placeholder; seções obrigatórias usam a frase
  negativa.
- Toda evidência aponta para um `TranscriptSegment` real; timestamps derivam do
  segmento, nunca do modelo; citações mostram o texto original (nunca uma "quote"
  reconstruída).
- Fatos são classificados em `explicit` / `inferred` / `uncertain`; o modelo
  nunca eleva `inferred` para `explicit`.
