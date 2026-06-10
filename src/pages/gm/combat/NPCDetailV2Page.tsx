import {
  OrdoPanel as Panel,
  OrdoChip as Chip,
  PanelHeader,
  StatBlock,
  EmptyVault,
  Rune,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { InlineEdit } from '@/components/combat/primitives';
import { AttitudeBadge, LinkedPanel, PortraitUploader } from '@/components/combat/kit';

interface PageProps {
  noStatblock?: boolean;
}

const ATTACKS = [
  { n: 'Посох-кадило', hit: '+4', dmg: '1d6+2', typeKey: 'combat.dmgType.bludgeon' },
  { n: 'Святое пламя', hit: '—', dmg: '2d8', typeKey: 'combat.dmgType.radiant' },
];

export default function NPCDetailV2Page({ noStatblock = false }: PageProps) {
  const t = useT();
  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.npc.title')}
        breadcrumb={t('combat.npc.breadcrumb')}
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone="gold" glyph="eye">{t('combat.npc.visible')}</Chip>
            <button className="ao-iconbtn" title={t('combat.npc.menu')}><Rune kind="dots" size={15} /></button>
          </div>
        }
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 22 }}>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Header */}
            <Panel frame padding={20}>
              <span className="ao-frame-c" />
              <div style={{ display: 'flex', gap: 18 }}>
                <PortraitUploader state="preview" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ao-overline" style={{ marginBottom: 8 }}>{t('combat.npc.publicProfile')}</div>
                  <InlineEdit heading value={t('combat.npc.name')} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <AttitudeBadge kind="friendly" />
                    <Chip glyph="sigil-3">{t('combat.npc.faction')}</Chip>
                    <Chip glyph="hex">{t('combat.npc.location')}</Chip>
                  </div>
                  <p className="ao-italic" style={{ fontSize: 14.5, marginTop: 12, marginBottom: 0, lineHeight: 1.55 }}>{t('combat.npc.publicDesc')}</p>
                </div>
              </div>
            </Panel>
            {/* Secrets */}
            <Panel padding={0} style={{ borderColor: 'rgba(107,42,42,0.6)' }}>
              <PanelHeader title={t('combat.npc.secrets')} glyph="lock" tone="ember" sub={t('combat.npc.secretsSub')} />
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{t('combat.npc.secretsBody')}</p>
              </div>
            </Panel>
            {/* Statblock */}
            {noStatblock ? (
              <Panel padding={0}>
                <PanelHeader title={t('combat.npc.statblock')} glyph="sword" />
                <EmptyVault
                  glyph="sword"
                  overline={t('combat.npc.noStatOverline')}
                  title={t('combat.npc.noStatTitle')}
                  body={t('combat.npc.noStatBody')}
                  action={<button className="ao-btn ao-btn--primary"><Rune kind="plus" size={11} /> {t('combat.npc.fillStat')}</button>}
                />
              </Panel>
            ) : (
              <Panel padding={0}>
                <PanelHeader title={t('combat.npc.statblock')} glyph="sword" sub={t('combat.npc.statblockSub')} right={<Chip tone="gold" glyph="check">{t('combat.npc.combatReady')}</Chip>} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {([
                      [t('combat.npc.stat.hp'), '18'],
                      [t('combat.npc.stat.ac'), '12'],
                      [t('combat.npc.stat.init'), '+1'],
                      [t('combat.npc.stat.speed'), t('combat.npc.speed.val')],
                      [t('combat.npc.stat.cr'), '1/2'],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="ao-stat" style={{ padding: '10px 6px' }}>
                        <div className="ao-stat-label">{l}</div>
                        <div className="ao-stat-value" style={{ fontSize: 26 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                    {([
                      ['СИЛ', 10, 0],
                      ['ЛОВ', 12, 1],
                      ['ТЕЛ', 13, 1],
                      ['ИНТ', 11, 0],
                      ['МДР', 16, 3],
                      ['ХАР', 14, 2],
                    ] as [string, number, number][]).map(([l, v, m]) => (
                      <StatBlock key={l} label={l} value={v} mod={m} />
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label className="ao-label">{t('combat.npc.attacks')}</label>
                      <button className="ao-btn ao-btn--sm"><Rune kind="plus" size={9} /> {t('combat.npc.addAttack')}</button>
                    </div>
                    <table className="ao-table">
                      <thead>
                        <tr>
                          <th>{t('combat.npc.col.name')}</th>
                          <th>{t('combat.npc.col.hit')}</th>
                          <th>{t('combat.npc.col.dmg')}</th>
                          <th>{t('combat.npc.col.type')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ATTACKS.map((a) => (
                          <tr key={a.n}>
                            <td style={{ color: 'var(--ink-bright)' }}>{a.n}</td>
                            <td className="ao-num">{a.hit}</td>
                            <td className="ao-num">{a.dmg}</td>
                            <td><span className="ao-codex">{t(a.typeKey)}</span></td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ display: 'inline-flex', gap: 4 }}>
                                <button className="ao-iconbtn" style={{ width: 24, height: 24 }}><Rune kind="cross" size={10} /></button>
                                <button className="ao-iconbtn" style={{ width: 24, height: 24, color: '#d8896a' }}><Rune kind="x" size={10} /></button>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LinkedPanel title={t('combat.npc.linkedQuests')} glyph="scroll" addLabel={t('combat.npc.linkQuest')} items={['Пропавший караван', 'Тени Ордена']} />
            <LinkedPanel title={t('combat.npc.linkedLocs')} glyph="hex" addLabel={t('combat.npc.linkLoc')} items={['Морнхейм', 'Часовня у тракта']} />
            <Panel padding={0}>
              <PanelHeader title={t('combat.npc.appearances')} glyph="sword" />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Засада на тракте', 'идёт · раунд 3'], ['Волки Пустоши', 'завершён · уцелел']].map(([n, s]) => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 11px', background: 'var(--abyss)', border: '1px solid var(--hairline)' }}>
                    <span style={{ fontSize: 13 }}>{n}</span>
                    <span className="ao-codex">{s}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </CombatBackdrop>
  );
}
