import { Users, ScrollText, Swords, ShieldCheck, Wand2, Dna } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { useUsers, useStatTypes, useCharacterClasses } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reference.api';
import { useSpells } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';

export default function AdminDashboardPage() {
  const t = useT();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: statTypes, isLoading: statTypesLoading } = useStatTypes();
  const { data: classes, isLoading: classesLoading } = useCharacterClasses();
  const speciesQuery = useQuery({
    queryKey: ['admin', 'species', 'dashboard'],
    queryFn: async () => (await referenceApi.getSpecies()).data ?? [],
  });
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
          title={t('adm.dashboard.characterClasses')}
          value={classes?.length}
          icon={<Swords className="h-6 w-6" />}
          href="/admin/character-classes"
          isLoading={classesLoading}
        />
        <DashboardCard
          title={t('nav.species')}
          value={speciesQuery.data?.length}
          icon={<Dna className="h-6 w-6" />}
          href="/admin/species"
          isLoading={speciesQuery.isLoading}
        />
        <DashboardCard
          title={t('nav.contentQuality')}
          value={classes?.length}
          icon={<ShieldCheck className="h-6 w-6" />}
          href="/admin/content-quality"
          isLoading={classesLoading}
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
