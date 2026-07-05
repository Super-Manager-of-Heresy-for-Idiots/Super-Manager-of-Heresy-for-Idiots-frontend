import type { CSSProperties, ReactNode } from 'react';
import { Rune, type GlyphKind } from './Rune';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalSceneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codexId?: string;
  overline?: string;
  title: string;
  sub?: string;
  rune?: GlyphKind;
  icon?: OrdoInterfaceIconKey;
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
  icon,
  tone,
  danger,
  width = 480,
  footer,
  children,
}: ModalSceneProps) {
  const accentColor = danger ? 'var(--ember)' : tone || 'var(--gold)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="ao-panel ao-frame ao-modal"
        aria-describedby={undefined}
        style={{ maxWidth: width, '--accent': accentColor } as CSSProperties}
      >
        <span className="ao-frame-c" />
        {/* Header */}
        <div className="ao-modal-head">
          {codexId && <div className="ao-codex ao-modal-codex">{codexId}</div>}
          {overline && <div className="ao-overline ao-modal-overline">{overline}</div>}
          <div className="ao-modal-titlerow">
            {(icon || rune) && (
              <div className="ao-modal-rune">
                {icon ? (
                  <OrdoInterfaceIcon icon={icon} size={18} style={{ color: accentColor }} />
                ) : rune ? (
                  <Rune kind={rune} size={18} color={accentColor} />
                ) : null}
              </div>
            )}
            <div>
              <DialogTitle asChild>
                <div className="ao-h4 ao-modal-title">{title}</div>
              </DialogTitle>
              {sub && <div className="ao-italic ao-modal-sub">{sub}</div>}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ao-modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="ao-modal-foot">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
