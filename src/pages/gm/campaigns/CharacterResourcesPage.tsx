import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, EmptyVault, ErrorAltar } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { ResourcesPanel, SpellSlotsPanel } from '@/components/characters';
import { useCharacter, useCharacterResources, useModifyResource } from '@/hooks/useCharacter';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ResourceEntry } from '@/types';
import s from './CharacterResourcesPage.module.css';

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
      <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />

      {/* Header */}
      <div className={s.header}>
        <p className={cn('ao-overline', s.overlineArcane)}>{t('camp.resources.overline')}</p>
        <h3 className={cn('ao-h3', s.title)}>{t('camp.resources.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {character ? character.name : t('camp.resources.sub')}
        </p>
      </div>

      {isLoading ? (
        <OrdoPanel frame>
          <div className={s.loadingBox}>
            {t('camp.resources.loading')}
          </div>
        </OrdoPanel>
      ) : error ? (
        <OrdoPanel frame padding={0}>
          <ErrorAltar
            glyph="hex"
            title={t('camp.resources.error.title')}
            body={t('camp.resources.error.body')}
            error={error}
            onRetry={() => refetch()}
            retryLabel={t('camp.retry')}
          />
        </OrdoPanel>
      ) : resources.length === 0 ? (
        <OrdoPanel frame padding={0}>
          <EmptyVault glyph="hex" title={t('camp.resources.empty.title')} body={t('camp.resources.empty.body')} />
        </OrdoPanel>
      ) : (
        <div className={s.body}>
          <ResourcesPanel
            resources={resources}
            editable={canWrite}
            onModify={modify}
            pending={modifyResource.isPending}
          />
          {!canWrite && (
            <p className={cn('ao-italic', s.readonlyNote)}>
              {isDead ? t('camp.resources.readonly.dead') : t('camp.resources.readonly.viewer')}
            </p>
          )}
        </div>
      )}

      <SpellSlotsPanel characterId={characterId!} canManage={canWrite} className={s.slotsBlock} />
    </div>
  );
}
