'use client';

import { useTranslations } from 'next-intl';
import { Recorder } from '@/components/product/recorder';

export default function RecordPage() {
  const t = useTranslations('recorder');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Recorder />
    </div>
  );
}
