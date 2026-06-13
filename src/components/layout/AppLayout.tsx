import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Rune, Sigil } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
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
    <nav className="ao-rail">
      <div className="ao-rail-brand">
        <Sigil size={40} glyph="sigil-1" color="var(--gold)" />
      </div>

      <div className="ao-rail-items">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              title={t(item.labelKey)}
              className={cn('ao-rail-btn', active && 'is-active')}
            >
              <Rune kind={item.glyph} size={18} />
              {item.labelKey === 'nav.admin' && user?.role === 'ADMIN' && (
                <span className="ao-rail-dot" />
              )}
            </button>
          );
        })}
      </div>

      <button onClick={handleLogout} title={t('topbar.logout')} className="ao-rail-logout">
        <Rune kind="x" size={16} />
      </button>
    </nav>
  );

  /* ── Drawer (mobile only) ─────────────────────────────── */
  const drawer = (
    <div className={cn('ao-drawer', drawerOpen ? 'is-open' : 'is-closed')}>
      {/* Backdrop */}
      <div className="ao-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      {/* Panel */}
      <div className="ao-scroll ao-grain ao-drawer-panel">
        {/* Drawer header */}
        <div className="ao-drawer-head">
          <Sigil size={40} glyph="sigil-1" color="var(--gold)" />
          <div className="ao-drawer-head-meta">
            <div className="ao-engraved ao-drawer-head-name">{t('app.name')}</div>
            {user && (
              <div className="ao-codex ao-drawer-head-role">
                {user.username} · {t(`role.${user.role}`)}
              </div>
            )}
          </div>
          <button
            className="ao-iconbtn"
            onClick={() => setDrawerOpen(false)}
            aria-label={t('cmp3.close')}
          >
            <Rune kind="x" size={15} color="var(--ink-quiet)" />
          </button>
        </div>

        {/* Nav items */}
        <div className="ao-drawer-nav">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.labelKey}
                onClick={() => goTo(item.path)}
                className={cn('ao-drawer-link', active && 'is-active')}
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
        <div className="ao-drawer-foot">
          <div className="ao-drawer-foot-row">
            <span className="ao-overline">{t('lang.label')}</span>
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="ao-btn ao-btn--ghost ao-btn--block ao-drawer-logout"
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
    <header className="ao-topbar">
      <div className="ao-topbar-left">
        {isMobile && (
          <button
            className="ao-iconbtn ao-topbar-burger"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('topbar.menu')}
          >
            <Rune kind="menu" size={18} color="var(--ink-quiet)" />
          </button>
        )}
        <span className="ao-engraved ao-topbar-title">{t('app.name')}</span>
        {!isMobile && (
          <>
            <span className="ao-topbar-sep">|</span>
            <span className="ao-codex ao-topbar-path">{location.pathname}</span>
          </>
        )}
      </div>
      <div className="ao-topbar-right">
        {!isMobile && user && (
          <>
            <span className="ao-codex ao-topbar-user">{user.username}</span>
            <span className="ao-chip ao-chip--gold ao-topbar-role">{t(`role.${user.role}`)}</span>
          </>
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );

  return (
    <div className="ao-shell">
      {!isMobile && rail}
      {isMobile && drawer}

      <div className="ao-shell-body">
        {header}
        <main className="ao-scroll ao-grain app-main ao-shell-main">
          <div className="ao-shell-content">
            <CampaignWsBridge />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
