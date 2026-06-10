import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import MonsterStatblock from '@/components/bestiary/MonsterStatblock';
import {
  useAdminMonster,
  useCampaignMonster,
  useHomebrewMonster,
  usePublicMonster,
} from '@/hooks/useBestiary';

type Source = 'admin' | 'homebrew' | 'campaign' | 'public';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100vh', background: 'var(--stone)', padding: 'clamp(16px, 4vw, 48px) clamp(12px, 4vw, 40px)' }}>
    <div style={{ maxWidth: 920, margin: '0 auto' }}>{children}</div>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(-1)}><ChevronLeft size={14} /> {t('best.com.back')}</button>
        <div style={{ flex: 1 }} />
        {canEdit && monster && (
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => navigate('edit')}><Pencil size={13} /> {t('best.com.edit')}</button>
        )}
      </div>

      {query.isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{t('best.detail.loading')}</div>
      )}
      {query.isError && (
        <div className="ao-panel" style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>
          {t('best.detail.notFound')}
        </div>
      )}
      {monster && <MonsterStatblock monster={monster} />}
    </Frame>
  );
}
