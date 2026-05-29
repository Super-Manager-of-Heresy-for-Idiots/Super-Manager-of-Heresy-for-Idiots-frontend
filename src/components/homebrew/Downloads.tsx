import { Rune } from '@/components/ordo';

interface DownloadsProps {
  value: number;
}

export function Downloads({ value }: DownloadsProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-quiet)' }}>
      <Rune kind="arrow-up" size={11} color="var(--bronze)" />
      <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>{value.toLocaleString()}</span>
      <span className="ao-overline" style={{ fontSize: 9 }}>instated</span>
    </span>
  );
}
