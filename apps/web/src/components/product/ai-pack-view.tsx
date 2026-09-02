'use client';

import { useTranslations } from 'next-intl';
import {
  PACK_SECTION_EMPTY_PHRASE,
  visibleSections,
  type AIPack,
  type AIPackSection,
} from '@loquia/domain';
import { Badge, Card, CardContent } from '@loquia/ui';
import { TimestampLink } from './timestamp-link';

export function AIPackView({
  pack,
  onSeek,
}: {
  pack: AIPack;
  /** legacy prop kept for callers; language is carried on the pack itself */
  locale?: string;
  onSeek?: (seconds: number) => void;
}) {
  const t = useTranslations('aiPack');
  const sections = visibleSections(pack);
  const isPt = pack.language.toLowerCase().startsWith('pt');

  if (sections.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        // The executive summary leads and is visually the headline of the pack.
        const lead = section.key === 'summary';
        return (
          <Card key={section.key} className={lead ? 'border-iris-line bg-iris-tint/40' : undefined}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-2">
                <h3
                  className={
                    lead
                      ? 'font-mono text-[11px] uppercase tracking-[0.14em] text-iris'
                      : 'font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground'
                  }
                >
                  {section.title}
                </h3>
                {section.confidence === 'inferred' && (
                  <Badge variant="warning" className="text-[10px]">
                    {t('inferred')}
                  </Badge>
                )}
                {section.confidence === 'uncertain' && (
                  <Badge variant="outline" className="text-[10px]">
                    {t('uncertain')}
                  </Badge>
                )}
              </div>
              <SectionBody section={section} isPt={isPt} onSeek={onSeek} lead={lead} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SectionBody({
  section,
  isPt,
  onSeek,
  lead = false,
}: {
  section: AIPackSection;
  isPt: boolean;
  onSeek?: (seconds: number) => void;
  lead?: boolean;
}) {
  if (section.lines.length === 0) {
    const phrase = PACK_SECTION_EMPTY_PHRASE[section.key];
    return (
      <p className="text-sm italic text-muted-foreground">
        {phrase ? (isPt ? phrase['pt-BR'] : phrase['en-US']) : '—'}
      </p>
    );
  }
  // The executive summary reads as prose — larger, no per-line quote clutter.
  if (lead) {
    return (
      <div className="space-y-2">
        {section.lines.map((line, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-ink">
            {line.text}
          </p>
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {section.lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
          {line.atSeconds != null && (
            <TimestampLink seconds={line.atSeconds} onSeek={onSeek} className="mt-0.5 shrink-0" />
          )}
          <span>{line.text}</span>
        </li>
      ))}
    </ul>
  );
}
