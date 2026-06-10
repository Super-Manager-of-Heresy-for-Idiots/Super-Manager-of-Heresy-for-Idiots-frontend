import { OrdoPanel as Panel, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { EncounterStatusBadge, AvatarStack } from '@/components/combat/kit';
import { ENC_LIST } from '@/components/combat/data';

export default function EncounterListPage() {
  const t = useT();
  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.list.title')}
        breadcrumb={t('combat.list.breadcrumb')}
        right={<button className="ao-btn ao-btn--primary"><Rune kind="plus" size={11} /> {t('combat.list.newCombat')}</button>}
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 22 }}>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {ENC_LIST.map((e) => (
            <Panel key={e.id} padding={0} className="cb-hoverable" style={{ cursor: 'pointer' }}>
              <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 46, height: 46, flexShrink: 0, border: '1px solid var(--rule-strong)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Rune kind="sword" size={20} color={e.status === 'ACTIVE' ? '#d8896a' : 'var(--ink-quiet)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="ao-h5" style={{ fontSize: 19 }}>{e.name}</span>
                    <EncounterStatusBadge status={e.status} round={e.round} />
                  </div>
                  <div className="ao-codex" style={{ marginTop: 6 }}>{e.meta}</div>
                </div>
                <button className="ao-iconbtn"><Rune kind="dots" size={14} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderTop: '1px solid var(--hairline)', background: 'rgba(0,0,0,0.2)' }}>
                <AvatarStack kinds={e.kinds} extra={e.extra} />
                <span style={{ flex: 1 }} />
                {e.status === 'ACTIVE' && <button className="ao-btn ao-btn--sm ao-btn--primary">{t('combat.list.openTracker')}</button>}
                {e.status === 'PAUSED' && <button className="ao-btn ao-btn--sm">{t('combat.list.resume')}</button>}
                {e.status === 'DRAFT' && <button className="ao-btn ao-btn--sm">{t('combat.list.editRoster')}</button>}
                {e.status === 'FINISHED' && <button className="ao-btn ao-btn--sm ao-btn--ghost">{t('combat.list.summary')}</button>}
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </CombatBackdrop>
  );
}
