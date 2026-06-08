import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, EmptyVault } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { ResourcesPanel } from '@/components/characters';
import { useCharacter, useCharacterResources, useModifyResource } from '@/hooks/useCharacter';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import type { ResourceEntry } from '@/types';

export default function CharacterResourcesPage() {
  const t = useT();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();

  const { data: character } = useCharacter(campaignId!, characterId!);
  const { data, isLoading, error, refetch } = useCharacterResources(campaignId!, characterId!);
  const modifyResource = useModifyResource();

  const resources = useMemo<ResourceEntry[]>(() => data ?? [], [data]);

  const isOwner = !!user && !!character && user.id === character.ownerId;
  // The Chronicler (GM) — and the admin — may adjust any character's resources.
  const isChronicler = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  const isDead = character?.status === 'DEAD';
  const canWrite = (isOwner || isChronicler) && !isDead;

  const backTo = `/campaigns/${campaignId}/characters/${characterId}`;

  function modify(resourceId: string, delta: number) {
    if (!campaignId || !characterId) return;
    modifyResource.mutate({ campaignId, characterId, resourceId, delta });
  }

  return (
    <div>
      <BackLink to={backTo} label={t('camp.backToCharacter')} style={{ marginBottom: 12 }} />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <p className="ao-overline" style={{ color: 'var(--arcane)' }}>{t('camp.resources.overline')}</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp.resources.title')}</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 6 }}>
          {character ? character.name : t('camp.resources.sub')}
        </p>
      </div>

      {isLoading ? (
        <OrdoPanel frame>
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
            {t('camp.resources.loading')}
          </div>
        </OrdoPanel>
      ) : error ? (
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="hex" title={t('camp.resources.error.title')} body={t('camp.resources.error.body')} />
          <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
            <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => refetch()}>
              {t('camp.retry')}
            </button>
          </div>
        </OrdoPanel>
      ) : resources.length === 0 ? (
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="hex" title={t('camp.resources.empty.title')} body={t('camp.resources.empty.body')} />
        </OrdoPanel>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <ResourcesPanel
            resources={resources}
            editable={canWrite}
            onModify={modify}
            pending={modifyResource.isPending}
          />
          {!canWrite && (
            <p
              className="ao-italic"
              style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 10, textAlign: 'center' }}
            >
              {isDead ? t('camp.resources.readonly.dead') : t('camp.resources.readonly.viewer')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
