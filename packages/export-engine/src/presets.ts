import {
  AI_PACK_SECTION_KEYS,
  type AIPackSectionKey,
  type ExportPreset,
  type ExportSize,
} from '@loquia/domain';

/** Which AI Pack sections each preset emits (before size trimming). */
const PRESET_SECTIONS: Record<Exclude<ExportPreset, 'custom'>, AIPackSectionKey[]> = {
  ai_pack: [...AI_PACK_SECTION_KEYS],
  clean_transcript: [],
  analysis: [
    'overview',
    'key_points',
    'decisions',
    'risks',
    'open_questions',
    'metrics',
    'sentiment',
  ],
  writing: ['overview', 'agenda', 'key_points', 'next_steps'],
  full_fidelity: [...AI_PACK_SECTION_KEYS],
};

export function resolveSections(
  preset: ExportPreset,
  custom?: AIPackSectionKey[],
): AIPackSectionKey[] {
  if (preset === 'custom') {
    // Preserve canonical order regardless of selection order.
    const selected = new Set(custom ?? []);
    return AI_PACK_SECTION_KEYS.filter((k) => selected.has(k));
  }
  return PRESET_SECTIONS[preset];
}

export interface PresetBehaviour {
  includeTranscript: boolean;
  includeEvidence: boolean;
  includeTimestamps: boolean;
}

/** Default content toggles per preset (options can override). */
export function presetBehaviour(preset: ExportPreset): PresetBehaviour {
  switch (preset) {
    case 'clean_transcript':
      return { includeTranscript: true, includeEvidence: false, includeTimestamps: false };
    case 'full_fidelity':
      return { includeTranscript: true, includeEvidence: true, includeTimestamps: true };
    case 'analysis':
      return { includeTranscript: false, includeEvidence: true, includeTimestamps: false };
    case 'writing':
      return { includeTranscript: false, includeEvidence: false, includeTimestamps: false };
    case 'ai_pack':
      return { includeTranscript: false, includeEvidence: true, includeTimestamps: false };
    case 'custom':
    default:
      return { includeTranscript: false, includeEvidence: false, includeTimestamps: false };
  }
}

/** Max items rendered per section for a given size. `Infinity` = no cap. */
export function sizeItemCap(size: ExportSize): number {
  switch (size) {
    case 'compact':
      return 3;
    case 'standard':
      return 8;
    case 'full':
    default:
      return Number.POSITIVE_INFINITY;
  }
}

/** Whether a size keeps low-confidence / inferred items. */
export function sizeKeepsInferred(size: ExportSize): boolean {
  return size !== 'compact';
}
