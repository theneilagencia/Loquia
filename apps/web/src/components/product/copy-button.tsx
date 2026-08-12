'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, type ButtonProps } from '@loquia/ui';

export function CopyButton({
  onCopy,
  children,
  ...props
}: ButtonProps & { onCopy: () => Promise<void> | void }) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  async function handle() {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" onClick={handle} {...props}>
      {copied ? <Check className="text-success" /> : <Copy />}
      {children ?? (copied ? t('copied') : t('copy'))}
    </Button>
  );
}
