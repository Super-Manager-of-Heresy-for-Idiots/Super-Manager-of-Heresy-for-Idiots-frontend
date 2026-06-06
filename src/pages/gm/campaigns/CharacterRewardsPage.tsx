import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { OrdoPanel, PanelHeader, OrdoDivider } from '@/components/ordo';
import { useCharacterRewards } from '@/hooks/useLevelUp';
import { useCharacterV2 } from '@/hooks/useCharacterV2';
import { REWARD_TYPE_LABELS } from '@/types';

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function CharacterRewardsPage() {
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data, isLoading, error } = useCharacterRewards(characterId!);
  const { data: character } = useCharacterV2(campaignId!, characterId!);

  const back = () => navigate(`/campaigns/${campaignId}/characters/${characterId}`);

  if (isLoading) {
    return (
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 22, marginBottom: 12 }} />
        <div className="ao-ph" style={{ width: '60%', height: 14 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          Не удалось загрузить список наград.
        </p>
        <button className="ao-btn" onClick={back}>← Назад</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Codex of Reward</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Награды персонажа</h3>
          {character && (
            <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
              {character.name} · Total LVL {data.totalLevel}
            </p>
          )}
        </div>
        <button className="ao-btn ao-btn--ghost" onClick={back}>
          <ArrowLeft className="h-3 w-3" /> К персонажу
        </button>
      </div>

      {data.classBreakdown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }} className="ao-italic">
          У персонажа пока нет полученных наград.
        </div>
      ) : (
        data.classBreakdown.map((cls) => (
          <OrdoPanel key={cls.classId} frame padding={0} style={{ marginBottom: 16 }}>
            <PanelHeader
              title={cls.className}
              glyph="helm"
              tone="gold"
              sub={`Уровень ${cls.classLevel}${cls.subclass ? ` · ${cls.subclass.name}` : ''}`}
            />
            <div style={{ padding: 16 }}>
              {cls.subclass && (
                <>
                  <div className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginBottom: 10 }}>
                    {cls.subclass.description}
                  </div>
                  <OrdoDivider glyph="diamond" />
                </>
              )}
              {Object.keys(cls.rewardsByType || {}).length === 0 ? (
                <div className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
                  Нет наград для этого класса.
                </div>
              ) : (
                Object.entries(cls.rewardsByType).map(([type, rewards]) => (
                  <div key={type} style={{ marginTop: 12 }}>
                    <div className="ao-overline" style={{ marginBottom: 6 }}>
                      {REWARD_TYPE_LABELS[type] || type}
                    </div>
                    {rewards.map((r, idx) => (
                      <div
                        key={`${r.name}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 0',
                          borderBottom: '1px solid var(--hairline)',
                        }}
                      >
                        <Trophy className="h-3 w-3" style={{ color: 'var(--gold)' }} />
                        <span style={{ flex: 1, color: 'var(--ink-bright)' }}>{r.name}</span>
                        <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
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
