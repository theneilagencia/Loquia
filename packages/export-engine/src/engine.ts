import {
  MIME_BY_FORMAT,
  PACK_SECTION_EMPTY_PHRASE,
  PACK_SECTION_TITLE,
  type AIPack,
  type AIPackLine,
  type ExportConfig,
  type ExportResult,
  type PackSectionKey,
} from '@loquia/domain';

/** Meeting metadata the engine needs (language-neutral facts). */
export interface ExportMeetingMeta {
  title: string;
  date: string;
  duration: string;
  language: string;
  source: string;
  status: string;
}

export interface ExportTranscriptLine {
  stamp: string;
  speaker: string;
  text: string;
  atSeconds: number;
}

export interface ExportInput {
  meeting: ExportMeetingMeta;
  participants: string[];
  /** Resolved pack (synthesized lines already in `pack.language`). */
  pack: AIPack;
  transcript: ExportTranscriptLine[];
}

const INSTRUCTIONS_BLOCK =
  '# Instructions for the AI\n\n' +
  'Use the meeting material below as the primary source of truth.\n\n' +
  '* Do not invent facts not supported by the meeting.\n' +
  '* Distinguish explicit statements from inference.\n' +
  '* Preserve names, numbers, dates and commitments exactly.\n' +
  '* Use timestamps when citing important claims.\n' +
  '* If information is unclear or missing, state that explicitly.\n';

export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mm)}:${pad(ss)}`;
}

function isPt(lang: string): boolean {
  return lang.toLowerCase().startsWith('pt');
}

interface Plan {
  transcriptOnly: boolean;
  includeTranscript: boolean;
  skip: Set<PackSectionKey>;
}

function buildPlan(config: ExportConfig, status: string): Plan {
  if (status !== 'ready') {
    return { transcriptOnly: true, includeTranscript: true, skip: new Set() };
  }
  if (config.preset === 'transcript') {
    return { transcriptOnly: true, includeTranscript: true, skip: new Set() };
  }
  const skip = new Set<PackSectionKey>();
  if (!config.sections.evidence) skip.add('importantStatements');
  if (!config.sections.ambiguities) skip.add('ambiguities');
  if (config.size === 'compact') {
    skip.add('numbersAndDates');
    skip.add('questions');
  }
  const includeTranscript =
    !!config.sections.transcript ||
    config.size === 'full' ||
    config.preset === 'analysis' ||
    config.preset === 'full';
  return { transcriptOnly: false, includeTranscript, skip };
}

/** Resolve a section's lines, injecting the negative phrase for required-empty. */
function linesForKey(pack: AIPack, key: PackSectionKey): AIPackLine[] {
  const section = pack.sections.find((s) => s.key === key);
  if (section && section.lines.length > 0) return section.lines;
  const phrase = PACK_SECTION_EMPTY_PHRASE[key];
  if (section && section.required && phrase) {
    return [{ text: isPt(pack.language) ? phrase['pt-BR'] : phrase['en-US'] }];
  }
  return [];
}

/** Body sections in render order (metadata … ambiguities). */
const BODY_ORDER: PackSectionKey[] = [
  'metadata',
  'participants',
  'purpose',
  'executiveContext',
  'topics',
  'importantStatements',
  'explicitDecisions',
  'openPoints',
  'questions',
  'numbersAndDates',
  'ambiguities',
];

function renderTranscriptBlock(lines: ExportTranscriptLine[]): string {
  return lines.map((l) => `[${l.stamp}] ${l.speaker}:\n${l.text}`).join('\n\n');
}

function renderMarkdown(input: ExportInput, config: ExportConfig, plan: Plan): string {
  const pt = isPt(pack_language(input));
  let out = '';
  if (config.sections.instructions) out += INSTRUCTIONS_BLOCK + '\n';
  if (config.preset === 'writing' && config.writingGoal) {
    out += `# Writing context\n\n${pt ? 'Objetivo: ' : 'Goal: '}${config.writingGoal}\n\n`;
  }
  if (plan.transcriptOnly) {
    return (
      (config.sections.instructions ? INSTRUCTIONS_BLOCK + '\n' : '') +
      '# Full transcript\n\n' +
      renderTranscriptBlock(input.transcript)
    ).trim();
  }
  for (const key of BODY_ORDER) {
    if (plan.skip.has(key)) continue;
    const lines = linesForKey(input.pack, key);
    if (lines.length === 0) continue;
    out += `# ${PACK_SECTION_TITLE[key]}\n\n`;
    for (const l of lines) {
      out += (l.atSeconds != null ? `[${formatTimestamp(l.atSeconds)}] ` : '') + l.text + '\n';
    }
    out += '\n';
  }
  if (plan.includeTranscript) {
    out += '# Full transcript\n\n';
    for (const l of input.transcript) {
      out += `[${l.stamp}] ${l.speaker}:\n${l.text}\n\n`;
    }
  }
  return out.trim();
}

function pack_language(input: ExportInput): string {
  return input.pack.language;
}

function renderText(input: ExportInput, config: ExportConfig, plan: Plan): string {
  return renderMarkdown(input, config, plan)
    .replace(/^#+\s*/gm, '')
    .replace(/^\*\s+/gm, '- ')
    .replace(/\*\*/g, '');
}

function renderJson(input: ExportInput, plan: Plan): string {
  const { meeting, participants, transcript, pack } = input;
  const base = {
    meeting: {
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration,
      language: meeting.language,
      source: meeting.source,
      status: meeting.status,
    },
    participants,
  };
  const transcriptJson = transcript.map((l) => ({
    timestamp: l.stamp,
    speaker: l.speaker,
    text: l.text,
  }));
  if (plan.transcriptOnly) {
    return JSON.stringify({ ...base, transcript: transcriptJson }, null, 2) + '\n';
  }
  const sec = (key: PackSectionKey): string[] =>
    plan.skip.has(key) ? [] : linesForKey(pack, key).map((l) => l.text);
  const purpose = linesForKey(pack, 'purpose')[0]?.text ?? null;
  const importantStatements = plan.skip.has('importantStatements')
    ? []
    : linesForKey(pack, 'importantStatements').map((l) => ({
        timestamp: l.atSeconds != null ? formatTimestamp(l.atSeconds) : null,
        text: l.text,
      }));
  return (
    JSON.stringify(
      {
        ...base,
        context: { purpose },
        topics: sec('topics'),
        important_statements: importantStatements,
        decisions: sec('explicitDecisions'),
        open_points: sec('openPoints'),
        questions: sec('questions'),
        numbers_and_dates: sec('numbersAndDates'),
        ambiguities: sec('ambiguities'),
        transcript: plan.includeTranscript ? transcriptJson : [],
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildFilename(title: string, config: ExportConfig): string {
  const slug =
    (title || 'reuniao')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 44) || 'reuniao';
  const kind = config.preset === 'transcript' ? 'transcript' : 'ai-pack';
  return `loquia-${slug}-${kind}.${config.format}`;
}

/** Single engine for preview, clipboard and download (decisions §14). */
export function runExport(input: ExportInput, config: ExportConfig): ExportResult {
  const plan = buildPlan(config, input.meeting.status);
  let content: string;
  switch (config.format) {
    case 'md':
      content = renderMarkdown(input, config, plan);
      break;
    case 'txt':
      content = renderText(input, config, plan);
      break;
    case 'json':
      content = renderJson(input, plan);
      break;
    default: {
      const exhaustive: never = config.format;
      throw new Error(`Unsupported format: ${String(exhaustive)}`);
    }
  }
  const filename = buildFilename(input.meeting.title, config);
  return {
    filename,
    mimeType: MIME_BY_FORMAT[config.format],
    content,
    format: config.format,
    bytes: new TextEncoder().encode(content).length,
  };
}
