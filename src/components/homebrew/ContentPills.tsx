import { Rune } from '@/components/ordo';

interface ContentPillsProps {
  items?: number;
  classes?: number;
  skills?: number;
  feats?: number;
  compact?: boolean;
}

export function ContentPills({ items = 0, classes = 0, skills = 0, feats = 0, compact = false }: ContentPillsProps) {
  const data = [
    { label: 'Items',   v: items,   g: 'sword' },
    { label: 'Classes', v: classes, g: 'helm' },
    { label: 'Skills',  v: skills,  g: 'eye' },
    { label: 'Feats',   v: feats,   g: 'sigil-3' },
  ];

  return (
    <div style={{ display: 'flex', gap: compact ? 6 : 8, flexWrap: 'wrap' }}>
      {data.map((d) => (
        <div key={d.label} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: compact ? '3px 8px' : '5px 10px',
          background: 'var(--abyss)',
          border: '1px solid var(--hairline)',
        }}>
          <Rune kind={d.g} size={compact ? 9 : 11} color={d.v ? 'var(--gold-pale)' : 'var(--ink-ghost)'} />
          <span className="ao-num" style={{ fontSize: compact ? 11 : 12, color: d.v ? 'var(--ink-bright)' : 'var(--ink-ghost)' }}>{d.v}</span>
          <span className="ao-codex" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
