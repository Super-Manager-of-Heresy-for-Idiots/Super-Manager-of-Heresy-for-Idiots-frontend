import type { CSSProperties } from 'react';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './VersionSeal.module.css';

interface VersionSealProps {
  version: number | string;
  size?: number;
}

export function VersionSeal({ version, size = 44 }: VersionSealProps) {
  const t = useT();
  return (
    <div className={s.seal} style={{ '--seal': `${size}px` } as CSSProperties}>
      <div className={s.hexOuter} />
      <div className={s.hexInner} />
      <div className={s.center}>
        <div className={cn('ao-codex', s.ver)}>{t('cmp2.versionSeal.ver')}</div>
        <div className={s.num}>{version}</div>
      </div>
    </div>
  );
}
