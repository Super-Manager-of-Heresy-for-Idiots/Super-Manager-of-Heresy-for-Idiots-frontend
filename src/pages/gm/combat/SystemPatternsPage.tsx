import { useState } from 'react';
import { OrdoPanel as Panel, ModalScene, EmptyVault, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import {
  SkeletonRow,
  SkeletonLine,
  DisabledWithTip,
  InlineEdit,
  FilterPill,
  ListToolbar,
} from '@/components/combat/primitives';
import { ToastCard, StateBanner } from '@/components/combat/kit';

function ConfirmDeleteModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <ModalScene open={open} onOpenChange={onOpenChange} danger codexId="DEL-QST-001" overline={t('combat.pat.confirmOverline')} title={t('combat.pat.confirmTitle')} sub={t('combat.pat.confirmSub')} width={520} rune="sigil-1" tone="var(--ember)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.55, textAlign: 'center' }}>{t('combat.pat.confirmBody')}</p>
        <div style={{ padding: '10px 14px', border: '1px solid rgba(179,70,26,0.45)', background: 'rgba(179,70,26,0.06)', display: 'flex', gap: 10 }}>
          <Rune kind="tri-inv" size={14} color="#d8896a" />
          <span style={{ fontSize: 12.5, color: '#d8896a' }}>{t('combat.pat.confirmWarn')}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => onOpenChange(false)}>{t('combat.pat.keep')}</button>
        <button className="ao-btn ao-btn--danger" style={{ flex: 1 }}><Rune kind="x" size={11} /> {t('combat.pat.deleteForever')}</button>
      </div>
    </ModalScene>
  );
}

export default function SystemPatternsPage() {
  const t = useT();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.preview.title')} breadcrumb={t('combat.preview.overline')} />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 1100 }}>
          <div>
            <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.pat.toasts')}</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <ToastCard tone="success" title={t('combat.pat.toast.applied')} body={t('combat.pat.toast.appliedBody')} />
              <ToastCard tone="error" title={t('combat.pat.toast.failed')} body={t('combat.pat.toast.failedBody')} action={<button className="ao-btn ao-btn--sm">{t('combat.pat.toast.retry')}</button>} />
              <ToastCard tone="turn" title={t('combat.pat.toast.turn')} body={t('combat.pat.toast.turnBody')} />
            </div>
          </div>
          <div>
            <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.pat.banners')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 880 }}>
              <StateBanner kind="paused" />
              <StateBanner kind="reconnect" />
            </div>
          </div>
          <div>
            <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.pat.skeletons')}</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Panel padding={0} style={{ width: 430 }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </Panel>
              <Panel padding={16} style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SkeletonLine w="50%" h={14} />
                <SkeletonLine w="90%" h={9} />
                <SkeletonLine w="75%" h={9} />
                <SkeletonLine w="100%" h={42} style={{ marginTop: 8 }} />
              </Panel>
            </div>
          </div>
          <div>
            <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.pat.disabled')}</div>
            <div style={{ display: 'flex', gap: 34, alignItems: 'flex-end', flexWrap: 'wrap', paddingTop: 60 }}>
              <DisabledWithTip primary label={t('combat.eb.startCombat')} tip={t('combat.pat.startTip')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InlineEdit value={t('combat.quest.name')} />
                <InlineEdit value={t('combat.quest.name')} editing />
              </div>
              <button className="ao-btn ao-btn--danger" onClick={() => setConfirmOpen(true)}>
                <Rune kind="x" size={11} /> {t('combat.lists.menu.delete')}
              </button>
            </div>
          </div>
          <div>
            <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.lists.notFoundTitle')}</div>
            <Panel padding={0}>
              <div style={{ padding: 16 }}>
                <ListToolbar search="королевский пир" count="0" filters={<FilterPill label={t('combat.lists.f.failed')} active count={0} />} />
              </div>
              <EmptyVault
                glyph="search"
                overline={t('combat.lists.notFoundOverline')}
                title={t('combat.lists.notFoundTitle')}
                body={t('combat.lists.notFoundBody')}
                action={<button className="ao-btn"><Rune kind="x" size={10} /> {t('combat.lists.resetFilters')}</button>}
              />
            </Panel>
          </div>
        </div>
      </div>
      <ConfirmDeleteModal open={confirmOpen} onOpenChange={setConfirmOpen} />
    </CombatBackdrop>
  );
}
