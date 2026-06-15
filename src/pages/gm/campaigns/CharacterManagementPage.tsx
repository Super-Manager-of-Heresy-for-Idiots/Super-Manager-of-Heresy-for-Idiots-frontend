import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, Bar } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useCharacter, useDeleteCharacter } from '@/hooks/useCharacter';
import { useLevelUpOptions } from '@/hooks/useLevelUp';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { xpForLevel, xpForNextLevel } from '@/types';
import s from './CharacterManagementPage.module.css';

interface ManagementTile {
  title: string;
  body: string;
  glyph: string;
  to: string;
  ready: boolean;
}

export default function CharacterManagementPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character, isLoading, error, refetch } = useCharacter(campaignId!, characterId!);
  const { user } = useAuthStore();
  const { data: levelUpOptions } = useLevelUpOptions(characterId!);
  const deleteCharacter = useDeleteCharacter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tiles = useMemo<ManagementTile[]>(() => {
    const base = `/campaigns/${campaignId}/characters/${characterId}`;
    return [
      {
        title: t('camp.mgmt.tile.sheet.title'),
        body: t('camp.mgmt.tile.sheet.body'),
        glyph: 'book',
        to: `${base}/sheet`,
        ready: true,
      },
      {
        title: t('camp.mgmt.tile.arsenal.title'),
        body: t('camp.mgmt.tile.arsenal.body'),
        glyph: 'sword',
        to: `${base}/inventory`,
        ready: true,
      },
      {
        title: t('camp.mgmt.tile.wallet.title'),
        body: t('camp.mgmt.tile.wallet.body'),
        glyph: 'coin',
        to: `${base}/wallet`,
        ready: true,
      },
      {
        title: t('camp.mgmt.tile.resources.title'),
        body: t('camp.mgmt.tile.resources.body'),
        glyph: 'hex',
        to: `${base}/resources`,
        ready: false,
      },
    ];
  }, [campaignId, characterId, t]);

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
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp.mgmt.loadError')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
      </div>
    );
  }

  const className = character.classLevels?.[0]?.className ?? t('camp.mgmt.unknownClass');
  const isOwner = user?.id === character.ownerId;
  const isPrivileged = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  const canLevelUp = isOwner || isPrivileged;
  const canDelete = isOwner || isPrivileged;

  const handleDelete = () => {
    if (!campaignId || !characterId) return;
    deleteCharacter.mutate(
      { campaignId, characterId },
      {
        onSuccess: () => {
          setConfirmDelete(false);
          navigate(`/campaigns/${campaignId}`);
        },
      },
    );
  };
  const readyForLevelUp = !!levelUpOptions && levelUpOptions.xpToNextLevel === 0;
  const xpPrev = xpForLevel(character.totalLevel);
  const xpNext = xpForNextLevel(character.totalLevel);
  const xpProgressMax = xpNext === Infinity ? Math.max(1, character.experience) : xpNext - xpPrev;
  const xpProgressVal = xpNext === Infinity ? xpProgressMax : Math.max(0, character.experience - xpPrev);
  const classLevelsLabel = character.classLevels?.length
    ? character.classLevels.map((cl) => `${cl.className} ${cl.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;

  return (
    <div>
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.mgmt.overline')}</p>
          <div className={s.titleRow}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? ''} />
          </div>
          <p className={cn('ao-italic', s.metaLine)}>
            {classLevelsLabel} · {className} · {t('camp.mgmt.owner', { name: character.ownerUsername })}
          </p>
        </div>
        <div className={s.headActions}>
          {canDelete && (
            <button
              className={cn('ao-btn ao-btn--ghost', s.deleteBtn)}
              onClick={() => setConfirmDelete(true)}
            >
              <Rune kind="x" size={14} color="currentColor" />
              <span className={s.ml6}>{t('common.delete')}</span>
            </button>
          )}
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}`)}>
            <Rune kind="arrow-l" size={14} color="currentColor" />
            <span className={s.ml6}>{t('camp2.back.campaign')}</span>
          </button>
        </div>
      </div>

      <OrdoPanel frame padding={0} className={s.statusPanel}>
        <PanelHeader title={t('camp.mgmt.status')} glyph="helm" tone="gold" />
        <div className={s.statusBody}>
          <div className={cn('ao-rgrid', s.barRow)}>
            <Bar value={character.currentHp ?? 0} max={character.maxHp ?? 0} tone="ember" height={7} />
            <span className={cn('ao-codex', s.hpLabel)}>
              {character.currentHp ?? 0}/{character.maxHp ?? 0} HP
            </span>
          </div>
          <div className={cn('ao-rgrid', s.barRow)}>
            <Bar value={xpProgressVal} max={xpProgressMax} tone="arcane" height={5} />
            <span className={cn('ao-codex', s.xpLabel)}>
              {xpNext === Infinity
                ? `${character.experience.toLocaleString()} XP · MAX`
                : `${character.experience.toLocaleString()} / ${xpNext.toLocaleString()} XP`}
            </span>
          </div>
        </div>
      </OrdoPanel>

      {readyForLevelUp && canLevelUp && (
        <div className={s.levelUpBanner}>
          <div>
            <p className={cn('ao-overline', s.overlineGold)}>{t('camp.mgmt.levelUpAvailable')}</p>
            <p className={cn('ao-italic', s.levelUpReady)}>
              {t('camp.mgmt.levelUpReady')}
            </p>
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

      <div className={s.tileGrid}>
        {tiles.map((tile) => (
          <button
            key={tile.to}
            className={cn('ao-panel', s.tile)}
            onClick={() => navigate(tile.to)}
          >
            <span className={s.tileIcon}>
              <Rune kind={tile.glyph} size={16} color="var(--ink-quiet)" />
            </span>
            <span className={s.tileMain}>
              <span className={s.tileTitleRow}>
                <span className={s.tileTitle}>{tile.title}</span>
                {!tile.ready && (
                  <span className={cn('ao-overline', s.tileTodo)}>{t('camp.mgmt.todo')}</span>
                )}
              </span>
              <span className={cn('ao-italic', s.tileBody)}>
                {tile.body}
              </span>
            </span>
            <Rune kind="chev-r" size={14} color="var(--ink-faint)" />
          </button>
        ))}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.mgmt.delete.title', { name: character.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.mgmt.delete.body')}
            </AlertDialogDescription>
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
