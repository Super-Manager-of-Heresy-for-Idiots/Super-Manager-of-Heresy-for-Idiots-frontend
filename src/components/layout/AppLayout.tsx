import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Backdrop } from '@/components/ao/Backdrop';
import { Rune } from '@/components/ao/Rune';
import { Sigil } from '@/components/ao/Sigil';
import { getRoleRedirect } from '@/lib/ao-utils';

interface NavItem {
  glyph: string;
  label: string;
  path: string;
}

const playerNav: NavItem[] = [
  { glyph: 'shield', label: 'Roster', path: '/characters' },
  { glyph: 'scroll', label: 'Join', path: '/teams/join' },
  { glyph: 'helm', label: 'Teams', path: '/teams' },
];

const gmNav: NavItem[] = [
  { glyph: 'shield', label: 'Teams', path: '/gm/teams' },
];

const adminNav: NavItem[] = [
  { glyph: 'book', label: 'Dashboard', path: '/admin' },
  { glyph: 'shield', label: 'Users', path: '/admin/users' },
  { glyph: 'helm', label: 'Teams', path: '/admin/teams' },
  { glyph: 'scroll', label: 'Stats', path: '/admin/stat-types' },
  { glyph: 'sword', label: 'Items', path: '/admin/item-types' },
  { glyph: 'sigil-3', label: 'Classes', path: '/admin/character-classes' },
  { glyph: 'diamond', label: 'Races', path: '/admin/character-races' },
  { glyph: 'flame', label: 'Feats', path: '/admin/feats' },
  { glyph: 'eye', label: 'Subclasses', path: '/admin/subclasses' },
  { glyph: 'cross-pat', label: 'Skills', path: '/admin/skills' },
  { glyph: 'hex', label: 'Rewards', path: '/admin/class-level-rewards' },
];

function getNavItems(role?: string): NavItem[] {
  if (role === 'ADMIN') return adminNav;
  if (role === 'GAME_MASTER') return gmNav;
  return playerNav;
}

function isActivePath(currentPath: string, navPath: string): boolean {
  if (navPath === '/admin') return currentPath === '/admin';
  return currentPath === navPath || currentPath.startsWith(navPath + '/');
}

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItems(user?.role);

  const getPageTitle = (): string => {
    const item = navItems.find((n) => isActivePath(location.pathname, n.path));
    return item?.label || 'Archive';
  };

  const roleLabel = user?.role === 'ADMIN' ? 'Archivist' : user?.role === 'GAME_MASTER' ? 'Warden' : 'Initiate';

  return (
    <Backdrop>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Rail — desktop sidebar */}
        <div
          className="ao-desktop-rail"
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
          <div
            style={{ marginBottom: 18, cursor: 'pointer' }}
            onClick={() => navigate(getRoleRedirect(user?.role || 'PLAYER'))}
          >
            <Sigil size={40} />
          </div>
          <div style={{ width: 24, height: 1, background: 'var(--rule)', marginBottom: 14 }} />
          <div
            className="ao-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}
          >
            {navItems.map((it) => {
              const active = isActivePath(location.pathname, it.path);
              return (
                <button
                  key={it.path}
                  title={it.label}
                  onClick={() => navigate(it.path)}
                  className="ao-iconbtn"
                  style={{
                    width: 40,
                    height: 40,
                    background: active ? 'var(--panel-raised)' : 'transparent',
                    color: active ? 'var(--gold-pale)' : 'var(--ink-faint)',
                    borderColor: active ? 'var(--brass)' : 'transparent',
                  }}
                >
                  <Rune kind={it.glyph} size={16} />
                </button>
              );
            })}
          </div>
          <div style={{ width: 24, height: 1, background: 'var(--rule)', marginTop: 14, marginBottom: 14 }} />
          <button
            className="ao-iconbtn"
            style={{ width: 40, height: 40, border: 'none', color: 'var(--ink-faint)' }}
            title="Logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <Rune kind="x" size={14} />
          </button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* TopBar */}
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
                {getPageTitle()}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="ao-codex">{user?.username}</span>
              <span className="ao-chip ao-chip--gold" style={{ fontSize: 10 }}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px 28px 28px' }}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="ao-mobile-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: '1px solid var(--rule)',
          background: 'var(--abyss)',
          padding: '8px 0 14px',
          zIndex: 100,
        }}
      >
        {navItems.slice(0, 5).map((it) => {
          const active = isActivePath(location.pathname, it.path);
          return (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 0',
                background: 'transparent',
                border: 'none',
                color: active ? 'var(--gold-pale)' : 'var(--ink-faint)',
                cursor: 'pointer',
              }}
            >
              <Rune kind={it.glyph} size={16} />
              <span className="ao-overline" style={{ fontSize: 9, color: 'inherit' }}>
                {it.label}
              </span>
              {active && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    background: 'var(--gold)',
                    transform: 'rotate(45deg)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </Backdrop>
  );
}
