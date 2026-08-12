'use client';

import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Speaker } from '@loquia/domain';
import { Button, Input, cn } from '@loquia/ui';

export function SpeakerRename({
  speaker,
  onRename,
}: {
  speaker: Speaker;
  onRename: (displayName: string) => Promise<void> | void;
}) {
  const t = useTranslations('transcript');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(speaker.displayName ?? '');
  const name = speaker.displayName?.trim() ? speaker.displayName : speaker.diarizationLabel;

  async function save() {
    await onRename(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('renamePlaceholder')}
          className="h-7 w-32"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
        <Button size="icon" variant="ghost" className="size-7" aria-label={t('save')} onClick={() => void save()}>
          <Check className="size-3.5 text-success" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7" aria-label="cancel" onClick={() => setEditing(false)}>
          <X className="size-3.5" />
        </Button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(speaker.displayName ?? '');
        setEditing(true);
      }}
      className={cn('group inline-flex items-center gap-1 font-medium hover:text-primary')}
      style={{ color: speaker.color }}
      aria-label={t('rename')}
    >
      {name}
      <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
