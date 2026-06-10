import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune } from '@/components/ordo';

/* ── Full-screen backdrop (standalone combat routes) ─────────── */

interface CombatBackdropProps {
  children: ReactNode;
}

export function CombatBackdrop({ children }: CombatBackdropProps) {
  return (
    <div
      className="ao-root ao-grain"
      style={{ position: 'fixed', inset: 0, background: 'var(--stone)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>{children}</div>
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
    <header
      style={{
        height: 56,
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        gap: 12,
        borderBottom: '1px solid var(--rule)',
        background: 'var(--abyss)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          className="ao-iconbtn"
          style={{ border: '1px solid var(--rule)', width: 34, height: 34, flexShrink: 0 }}
          onClick={() => navigate(-1)}
          aria-label="back"
        >
          <Rune kind="arrow-l" size={15} color="var(--ink-quiet)" />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="ao-engraved" style={{ fontSize: 'var(--t-body-lg)', color: 'var(--ink-bright)', lineHeight: 1.1 }}>{title}</div>
          {breadcrumb && (
            <div className="ao-codex" style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {breadcrumb}
            </div>
          )}
        </div>
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>{right}</div>}
    </header>
  );
}
