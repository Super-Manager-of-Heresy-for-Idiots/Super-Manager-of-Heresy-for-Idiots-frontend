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
import type { NpcResponse } from '@/types';

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
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.npcMgr.overline')}</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.npcMgr.title')}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 120 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '40%', height: 14, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '60%', height: 18, marginBottom: 10 }} />
              <div className="ao-ph" style={{ width: '30%', height: 14 }} />
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
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.npcMgr.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.npcMgr.title')}</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {t('camp2.npcMgr.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>{t('camp2.npcMgr.newNpc')}</span>
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
              <span style={{ marginLeft: 6 }}>{t('camp2.npcMgr.newNpc')}</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {npcs.map((npc) => {
            const glyph = glyphForNpc(npc.id);
            return (
              <OrdoPanel key={npc.id} frame padding={0}>
                <div style={{ padding: 18 }}>
                  {/* Top row: icon box + name block + visibility */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Icon box */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        border: '1px solid var(--rule)',
                        background: 'var(--abyss)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: npc.isVisibleToPlayers ? 'none' : 'grayscale(1)',
                        opacity: npc.isVisibleToPlayers ? 1 : 0.5,
                      }}
                    >
                      <Rune kind={glyph} size={22} color="var(--gold)" />
                    </div>

                    {/* Name block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <CodexID>{npc.id.slice(0, 8).toUpperCase()}</CodexID>
                        <VisibilityToggle
                          visible={npc.isVisibleToPlayers}
                          onToggle={() => toggleVisibility(npc)}
                        />
                      </div>
                      <h5 className="ao-h5" style={{ marginTop: 4, color: 'var(--ink-bright)' }}>
                        {npc.name}
                      </h5>
                    </div>
                  </div>

                  {/* Two-column description grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                    {/* Public description */}
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--rule)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Rune kind="eye" size={10} color="var(--ink-faint)" />
                        <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>
                          {t('camp2.npcMgr.publicLabel')}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                        {npc.publicDescription || <span className="ao-italic" style={{ color: 'var(--ink-ghost)' }}>{t('camp2.npcMgr.noPublicDescription')}</span>}
                      </p>
                    </div>

                    {/* Private description */}
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(100,20,30,0.08)',
                        border: '1px solid rgba(140,40,50,0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Rune kind="lock" size={10} color="rgba(180,80,80,0.6)" />
                        <span className="ao-overline" style={{ fontSize: 8, color: 'rgba(180,80,80,0.6)' }}>
                          {t('camp2.npcMgr.privateLabel')}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
                        {npc.privateDescription || <span className="ao-italic" style={{ color: 'var(--ink-ghost)' }}>{t('camp2.npcMgr.noPrivateNotes')}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '12px 18px',
                    borderTop: '1px solid var(--hairline)',
                    background: 'var(--abyss)',
                  }}
                >
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="ao-input"
                value={formPublicDesc}
                onChange={(e) => setFormPublicDesc(e.target.value)}
                placeholder={t('camp2.npcMgr.field.publicDescPlaceholder')}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <OrdoField label={t('camp2.npcMgr.field.privateDesc')} hint={t('camp2.npcMgr.field.privateDescHint')}>
              <textarea
                className="ao-input"
                value={formPrivateDesc}
                onChange={(e) => setFormPrivateDesc(e.target.value)}
                placeholder={t('camp2.npcMgr.field.privateDescPlaceholder')}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className="ao-label" style={{ marginBottom: 0 }}>{t('camp2.npcMgr.field.visible')}</span>
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
