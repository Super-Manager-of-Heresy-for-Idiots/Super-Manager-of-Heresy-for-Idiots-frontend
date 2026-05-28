import { DashboardCard } from '@/components/admin/DashboardCard';
import { useUsers, useAdminTeams, useStatTypes, useItemTypes, useCharacterClasses, useCharacterRaces } from '@/hooks/useAdmin';

export default function AdminDashboardPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: teams, isLoading: teamsLoading } = useAdminTeams();
  const { data: statTypes, isLoading: statTypesLoading } = useStatTypes();
  const { data: itemTypes, isLoading: itemTypesLoading } = useItemTypes();
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const { data: races, isLoading: racesLoading } = useCharacterRaces();

  return (
    <div>
      <h1 className="ao-h2" style={{ marginBottom: 24 }}>Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        <DashboardCard
          title="Total Users"
          value={users?.length}
          glyph="shield"
          href="/admin/users"
          isLoading={usersLoading}
        />
        <DashboardCard
          title="Total Teams"
          value={teams?.length}
          glyph="helm"
          href="/admin/teams"
          isLoading={teamsLoading}
        />
        <DashboardCard
          title="Stat Types"
          value={statTypes?.length}
          glyph="scroll"
          href="/admin/stat-types"
          isLoading={statTypesLoading}
        />
        <DashboardCard
          title="Item Types"
          value={itemTypes?.length}
          glyph="sword"
          href="/admin/item-types"
          isLoading={itemTypesLoading}
        />
        <DashboardCard
          title="Character Classes"
          value={classes?.length}
          glyph="sigil-3"
          href="/admin/character-classes"
          isLoading={classesLoading}
        />
        <DashboardCard
          title="Character Races"
          value={races?.length}
          glyph="diamond"
          href="/admin/character-races"
          isLoading={racesLoading}
        />
      </div>
    </div>
  );
}
