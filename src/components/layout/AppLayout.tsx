import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/features/messenger/hooks/useMessengerQueries';
import { OrdoInterfaceIcon, Rune, type OrdoInterfaceIconKey } from '@/components/ordo';
import { RotaPerforataLogo } from '@/components/brand/RotaPerforataLogo';
import { useT } from '@/i18n/I18nContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccountSwitcher } from './AccountSwitcher';
import { PageFallback } from './PageFallback';
import type { Role } from '@/types';

/** Description i18n key for a nav entry, e.g. `nav.campaigns` → `nav.desc.campaigns`. */
const descKey = (labelKey: string) => labelKey.replace('nav.', 'nav.desc.');

/* ── Nav definition ─────────────────────────────────────── */

interface NavEntry {
  labelKey: string;
  path: string;
  icon: OrdoInterfaceIconKey;
  exact?: boolean;
}

const playerNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', icon: 'campaign' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', icon: 'character-template' },
  { labelKey: 'nav.friends', path: '/friends', icon: 'friends' },
  { labelKey: 'nav.messages', path: '/messages', icon: 'messages' },
  { labelKey: 'nav.marketplace', path: '/marketplace', icon: 'homebrew-package' },
  { labelKey: 'nav.blueprintMarket', path: '/blueprints/marketplace', icon: 'campaign-blueprint' },
  { labelKey: 'nav.itemCatalog', path: '/library/items', icon: 'item' },
];

const gmNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', icon: 'campaign' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', icon: 'character-template' },
  { labelKey: 'nav.friends', path: '/friends', icon: 'friends' },
  { labelKey: 'nav.messages', path: '/messages', icon: 'messages' },
  { labelKey: 'nav.marketplace', path: '/marketplace', icon: 'homebrew-package' },
  { labelKey: 'nav.blueprintMarket', path: '/blueprints/marketplace', icon: 'campaign-blueprint' },
  { labelKey: 'nav.itemCatalog', path: '/library/items', icon: 'item' },
  { labelKey: 'nav.myBlueprints', path: '/blueprints/my', icon: 'blueprint-draft' },
  { labelKey: 'nav.myDoctrines', path: '/gm/homebrew/my', icon: 'homebrew-draft' },
  { labelKey: 'nav.installed', path: '/gm/homebrew/installed', icon: 'homebrew-installed' },
  { labelKey: 'nav.library', path: '/gm/homebrew/library', icon: 'admin-content' },
];

const adminNav: NavEntry[] = [
  { labelKey: 'nav.campaigns', path: '/campaigns', icon: 'campaign' },
  { labelKey: 'nav.myCharacters', path: '/characters/templates', icon: 'character-template' },
  { labelKey: 'nav.friends', path: '/friends', icon: 'friends' },
  { labelKey: 'nav.messages', path: '/messages', icon: 'messages' },
  { labelKey: 'nav.admin', path: '/admin', icon: 'admin-dashboard', exact: true },
  { labelKey: 'nav.users', path: '/admin/users', icon: 'admin-users' },
  { labelKey: 'nav.characters', path: '/admin/characters', icon: 'character' },
  { labelKey: 'nav.statTypes', path: '/admin/stat-types', icon: 'ability-check' },
  { labelKey: 'nav.itemTemplates', path: '/admin/item-templates', icon: 'item-template' },
  { labelKey: 'nav.itemCatalog', path: '/library/items', icon: 'item' },
  { labelKey: 'nav.classes', path: '/admin/character-classes', icon: 'class' },
  { labelKey: 'nav.species', path: '/admin/species', icon: 'species' },
  { labelKey: 'nav.contentQuality', path: '/admin/content-quality', icon: 'validation-warning' },
  { labelKey: 'nav.buffsDebuffs', path: '/admin/buffs-debuffs', icon: 'active-effect' },
  { labelKey: 'nav.enchantments', path: '/admin/enchantment-types', icon: 'enchantment' },
  { labelKey: 'nav.bestiary', path: '/admin/bestiary/monsters', icon: 'bestiary' },
  { labelKey: 'nav.bestiaryDicts', path: '/admin/bestiary/dictionaries', icon: 'dictionary' },
  { labelKey: 'nav.homebrew', path: '/admin/homebrew', icon: 'homebrew-package' },
  { labelKey: 'nav.spellWarnings', path: '/admin/spell-warnings', icon: 'spell' },
  { labelKey: 'nav.classFeatureWarnings', path: '/admin/class-feature-warnings', icon: 'class-feature' },
  { labelKey: 'nav.ruleWorkbench', path: '/admin/rule-workbench', icon: 'rule-workbench' },
  { labelKey: 'nav.resourceTypes', path: '/admin/resource-types', icon: 'resource' },
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

export function AppLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = getNavItems(user?.role);
  const unreadCount = useUnreadCount();

  const isActive = (item: NavEntry) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const navIcon = (item: NavEntry) =>
    item.labelKey === 'nav.messages' && unreadCount > 0 ? 'unread-message' : item.icon;

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

  /* ── Rail (desktop only) — collapsed icons, expands on hover ── */
  const rail = (
    <nav className="ao-rail">
      <div className="ao-scroll ao-rail-inner">
        <div className="ao-rail-brand">
          <span className="ao-rail-brand-mark">
            <RotaPerforataLogo size={36} label={t('app.name')} />
          </span>
          <span className="ao-rail-brand-name ao-engraved">{t('app.name')}</span>
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
                <span className="ao-rail-btn-ico">
                  <OrdoInterfaceIcon icon={navIcon(item)} size={18} />
                  {item.labelKey === 'nav.admin' && user?.role === 'ADMIN' && (
                    <span className="ao-rail-dot" />
                  )}
                </span>
                <span className="ao-rail-btn-text">
                  <span className="ao-rail-btn-label">
                    {t(item.labelKey)}
                    {item.labelKey === 'nav.messages' && unreadCount > 0 && (
                      <span className="ao-chip ao-chip--gold">{unreadCount}</span>
                    )}
                  </span>
                  <span className="ao-rail-btn-desc">{t(descKey(item.labelKey))}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="ao-rail-foot">
          <AccountSwitcher />
        </div>
      </div>
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
          <RotaPerforataLogo size={40} label={t('app.name')} />
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
                <OrdoInterfaceIcon
                  icon={navIcon(item)}
                  size={16}
                  style={{ color: active ? 'var(--gold)' : 'var(--ink-faint)' }}
                />
                <span className="ao-drawer-link-text">
                  <span className="ao-drawer-link-label">
                    {t(item.labelKey)}
                    {item.labelKey === 'nav.messages' && unreadCount > 0 && (
                      <span className="ao-chip ao-chip--gold">{unreadCount}</span>
                    )}
                  </span>
                  <span className="ao-drawer-link-desc">{t(descKey(item.labelKey))}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Drawer footer: language + account switcher */}
        <div className="ao-drawer-foot">
          <div className="ao-drawer-foot-row">
            <span className="ao-overline">{t('lang.label')}</span>
            <LanguageSwitcher />
          </div>
          <AccountSwitcher onNavigate={() => setDrawerOpen(false)} />
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
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
