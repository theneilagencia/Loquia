import {
  nonEmptySections,
  type AIPack,
  type AIPackItem,
  type AIPackSection,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
  type Meeting,
  type Speaker,
  type Transcript,
  type TranscriptSegment,
} from '@loquia/domain';
import { stringsFor, type EngineStrings } from './labels';
import {
  presetBehaviour,
  resolveSections,
  sizeItemCap,
  sizeKeepsInferred,
} from './presets';

export interface ExportInput {
  meeting: Meeting;
  aiPack: AIPack;
  transcript: Transcript;
}

const MIME: Record<ExportFormat, string> = {
  md: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  json: 'application/json;charset=utf-8',
};

export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

/** Speaker display name, honouring rename (falls back to diarization label). */
export function speakerName(speaker: Speaker | undefined): string {
  if (!speaker) return 'Unknown';
  return speaker.displayName?.trim() ? speaker.displayName : speaker.diarizationLabel;
}

function safeFilename(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'meeting'
  );
}

interface ResolvedPlan {
  sections: AIPackSection[];
  includeTranscript: boolean;
  includeEvidence: boolean;
  includeTimestamps: boolean;
  itemCap: number;
  keepInferred: boolean;
}

function plan(input: ExportInput, options: ExportOptions): ResolvedPlan {
  const behaviour = presetBehaviour(options.preset);
  const wantedKeys = new Set(resolveSections(options.preset, options.sections));
  const available = nonEmptySections(input.aiPack).filter((s) => wantedKeys.has(s.key));
  const keepInferred = sizeKeepsInferred(options.size);
  const itemCap = sizeItemCap(options.size);

  const sections = available
    .map((section) => trimSection(section, itemCap, keepInferred))
    .filter((s) => s.items.length > 0);

  return {
    sections,
    includeTranscript: options.includeTranscript ?? behaviour.includeTranscript,
    includeEvidence: options.includeEvidence ?? behaviour.includeEvidence,
    includeTimestamps: options.includeTimestamps ?? behaviour.includeTimestamps,
    itemCap,
    keepInferred,
  };
}

function trimSection(
  section: AIPackSection,
  itemCap: number,
  keepInferred: boolean,
): AIPackSection {
  let items = section.items;
  if (!keepInferred) {
    items = items.filter((i) => i.origin === 'explicit');
  }
  // Highest confidence first, stable for equal confidence.
  items = [...items].sort((a, b) => b.confidence - a.confidence);
  if (Number.isFinite(itemCap)) {
    items = items.slice(0, itemCap);
  }
  return { key: section.key, items };
}

function speakerMap(transcript: Transcript): Map<string, Speaker> {
  return new Map(transcript.speakers.map((s) => [s.id, s]));
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

function renderItemMd(
  item: AIPackItem,
  strings: EngineStrings,
  includeEvidence: boolean,
): string {
  const tags: string[] = [];
  if (item.origin === 'inferred') tags.push(`_${strings.inferred}_`);
  if (item.uncertain) tags.push(`_${strings.uncertain}_`);
  const meta: string[] = [];
  if (item.assignee) meta.push(`${strings.assignee}: ${item.assignee}`);
  if (item.dueLabel) meta.push(`${strings.due}: ${item.dueLabel}`);

  let line = `- ${item.text}`;
  if (tags.length) line += ` (${tags.join(', ')})`;
  const lines = [line];
  if (meta.length) lines.push(`  - ${meta.join(' · ')}`);
  if (includeEvidence) {
    for (const ev of item.evidence) {
      lines.push(`  - ${strings.evidence} [${formatTimestamp(ev.startSeconds)}]: "${ev.quote}"`);
    }
  }
  return lines.join('\n');
}

function renderMarkdown(input: ExportInput, options: ExportOptions, p: ResolvedPlan): string {
  const s = stringsFor(options.language);
  const out: string[] = [];
  out.push(`# ${input.meeting.title}`);
  out.push('');
  out.push(`> ${s.language}: ${options.language} · ${s.generatedAt}: ${input.aiPack.generatedAt}`);
  out.push('');

  if (p.sections.length > 0) {
    out.push(`## ${s.aiPack}`);
    out.push('');
    for (const section of p.sections) {
      out.push(`### ${s.sections[section.key]}`);
      out.push('');
      for (const item of section.items) {
        out.push(renderItemMd(item, s, p.includeEvidence));
      }
      out.push('');
    }
  }

  if (p.includeTranscript) {
    const speakers = speakerMap(input.transcript);
    out.push(`## ${s.transcript}`);
    out.push('');
    for (const seg of input.transcript.segments) {
      out.push(renderSegmentLine(seg, speakers.get(seg.speakerId), p.includeTimestamps));
    }
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function renderSegmentLine(
  seg: TranscriptSegment,
  speaker: Speaker | undefined,
  includeTimestamps: boolean,
): string {
  const name = speakerName(speaker);
  const ts = includeTimestamps ? `[${formatTimestamp(seg.startSeconds)}] ` : '';
  return `${ts}**${name}:** ${seg.text}`;
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

function renderText(input: ExportInput, options: ExportOptions, p: ResolvedPlan): string {
  const s = stringsFor(options.language);
  const out: string[] = [];
  out.push(input.meeting.title.toUpperCase());
  out.push(`${s.language}: ${options.language}`);
  out.push('');

  if (p.sections.length > 0) {
    out.push(s.aiPack.toUpperCase());
    out.push('');
    for (const section of p.sections) {
      out.push(`${s.sections[section.key]}`);
      for (const item of section.items) {
        const tag =
          item.origin === 'inferred' || item.uncertain
            ? ` (${[item.origin === 'inferred' ? s.inferred : '', item.uncertain ? s.uncertain : '']
                .filter(Boolean)
                .join(', ')})`
            : '';
        out.push(`  - ${item.text}${tag}`);
        if (p.includeEvidence) {
          for (const ev of item.evidence) {
            out.push(`      ${s.evidence} [${formatTimestamp(ev.startSeconds)}]: "${ev.quote}"`);
          }
        }
      }
      out.push('');
    }
  }

  if (p.includeTranscript) {
    const speakers = speakerMap(input.transcript);
    out.push(s.transcript.toUpperCase());
    out.push('');
    for (const seg of input.transcript.segments) {
      const name = speakerName(speakers.get(seg.speakerId));
      const ts = p.includeTimestamps ? `[${formatTimestamp(seg.startSeconds)}] ` : '';
      out.push(`${ts}${name}: ${seg.text}`);
    }
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

function renderJson(input: ExportInput, options: ExportOptions, p: ResolvedPlan): string {
  const speakers = speakerMap(input.transcript);
  const payload = {
    meeting: {
      id: input.meeting.id,
      title: input.meeting.title,
      meetingLanguage: input.meeting.meetingLanguage,
      durationSeconds: input.meeting.durationSeconds,
    },
    export: {
      preset: options.preset,
      size: options.size,
      language: options.language,
      generatedAt: input.aiPack.generatedAt,
    },
    aiPack: p.sections.map((section) => ({
      key: section.key,
      items: section.items.map((item) => ({
        text: item.text,
        origin: item.origin,
        confidence: item.confidence,
        uncertain: item.uncertain,
        assignee: item.assignee ?? null,
        dueLabel: item.dueLabel ?? null,
        evidence: p.includeEvidence
          ? item.evidence.map((ev) => ({
              segmentId: ev.segmentId,
              startSeconds: ev.startSeconds,
              language: ev.language,
              quote: ev.quote,
            }))
          : [],
      })),
    })),
    transcript: p.includeTranscript
      ? {
          language: input.transcript.language,
          segments: input.transcript.segments.map((seg) => ({
            id: seg.id,
            speaker: speakerName(speakers.get(seg.speakerId)),
            startSeconds: seg.startSeconds,
            endSeconds: seg.endSeconds,
            text: seg.text,
            language: seg.language,
          })),
        }
      : null,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The single ExportEngine used for preview, clipboard and download (spec §31).
 * Pure and deterministic: same input + options ⇒ same output.
 */
export function runExport(input: ExportInput, options: ExportOptions): ExportResult {
  const p = plan(input, options);
  let content: string;
  switch (options.format) {
    case 'md':
      content = renderMarkdown(input, options, p);
      break;
    case 'txt':
      content = renderText(input, options, p);
      break;
    case 'json':
      content = renderJson(input, options, p);
      break;
    default: {
      const exhaustive: never = options.format;
      throw new Error(`Unsupported format: ${String(exhaustive)}`);
    }
  }

  const base = safeFilename(input.meeting.title);
  const filename = `${base}-${options.preset}-${options.size}.${options.format}`;
  return {
    filename,
    mimeType: MIME[options.format],
    content,
    format: options.format,
    bytes: new TextEncoder().encode(content).length,
  };
}
