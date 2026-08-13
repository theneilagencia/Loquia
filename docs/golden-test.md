# Golden Transcript & AI Pack Integrity

A deterministic, generator-agnostic gate that proves the AI Pack's factual
integrity guarantees hold — without any external credentials.

## Fixtures

- `tests/fixtures/golden-meeting.json` — a fixed pt-BR meeting: 8 segments
  (`seg_a1..seg_a8`), 3 participants (one external). It deliberately contains a
  clear **decision** (seg_a2), a **suggestion that is not a decision** (seg_a3),
  a **hypothesis** (seg_a4), an **uncertain** statement with two competing
  numbers `R$ 120 mil ou R$ 150 mil` (seg_a5), an **open question** (seg_a6), an
  **opinion change** with a second date (seg_a7), and an **objection** (seg_a8).
- `tests/fixtures/golden-meeting.expected.json` — invariants: all evidence
  references valid, exactly one decision, `numbersPreserved: ["120","150"]`,
  dates preserved, cross-language behavior.

## Integrity evaluator

`packages/pipeline/src/ai-pack-integrity.ts` →
`evaluateAIPackIntegrity(source, segments)` validates a **persisted** pack
against the transcript segments, independent of which generator produced it:

- `evidenceReferenceValidity` — fraction of evidence refs that resolve to a real
  segment id (1 = all valid).
- `timestampsDerived` / `excerptsDerived` — timestamps and excerpts come from the
  segments, not from the model's free text.
- `unsupportedCriticalClaims` — evidence-requiring sections
  (`importantStatements`, `evidence`) whose refs don't resolve.
- `invalidRefs` — the offending `{ segmentId }` list.

## Tests (`packages/pipeline/src/golden.test.ts`, 5 tests)

1. Every evidence reference resolves; timestamps/excerpts derive from segments;
   no dropped facts.
2. Decision detected (seg_a2); the suggestion (seg_a3) is **not** cited as a
   decision; the open question (seg_a6) is kept.
3. Numbers (`120`, `150`) and dates (`12 de março` / `20 de março`) are preserved
   verbatim in the pack.
4. Cross-language: `en-US` output keeps the original pt-BR evidence, numbers and
   dates (evidence excerpts stay in the spoken language).
5. **Adversarial**: a tampered pack citing a hallucinated `seg_does_not_exist` is
   flagged — `evidenceReferenceValidity < 1`, `unsupportedCriticalClaims = 1`.
   This guards the checker itself against silently passing.

The suite runs on the deterministic `MockAIPackGenerator` (derived from real
segments) so it is stable in CI with no credentials, while asserting the same
evidence-anchoring guarantees a real provider must satisfy.

Run: `pnpm --filter @loquia/pipeline test` (golden tests are 5 of the 23).
