import { Suspense, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { CharStatusBadge, SectionTabs } from '@/components/campaigns';
import { Bar, Rune } from '@/components/ordo';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { CHARACTER_TABS } from '@/config/campaignSections';
import { useCampaignRole } from '@/hooks/useCampaignRole';
import { useCharacter, useDeleteCharacter } from '@/hooks/useCharacter';
import { useLevelUpOptions } from '@/hooks/useLevelUp';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import { xpForLevel, xpForNextLevel } from '@/types';
import { PageFallback } from './PageFallback';
import s from './CharacterLayout.module.css';

/**
 * Shell for `/campaigns/:campaignId/characters/:characterId/*`.
 *
 * Replaces the old hub page that existed only to link four sub-pages: the
 * folio is now the index route and the sub-pages are tabs, so a player reaches
 * their sheet in one click instead of four. Identity, vitals, the level-up
 * banner and deletion live here, next to every tab that needs them.
 */
export function CharacterLayout() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character, isLoading, error, refetch } = useCharacter(campaignId!, characterId!);
  const { data: levelUpOptions } = useLevelUpOptions(characterId!);
  const { isGm, userId } = useCampaignRole();
  const deleteCharacter = useDeleteCharacter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.phTitle)} />
        <div className={cn('ao-ph', s.phSub)} />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>{t('camp.mgmt.loadError')}</p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
        )}
      </div>
    );
  }

  const isOwner = userId === character.ownerId;
  const canManage = isOwner || isGm;
  const className = character.classLevels?.[0]?.className ?? t('camp.mgmt.unknownClass');
  const classLevelsLabel = character.classLevels?.length
    ? character.classLevels.map((cl) => `${cl.className} ${cl.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;

  const readyForLevelUp = !!levelUpOptions && levelUpOptions.xpToNextLevel === 0;
  const xpPrev = xpForLevel(character.totalLevel);
  const xpNext = xpForNextLevel(character.totalLevel);
  const xpProgressMax = xpNext === Infinity ? Math.max(1, character.experience) : xpNext - xpPrev;
  const xpProgressVal = xpNext === Infinity ? xpProgressMax : Math.max(0, character.experience - xpPrev);

  const handleDelete = () => {
    deleteCharacter.mutate(
      { campaignId: campaignId!, characterId: characterId! },
      {
        onSuccess: () => {
          setConfirmDelete(false);
          navigate(`/campaigns/${campaignId}`);
        },
      },
    );
  };

  return (
    <div>
      <div className={s.head}>
        <div>
          <div className={s.titleRow}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? ''} />
          </div>
          <p className={cn('ao-italic', s.meta)}>
            {classLevelsLabel} · {className} · {t('camp.mgmt.owner', { name: character.ownerUsername })}
          </p>
        </div>
        {canManage && (
          <button className={cn('ao-btn ao-btn--ghost', s.deleteBtn)} onClick={() => setConfirmDelete(true)}>
            <Rune kind="x" size={14} color="currentColor" />
            <span className={s.ml6}>{t('common.delete')}</span>
          </button>
        )}
      </div>

      <div className={s.bars}>
        <div className={s.barCell}>
          <Bar value={character.currentHp ?? 0} max={character.maxHp ?? 0} tone="ember" height={7} />
          <span className={cn('ao-codex', s.hpLabel)}>
            {character.currentHp ?? 0}/{character.maxHp ?? 0} HP
          </span>
        </div>
        <div className={s.barCell}>
          <Bar value={xpProgressVal} max={xpProgressMax} tone="arcane" height={5} />
          <span className={cn('ao-codex', s.xpLabel)}>
            {xpNext === Infinity
              ? `${character.experience.toLocaleString()} XP · MAX`
              : `${character.experience.toLocaleString()} / ${xpNext.toLocaleString()} XP`}
          </span>
        </div>
      </div>

      {readyForLevelUp && canManage && (
        <div className={s.levelUpBanner}>
          <div>
            <p className={cn('ao-overline', s.overlineGold)}>{t('camp.mgmt.levelUpAvailable')}</p>
            <p className={cn('ao-italic', s.levelUpReady)}>{t('camp.mgmt.levelUpReady')}</p>
          </div>
          <button
            className="ao-btn ao-btn--primary"
            onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/level-up`)}
          >
            <Rune kind="flame" size={12} color="currentColor" />
            <span className={s.ml6}>{t('camp.mgmt.levelUp')}</span>
          </button>
        </div>
      )}

      <SectionTabs sections={CHARACTER_TABS} labelKey="camp.char.tabs.label" />

      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.mgmt.delete.title', { name: character.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('camp.mgmt.delete.body')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCharacter.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCharacter.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCharacter.isPending ? t('camp.mgmt.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
