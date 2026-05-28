import React from 'react';

/* ── Label ── */

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required, className = '', ...rest }: LabelProps) {
  return (
    <label className={`ao-label ${className}`} {...rest}>
      {children}
      {required && <span className="ao-label__required">*</span>}
    </label>
  );
}

/* ── Input ── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...rest }, ref) => {
    return (
      <div className="ao-field">
        <input
          ref={ref}
          className={`ao-input ${error ? 'ao-input--error' : ''} ${className}`}
          {...rest}
        />
        {error && <div className="ao-error">{error}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ── Textarea ── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...rest }, ref) => {
    return (
      <div className="ao-field">
        <textarea
          ref={ref}
          className={`ao-textarea ${error ? 'ao-textarea--error' : ''} ${className}`}
          {...rest}
        />
        {error && <div className="ao-error">{error}</div>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/* ── Select ── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, children, className = '', ...rest }, ref) => {
    return (
      <div className="ao-field">
        <select
          ref={ref}
          className={`ao-select ${error ? 'ao-select--error' : ''} ${className}`}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <div className="ao-error">{error}</div>}
      </div>
    );
  }
);

Select.displayName = 'Select';
