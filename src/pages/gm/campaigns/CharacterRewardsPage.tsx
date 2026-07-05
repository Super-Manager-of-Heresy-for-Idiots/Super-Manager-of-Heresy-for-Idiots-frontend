import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { OrdoInterfaceIcon, OrdoPanel, PanelHeader, OrdoDivider } from '@/components/ordo';
import { useCharacterRewards } from '@/hooks/useLevelUp';
import { useCharacter } from '@/hooks/useCharacter';
import { REWARD_TYPE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import s from './CharacterRewardsPage.module.css';

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function CharacterRewardsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data, isLoading, error } = useCharacterRewards(characterId!);
  const { data: character } = useCharacter(campaignId!, characterId!);

  const back = () => navigate(`/campaigns/${campaignId}/characters/${characterId}`);

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.phTitle)} />
        <div className={cn('ao-ph', s.phSub)} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp.rewards.loadError')}
        </p>
        <button className="ao-btn" onClick={back}>{t('camp.back')}</button>
      </div>
    );
  }

  return (
    <div>
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.rewards.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp.rewards.title')}</h3>
          {character && (
            <p className={cn('ao-italic', s.metaLine)}>
              {character.name} · {t('camp.rewards.totalLvl', { level: data.totalLevel })}
            </p>
          )}
        </div>
        <BackLink to={`/campaigns/${campaignId}/characters/${characterId}`} label={t('camp2.back.character')} size="md" />
      </div>

      {data.classBreakdown.length === 0 ? (
        <div className={cn('ao-italic', s.emptyBlock)}>
          {t('camp.rewards.empty')}
        </div>
      ) : (
        data.classBreakdown.map((cls) => (
          <OrdoPanel key={cls.classId} frame padding={0} className={s.classPanel}>
            <PanelHeader
              title={cls.className}
              icon="class"
              tone="gold"
              sub={`${t('camp.rewards.classLevel', { level: cls.classLevel })}${cls.subclass ? ` · ${cls.subclass.name}` : ''}`}
            />
            <div className={s.classBody}>
              {cls.subclass && (
                <>
                  <div className={cn('ao-codex', s.subclassDesc)}>
                    {cls.subclass.description}
                  </div>
                  <OrdoDivider glyph="diamond" />
                </>
              )}
              {Object.keys(cls.rewardsByType || {}).length === 0 ? (
                <div className={cn('ao-italic', s.noRewards)}>
                  {t('camp.rewards.noClassRewards')}
                </div>
              ) : (
                Object.entries(cls.rewardsByType).map(([type, rewards]) => (
                  <div key={type} className={s.rewardGroup}>
                    <div className={cn('ao-overline', s.rewardGroupLabel)}>
                      {REWARD_TYPE_LABELS[type] || type}
                    </div>
                    {rewards.map((r, idx) => (
                      <div key={`${r.name}-${idx}`} className={s.rewardRow}>
                        <OrdoInterfaceIcon icon="reward" size={12} className={s.trophyIcon} />
                        <span className={s.rewardName}>{r.name}</span>
                        <span className={cn('ao-codex', s.rewardDate)}>
                          {formatDate(r.acquiredAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </OrdoPanel>
        ))
      )}
    </div>
  );
}
