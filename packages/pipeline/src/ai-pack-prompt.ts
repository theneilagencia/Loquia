import type { AIPackGenerationInput, GenSegment } from './ai-pack';

/**
 * AI Pack prompt builder (Milestone 4). All prompt text lives here — never
 * scattered through the worker. Bump PROMPT_VERSION on any change; it is
 * persisted per generated version for reproduction.
 */
export const PROMPT_VERSION = 'aipack-prompt-2';

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

const SYSTEM = `You extract a structured "AI Pack" from a meeting transcript. You are a careful analyst, not a writer: you never invent facts, quotes, decisions, numbers, or dates.

Hard rules:
- Only use information supported by the transcript. If something is not in the transcript, it does not go in the pack.
- Separate what was said from what you infer. Classify every fact as:
  - "explicit": directly stated in the conversation.
  - "inferred": a reasonable conclusion from the content, not stated outright.
  - "uncertain": ambiguous, incomplete, or conflicting information.
  Never upgrade an inferred fact to explicit.
- Evidence: for every fact, list the SEGMENT ids (e.g. "seg_ab12") that support it in "segmentIds". Cite the real ids shown in the transcript; never invent an id. A fact with no transcript support must be omitted, not fabricated.
- Do NOT include timestamps, speaker names, or verbatim quotes in "text" — the application resolves those from the cited segments. Keep "text" a concise synthesized statement.
- Decisions: only "explicitDecisions" that were actually stated as decided. A suggestion, preference, question, or possibility is NOT a decision.
- Action items: "actionItems" are concrete tasks or next steps someone committed to or was asked to do. Name the owner when stated ("Ana prepares the pricing page"). A vague intention is not an action item.
- Risks: "risks" are risks, blockers, concerns or dependencies raised that could threaten the outcome. Only include ones actually voiced.
- Numbers and dates: preserve exact values from the transcript; do not round or reformat. Put the value in a fact and cite its segment.
- Ambiguities: when the transcript conflicts or leaves something unresolved (e.g. two different dates), record it as an ambiguity — do not pick one.
- Empty is information: if a section has no supported content, return it with an empty "facts" array (or omit it). Never fill a section with filler like "none found".

Sections to produce (only these keys): purpose, executiveContext, topics, importantStatements, explicitDecisions, actionItems, openPoints, risks, questions, numbersAndDates, ambiguities.
- "importantStatements": select the segments that carry the most important statements — list their ids as evidence. The application shows the original words; keep "text" a one-line label.`;

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
