import { Users, ScrollText, Package, Swords, Crown } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { useUsers, useStatTypes, useItemTypes, useCharacterClasses, useCharacterRaces } from '@/hooks/useAdmin';

export default function AdminDashboardPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: statTypes, isLoading: statTypesLoading } = useStatTypes();
  const { data: itemTypes, isLoading: itemTypesLoading } = useItemTypes();
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const { data: races, isLoading: racesLoading } = useCharacterRaces();

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Users"
          value={users?.length}
          icon={<Users className="h-6 w-6" />}
          href="/admin/users"
          isLoading={usersLoading}
        />
        <DashboardCard
          title="Stat Types"
          value={statTypes?.length}
          icon={<ScrollText className="h-6 w-6" />}
          href="/admin/stat-types"
          isLoading={statTypesLoading}
        />
        <DashboardCard
          title="Item Types"
          value={itemTypes?.length}
          icon={<Package className="h-6 w-6" />}
          href="/admin/item-types"
          isLoading={itemTypesLoading}
        />
        <DashboardCard
          title="Character Classes"
          value={classes?.length}
          icon={<Swords className="h-6 w-6" />}
          href="/admin/character-classes"
          isLoading={classesLoading}
        />
        <DashboardCard
          title="Character Races"
          value={races?.length}
          icon={<Crown className="h-6 w-6" />}
          href="/admin/character-races"
          isLoading={racesLoading}
        />
      </div>
    </div>
  );
}
