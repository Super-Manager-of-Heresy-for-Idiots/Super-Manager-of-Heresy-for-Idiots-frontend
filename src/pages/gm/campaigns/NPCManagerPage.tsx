import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrdoInterfaceIcon, OrdoPanel, Rune, EmptyVault, ErrorAltar } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle } from '@/components/narrative';
import {
  useCampaignNpcs,
  useSetNpcVisibility,
} from '@/hooks/useNpcs';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { NpcResponse } from '@/types';
import { NpcCreateDialog } from './NpcCreateDialog';
import s from './NPCManagerPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */


/* ── page ────────────────────────────────────────────────────── */

export default function NPCManagerPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: npcs, isLoading, error, refetch } = useCampaignNpcs(campaignId!);
  const visibilityMutation = useSetNpcVisibility();

  const [dialogOpen, setDialogOpen] = useState(false);

  const sourceLabel = (npc: NpcResponse): string | null => {
    if (npc.sourceType === 'CLASS_BASED') {
      const who = [npc.race?.name, npc.characterClass?.name].filter(Boolean).join(' ');
      const lvl = npc.level != null ? t('camp2.npcForm.levelShort', { n: npc.level }) : '';
      return [who, lvl].filter(Boolean).join(' · ') || null;
    }
    if (npc.sourceType === 'MONSTER_BASED') {
      return npc.sourceMonster?.name ?? t('camp2.npcForm.source.monster');
    }
    return null;
  };

  const toggleVisibility = (npc: NpcResponse) => {
    visibilityMutation.mutate({
      campaignId: campaignId!,
      npcId: npc.id,
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.npcMgr.overline')}</p>
            <h3 className={cn('ao-h3', s.title)}>{t('camp2.npcMgr.title')}</h3>
          </div>
        </div>
        <div className={s.skelList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW40H14)} />
              <div className={cn('ao-ph', s.phW60H18)} />
              <div className={cn('ao-ph', s.phW30H14)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div>
        <ErrorAltar
          title={t('camp2.npcMgr.loadError')}
          error={error}
          onRetry={() => refetch()}
          retryLabel={t('common.retry')}
        />
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp2.npcMgr.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp2.npcMgr.title')}</h3>
          <p className={cn('ao-italic', s.subtitle)}>
            {t('camp2.npcMgr.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => setDialogOpen(true)}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp2.npcMgr.newNpc')}</span>
        </button>
      </div>

      {/* NPC List */}
      {!npcs || npcs.length === 0 ? (
        <EmptyVault
          glyph="helm"
          title={t('camp2.npcMgr.empty.title')}
          body={t('camp2.npcMgr.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => setDialogOpen(true)}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp2.npcMgr.newNpc')}</span>
            </button>
          }
        />
      ) : (
        <div className={s.list}>
          {npcs.map((npc) => {
            const srcLabel = sourceLabel(npc);
            return (
              <OrdoPanel key={npc.id} frame padding={0}>
                <div className={s.cardPad}>
                  {/* Top row: icon box + name block + visibility */}
                  <div className={s.topRow}>
                    {/* Icon box */}
                    <div className={cn(s.iconBox, !npc.isVisibleToPlayers && s.dimmed)}>
                      <OrdoInterfaceIcon
                        icon={
                          npc.sourceType === 'MONSTER_BASED'
                            ? 'npc-monster-based'
                            : npc.sourceType === 'CLASS_BASED'
                              ? 'npc-class-based'
                              : 'npc-freeform'
                        }
                        size={22}
                        style={{ color: 'var(--gold)' }}
                      />
                    </div>

                    {/* Name block */}
                    <div className={s.nameBlock}>
                      <div className={s.idRow}>
                        <CodexID>{npc.id.slice(0, 8).toUpperCase()}</CodexID>
                        <VisibilityToggle
                          visible={npc.isVisibleToPlayers}
                          onToggle={() => toggleVisibility(npc)}
                        />
                      </div>
                      <h5 className={cn('ao-h5', s.npcName)}>
                        {npc.name}
                      </h5>
                      {srcLabel && (
                        <div className={s.sourceBadge}>
                          <Rune
                            kind={npc.sourceType === 'MONSTER_BASED' ? 'flame' : 'helm'}
                            size={10}
                            color="var(--ink-faint)"
                          />
                          <span>{srcLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-column description grid */}
                  <div className={cn('ao-rgrid', s.descGrid)}>
                    {/* Public description */}
                    <div className={s.descBox}>
                      <div className={s.descHead}>
                        <Rune kind="eye" size={10} color="var(--ink-faint)" />
                        <span className={cn('ao-overline', s.descLabel)}>
                          {t('camp2.npcMgr.publicLabel')}
                        </span>
                      </div>
                      <p className={s.descText}>
                        {npc.publicDescription || <span className={cn('ao-italic', s.descEmpty)}>{t('camp2.npcMgr.noPublicDescription')}</span>}
                      </p>
                    </div>

                    {/* Private description */}
                    <div className={s.descBoxPrivate}>
                      <div className={s.descHead}>
                        <Rune kind="lock" size={10} color="rgba(180,80,80,0.6)" />
                        <span className={cn('ao-overline', s.descLabelPrivate)}>
                          {t('camp2.npcMgr.privateLabel')}
                        </span>
                      </div>
                      <p className={s.descText}>
                        {npc.privateDescription || <span className={cn('ao-italic', s.descEmpty)}>{t('camp2.npcMgr.noPrivateNotes')}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className={s.cardFooter}>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => navigate(`/campaigns/${campaignId}/npcs/${npc.id}`)}
                  >
                    <Rune kind="scroll" size={10} /> {t('camp2.npcMgr.open')}
                  </button>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => toggleVisibility(npc)}
                    disabled={visibilityMutation.isPending}
                  >
                    <Rune kind={npc.isVisibleToPlayers ? 'lock' : 'eye'} size={10} />
                    {npc.isVisibleToPlayers ? ` ${t('camp2.npcMgr.hide')}` : ` ${t('camp2.npcMgr.reveal')}`}
                  </button>
                </div>
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <NpcCreateDialog campaignId={campaignId!} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
