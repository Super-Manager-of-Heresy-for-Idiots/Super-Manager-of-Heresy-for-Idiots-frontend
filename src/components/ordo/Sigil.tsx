import { Rune } from './Rune';

interface SigilProps {
  size?: number;
  glyph?: string;
  color?: string;
}

export function Sigil({
  size = 64,
  glyph = 'sigil-1',
  color = 'var(--gold)',
}: SigilProps) {
  return (
    <div
      className="ao-seal"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
    >
      <Rune kind={glyph} size={size * 0.5} color={color} />
    </div>
  );
}
