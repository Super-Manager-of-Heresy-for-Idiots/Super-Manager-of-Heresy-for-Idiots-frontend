import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune } from '@/components/ordo';

/* ── Full-screen backdrop (standalone combat routes) ─────────── */

interface CombatBackdropProps {
  children: ReactNode;
}

export function CombatBackdrop({ children }: CombatBackdropProps) {
  return (
    <div className="ao-root ao-grain cb-backdrop">
      <div className="cb-backdrop-inner">{children}</div>
    </div>
  );
}

/* ── Top bar with a back action ──────────────────────────────── */

interface CombatTopBarProps {
  title: string;
  breadcrumb?: string;
  right?: ReactNode;
}

export function CombatTopBar({ title, breadcrumb, right }: CombatTopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="cb-topbar">
      <div className="cb-topbar-left">
        <button
          className="ao-iconbtn cb-topbar-back"
          onClick={() => navigate(-1)}
          aria-label="back"
        >
          <Rune kind="arrow-l" size={15} color="var(--ink-quiet)" />
        </button>
        <div className="cb-topbar-titles">
          <div className="ao-engraved cb-topbar-title">{title}</div>
          {breadcrumb && <div className="ao-codex cb-topbar-crumb">{breadcrumb}</div>}
        </div>
      </div>
      {right && <div className="cb-topbar-right">{right}</div>}
    </header>
  );
}
