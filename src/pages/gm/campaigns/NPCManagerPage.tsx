import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, Rune, OrdoField, EmptyVault } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle } from '@/components/narrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useCampaignNpcs,
  useCreateNpc,
  useSetNpcVisibility,
} from '@/hooks/useNpcs';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { NpcResponse } from '@/types';
import s from './NPCManagerPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

const GLYPH_POOL = ['helm', 'shield', 'sigil-1', 'sigil-2', 'sigil-3', 'flame', 'sword', 'eye'];

function glyphForNpc(id: string): string {
  const idx = id.charCodeAt(0) % GLYPH_POOL.length;
  return GLYPH_POOL[idx];
}

/* ── page ────────────────────────────────────────────────────── */

export default function NPCManagerPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: npcs, isLoading, error, refetch } = useCampaignNpcs(campaignId!);
  const createMutation = useCreateNpc();
  const visibilityMutation = useSetNpcVisibility();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPublicDesc, setFormPublicDesc] = useState('');
  const [formPrivateDesc, setFormPrivateDesc] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  const resetForm = () => {
    setFormName('');
    setFormPublicDesc('');
    setFormPrivateDesc('');
    setFormVisible(true);
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        campaignId: campaignId!,
        data: {
          name: formName,
          publicDescription: formPublicDesc || undefined,
          privateDescription: formPrivateDesc || undefined,
          isVisibleToPlayers: formVisible,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  const toggleVisibility = (npc: NpcResponse) => {
    visibilityMutation.mutate({
      campaignId: campaignId!,
      npcId: npc.id,
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  const backTo = `/campaigns/${campaignId}`;
  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
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
        <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp2.npcMgr.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.campaign')} className={s.backLink} />
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
          onClick={() => { resetForm(); setDialogOpen(true); }}
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
            <button className="ao-btn ao-btn--primary" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp2.npcMgr.newNpc')}</span>
            </button>
          }
        />
      ) : (
        <div className={s.list}>
          {npcs.map((npc) => {
            const glyph = glyphForNpc(npc.id);
            return (
              <OrdoPanel key={npc.id} frame padding={0}>
                <div className={s.cardPad}>
                  {/* Top row: icon box + name block + visibility */}
                  <div className={s.topRow}>
                    {/* Icon box */}
                    <div className={cn(s.iconBox, !npc.isVisibleToPlayers && s.dimmed)}>
                      <Rune kind={glyph} size={22} color="var(--gold)" />
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.npcMgr.dialog.title')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('camp2.npcMgr.field.name')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('camp2.npcMgr.field.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('camp2.npcMgr.field.publicDesc')} hint={t('camp2.npcMgr.field.publicDescHint')}>
              <textarea
                value={formPublicDesc}
                onChange={(e) => setFormPublicDesc(e.target.value)}
                placeholder={t('camp2.npcMgr.field.publicDescPlaceholder')}
                rows={3}
                className={cn('ao-input', s.resizeV)}
              />
            </OrdoField>

            <OrdoField label={t('camp2.npcMgr.field.privateDesc')} hint={t('camp2.npcMgr.field.privateDescHint')}>
              <textarea
                value={formPrivateDesc}
                onChange={(e) => setFormPrivateDesc(e.target.value)}
                placeholder={t('camp2.npcMgr.field.privateDescPlaceholder')}
                rows={3}
                className={cn('ao-input', s.resizeV)}
              />
            </OrdoField>

            <label className={s.checkRow}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className={cn('ao-label', s.checkLabel)}>{t('camp2.npcMgr.field.visible')}</span>
            </label>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('camp2.npcMgr.withhold')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!formName || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('camp2.npcMgr.inscribe')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
