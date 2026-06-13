import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './Downloads.module.css';

interface DownloadsProps {
  value: number;
}

export function Downloads({ value }: DownloadsProps) {
  const t = useT();
  return (
    <span className={s.wrap}>
      <Rune kind="arrow-up" size={11} color="var(--bronze)" />
      <span className={cn('ao-num', s.num)}>{value.toLocaleString()}</span>
      <span className={cn('ao-overline', s.label)}>{t('cmp2.downloads.instated')}</span>
    </span>
  );
}
