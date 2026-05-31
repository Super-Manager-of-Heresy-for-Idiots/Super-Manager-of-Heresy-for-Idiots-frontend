import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Rune, Sigil } from '@/components/ordo';
import type { Role } from '@/types';

/* ── Nav definition ─────────────────────────────────────── */

interface NavEntry {
  label: string;
  path: string;
  glyph: string;
}

const playerNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
];

const gmNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
  { label: 'Doctrines', path: '/gm/homebrew/marketplace', glyph: 'scroll' },
];

const adminNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
  { label: 'Doctrines', path: '/gm/homebrew/marketplace', glyph: 'scroll' },
  { label: 'Archive', path: '/admin', glyph: 'book' },
];

function getNavItems(role?: Role): NavEntry[] {
  switch (role) {
    case 'ADMIN':
      return adminNav;
    case 'GAME_MASTER':
      return gmNav;
    case 'PLAYER':
    default:
      return playerNav;
  }
}

/* ── Role labels for topbar ─────────────────────────────── */

const roleLabels: Record<string, string> = {
  PLAYER: 'Hand of Fate',
  GAME_MASTER: 'Chronicler',
  ADMIN: 'Archivist',
};

/* ── Layout ─────────────────────────────────────────────── */

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItems(user?.role);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--stone)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Rail ─────────────────────────────────────── */}
      <nav
        style={{
          width: 68,
          minWidth: 68,
          background: 'var(--abyss)',
          borderRight: '1px solid var(--rule)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 16,
          gap: 4,
        }}
      >
        {/* Logo seal */}
        <div style={{ marginBottom: 20 }}>
          <Sigil size={40} glyph="sigil-1" color="var(--gold)" />
        </div>

        {/* Nav buttons */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                title={item.label}
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: active
                    ? 'rgba(176, 141, 78, 0.12)'
                    : 'transparent',
                  border: active
                    ? '1px solid var(--brass)'
                    : '1px solid transparent',
                  color: active ? 'var(--gold-pale)' : 'var(--ink-faint)',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--ink-quiet)';
                    e.currentTarget.style.borderColor = 'var(--rule)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--ink-faint)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <Rune kind={item.glyph} size={18} />
                {/* Badge for admin Archive */}
                {item.label === 'Archive' && user?.role === 'ADMIN' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--ember)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: settings / logout */}
        <button
          onClick={handleLogout}
          title="Leave the Archive"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--ink-faint)',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--ember)';
            e.currentTarget.style.borderColor = 'var(--rule)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--ink-faint)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Rune kind="x" size={16} />
        </button>
      </nav>

      {/* ── Main area ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* TopBar */}
        <header
          style={{
            height: 60,
            minHeight: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--rule)',
            background: 'var(--abyss)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              className="ao-engraved"
              style={{ fontSize: 'var(--t-body-lg)', color: 'var(--ink-bright)' }}
            >
              Ordo Arcanum
            </span>
            <span style={{ color: 'var(--rule)' }}>|</span>
            <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
              {location.pathname}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user && (
              <>
                <span
                  className="ao-codex"
                  style={{ color: 'var(--ink-quiet)' }}
                >
                  {user.username}
                </span>
                <span
                  className="ao-chip ao-chip--gold"
                  style={{ fontSize: 9 }}
                >
                  {roleLabels[user.role] || user.role}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main
          className="ao-scroll ao-grain"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            position: 'relative',
            background: 'var(--stone)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
