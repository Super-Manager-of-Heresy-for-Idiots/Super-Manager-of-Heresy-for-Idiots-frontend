import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Rune, OrdoPanel, PanelHeader } from '@/components/ordo';
import { formatDate, cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import { useUsers } from '@/hooks/useAdmin';
import { useT } from '@/i18n/I18nContext';
import s from './UsersListPage.module.css';

/* ── role config ─────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { c: string; glyph: string; labelKey: string }> = {
  PLAYER:      { c: '#7a9866', glyph: 'shield', labelKey: 'adm.users.rolePlayer' },
  GAME_MASTER: { c: '#c9a84c', glyph: 'helm',   labelKey: 'adm.users.roleGameMaster' },
  ADMIN:       { c: '#c0584a', glyph: 'lock',    labelKey: 'adm.users.roleAdmin' },
};

type RoleFilter = 'all' | 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

/* ── role badge ──────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const t = useT();
  const cfg = ROLE_CFG[role] ?? { c: 'var(--ink-quiet)', glyph: 'cir', labelKey: '' };
  const color = cfg.c;
  const label = cfg.labelKey ? t(cfg.labelKey) : role;

  return (
    <span className={s.roleBadge} style={{ '--c': color } as CSSProperties}>
      <Rune kind={cfg.glyph} size={10} color={color} />
      {label}
    </span>
  );
}

/* ── main page ───────────────────────────────────────────────── */
export default function UsersListPage() {
  const t = useT();
  const { data: users, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  /* derived data */
  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    if (!users) return { PLAYER: 0, GAME_MASTER: 0, ADMIN: 0, total: 0 };
    return {
      PLAYER: users.filter((u) => u.role === 'PLAYER').length,
      GAME_MASTER: users.filter((u) => u.role === 'GAME_MASTER').length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      total: users.length,
    };
  }, [users]);

  /* ── error state ────────────────────────────────────────────── */
  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('adm.users.errorBody')}
        </p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        )}
      </div>
    );
  }

  /* ── filter tab definitions ─────────────────────────────────── */
  const tabs: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'all',         label: t('adm.users.tabAll'),          count: roleCounts.total },
    { key: 'PLAYER',      label: t('adm.users.tabPlayers'),      count: roleCounts.PLAYER },
    { key: 'GAME_MASTER', label: t('adm.users.tabChroniclers'),  count: roleCounts.GAME_MASTER },
    { key: 'ADMIN',       label: t('adm.users.tabInquisitors'),  count: roleCounts.ADMIN },
  ];

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div>
      {/* ── header row ──────────────────────────────────────── */}
      <div className={s.header}>
        {/* left: overline + title */}
        <div>
          <p className={cn('ao-overline', s.overline)}>
            {t('adm.users.overline')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>{t('adm.users.title')}</h3>
        </div>

        {/* right: stat counters */}
        <div className={s.stats}>
          {([
            { label: t('adm.users.statPlayers'),      value: roleCounts.PLAYER,      color: '#7a9866' },
            { label: t('adm.users.statChroniclers'),   value: roleCounts.GAME_MASTER, color: '#c9a84c' },
            { label: t('adm.users.statInquisitors'),   value: roleCounts.ADMIN,       color: '#c0584a' },
          ] as const).map((stat) => (
            <div key={stat.label} className={s.stat}>
              <div className={s.statValue}>
                {isLoading ? '—' : stat.value}
              </div>
              <div className={cn('ao-overline', s.statLabel)} style={{ '--c': stat.color } as CSSProperties}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── framed panel ────────────────────────────────────── */}
      <OrdoPanel frame padding={0}>
        {/* panel header with search */}
        <PanelHeader
          title={t('adm.users.panelTitle')}
          glyph="scroll"
          right={
            <div className={s.searchWrap}>
              <Rune kind="search" size={13} color="var(--ink-faint)" />
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder={t('adm.users.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />

        {/* ── role filter tabs ──────────────────────────────── */}
        <div className={s.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={cn('ao-tab', roleFilter === tab.key && 'ao-tab--active')}
              onClick={() => setRoleFilter(tab.key)}
            >
              {tab.label}
              <span className={s.tabCount}>
                {isLoading ? '—' : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── table ─────────────────────────────────────────── */}
        {isLoading ? (
          <div className={s.skelCol}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn('ao-ph', s.skelRow)} />
            ))}
          </div>
        ) : (
          <table className={cn('ao-table', s.table)}>
            <thead>
              <tr>
                <th className={s.th}>{t('adm.users.colUsername')}</th>
                <th className={s.th}>{t('adm.users.colSigilAddress')}</th>
                <th className={s.th}>{t('adm.users.colOffice')}</th>
                <th className={s.th}>{t('adm.users.colInscribed')}</th>
                <th className={s.thActions} />
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.id}>
                  {/* username with placeholder avatar */}
                  <td className={s.td}>
                    <div className={s.userCell}>
                      <div className={s.avatar}>
                        <Rune kind="sigil-1" size={14} color="var(--ink-faint)" />
                      </div>
                      <span className={s.username}>{user.username}</span>
                    </div>
                  </td>

                  {/* email / sigil address */}
                  <td className={s.td}>
                    <span className={cn('ao-italic', s.email)}>{user.email}</span>
                  </td>

                  {/* office / role badge */}
                  <td className={s.td}>
                    <RoleBadge role={user.role} />
                  </td>

                  {/* inscribed / created date */}
                  <td className={s.td}>
                    <span className={cn('ao-codex', s.date)}>{formatDate(user.createdAt)}</span>
                  </td>

                  {/* dots menu */}
                  <td className={s.actionsTd}>
                    <button
                      className={cn('ao-btn ao-btn--ghost', s.dotsBtn)}
                      aria-label={t('adm.users.actions')}
                    >
                      <Rune kind="dots" size={16} color="var(--ink-quiet)" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={5} className={s.emptyCell}>
                    <span className={cn('ao-italic', s.emptyText)}>{t('adm.users.noSouls')}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── footer ────────────────────────────────────────── */}
        <div className={s.footer}>
          <span>
            {isLoading
              ? '—'
              : t('adm.users.soulsCount', { filtered: filteredUsers?.length ?? 0, total: roleCounts.total })}
          </span>
          <span className={s.footerRight}>{t('adm.users.sortedRecent')}</span>
        </div>
      </OrdoPanel>
    </div>
  );
}
