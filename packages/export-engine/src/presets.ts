import type { ExportSections, PackSize, PresetId } from '@loquia/domain';

/** Default optional-block toggles for a base preset. */
export function defaultSections(preset: PresetId): ExportSections {
  switch (preset) {
    case 'transcript':
      return { instructions: false, transcript: true, evidence: false, ambiguities: false };
    case 'analysis':
      return { instructions: true, transcript: true, evidence: true, ambiguities: true };
    case 'writing':
      return { instructions: true, transcript: false, evidence: true, ambiguities: true };
    case 'full':
      return { instructions: true, transcript: true, evidence: true, ambiguities: true };
    case 'ai':
    default:
      return { instructions: false, transcript: false, evidence: true, ambiguities: true };
  }
}

/** Default size for a base preset. */
export function defaultSize(preset: PresetId): PackSize {
  if (preset === 'full' || preset === 'analysis') return 'full';
  if (preset === 'transcript') return 'standard';
  return 'standard';
}
