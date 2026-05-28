import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  block = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [
    'ao-btn',
    variant !== 'default' && `ao-btn--${variant}`,
    size !== 'md' && `ao-btn--${size}`,
    block && 'ao-btn--block',
    disabled && 'ao-btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} disabled={disabled} {...rest}>
      {icon}
      {children}
    </button>
  );
}
