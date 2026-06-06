import { useState, useMemo } from 'react';
import { Rune, OrdoPanel, OrdoChip, PanelHeader } from '@/components/ordo';
import { formatDate } from '@/lib/utils';
import { useUsers } from '@/hooks/useAdmin';
import { useT } from '@/i18n/I18nContext';

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
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 10px 4px 7px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${color}66`,
        borderLeft: `2px solid ${color}`,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.18em',
        color: color,
        textTransform: 'uppercase',
      }}
    >
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
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('adm.users.errorBody')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        {/* left: overline + title */}
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 2 }}>
            {t('adm.users.overline')}
          </p>
          <h3 className="ao-h3" style={{ margin: 0 }}>{t('adm.users.title')}</h3>
        </div>

        {/* right: stat counters */}
        <div style={{ display: 'flex', gap: 32 }}>
          {([
            { label: t('adm.users.statPlayers'),      value: roleCounts.PLAYER,      color: '#7a9866' },
            { label: t('adm.users.statChroniclers'),   value: roleCounts.GAME_MASTER, color: '#c9a84c' },
            { label: t('adm.users.statInquisitors'),   value: roleCounts.ADMIN,       color: '#c0584a' },
          ] as const).map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 28,
                  lineHeight: 1,
                  color: 'var(--ink-bright)',
                }}
              >
                {isLoading ? '\u2014' : stat.value}
              </div>
              <div
                className="ao-overline"
                style={{ fontSize: 9, marginTop: 4, color: stat.color }}
              >
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Rune
                kind="search"
                size={13}
                color="var(--ink-faint)"
                className=""
              />
              <input
                className="ao-input"
                style={{
                  paddingLeft: 8,
                  width: 220,
                  fontSize: 12,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--rule)',
                  borderRadius: 0,
                }}
                placeholder={t('adm.users.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />

        {/* ── role filter tabs ──────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`ao-tab ${roleFilter === tab.key ? 'ao-tab--active' : ''}`}
              onClick={() => setRoleFilter(tab.key)}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 5,
                  opacity: 0.5,
                  fontSize: '0.85em',
                }}
              >
                {isLoading ? '\u2014' : tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── table ─────────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
            ))}
          </div>
        ) : (
          <table className="ao-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.users.colUsername')}</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.users.colSigilAddress')}</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.users.colOffice')}</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>{t('adm.users.colInscribed')}</th>
                <th style={{ width: 40, padding: '12px 8px' }} />
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.id}>
                  {/* username with placeholder avatar */}
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--abyss)',
                          border: '1px solid var(--rule)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Rune kind="sigil-1" size={14} color="var(--ink-faint)" />
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-bright)',
                          fontSize: 13,
                        }}
                      >
                        {user.username}
                      </span>
                    </div>
                  </td>

                  {/* email / sigil address */}
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      className="ao-italic"
                      style={{ color: 'var(--ink-quiet)', fontSize: 13 }}
                    >
                      {user.email}
                    </span>
                  </td>

                  {/* office / role badge */}
                  <td style={{ padding: '10px 16px' }}>
                    <RoleBadge role={user.role} />
                  </td>

                  {/* inscribed / created date */}
                  <td style={{ padding: '10px 16px' }}>
                    <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                      {formatDate(user.createdAt)}
                    </span>
                  </td>

                  {/* dots menu */}
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button
                      className="ao-btn ao-btn--ghost"
                      style={{ padding: 4, lineHeight: 1, minWidth: 0 }}
                      aria-label={t('adm.users.actions')}
                    >
                      <Rune kind="dots" size={16} color="var(--ink-quiet)" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      {t('adm.users.noSouls')}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── footer ────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--rule)',
            fontSize: 11,
            color: 'var(--ink-faint)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
          }}
        >
          <span>
            {isLoading
              ? '\u2014'
              : t('adm.users.soulsCount', { filtered: filteredUsers?.length ?? 0, total: roleCounts.total })}
          </span>
          <span style={{ opacity: 0.6 }}>{t('adm.users.sortedRecent')}</span>
        </div>
      </OrdoPanel>
    </div>
  );
}
