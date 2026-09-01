'use client';

import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { PACK_SECTION_TITLE } from '@loquia/domain';
import { Card, CardContent, Skeleton } from '@loquia/ui';

/**
 * The "generating" state for the AI Pack tab — shown while a job is queued or
 * running and no pack exists yet. Communicates clearly WHAT is happening (the
 * conversation is being analyzed into decisions, topics, numbers with evidence)
 * and that longer meetings take a little longer, with animated section skeletons
 * so the wait reads as intentional rather than stuck.
 */
export function AiPackGenerating() {
  const t = useTranslations('aiPack');
  const previews = [
    PACK_SECTION_TITLE.purpose,
    PACK_SECTION_TITLE.explicitDecisions,
    PACK_SECTION_TITLE.numbersAndDates,
  ];
  return (
    <Card className="border-iris-line bg-iris-tint/40">
      <CardContent className="space-y-6 py-9">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="relative flex size-12 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-iris/20" />
            <span className="relative flex size-12 items-center justify-center rounded-full bg-iris/10">
              <Sparkles className="size-6 animate-loq-pulse text-iris" />
            </span>
          </span>
          <div className="space-y-1.5">
            <p className="text-[15.5px] font-bold text-ink">{t('generating')}</p>
            <p className="mx-auto max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              {t('generatingHint')}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-md gap-2">
          {previews.map((label, i) => (
            <div
              key={i}
              className="space-y-2 rounded-xl border border-border/70 bg-surface p-3.5"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="size-1.5 animate-loq-pulse rounded-full bg-iris" style={{ animationDelay: `${i * 150}ms` }} />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {label}
                </span>
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-4/5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
