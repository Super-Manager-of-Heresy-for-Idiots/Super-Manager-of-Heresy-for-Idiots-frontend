import { useState } from 'react';
import { Panel, PanelHeader, Table, Button, Input, Select, Chip, Rune } from '@/components/ao';
import { formatDate } from '@/lib/ao-utils';
import { useUsers } from '@/hooks/useAdmin';

const roleTones: Record<string, 'gold' | 'arcane' | 'ember' | 'muted'> = {
  PLAYER: 'muted',
  GAME_MASTER: 'arcane',
  ADMIN: 'gold',
};

const roleLabels: Record<string, string> = {
  PLAYER: 'Player',
  GAME_MASTER: 'Game Master',
  ADMIN: 'Admin',
};

export default function UsersListPage() {
  const { data: users, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load users</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ao-h2" style={{ marginBottom: 24 }}>Users Management</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Rune
            kind="search"
            size={16}
            color="var(--ink-faint)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ width: 180 }}
        >
          <option value="all">All Roles</option>
          <option value="PLAYER">Player</option>
          <option value="GAME_MASTER">Game Master</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ao-skeleton" style={{ height: 44, width: '100%' }} />
          ))}
        </div>
      ) : (
        <Panel>
          <Table
            columns={[
              { key: 'username', header: 'Username', render: (row) => row.username },
              { key: 'email', header: 'Email', render: (row) => row.email },
              {
                key: 'role',
                header: 'Role',
                render: (row) => (
                  <Chip tone={roleTones[row.role] || 'muted'}>
                    {roleLabels[row.role] || row.role}
                  </Chip>
                ),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (row) => formatDate(row.createdAt),
              },
            ]}
            data={filteredUsers || []}
            rowKey={(row) => row.id}
          />
          {filteredUsers?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-faint)' }}>
              No users found
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
