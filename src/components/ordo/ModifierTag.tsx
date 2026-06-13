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
      className={`ao-modtag ${positive ? 'is-pos' : 'is-neg'}${sm ? ' ao-modtag--sm' : ''}`}
    >
      <Rune kind={positive ? 'arrow-up' : 'minus'} size={sm ? 7 : 8} color={color} />
      <span>{stat}</span>
      <span className="ao-modtag-value">{positive ? `+${value}` : value}</span>
    </span>
  );
}
