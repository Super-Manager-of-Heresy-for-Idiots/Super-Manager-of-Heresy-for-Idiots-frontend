import { useState, useMemo } from 'react';
import { Rune, OrdoDivider, OrdoPanel } from '@/components/ordo';
import { formatDate } from '@/lib/utils';
import { useUsers } from '@/hooks/useAdmin';

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  PLAYER: { label: 'Player', color: '#7a9866' },
  GAME_MASTER: { label: 'Chronicler', color: '#c9a84c' },
  ADMIN: { label: 'Inquisitor', color: '#c0584a' },
};

type RoleFilter = 'all' | 'PLAYER' | 'GAME_MASTER' | 'ADMIN';

export default function UsersListPage() {
  const { data: users, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
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

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The census could not be consulted. The ledger remains closed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Census of Souls</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Registered Members</h3>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Stats counters */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, margin: '24px 0' }}>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--ink-bright)' }}>
            {isLoading ? '\u2014' : roleCounts.total}
          </span>
          <span className="ao-stat-label">Total</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: ROLE_CONFIG.PLAYER.color }}>
            {isLoading ? '\u2014' : roleCounts.PLAYER}
          </span>
          <span className="ao-stat-label">Players</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: ROLE_CONFIG.GAME_MASTER.color }}>
            {isLoading ? '\u2014' : roleCounts.GAME_MASTER}
          </span>
          <span className="ao-stat-label">Chroniclers</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: ROLE_CONFIG.ADMIN.color }}>
            {isLoading ? '\u2014' : roleCounts.ADMIN}
          </span>
          <span className="ao-stat-label">Inquisitors</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Role filter tabs + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0', gap: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { key: 'all' as RoleFilter, label: 'All' },
            { key: 'PLAYER' as RoleFilter, label: 'Players' },
            { key: 'GAME_MASTER' as RoleFilter, label: 'Chroniclers' },
            { key: 'ADMIN' as RoleFilter, label: 'Inquisitors' },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={`ao-btn ao-btn--sm ${roleFilter === tab.key ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
              onClick={() => setRoleFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: '0 1 320px' }}>
          <Rune
            kind="search"
            size={14}
            color="var(--ink-faint)"
            className=""
          />
          <input
            className="ao-input"
            style={{ paddingLeft: 12, width: '100%' }}
            placeholder="Search by name or sigil address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
          ))}
        </div>
      ) : (
        <OrdoPanel frame padding={0}>
          <table className="ao-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Username</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Sigil Address</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Office</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Inscribed</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => {
                const roleConf = ROLE_CONFIG[user.role] || { label: user.role, color: 'var(--ink-quiet)' };
                return (
                  <tr key={user.id}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-bright)' }}>
                        {user.username}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13 }}>
                        {user.email}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: `${roleConf.color}22`,
                          color: roleConf.color,
                          border: `1px solid ${roleConf.color}44`,
                        }}
                      >
                        {roleConf.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                      No souls match thy inquiry
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </OrdoPanel>
      )}
    </div>
  );
}
