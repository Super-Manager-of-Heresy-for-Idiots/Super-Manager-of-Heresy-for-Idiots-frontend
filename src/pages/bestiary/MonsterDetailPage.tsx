import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { BackLink } from '@/components/campaigns';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import MonsterStatblock from '@/components/bestiary/MonsterStatblock';
import {
  useAdminMonster,
  useCampaignMonster,
  useHomebrewMonster,
  usePublicMonster,
} from '@/hooks/useBestiary';
import { cn } from '@/lib/utils';
import s from './MonsterDetailPage.module.css';

type Source = 'admin' | 'homebrew' | 'campaign' | 'public';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className={s.frame}>
    <div className={s.inner}>{children}</div>
  </div>
);

export default function MonsterDetailPage({ source }: { source: Source }) {
  const navigate = useNavigate();
  const t = useT();
  const { monsterId, packageId, campaignId } = useParams();

  const admin = useAdminMonster(source === 'admin' ? monsterId : undefined);
  const homebrew = useHomebrewMonster(source === 'homebrew' ? packageId : undefined, source === 'homebrew' ? monsterId : undefined);
  const campaign = useCampaignMonster(source === 'campaign' ? campaignId : undefined, source === 'campaign' ? monsterId : undefined);
  const pub = usePublicMonster(source === 'public' ? monsterId : undefined);

  const query = source === 'admin' ? admin : source === 'homebrew' ? homebrew : source === 'campaign' ? campaign : pub;
  const monster = query.data;

  const role = useAuthStore((s) => s.user?.role);
  const isGM = role === 'GAME_MASTER' || role === 'ADMIN';
  // Campaign monsters are readable by every member, but only GMs may edit.
  const canEdit = source === 'admin' || source === 'homebrew' || (source === 'campaign' && isGM);

  return (
    <Frame>
      <div className={s.toolbar}>
        <BackLink label={t('best.com.back')} />
        <div className={s.spacer} />
        {canEdit && monster && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => navigate('edit')}><Pencil size={13} /> {t('best.com.edit')}</button>
        )}
      </div>

      {query.isLoading && (
        <div className={s.status}>{t('best.detail.loading')}</div>
      )}
      {query.isError && (
        <div className={cn('ao-panel', s.notFound)}>
          {t('best.detail.notFound')}
        </div>
      )}
      {monster && <MonsterStatblock monster={monster} />}
    </Frame>
  );
}
