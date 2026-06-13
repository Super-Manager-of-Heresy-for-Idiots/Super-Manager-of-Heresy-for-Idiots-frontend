import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './ReadOnlyOverlay.module.css';

interface ReadOnlyOverlayProps {
  status: string;
  characterName?: string;
}

const STATUS_DESCRIPTION_KEYS: Record<string, string> = {
  DEAD: 'cmp.readonly.dead',
  RESERVE: 'cmp.readonly.reserve',
};

export function ReadOnlyOverlay({ status, characterName }: ReadOnlyOverlayProps) {
  const t = useT();
  const isDead = status === 'DEAD';
  const tint = isDead ? 'rgba(176,106,106,0.12)' : 'rgba(90,90,90,0.10)';
  const description = t(
    STATUS_DESCRIPTION_KEYS[status] ?? 'cmp.readonly.default',
  );

  return (
    <div
      className={cn(s.overlay, isDead && s.dead)}
      style={{ '--ov-tint': tint } as CSSProperties}
    >
      <div className={s.lockbox}>
        <Rune kind="lock" size={32} color={isDead ? '#b06a6a' : 'var(--ink-faint)'} />
      </div>

      <CharStatusBadge status={status} />

      {characterName && <div className={s.name}>{characterName}</div>}

      <div className={s.desc}>{description}</div>
    </div>
  );
}
