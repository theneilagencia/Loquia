'use client';

import { useTranslations } from 'next-intl';
import { Recorder } from '@/components/product/recorder';

export default function RecordPage() {
  const t = useTranslations('recorder');
  return (
    <div className="max-w-[760px] space-y-6">
      <h1 className="text-[clamp(26px,2.9vw,34px)] font-extrabold tracking-[-0.03em]">
        {t('title')}
      </h1>
      <Recorder />
    </div>
  );
}
