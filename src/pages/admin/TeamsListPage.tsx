import { Panel, Table, Button } from '@/components/ao';
import { formatDate } from '@/lib/ao-utils';
import { useAdminTeams } from '@/hooks/useAdmin';

export default function TeamsListPage() {
  const { data: teams, isLoading, error, refetch } = useAdminTeams();

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load teams</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ao-h2" style={{ marginBottom: 24 }}>Teams Management</h1>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ao-skeleton" style={{ height: 44, width: '100%' }} />
          ))}
        </div>
      ) : (
        <Panel>
          <Table
            columns={[
              { key: 'name', header: 'Team Name', render: (row) => row.name },
              { key: 'gm', header: 'Game Master', render: (row) => row.gameMaster?.username || 'N/A' },
              { key: 'members', header: 'Members', render: (row) => String(row.members?.length || row.memberCount || 0) },
              { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
            ]}
            data={teams || []}
            rowKey={(row) => row.id}
          />
          {(!teams || teams.length === 0) && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ink-faint)' }}>
              No teams found
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
