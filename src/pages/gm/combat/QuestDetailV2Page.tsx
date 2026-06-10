import { useState } from 'react';
import {
  OrdoPanel as Panel,
  OrdoChip as Chip,
  OrdoDivider as Divider,
  OrdoField as Field,
  PanelHeader,
  ModalScene,
  Rune,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Tabs, InlineEdit, VisibilityEye } from '@/components/combat/primitives';
import { LinkedPanel } from '@/components/combat/kit';
import { RarityBadge } from '@/components/items/RarityBadge';
import { rarityHue } from '@/components/combat/data';

/* ── Add reward modal ────────────────────────────────────────── */

function AddRewardModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const [tab, setTab] = useState('item');
  return (
    <ModalScene open={open} onOpenChange={onOpenChange} codexId="QST-RWD-007" overline={t('combat.reward.overline')} title={t('combat.reward.title')} sub={t('combat.reward.sub')} width={560}>
      <Tabs active={tab} onChange={setTab} items={[{ id: 'item', label: t('combat.reward.tabItem') }, { id: 'cur', label: t('combat.reward.tabCur') }]} />
      {tab === 'item' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <Field label={t('combat.reward.fromCatalog')}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}><Rune kind="search" size={13} /></span>
              <input className="ao-input" placeholder={t('combat.reward.typeName')} style={{ paddingLeft: 32 }} defaultValue="звёздн" />
            </div>
          </Field>
          <div style={{ border: '1px solid var(--rule)', background: 'var(--abyss)' }}>
            {[{ n: 'Меч из звёздной стали', r: 'RARE' }, { n: 'Звёздная пыль (флакон)', r: 'UNCOMMON' }].map((x, i) => (
              <div key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i === 0 ? '1px solid var(--hairline)' : 'none', background: i === 0 ? 'rgba(176,141,78,0.07)' : 'transparent', cursor: 'pointer' }}>
                <Rune kind="square-rot" size={12} color={rarityHue(x.r)} />
                <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-bright)' }}>{x.n}</span>
                <RarityBadge rarity={x.r} size="sm" />
              </div>
            ))}
          </div>
          <Field label={t('combat.reward.qty')}><input className="ao-input" defaultValue="1" style={{ width: 100 }} /></Field>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('combat.reward.sumOrFormula')} hint={t('combat.reward.formulaHint')}><input className="ao-input" defaultValue="3d6*10" /></Field>
            <Field label={t('combat.reward.currency')}><select className="ao-input"><option>{t('combat.reward.gold')}</option><option>{t('combat.reward.silver')}</option></select></Field>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => onOpenChange(false)}>{t('combat.reward.cancel')}</button>
        <button className="ao-btn ao-btn--primary" style={{ flex: 2 }}>{t('combat.reward.add')}</button>
      </div>
    </ModalScene>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

interface PageProps {
  editingTitle?: boolean;
}

export default function QuestDetailV2Page({ editingTitle = false }: PageProps) {
  const t = useT();
  const [objs, setObjs] = useState([
    { id: 'o1', textKey: 'combat.quest.goal.0', done: true, vis: true },
    { id: 'o2', textKey: 'combat.quest.goal.1', done: true, vis: true },
    { id: 'o3', textKey: 'combat.quest.goal.2', done: false, vis: true },
    { id: 'o4', textKey: 'combat.quest.goal.3', done: false, vis: false },
  ]);
  const [rewardOpen, setRewardOpen] = useState(false);
  const notes = [
    { id: 'n1', tKey: 'combat.quest.note.0t', textKey: 'combat.quest.note.0' },
    { id: 'n2', tKey: 'combat.quest.note.1t', textKey: 'combat.quest.note.1' },
  ];

  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.quest.title')}
        breadcrumb={t('combat.quest.breadcrumb')}
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone="gold" glyph="eye">{t('combat.quest.visible')}</Chip>
            <button className="ao-iconbtn" title={t('combat.quest.menu')}><Rune kind="dots" size={15} /></button>
          </div>
        }
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 22 }}>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, maxWidth: 1260, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Panel frame padding={20}>
              <span className="ao-frame-c" />
              <div className="ao-overline" style={{ marginBottom: 8 }}>{t('combat.quest.overline')}</div>
              <InlineEdit heading value={t('combat.quest.name')} editing={editingTitle} />
              <Divider />
              <div className="cb-inline" style={{ cursor: 'text', position: 'relative' }}>
                <p className="ao-italic" style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: 'var(--ink)' }}>
                  {t('combat.quest.desc')}
                  <Rune kind="cross" size={11} color="var(--ink-ghost)" />
                </p>
              </div>
            </Panel>
            <Panel padding={0}>
              <PanelHeader title={t('combat.quest.goals')} glyph="check" sub={t('combat.quest.goalsSub')} right={<button className="ao-btn ao-btn--sm"><Rune kind="plus" size={9} /> {t('combat.quest.addGoal')}</button>} />
              <div style={{ padding: '8px 0' }}>
                {objs.map((o) => (
                  <div key={o.id} className="cb-obj-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', opacity: o.vis ? 1 : 0.6 }}>
                    <span style={{ cursor: 'grab', color: 'var(--ink-ghost)' }}><Rune kind="menu" size={12} /></span>
                    <button onClick={() => setObjs((a) => a.map((x) => (x.id === o.id ? { ...x, done: !x.done } : x)))} style={{ width: 20, height: 20, flexShrink: 0, border: `1px solid ${o.done ? 'var(--gold)' : 'var(--rule-strong)'}`, background: o.done ? 'var(--gold)' : 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      {o.done && <Rune kind="check" size={12} color="var(--abyss)" />}
                    </button>
                    <span style={{ flex: 1, fontSize: 14, color: o.done ? 'var(--ink-faint)' : 'var(--ink-bright)', textDecoration: o.done ? 'line-through' : 'none', fontStyle: o.vis ? 'normal' : 'italic' }}>{t(o.textKey)}</span>
                    {!o.vis && <Chip glyph="lock">{t('combat.quest.gmOnly')}</Chip>}
                    <VisibilityEye visible={o.vis} onToggle={() => setObjs((a) => a.map((x) => (x.id === o.id ? { ...x, vis: !x.vis } : x)))} size={26} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel padding={0}>
              <PanelHeader title={t('combat.quest.notes')} glyph="scroll" tone="arcane" sub={t('combat.quest.notesSub')} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea className="ao-input" rows={2} placeholder={t('combat.quest.notePh')} />
                <div><button className="ao-btn ao-btn--sm">{t('combat.quest.write')}</button></div>
                {notes.map((n) => (
                  <div key={n.id} className="cb-note-row" style={{ padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--hairline)', position: 'relative' }}>
                    <div className="ao-codex" style={{ marginBottom: 4 }}>{t(n.tKey)}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{t(n.textKey)}</div>
                    <div className="cb-quick" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      <button className="ao-iconbtn" style={{ width: 24, height: 24 }}><Rune kind="cross" size={10} /></button>
                      <button className="ao-iconbtn" style={{ width: 24, height: 24, color: '#d8896a' }}><Rune kind="x" size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel padding={0}>
              <PanelHeader title={t('combat.quest.rewards')} glyph="coin" right={<button className="ao-btn ao-btn--sm" onClick={() => setRewardOpen(true)}><Rune kind="plus" size={9} /> {t('combat.quest.addReward')}</button>} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ n: 'Меч из звёздной стали', r: 'RARE' }, { n: '300 золотых монет', r: 'COMMON', cur: true }].map((x) => (
                  <div key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--abyss)', border: `1px solid ${rarityHue(x.r)}66` }}>
                    <Rune kind={x.cur ? 'coin' : 'square-rot'} size={13} color={rarityHue(x.r)} />
                    <span style={{ flex: 1, fontSize: 13 }}>{x.n}</span>
                    <button className="ao-iconbtn" style={{ width: 24, height: 24, borderColor: 'transparent', color: 'var(--ink-faint)' }}><Rune kind="x" size={10} /></button>
                  </div>
                ))}
                <button className="ao-btn ao-btn--block"><Rune kind="hex" size={11} /> {t('combat.quest.randomReward')}</button>
              </div>
            </Panel>
            <LinkedPanel title={t('combat.quest.linkedNpcs')} glyph="helm" addLabel={t('combat.quest.linkNpc')} items={['Брат Алдрик', 'Грим Одноглазый']} />
            <LinkedPanel title={t('combat.quest.linkedLocs')} glyph="hex" addLabel={t('combat.quest.linkLoc')} items={['Старый тракт', 'Склад Гильдии', 'Пустошь']} />
          </div>
        </div>
      </div>
      <AddRewardModal open={rewardOpen} onOpenChange={setRewardOpen} />
    </CombatBackdrop>
  );
}
