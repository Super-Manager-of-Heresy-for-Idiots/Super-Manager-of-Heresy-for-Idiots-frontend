import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface DownloadsProps {
  value: number;
}

export function Downloads({ value }: DownloadsProps) {
  const t = useT();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-quiet)' }}>
      <Rune kind="arrow-up" size={11} color="var(--bronze)" />
      <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>{value.toLocaleString()}</span>
      <span className="ao-overline" style={{ fontSize: 9 }}>{t('cmp2.downloads.instated')}</span>
    </span>
  );
}
