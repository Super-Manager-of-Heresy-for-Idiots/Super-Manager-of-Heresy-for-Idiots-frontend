interface StatBlockProps {
  label: string;
  value: number;
  mod: number;
}

export function StatBlock({ label, value, mod }: StatBlockProps) {
  return (
    <div className="ao-stat" style={{ textAlign: 'center' }}>
      <div className="ao-overline" style={{ marginBottom: 4 }}>{label}</div>
      <div className="ao-stat-value">{value}</div>
      <div
        className="ao-codex"
        style={{ color: mod >= 0 ? 'var(--ink-quiet)' : '#d8896a', marginTop: 2 }}
      >
        {mod >= 0 ? `+${mod}` : mod}
      </div>
    </div>
  );
}
