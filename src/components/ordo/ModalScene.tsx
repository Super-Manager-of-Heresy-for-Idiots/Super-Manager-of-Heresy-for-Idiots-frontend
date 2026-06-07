import type { ReactNode } from 'react';
import { Rune, type GlyphKind } from './Rune';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog';

interface ModalSceneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codexId?: string;
  overline?: string;
  title: string;
  sub?: string;
  rune?: GlyphKind;
  tone?: string;
  danger?: boolean;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}

export function ModalScene({
  open,
  onOpenChange,
  codexId,
  overline,
  title,
  sub,
  rune,
  tone,
  danger,
  width = 480,
  footer,
  children,
}: ModalSceneProps) {
  const accentColor = danger ? 'var(--ember)' : tone || 'var(--gold)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent
        className="ao-panel ao-frame"
        style={{
          maxWidth: width,
          padding: 0,
          border: `1px solid ${accentColor}44`,
          background: 'var(--panel)',
        }}
      >
        <span className="ao-frame-c" />
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--rule)',
            background: `linear-gradient(180deg, ${accentColor}08, transparent)`,
          }}
        >
          {codexId && (
            <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginBottom: 6 }}>
              {codexId}
            </div>
          )}
          {overline && (
            <div
              className="ao-overline"
              style={{ color: accentColor, marginBottom: 6 }}
            >
              {overline}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {rune && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: `1px solid ${accentColor}`,
                  background: 'var(--abyss)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Rune kind={rune} size={18} color={accentColor} />
              </div>
            )}
            <div>
              <div className="ao-h4" style={{ fontSize: 22 }}>{title}</div>
              {sub && <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', marginTop: 2 }}>{sub}</div>}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: '0 24px 20px' }}>
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
