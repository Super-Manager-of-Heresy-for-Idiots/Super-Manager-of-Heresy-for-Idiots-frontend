import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Rune, Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Role } from '@/types';

/* ── Nav definition ─────────────────────────────────────── */

interface NavEntry {
  labelKey: string;
  path: string;
  glyph: string;
  exact?: boolean;
}

const playerNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', glyph: 'helm' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', glyph: 'shield' },
  { labelKey: 'nav.marketplace', path: '/marketplace', glyph: 'book' },
];

const gmNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', glyph: 'helm' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', glyph: 'shield' },
  { labelKey: 'nav.marketplace', path: '/marketplace', glyph: 'book' },
  { labelKey: 'nav.myDoctrines', path: '/gm/homebrew/my', glyph: 'scroll' },
  { labelKey: 'nav.installed', path: '/gm/homebrew/installed', glyph: 'check' },
  { labelKey: 'nav.library', path: '/gm/homebrew/library', glyph: 'book' },
];

const adminNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', glyph: 'helm' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', glyph: 'shield' },
  { labelKey: 'nav.admin', path: '/admin', glyph: 'book', exact: true },
  { labelKey: 'nav.users', path: '/admin/users', glyph: 'helm' },
  { labelKey: 'nav.characters', path: '/admin/characters', glyph: 'shield' },
  { labelKey: 'nav.statTypes', path: '/admin/stat-types', glyph: 'diamond' },
  { labelKey: 'nav.itemTypes', path: '/admin/item-types', glyph: 'sword' },
  { labelKey: 'nav.classes', path: '/admin/character-classes', glyph: 'shield' },
  { labelKey: 'nav.races', path: '/admin/character-races', glyph: 'sigil-3' },
  { labelKey: 'nav.skills', path: '/admin/skills', glyph: 'sigil-2' },
  { labelKey: 'nav.subclasses', path: '/admin/subclasses', glyph: 'cross-pat' },
  { labelKey: 'nav.feats', path: '/admin/feats', glyph: 'flame' },
  { labelKey: 'nav.buffsDebuffs', path: '/admin/buffs-debuffs', glyph: 'hex' },
  { labelKey: 'nav.enchantments', path: '/admin/enchantment-types', glyph: 'eye' },
  { labelKey: 'nav.bestiary', path: '/admin/bestiary/monsters', glyph: 'sword' },
  { labelKey: 'nav.bestiaryDicts', path: '/admin/bestiary/dictionaries', glyph: 'book' },
  { labelKey: 'nav.homebrew', path: '/admin/homebrew', glyph: 'scroll' },
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

/* ── Layout ─────────────────────────────────────────────── */

/**
 * Lives inside AppLayout so the campaign-scoped WebSocket follows the route.
 * Connects on enter, disconnects on leave, swaps cleanly on campaign switch.
 */
function CampaignWsBridge() {
  const match = useMatch('/campaigns/:campaignId/*');
  useWebSocket(match?.params.campaignId);
  return null;
}

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = getNavItems(user?.role);

  const isActive = (item: NavEntry) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goTo = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Close the drawer whenever the route changes or we grow back to desktop.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  /* ── Rail (desktop only) ──────────────────────────────── */
  const rail = (
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
      <div style={{ marginBottom: 20 }}>
        <Sigil size={40} glyph="sigil-1" color="var(--gold)" />
      </div>

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
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              title={t(item.labelKey)}
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: active ? 'rgba(176, 141, 78, 0.12)' : 'transparent',
                border: active ? '1px solid var(--brass)' : '1px solid transparent',
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
              {item.labelKey === 'nav.admin' && user?.role === 'ADMIN' && (
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

      <button
        onClick={handleLogout}
        title={t('topbar.logout')}
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
  );

  /* ── Drawer (mobile only) ─────────────────────────────── */
  const drawer = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        pointerEvents: drawerOpen ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5,4,3,0.6)',
          opacity: drawerOpen ? 1 : 0,
          transition: 'opacity 240ms',
          backdropFilter: drawerOpen ? 'blur(2px)' : 'none',
        }}
      />
      {/* Panel */}
      <div
        className="ao-scroll ao-grain"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 290,
          maxWidth: '86%',
          background: 'linear-gradient(180deg, var(--stone), var(--abyss))',
          borderRight: '1px solid var(--rule-strong)',
          boxShadow: 'var(--shadow-high)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-104%)',
          transition: 'transform 280ms cubic-bezier(0.3,0,0.2,1)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: '20px 18px 16px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Sigil size={40} glyph="sigil-1" color="var(--gold)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ao-engraved" style={{ fontSize: 13 }}>
              {t('app.name')}
            </div>
            {user && (
              <div className="ao-codex" style={{ marginTop: 2 }}>
                {user.username} · {t(`role.${user.role}`)}
              </div>
            )}
          </div>
          <button
            className="ao-iconbtn"
            style={{ border: 'none' }}
            onClick={() => setDrawerOpen(false)}
            aria-label={t('cmp3.close')}
          >
            <Rune kind="x" size={15} color="var(--ink-quiet)" />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '10px 0 16px', position: 'relative', zIndex: 2, flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.labelKey}
                onClick={() => goTo(item.path)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 18px',
                  background: active ? 'rgba(176,141,78,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: '2px solid ' + (active ? 'var(--gold)' : 'transparent'),
                  color: active ? 'var(--gold-pale)' : 'var(--ink-quiet)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15,
                }}
              >
                <Rune
                  kind={item.glyph}
                  size={16}
                  color={active ? 'var(--gold)' : 'var(--ink-faint)'}
                />
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Drawer footer: language + logout */}
        <div
          style={{
            padding: '14px 18px 20px',
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span className="ao-overline" style={{ fontSize: 9 }}>
              {t('lang.label')}
            </span>
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="ao-btn ao-btn--ghost ao-btn--block"
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <Rune kind="x" size={14} />
            {t('topbar.logout')}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Header ───────────────────────────────────────────── */
  const header = (
    <header
      style={{
        height: 56,
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        gap: 10,
        borderBottom: '1px solid var(--rule)',
        background: 'var(--abyss)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {isMobile && (
          <button
            className="ao-iconbtn"
            style={{ border: 'none', width: 36, height: 36, flexShrink: 0 }}
            onClick={() => setDrawerOpen(true)}
            aria-label={t('topbar.menu')}
          >
            <Rune kind="menu" size={18} color="var(--ink-quiet)" />
          </button>
        )}
        <span
          className="ao-engraved"
          style={{
            fontSize: 'var(--t-body-lg)',
            color: 'var(--ink-bright)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('app.name')}
        </span>
        {!isMobile && (
          <>
            <span style={{ color: 'var(--rule)' }}>|</span>
            <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
              {location.pathname}
            </span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        {!isMobile && user && (
          <>
            <span className="ao-codex" style={{ color: 'var(--ink-quiet)' }}>
              {user.username}
            </span>
            <span className="ao-chip ao-chip--gold" style={{ fontSize: 9 }}>
              {t(`role.${user.role}`)}
            </span>
          </>
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );

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
      {!isMobile && rail}
      {isMobile && drawer}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header}
        <main
          className="ao-scroll ao-grain app-main"
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            background: 'var(--stone)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <CampaignWsBridge />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
