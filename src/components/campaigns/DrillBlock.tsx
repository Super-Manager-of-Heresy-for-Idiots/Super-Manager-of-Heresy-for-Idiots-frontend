import { Rune } from '@/components/ordo';
import { useNavigate } from 'react-router-dom';

interface DrillBlockProps {
  label: string;
  glyph: string;
  count?: number;
  to: string;
}

export function DrillBlock({ label, glyph, count, to }: DrillBlockProps) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav(to)}
      className="ao-panel"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', cursor: 'pointer',
        border: '1px solid var(--hairline)', background: 'var(--panel)',
        textAlign: 'left', width: '100%',
      }}
    >
      <div style={{
        width: 38, height: 38, border: '1px solid var(--rule)',
        background: 'var(--abyss)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Rune kind={glyph} size={18} color="var(--ink-quiet)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--ink-bright)', fontSize: 14 }}>{label}</div>
        {count != null && <div className="ao-codex" style={{ marginTop: 2 }}>{count} entries</div>}
      </div>
      <Rune kind="chev-r" size={14} color="var(--ink-faint)" />
    </button>
  );
}
