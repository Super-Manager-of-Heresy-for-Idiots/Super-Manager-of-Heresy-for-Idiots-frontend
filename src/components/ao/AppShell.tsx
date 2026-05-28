import React from 'react';
import { Rune } from './Rune';
import { Sigil } from './Sigil';

/* ── Default navigation items ── */

export interface NavItem {
  key: string;
  label: string;
  glyph: string;
  path: string;
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
  className?: string;
}

export function Rail({
  nav,
  active,
  onNavigate,
  onSettings,
  className = '',
}: RailProps) {
  return (
    <nav className={`ao-rail ${className}`}>
      <div className="ao-rail__top">
        <div className="ao-rail__sigil">
          <Sigil size={36} />
        </div>
        <div className="ao-rail__nav">
          {nav.map((item) => (
            <button
              key={item.key}
              className={`ao-rail__btn ${active === item.key ? 'ao-rail__btn--active' : ''}`}
              onClick={() => onNavigate(item)}
              title={item.label}
              type="button"
            >
              <Rune kind={item.glyph} size={20} />
            </button>
          ))}
        </div>
      </div>
      <div className="ao-rail__bottom">
        {onSettings && (
          <button
            className="ao-rail__btn"
            onClick={onSettings}
            title="Settings"
            type="button"
          >
            <Rune kind="cir-dot" size={20} />
          </button>
        )}
      </div>
    </nav>
  );
}

/* ── TopBar ── */

interface TopBarProps {
  title?: string;
  breadcrumb?: string[];
  right?: React.ReactNode;
  className?: string;
}

export function TopBar({
  title,
  breadcrumb,
  right,
  className = '',
}: TopBarProps) {
  return (
    <header className={`ao-topbar ${className}`}>
      <div className="ao-topbar__left">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="ao-topbar__breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <Rune kind="chev-r" size={10} color="var(--ink-faint)" />
                )}
                <span className={i === breadcrumb.length - 1 ? 'ao-topbar__crumb--active' : 'ao-topbar__crumb'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        {title && <h1 className="ao-topbar__title ao-engraved">{title}</h1>}
      </div>
      {right && <div className="ao-topbar__right">{right}</div>}
    </header>
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
  className?: string;
}

export function AppShell({
  children,
  nav = DEFAULT_NAV,
  activeNav = '',
  onNavigate = () => {},
  onSettings,
  topBar,
  className = '',
}: AppShellProps) {
  return (
    <div className={`ao-shell ${className}`}>
      <Rail
        nav={nav}
        active={activeNav}
        onNavigate={onNavigate}
        onSettings={onSettings}
      />
      <div className="ao-shell__main">
        {topBar}
        <div className="ao-shell__content ao-scroll">{children}</div>
      </div>
    </div>
  );
}
