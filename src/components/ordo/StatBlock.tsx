interface StatBlockProps {
  label: string;
  value: number;
  mod: number;
}

export function StatBlock({ label, value, mod }: StatBlockProps) {
  return (
    <div className="ao-stat ao-statblock">
      <div className="ao-overline ao-statblock-label">{label}</div>
      <div className="ao-stat-value">{value}</div>
      <div className={`ao-codex ao-statblock-mod${mod >= 0 ? '' : ' is-neg'}`}>
        {mod >= 0 ? `+${mod}` : mod}
      </div>
    </div>
  );
}
