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
    <div className="ao-field">
      <div className="ao-field-top">
        <label className="ao-label">
          {label}
          {required && <span className="ao-field-req">*</span>}
        </label>
        {count && <span className="ao-codex">{count}</span>}
      </div>
      {children}
      {hint && <span className="ao-codex ao-field-hint">{hint}</span>}
    </div>
  );
}
