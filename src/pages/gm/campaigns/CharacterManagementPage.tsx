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
import { xpForLevel, xpForNextLevel } from '@/types';

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
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '36%', height: 20, marginBottom: 16 }} />
        <div className="ao-ph" style={{ width: '64%', height: 12 }} />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.mgmt.overline')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? ''} />
          </div>
          <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 6 }}>
            {classLevelsLabel} · {className} · {t('camp.mgmt.owner', { name: character.ownerUsername })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canDelete && (
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setConfirmDelete(true)}
              style={{ color: 'var(--ember)', borderColor: 'var(--ember)' }}
            >
              <Rune kind="x" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{t('common.delete')}</span>
            </button>
          )}
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}`)}>
            <Rune kind="arrow-l" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>{t('camp.mgmt.campaign')}</span>
          </button>
        </div>
      </div>

      <OrdoPanel frame padding={0} style={{ marginBottom: 24 }}>
        <PanelHeader title={t('camp.mgmt.status')} glyph="helm" tone="gold" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
            <Bar value={character.currentHp ?? 0} max={character.maxHp ?? 0} tone="ember" height={7} />
            <span className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
              {character.currentHp ?? 0}/{character.maxHp ?? 0} HP
            </span>
          </div>
          <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
            <Bar value={xpProgressVal} max={xpProgressMax} tone="arcane" height={5} />
            <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {xpNext === Infinity
                ? `${character.experience.toLocaleString()} XP · MAX`
                : `${character.experience.toLocaleString()} / ${xpNext.toLocaleString()} XP`}
            </span>
          </div>
        </div>
      </OrdoPanel>

      {readyForLevelUp && canLevelUp && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '14px 18px',
            marginBottom: 18,
            border: '1px solid var(--gold)',
            background: 'rgba(212,180,120,0.08)',
          }}
        >
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.mgmt.levelUpAvailable')}</p>
            <p className="ao-italic" style={{ color: 'var(--ink-bright)', fontSize: 13, marginTop: 4 }}>
              {t('camp.mgmt.levelUpReady')}
            </p>
          </div>
          <button
            className="ao-btn ao-btn--primary"
            onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/level-up`)}
          >
            <Rune kind="flame" size={12} color="currentColor" />
            <span style={{ marginLeft: 6 }}>{t('camp.mgmt.levelUp')}</span>
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {tiles.map((tile) => (
          <button
            key={tile.to}
            className="ao-panel"
            onClick={() => navigate(tile.to)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 16,
              border: '1px solid var(--hairline)',
              background: 'var(--panel)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                border: '1px solid var(--rule)',
                background: 'var(--abyss)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Rune kind={tile.glyph} size={16} color="var(--ink-quiet)" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ color: 'var(--ink-bright)', fontSize: 14 }}>{tile.title}</span>
                {!tile.ready && (
                  <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>{t('camp.mgmt.todo')}</span>
                )}
              </span>
              <span className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, lineHeight: 1.35 }}>
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
