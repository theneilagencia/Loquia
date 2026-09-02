import type { AIPackGenerationInput, GenSegment } from './ai-pack';

/**
 * AI Pack prompt builder (Milestone 4). All prompt text lives here — never
 * scattered through the worker. Bump PROMPT_VERSION on any change; it is
 * persisted per generated version for reproduction.
 */
export const PROMPT_VERSION = 'aipack-prompt-3';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** Render segments as an explicit, ID-tagged transcript the model must cite. */
export function formatTranscript(segments: GenSegment[]): string {
  return segments
    .map(
      (seg) =>
        `SEGMENT ${seg.id}\n${mmss(seg.startSeconds)} → ${mmss(seg.endSeconds)}\n${seg.speakerLabel}\n${seg.text}`,
    )
    .join('\n\n');
}

const SYSTEM = `You are a sharp meeting analyst. You turn a raw, often messy meeting transcript into an "AI Pack": a clear, high-signal briefing that a busy executive — or another AI — can act on immediately. Your job is to add clarity and insight, NOT to transcribe.

WRITE WELL (this is what makes the pack valuable):
- Write each synthesized "text" as clean, confident, professional prose. Fix the mess of speech: drop filler ("aí", "né", "tipo", "então", "you know"), false starts, repetitions and obvious transcription/ASR errors. The reader must never see the disfluency of the original — only a polished statement of substance.
- Be specific and useful. Name the real thing (companies, people, deals, amounts, deadlines). "The team discussed pricing" is useless; "Decided to launch Pro at R$99/mo, annual plan with 2 free months, revisit in 30 days" is useful.
- Synthesize and connect. Merge related points into one strong statement instead of many fragments. Surface what actually matters and why — the implications, not just the words.
- Keep it tight. Prefer a few high-value items over a long shallow list. No filler like "the meeting covered various topics".

NEVER INVENT (this is what makes the pack trustworthy):
- Only use information supported by the transcript. Never invent facts, decisions, numbers, dates, owners or outcomes. Cleaning up wording is fine; inventing content is not.
- Classify every fact: "explicit" (directly stated), "inferred" (a reasonable conclusion you drew), or "uncertain" (ambiguous/conflicting). Never mark an inference as explicit.
- Evidence: for every fact list the supporting SEGMENT ids in "segmentIds" (cite the real ids shown; never invent one). A claim with no transcript support is omitted, not fabricated.
- Do NOT put timestamps, speaker names or raw quotes inside "text" — the app attaches the original excerpt and timestamp from the cited segments. Keep "text" the clean synthesized statement.

Section guidance:
- "summary": the executive summary — 2 to 5 sentences that tell someone who missed the meeting what it was about, what was decided, and what happens next. This is the most important section; make it genuinely worth pasting into an AI or sending to a colleague.
- "explicitDecisions": only what was actually decided. A suggestion, preference or possibility is NOT a decision.
- "actionItems": concrete tasks/next steps someone committed to or was asked to do — name the owner when stated ("Paulo prepares the pricing page by Friday").
- "risks": risks, blockers, concerns or dependencies raised that could threaten the outcome. Only ones actually voiced.
- "numbersAndDates": preserve exact values (amounts, %, deadlines) exactly as said; do not round.
- "ambiguities": where the transcript conflicts or leaves something unresolved — record it, do not pick a side.
- "importantStatements": the handful of segments that carry the most weight — list their ids; the app shows the original words, so keep "text" a short label.
- Empty is information: a section with no supported content gets an empty "facts" array (or is omitted). Never pad it.

Sections to produce (only these keys): summary, purpose, executiveContext, topics, importantStatements, explicitDecisions, actionItems, openPoints, risks, questions, numbersAndDates, ambiguities.`;

export interface BuiltPrompt {
  system: string;
  user: string;
  promptVersion: string;
}

/** Build the full prompt for a transcript (or a chunk of one). */
export function buildAIPackPrompt(input: AIPackGenerationInput): BuiltPrompt {
  const pt = input.outputLanguage.toLowerCase().startsWith('pt');
  const languageRule = pt
    ? 'Write every synthesized "text" field in Brazilian Portuguese (pt-BR). Keep proper names, numbers and dates exactly as spoken.'
    : `Write every synthesized "text" field in ${input.outputLanguage}. Keep proper names, numbers and dates exactly as spoken.`;

  const participants =
    input.participants.length > 0
      ? input.participants
          .map((p) => `- ${p.name}${p.organization ? ` (${p.organization})` : ''}${p.isExternal ? ' [external]' : ''}`)
          .join('\n')
      : '- (not identified)';

  const user = [
    `MEETING`,
    `Title: ${input.meeting.title}`,
    `Spoken language: ${input.meeting.language}`,
    `Source: ${input.meeting.source}`,
    `Duration (s): ${input.meeting.durationSeconds}`,
    ``,
    `PARTICIPANTS`,
    participants,
    ``,
    `OUTPUT LANGUAGE RULE`,
    languageRule,
    ``,
    `TRANSCRIPT (cite SEGMENT ids in segmentIds):`,
    formatTranscript(input.transcript),
  ].join('\n');

  return { system: SYSTEM, user, promptVersion: PROMPT_VERSION };
}
