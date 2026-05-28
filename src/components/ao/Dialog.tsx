import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Rune } from './Rune';
import { Button } from './Button';

/* ── Dialog ── */

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  width?: number | string;
}

export function Dialog({
  open,
  onClose,
  children,
  title,
  className = '',
  width = 480,
}: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="ao-dialog-overlay" onClick={onClose}>
      <div
        className={`ao-dialog ao-panel ao-frame ${className}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <span className="ao-frame__corner ao-frame__corner--tl" />
        <span className="ao-frame__corner ao-frame__corner--tr" />
        <span className="ao-frame__corner ao-frame__corner--bl" />
        <span className="ao-frame__corner ao-frame__corner--br" />

        {title && (
          <div className="ao-dialog__header">
            <h2 className="ao-dialog__title ao-engraved">{title}</h2>
            <button
              className="ao-dialog__close"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              <Rune kind="x" size={16} />
            </button>
          </div>
        )}

        <div className="ao-dialog__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ── AlertDialog ── */

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: AlertDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} width={400}>
      {description && <p className="ao-dialog__desc">{description}</p>}
      <div className="ao-dialog__actions">
        <Button variant="ghost" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
