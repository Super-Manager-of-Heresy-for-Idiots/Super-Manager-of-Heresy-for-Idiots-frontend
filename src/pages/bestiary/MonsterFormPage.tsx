import { useNavigate, useParams } from 'react-router-dom';
import MonsterFormBody from '@/components/bestiary/MonsterFormBody';
import { emptyMonsterForm, monsterToForm } from '@/components/bestiary/serialize';
import { scopeKey } from '@/components/bestiary/constants';
import { useT } from '@/i18n/I18nContext';
import {
  useAdminMonster,
  useBestiaryDictionaries,
  useCampaignMonster,
  useCreateAdminMonster,
  useCreateCampaignMonster,
  useCreateHomebrewMonster,
  useHomebrewMonster,
  useProficiencySkills,
  useUpdateAdminMonster,
  useUpdateCampaignMonster,
  useUpdateHomebrewMonster,
} from '@/hooks/useBestiary';
import type { MonsterRequest, MonsterScope } from '@/types';
import s from './MonsterFormPage.module.css';

const Loader = ({ label }: { label: string }) => (
  <div className={s.loader}>{label}</div>
);

export default function MonsterFormPage() {
  const navigate = useNavigate();
  const t = useT();
  const { monsterId, packageId, campaignId } = useParams();
  const scope: MonsterScope = campaignId ? 'CAMPAIGN' : packageId ? 'HOMEBREW' : 'SYSTEM';
  const isEdit = !!monsterId;

  const listPath =
    scope === 'CAMPAIGN' ? `/campaigns/${campaignId}/bestiary`
    : scope === 'HOMEBREW' ? `/gm/homebrew/${packageId}/bestiary`
    : '/admin/bestiary/monsters';

  const dictsQ = useBestiaryDictionaries(packageId);
  const skillsQ = useProficiencySkills();

  const adminQ = useAdminMonster(scope === 'SYSTEM' && isEdit ? monsterId : undefined);
  const hbQ = useHomebrewMonster(scope === 'HOMEBREW' && isEdit ? packageId : undefined, scope === 'HOMEBREW' && isEdit ? monsterId : undefined);
  const cmQ = useCampaignMonster(scope === 'CAMPAIGN' && isEdit ? campaignId : undefined, scope === 'CAMPAIGN' && isEdit ? monsterId : undefined);
  const existing = scope === 'SYSTEM' ? adminQ : scope === 'HOMEBREW' ? hbQ : cmQ;

  const createAdmin = useCreateAdminMonster();
  const updateAdmin = useUpdateAdminMonster();
  const createHb = useCreateHomebrewMonster(packageId ?? '');
  const updateHb = useUpdateHomebrewMonster(packageId ?? '');
  const createCm = useCreateCampaignMonster(campaignId ?? '');
  const updateCm = useUpdateCampaignMonster(campaignId ?? '');

  const submitting =
    createAdmin.isPending || updateAdmin.isPending ||
    createHb.isPending || updateHb.isPending ||
    createCm.isPending || updateCm.isPending;

  const handleSubmit = (req: MonsterRequest) => {
    const onSuccess = () => navigate(listPath);
    if (scope === 'SYSTEM') {
      if (isEdit) updateAdmin.mutate({ id: monsterId!, data: req }, { onSuccess });
      else createAdmin.mutate(req, { onSuccess });
    } else if (scope === 'HOMEBREW') {
      if (isEdit) updateHb.mutate({ id: monsterId!, data: req }, { onSuccess });
      else createHb.mutate(req, { onSuccess });
    } else {
      if (isEdit) updateCm.mutate({ id: monsterId!, data: req }, { onSuccess });
      else createCm.mutate(req, { onSuccess });
    }
  };

  if (dictsQ.isLoading || skillsQ.isLoading || (isEdit && existing.isLoading)) {
    return <Loader label={t('best.detail.loading')} />;
  }
  if (isEdit && existing.isError) {
    return <Loader label={t('best.detail.notFound')} />;
  }

  const initial = isEdit && existing.data ? monsterToForm(existing.data) : emptyMonsterForm();

  return (
    <MonsterFormBody
      initial={initial}
      dictionaries={dictsQ.data!}
      skills={skillsQ.data ?? []}
      scope={scope}
      contextLabel={t('best.form.context', { scope: t(scopeKey(scope)) })}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigate(listPath)}
    />
  );
}
