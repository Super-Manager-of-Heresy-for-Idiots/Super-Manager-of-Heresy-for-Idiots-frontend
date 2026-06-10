import { OrdoPanel as Panel, PanelHeader, Sigil, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { EncounterStatusBadge } from '@/components/combat/kit';

const DMG = [
  { name: 'Каэлен Морн', dealt: 47, taken: 18 },
  { name: 'Мира Тэн', dealt: 38, taken: 11 },
  { name: 'Эзра Полынь', dealt: 52, taken: 4 },
  { name: 'Торвальд Камнерук', dealt: 12, taken: 31 },
];

export default function CombatSummaryPage() {
  const t = useT();
  const maxD = Math.max(...DMG.map((d) => Math.max(d.dealt, d.taken)));
  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.sum.title')} breadcrumb={t('combat.sum.breadcrumb')} right={<EncounterStatusBadge status="FINISHED" />} />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Sigil size={64} glyph="sigil-3" color="var(--gold)" />
            <div className="ao-h3" style={{ marginTop: 12 }}>{t('combat.sum.victory')}</div>
            <div className="ao-italic" style={{ marginTop: 4, color: 'var(--ink-quiet)' }}>{t('combat.sum.chronicled')}</div>
          </div>
          <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {([
              [t('combat.sum.duration'), t('combat.sum.duration.val')],
              [t('combat.sum.rounds'), '6'],
              [t('combat.sum.foesDown'), t('combat.sum.foesDown.val')],
            ] as [string, string][]).map(([l, v]) => (
              <Panel key={l} frame style={{ textAlign: 'center', padding: '18px 12px' }}>
                <span className="ao-frame-c" />
                <div className="ao-overline">{l}</div>
                <div className="ao-h4" style={{ marginTop: 6 }}>{v}</div>
              </Panel>
            ))}
          </div>
          <Panel padding={0}>
            <PanelHeader title={t('combat.sum.damageSummary')} glyph="sword" sub={t('combat.sum.damageSub')} />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DMG.map((d) => (
                <div key={d.name} className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-bright)' }}>{d.name}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="ao-codex">{t('combat.sum.dealt')}</span>
                      <span className="ao-num" style={{ fontSize: 13, color: '#7a9866' }}>{d.dealt}</span>
                    </div>
                    <div className="ao-bar" style={{ marginTop: 3 }}>
                      <div style={{ width: `${(d.dealt / maxD) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3d5a44, #7a9866)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="ao-codex">{t('combat.sum.taken')}</span>
                      <span className="ao-num" style={{ fontSize: 13, color: '#d8896a' }}>{d.taken}</span>
                    </div>
                    <div className="ao-bar" style={{ marginTop: 3 }}>
                      <div style={{ width: `${(d.taken / maxD) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7d2f10, #b3461a)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--rule)' }}>
              <button className="ao-btn"><Rune kind="book" size={12} /> {t('combat.sum.combatLog')}</button>
              <span style={{ flex: 1 }} />
              <button className="ao-btn ao-btn--primary ao-btn--lg"><Rune kind="hex" size={13} /> {t('combat.sum.genLoot')}</button>
            </div>
          </Panel>
        </div>
      </div>
    </CombatBackdrop>
  );
}
