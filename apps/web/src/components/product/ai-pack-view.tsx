'use client';

import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';
import { nonEmptySections, type AIPack, type AIPackSectionKey } from '@loquia/domain';
import { Badge, Card, CardContent } from '@loquia/ui';
import { TimestampLink } from './timestamp-link';

const SECTION_TITLE: Record<AIPackSectionKey, { pt: string; en: string }> = {
  overview: { pt: 'Resumo executivo', en: 'Overview' },
  participants: { pt: 'Participantes', en: 'Participants' },
  agenda: { pt: 'Pauta', en: 'Agenda' },
  key_points: { pt: 'Pontos-chave', en: 'Key points' },
  decisions: { pt: 'Decisões', en: 'Decisions' },
  action_items: { pt: 'Ações', en: 'Action items' },
  open_questions: { pt: 'Perguntas em aberto', en: 'Open questions' },
  risks: { pt: 'Riscos', en: 'Risks' },
  commitments: { pt: 'Compromissos', en: 'Commitments' },
  metrics: { pt: 'Números e métricas', en: 'Metrics' },
  references: { pt: 'Referências', en: 'References' },
  sentiment: { pt: 'Clima da reunião', en: 'Sentiment' },
  glossary: { pt: 'Glossário', en: 'Glossary' },
  next_steps: { pt: 'Próximos passos', en: 'Next steps' },
};

export function AIPackView({
  pack,
  locale,
  onSeek,
}: {
  pack: AIPack;
  locale: string;
  onSeek?: (seconds: number) => void;
}) {
  const t = useTranslations('aiPack');
  const isPt = locale.startsWith('pt');
  const sections = nonEmptySections(pack);

  if (sections.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isPt ? SECTION_TITLE[section.key].pt : SECTION_TITLE[section.key].en}
            </h3>
            <ul className="space-y-4">
              {section.items.map((item) => (
                <li key={item.id} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm leading-relaxed">{item.text}</p>
                    <div className="flex shrink-0 gap-1">
                      {item.origin === 'inferred' && (
                        <Badge variant="warning" className="text-[10px]">
                          {t('inferred')}
                        </Badge>
                      )}
                      {item.uncertain && (
                        <Badge variant="outline" className="text-[10px]">
                          {t('uncertain')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {(item.assignee || item.dueLabel) && (
                    <p className="text-xs text-muted-foreground">
                      {[item.assignee, item.dueLabel].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {item.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2 text-xs"
                    >
                      <Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                      {/* Evidence keeps its ORIGINAL language, never translated. */}
                      <span className="flex-1 italic text-muted-foreground">{ev.quote}</span>
                      <TimestampLink seconds={ev.startSeconds} onSeek={onSeek} />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
