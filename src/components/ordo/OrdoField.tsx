import type { ReactNode } from 'react';

interface OrdoFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  count?: string;
  children: ReactNode;
}

export function OrdoField({
  label,
  required,
  hint,
  count,
  children,
}: OrdoFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label className="ao-label" style={{ marginBottom: 0 }}>
          {label}
          {required && (
            <span style={{ color: 'var(--ember)', marginLeft: 4 }}>*</span>
          )}
        </label>
        {count && (
          <span className="ao-codex">{count}</span>
        )}
      </div>
      {children}
      {hint && (
        <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}
