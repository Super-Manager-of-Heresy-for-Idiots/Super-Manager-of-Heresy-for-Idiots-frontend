import { useState } from 'react';
import { useT } from '@/i18n/I18nContext';
import { useCharacterFeats, useAddFeat, useRemoveFeat } from '@/hooks/useCharacter';
import { useFeats } from '@/hooks/useContentCatalog';

interface Props {
  campaignId: string;
  characterId: string;
  /** Owner / GM / admin may add & remove; others see a read-only list. */
  canManage: boolean;
}

/**
 * A character's feats (structured character_feats, S1). Adding a feat auto-provisions any feat-bound
 * resources server-side. Degrades to an empty note when the character has no feats yet.
 */
export function CharacterFeatsPanel({ campaignId, characterId, canManage }: Props) {
  const t = useT();
  const { data: feats } = useCharacterFeats(campaignId, characterId);
  const { data: catalog } = useFeats(campaignId);
  const addFeat = useAddFeat();
  const removeFeat = useRemoveFeat();
  const [selected, setSelected] = useState('');

  const list = feats ?? [];
  const busy = addFeat.isPending || removeFeat.isPending;

  return (
    <div className="ao-col ao-gap-8">
      <div className="ao-overline">{t('camp2.folio.feats.title')}</div>
      {list.length === 0 ? (
        <span className="ao-codex">{t('camp2.folio.feats.empty')}</span>
      ) : (
        <div className="ao-col ao-gap-6">
          {list.map((f) => (
            <div key={f.id} className="ao-row ao-between ao-gap-8">
              <span>
                {f.featName ?? f.featId}
                <span className="ao-codex"> · {f.source}</span>
              </span>
              {canManage && (
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  disabled={busy}
                  onClick={() => removeFeat.mutate({ campaignId, characterId, featId: f.featId })}
                >
                  {t('camp2.folio.feats.remove')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && (
        <div className="ao-row ao-gap-8">
          <select className="ao-input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">{t('camp2.folio.feats.pick')}</option>
            {(catalog ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            className="ao-btn ao-btn--primary ao-btn--sm"
            disabled={!selected || busy}
            onClick={() => {
              addFeat.mutate({ campaignId, characterId, featId: selected });
              setSelected('');
            }}
          >
            {t('camp2.folio.feats.add')}
          </button>
        </div>
      )}
    </div>
  );
}
