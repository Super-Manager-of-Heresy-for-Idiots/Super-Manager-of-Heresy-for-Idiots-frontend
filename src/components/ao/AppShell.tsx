import React from 'react';
import { Rune } from './Rune';
import { Sigil } from './Sigil';
import { Backdrop } from './Backdrop';

/* ── Default navigation items ── */

export interface NavItem {
  key: string;
  label: string;
  glyph: string;
  path: string;
  badge?: boolean;
}

export const DEFAULT_NAV: NavItem[] = [
  { key: 'roster', label: 'Roster', glyph: 'shield', path: '/characters' },
  { key: 'sheet', label: 'Sheet', glyph: 'sigil-3', path: '/characters' },
  { key: 'arsenal', label: 'Arsenal', glyph: 'sword', path: '/inventory' },
  { key: 'conclave', label: 'Conclave', glyph: 'helm', path: '/teams' },
];

/* ── Rail ── */

interface RailProps {
  nav: NavItem[];
  active: string;
  onNavigate: (item: NavItem) => void;
  onSettings?: () => void;
}

export function Rail({ nav, active, onNavigate, onSettings }: RailProps) {
  return (
    <div
      style={{
        width: 68,
        background: 'var(--abyss)',
        borderRight: '1px solid var(--rule)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '18px 0 14px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <Sigil size={40} glyph="sigil-2" />
      </div>
      <div style={{ width: 24, height: 1, background: 'var(--rule)', marginBottom: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {nav.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              title={item.label}
              className={`ao-iconbtn ${isActive ? 'is-active' : ''}`}
              style={{
                width: 40,
                height: 40,
                background: isActive ? 'var(--panel-raised)' : 'transparent',
                color: isActive ? 'var(--gold-pale)' : 'var(--ink-faint)',
                borderColor: isActive ? 'var(--brass)' : 'transparent',
                position: 'relative',
              }}
              onClick={() => onNavigate(item)}
              type="button"
            >
              <Rune kind={item.glyph} size={16} />
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 5,
                    height: 5,
                    background: 'var(--ember)',
                    boxShadow: '0 0 6px var(--ember)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ width: 24, height: 1, background: 'var(--rule)', marginTop: 14, marginBottom: 14 }} />
      {onSettings && (
        <button
          className="ao-iconbtn"
          style={{ width: 40, height: 40, border: 'none', color: 'var(--ink-faint)' }}
          title="Settings"
          onClick={onSettings}
          type="button"
        >
          <Rune kind="cir-dot" size={14} />
        </button>
      )}
    </div>
  );
}

/* ── TopBar ── */

interface TopBarProps {
  title?: string;
  breadcrumb?: string;
  right?: React.ReactNode;
}

export function TopBar({ title, breadcrumb, right }: TopBarProps) {
  return (
    <div
      style={{
        height: 60,
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 18,
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Rune kind="diamond-fill" size={8} color="var(--gold)" />
        <span className="ao-engraved" style={{ fontSize: 14 }}>
          {title}
        </span>
      </div>
      {breadcrumb && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-faint)' }}>
          <Rune kind="chev-r" size={12} />
          <span className="ao-codex">{breadcrumb}</span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

/* ── AppShell ── */

interface AppShellProps {
  children: React.ReactNode;
  nav?: NavItem[];
  activeNav?: string;
  onNavigate?: (item: NavItem) => void;
  onSettings?: () => void;
  topBar?: React.ReactNode;
}

export function AppShell({
  children,
  nav = DEFAULT_NAV,
  activeNav = '',
  onNavigate = () => {},
  onSettings,
  topBar,
}: AppShellProps) {
  return (
    <Backdrop>
      <div style={{ display: 'flex', height: '100%' }}>
        <Rail nav={nav} active={activeNav} onNavigate={onNavigate} onSettings={onSettings} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {topBar}
          <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px 28px 28px' }}>
            {children}
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
