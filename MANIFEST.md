# Pacote de handoff — inventário

Gerado no Claude Design em 12/08/2026, para o repositório `theneilagencia/Loquia`.
A estrutura abaixo já corresponde à raiz do repositório: importe sem reorganizar.

## Conteúdo

| Caminho | Origem | Papel |
|---|---|---|
| `README.md` | escrito para o repositório | porta de entrada |
| `.gitignore` | escrito para o repositório | preparado para a etapa Next.js |
| `prototype/Loquia.dc.html` | artefato validado, intacto | especificação executável de produto e UX |
| `prototype/support.js` | runtime do protótipo | necessário para abrir o HTML |
| `prototype/uploads/pasted-1786414671926-0.png` | imagem do hero | referenciada por caminho relativo |
| `prototype/uploads/pasted-1786474472138-0.png` | imagem da seção de portabilidade | referenciada por caminho relativo |
| `prototype/uploads/pasted-1786474527663-0.png` | fundo do CTA final | referenciada por caminho relativo |
| `prototype/archive/Loquia-v1-memoria-operacional.dc.html` | versão descartada | histórico do reposicionamento |
| `prototype/archive/Loquia-v2-contexto-pronto-para-usar.dc.html` | versão descartada | histórico do reposicionamento |
| `assets/hero-recording.png` | mesma imagem do hero | cópia com nome descritivo, para reuso |
| `assets/portability.png` | mesma imagem da portabilidade | cópia com nome descritivo, para reuso |
| `assets/cta-background.png` | mesmo fundo do CTA | cópia com nome descritivo, para reuso |
| `docs/status-report.md` | handoff | estado atual e plano de integração |
| `docs/routes.md` | handoff | rotas, estados, ações |
| `docs/domain-types.md` | handoff | tipos de domínio |
| `docs/services-adapters.md` | handoff | contratos de services e adapters |
| `docs/ai-pack-spec.md` | handoff | especificação do AI Pack |
| `docs/design-tokens.md` | handoff | tokens de design |
| `docs/component-inventory.md` | handoff | inventário de componentes |
| `docs/test-plan.md` | handoff | plano de testes |
| `docs/migration-checklist.md` | handoff | checklist de migração |
| `docs/brandbook.md` | handoff | marca e voz |
| `docs/decisions.md` | handoff | decisões registradas |

## Notas de integridade

**Protótipo intacto.** `Loquia.dc.html` foi copiado byte a byte, sem minificação, reformatação, remoção de mocks ou alteração de texto.

**Por que `prototype/uploads/` e não só `assets/`.** O protótipo referencia as imagens como `uploads/pasted-*.png` e o runtime como `./support.js`, ambos relativos. Mantê-los ao lado do HTML preserva o comportamento com zero edições no arquivo. As cópias em `assets/` existem para a reconstrução, com nomes legíveis.

**Duas imagens têm cópia dupla** (`prototype/uploads/` e `assets/`). Isso é intencional: uma serve ao protótipo, a outra à aplicação futura. Um quarto arquivo de imagem existia no projeto de design mas foi substituído durante a iteração e não é referenciado — não foi incluído.

**Segredos.** Varredura por chaves de API, tokens, senhas, credenciais AWS e blocos PEM em todos os arquivos de texto: nenhuma ocorrência. A única correspondência do padrão foi o rótulo de interface `confirmPassword: "Confirmar senha"`, que é texto de UI. Nenhum dado pessoal real: todos os nomes, emails e empresas dos dados de demonstração são fictícios.

**Nomes do `archive/`.** As duas versões anteriores foram renomeadas de `Loquia v1 (memória operacional).dc.html` para `Loquia-v1-memoria-operacional.dc.html` (e equivalente para a v2): sem espaços, parênteses ou acentos, para não causar atrito em git, CI e sistemas de arquivos. São arquivos de histórico, não referenciados por nada. O conteúdo é intacto.

**Não incluído de propósito:** capturas de tela de trabalho intermediário e a imagem substituída.
