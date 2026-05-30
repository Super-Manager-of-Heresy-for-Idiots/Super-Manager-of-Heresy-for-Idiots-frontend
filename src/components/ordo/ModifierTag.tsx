import { Rune } from './Rune';

interface ModifierTagProps {
  stat: string;
  value: number;
  size?: 'sm' | 'md';
}

export function ModifierTag({ stat, value, size = 'md' }: ModifierTagProps) {
  const positive = value >= 0;
  const color = positive ? '#7a9866' : '#d8896a';
  const sm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sm ? 4 : 5,
        padding: sm ? '2px 6px' : '2px 7px',
        background: positive ? 'rgba(122,152,102,0.08)' : 'rgba(179,70,26,0.08)',
        border: `1px solid ${color}55`,
        fontFamily: 'var(--font-mono)',
        fontSize: sm ? 10 : 11,
        color,
      }}
    >
      <Rune kind={positive ? 'arrow-up' : 'minus'} size={sm ? 7 : 8} color={color} />
      <span>{stat}</span>
      <span style={{ fontWeight: 600 }}>{positive ? `+${value}` : value}</span>
    </span>
  );
}
