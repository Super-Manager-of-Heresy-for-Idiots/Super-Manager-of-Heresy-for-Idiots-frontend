import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Rune, Sigil } from '@/components/ordo';
import type { Role } from '@/types';

/* ── Nav definition ─────────────────────────────────────── */

interface NavEntry {
  label: string;
  path: string;
  glyph: string;
  exact?: boolean;
}

const playerNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
  { label: 'Marketplace', path: '/marketplace', glyph: 'book' },
];

const gmNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
  { label: 'Marketplace', path: '/marketplace', glyph: 'book' },
  { label: 'My Doctrines', path: '/gm/homebrew/my', glyph: 'scroll' },
  { label: 'Installed', path: '/gm/homebrew/installed', glyph: 'check' },
  { label: 'Library', path: '/gm/homebrew/library', glyph: 'book' },
];

const adminNav: NavEntry[] = [
  { label: 'Campaigns', path: '/campaigns', glyph: 'helm' },
  { label: 'Admin', path: '/admin', glyph: 'book', exact: true },
  { label: 'Users', path: '/admin/users', glyph: 'helm' },
  { label: 'Characters', path: '/admin/characters', glyph: 'shield' },
  { label: 'Stat Types', path: '/admin/stat-types', glyph: 'diamond' },
  { label: 'Item Types', path: '/admin/item-types', glyph: 'sword' },
  { label: 'Classes', path: '/admin/character-classes', glyph: 'shield' },
  { label: 'Races', path: '/admin/character-races', glyph: 'sigil-3' },
  { label: 'Skills', path: '/admin/skills', glyph: 'sigil-2' },
  { label: 'Subclasses', path: '/admin/subclasses', glyph: 'cross-pat' },
  { label: 'Feats', path: '/admin/feats', glyph: 'flame' },
  { label: 'Buffs/Debuffs', path: '/admin/buffs-debuffs', glyph: 'hex' },
  { label: 'Enchantments', path: '/admin/enchantment-types', glyph: 'eye' },
  { label: 'Homebrew', path: '/admin/homebrew', glyph: 'scroll' },
];

function getNavItems(role?: Role): NavEntry[] {
  switch (role) {
    case 'ADMIN':
      return adminNav;
    case 'GM':
      return gmNav;
    case 'PLAYER':
    default:
      return playerNav;
  }
}

/* ── Role labels for topbar ─────────────────────────────── */

const roleLabels: Record<string, string> = {
  PLAYER: 'Hand of Fate',
  GM: 'Chronicler',
  ADMIN: 'Archivist',
};

/* ── Layout ─────────────────────────────────────────────── */

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItems(user?.role);

  const isActive = (item: NavEntry) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

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
            overflowY: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: 8,
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item);
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
                {item.label === 'Admin' && user?.role === 'ADMIN' && (
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
