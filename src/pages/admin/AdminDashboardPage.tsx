import { Users, ScrollText, Package, Swords, Crown, Wand2 } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { useUsers, useStatTypes, useItemTypes, useCharacterClasses, useCharacterRaces } from '@/hooks/useAdmin';
import { useSpells } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';

export default function AdminDashboardPage() {
  const t = useT();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: statTypes, isLoading: statTypesLoading } = useStatTypes();
  const { data: itemTypes, isLoading: itemTypesLoading } = useItemTypes();
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const { data: races, isLoading: racesLoading } = useCharacterRaces();
  const { data: spells, isLoading: spellsLoading } = useSpells();

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">{t('adm.dashboard.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title={t('adm.dashboard.totalUsers')}
          value={users?.length}
          icon={<Users className="h-6 w-6" />}
          href="/admin/users"
          isLoading={usersLoading}
        />
        <DashboardCard
          title={t('adm.dashboard.statTypes')}
          value={statTypes?.length}
          icon={<ScrollText className="h-6 w-6" />}
          href="/admin/stat-types"
          isLoading={statTypesLoading}
        />
        <DashboardCard
          title={t('adm.dashboard.itemTypes')}
          value={itemTypes?.length}
          icon={<Package className="h-6 w-6" />}
          href="/admin/item-types"
          isLoading={itemTypesLoading}
        />
        <DashboardCard
          title={t('adm.dashboard.characterClasses')}
          value={classes?.length}
          icon={<Swords className="h-6 w-6" />}
          href="/admin/character-classes"
          isLoading={classesLoading}
        />
        <DashboardCard
          title={t('adm.dashboard.characterRaces')}
          value={races?.length}
          icon={<Crown className="h-6 w-6" />}
          href="/admin/character-races"
          isLoading={racesLoading}
        />
        <DashboardCard
          title={t('adm.dashboard.spells')}
          value={spells?.length}
          icon={<Wand2 className="h-6 w-6" />}
          href="/admin/spells"
          isLoading={spellsLoading}
        />
      </div>
    </div>
  );
}
