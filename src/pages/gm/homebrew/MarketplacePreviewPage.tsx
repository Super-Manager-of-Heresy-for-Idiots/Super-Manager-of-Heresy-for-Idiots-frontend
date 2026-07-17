import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Rune } from '@/components/ordo';
import { usePackagePreview, useInstallPackage, useInstalledPackages } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { cn, formatDate } from '@/lib/utils';
import type {
  HomebrewSpellResponse, ItemDefinition, ContentClassDetailResponse,
  SpeciesDetail, FeatDetail, BackgroundDetail, MonsterResponse, ContentSummaryDto, ContentLabel,
  InstalledHomebrewResponse, ContentType,
} from '@/types';
import s from './MarketplacePreviewPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */
type Lbl = ContentLabel | { name?: string | null; nameRusloc?: string | null; nameEngloc?: string | null } | null | undefined;
const nm = (l: Lbl): string => {
  if (!l) return '';
  const a = l as { name?: string | null; nameRusloc?: string | null; nameEngloc?: string | null };
  return a.name || a.nameRusloc || a.nameEngloc || '';
};
const mod = (score: number) => { const m = Math.floor((score - 10) / 2); return (m >= 0 ? '+' : '') + m; };
const ABIL: Record<string, string> = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' };
const abilName = (slug?: string | null) => (slug ? ABIL[slug.toLowerCase()] ?? slug : '');

const SPELL_COLORS = ['#7a9866', '#b3461a', '#8f6fb5', '#5a8e94', '#b08d4e', '#8f6fb5', '#b3461a', '#7a9866', '#5a8e94', '#b08d4e'];

/* ── page ────────────────────────────────────────────────────── */
export default function MarketplacePreviewPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: preview, isLoading, isError } = usePackagePreview(id);
  const installMutation = useInstallPackage();
  const { data: installedData } = useInstalledPackages({ size: 200 });
  const installed = useMemo(
    () => new Set((installedData?.content ?? []).map((i: InstalledHomebrewResponse) => i.packageId)).has(id ?? ''),
    [installedData, id],
  );

  if (isLoading) {
    return <div className={s.page}><div className={cn(s.state, s.stateRow)}><Loader2 className="h-5 w-5 animate-spin" /> {t('hb.pv.loading')}</div></div>;
  }
  if (isError || !preview) {
    return (
      <div className={s.page}>
        <div className={s.state}>
          <div>{t('hb.pv.notFound')}</div>
          <button className={s.backBtn} onClick={() => navigate('/marketplace')}><Rune kind="arrow-l" size={11} /> {t('hb.pv.back')}</button>
        </div>
      </div>
    );
  }

  const h = preview.header;
  const cbt = h.contentByType ?? {};
  const light = (type: ContentType): ContentSummaryDto[] => cbt[type] ?? [];

  const counts: Record<string, number> = {
    spell: preview.spells?.length ?? 0,
    item: preview.items?.length ?? 0,
    itemType: light('ITEM_TYPE').length,
    class: preview.classes?.length ?? 0,
    subclass: light('SUBCLASS').length,
    species: preview.species?.length ?? 0,
    feat: preview.feats?.length ?? 0,
    skill: light('SKILL').length,
    buff: light('BUFF_DEBUFF').length,
    background: preview.backgrounds?.length ?? 0,
    resource: light('CUSTOM_RESOURCE').length,
    monster: preview.monsters?.length ?? 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const doInstall = () => { if (id) installMutation.mutate(id); };

  const toc: { key: string; anchor: string; label: string }[] = [
    { key: 'spell', anchor: 'pv-spell', label: t('hb.market.ptype.SPELL') },
    { key: 'item', anchor: 'pv-item', label: t('hb.market.ptype.ITEM') },
    { key: 'itemType', anchor: 'pv-itemtype', label: t('hb.market.ptype.ITEM_TYPE') },
    { key: 'class', anchor: 'pv-class', label: t('hb.market.ptype.CHARACTER_CLASS') },
    { key: 'subclass', anchor: 'pv-subclass', label: t('hb.market.ptype.SUBCLASS') },
    { key: 'species', anchor: 'pv-species', label: t('hb.market.ptype.SPECIES') },
    { key: 'feat', anchor: 'pv-feat', label: t('hb.market.ptype.FEAT') },
    { key: 'skill', anchor: 'pv-skill', label: t('hb.market.ptype.SKILL') },
    { key: 'buff', anchor: 'pv-buff', label: t('hb.market.ptype.BUFF_DEBUFF') },
    { key: 'background', anchor: 'pv-background', label: t('hb.market.ptype.BACKGROUND') },
    { key: 'resource', anchor: 'pv-resource', label: t('hb.market.ptype.CUSTOM_RESOURCE') },
    { key: 'monster', anchor: 'pv-monster', label: t('hb.pv.bestiary') },
  ].filter((x) => counts[x.key] > 0);

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={() => navigate('/marketplace')}><Rune kind="arrow-l" size={11} /> {t('hb.pv.back')}</button>
      </div>

      {/* HERO */}
      <div className={s.hero}>
        <div className={s.heroGlow} />
        <div className={s.heroInner}>
          <div className={s.crest}><Rune kind="sigil-1" size={92} /></div>
          <div className={s.heroMain}>
            <div className={s.badgeRow}>
              <span className={cn(s.statusBadge, h.status === 'DRAFT' && s.statusDraft)}>{t(`cmp2.hbStatus.${h.status}`)}</span>
              {(h.tags ?? []).slice(0, 1).map((tg) => <span key={tg} className={s.tagChip} style={{ color: 'var(--oa-red)', borderColor: 'rgba(179,70,26,0.4)' }}>{tg}</span>)}
            </div>
            <h1 className={s.heroTitle}>{h.title}</h1>
            {h.description && <p className={s.heroDesc}>{h.description}</p>}
            <div className={s.heroMeta}>
              <div className={s.author}>
                <div className={s.authorSigil}><Rune kind="sigil-1" size={18} /></div>
                <div>
                  <div className={s.authorName}>{h.authorUsername}</div>
                  <div className={s.authorRole}>{t('hb.pv.gm')}</div>
                </div>
              </div>
              <div className={s.vsep} />
              <div className={s.statChip}>
                <Rune kind="arrow-d" size={16} color="var(--oa-gold)" />
                <span className={s.statNum}>{h.downloadCount?.toLocaleString?.() ?? h.downloadCount}</span>
                <span className={s.statLbl}>{t('hb.pv.installs')}</span>
              </div>
              {(h.likes ?? 0) > 0 && (
                <div className={s.statChip}>
                  <Rune kind="star" size={16} color="var(--oa-green)" />
                  <span className={s.statNum}>{h.likes}</span>
                  <span className={s.statPlus}>{(h.netRating ?? 0) >= 0 ? '+' : ''}{h.netRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={s.body}>
        {/* RAIL */}
        <aside className={s.rail}>
          <div className={s.card}>
            <button className={s.installBtn} disabled={installed || installMutation.isPending} onClick={doInstall}>
              <Rune kind={installed ? 'check' : 'arrow-d'} size={17} color="var(--oa-bg)" />
              {installed ? t('hb.market.installed') : t('hb.pv.install')}
            </button>
            {installed
              ? <div className={s.installedNote}>{t('hb.pv.inCollection')}</div>
              : <div className={s.freeNote}>{t('hb.pv.free')}</div>}
          </div>

          <div className={s.card}>
            <div className={s.cardLabel}>{t('hb.pv.verdict')}</div>
            <div className={s.verdictRow}>
              <div className={s.verdictNum}>{(h.netRating ?? 0) >= 0 ? '+' : ''}{h.netRating ?? 0}</div>
              <div className={s.verdictSub}>{t('hb.pv.netRating')}</div>
            </div>
            <div className={s.verdictBars}>
              <div className={s.vbar}><Rune kind="star" size={14} color="var(--oa-green)" /> {h.likes ?? 0}</div>
              <div className={s.vbar}><Rune kind="x" size={14} color="var(--oa-red)" /> {h.dislikes ?? 0}</div>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.metaRow}><span className={s.metaKey}>{t('hb.pv.edition')}</span><span className={s.metaValGold}>v{h.version}</span></div>
            {h.createdAt && <div className={s.metaRow}><span className={s.metaKey}>{t('hb.pv.firstSealed')}</span><span className={s.metaVal}>{formatDate(h.createdAt)}</span></div>}
            {h.publishedAt && <div className={s.metaRow}><span className={s.metaKey}>{t('hb.pv.updated')}</span><span className={s.metaVal}>{formatDate(h.publishedAt)}</span></div>}
            {(h.tags ?? []).length > 0 && (<><div className={s.hr} /><div className="ao-row ao-wrap ao-gap-6">{h.tags!.map((tg) => <span key={tg} className={s.tagChip}>{tg}</span>)}</div></>)}
          </div>

          <div className={s.card}>
            <div className={s.cardLabel}>{t('hb.pv.contents')} · {total}</div>
            {toc.map((x) => (
              <a key={x.key} className={s.tocRow} href={`#${x.anchor}`}>
                <span className={s.tocName}>{x.label}</span><span className={s.tocCount}>{counts[x.key]}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className={s.main}>
          <div className={s.intro}>{t('hb.pv.intro')}</div>

          {counts.spell > 0 && <SpellSection anchor="pv-spell" title={t('hb.market.ptype.SPELL')} kicker="Incantamenta" spells={preview.spells!} t={t} />}
          {counts.item > 0 && <ItemSection anchor="pv-item" title={t('hb.market.ptype.ITEM')} kicker="Artificia" items={preview.items!} t={t} />}
          {counts.itemType > 0 && <LightSection anchor="pv-itemtype" title={t('hb.market.ptype.ITEM_TYPE')} kicker="Genera" glyph="sword" rows={light('ITEM_TYPE')} t={t} kind="itemType" />}
          {counts.class > 0 && <ClassSection anchor="pv-class" title={t('hb.market.ptype.CHARACTER_CLASS')} kicker="Classes" classes={preview.classes!} t={t} />}
          {counts.subclass > 0 && <LightSection anchor="pv-subclass" title={t('hb.market.ptype.SUBCLASS')} kicker="Ordines" glyph="helm" rows={light('SUBCLASS')} t={t} kind="subclass" />}
          {counts.species > 0 && <SpeciesSection anchor="pv-species" title={t('hb.market.ptype.SPECIES')} kicker="Species" species={preview.species!} t={t} />}
          {counts.feat > 0 && <FeatSection anchor="pv-feat" title={t('hb.market.ptype.FEAT')} kicker="Dotes" feats={preview.feats!} t={t} />}
          {counts.skill > 0 && <LightSection anchor="pv-skill" title={t('hb.market.ptype.SKILL')} kicker="Artes" glyph="eye" rows={light('SKILL')} t={t} kind="skill" />}
          {counts.buff > 0 && <LightSection anchor="pv-buff" title={t('hb.market.ptype.BUFF_DEBUFF')} kicker="Effectus" glyph="sigil-2" rows={light('BUFF_DEBUFF')} t={t} kind="buff" />}
          {counts.background > 0 && <BackgroundSection anchor="pv-background" title={t('hb.market.ptype.BACKGROUND')} kicker="Origines" backgrounds={preview.backgrounds!} t={t} />}
          {counts.resource > 0 && <LightSection anchor="pv-resource" title={t('hb.market.ptype.CUSTOM_RESOURCE')} kicker="Vires" glyph="diamond" rows={light('CUSTOM_RESOURCE')} t={t} kind="resource" />}
          {counts.monster > 0 && <MonsterSection anchor="pv-monster" title={t('hb.pv.bestiary')} kicker="Bestiarium" monsters={preview.monsters!} t={t} />}
        </main>
      </div>
    </div>
  );
}

/* ── section chrome ──────────────────────────────────────────── */
type TF = ReturnType<typeof useT>;
function SectionShell({ anchor, glyph, kicker, title, count, children }: { anchor: string; glyph: string; kicker: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <details id={anchor} className={s.section}>
      <summary>
        <Rune kind={glyph} size={24} className={s.secGlyph} />
        <div className={s.secHead}>
          <div className={s.secKicker}>{kicker}</div>
          <div className={s.secTitle}>{title} <span className={s.secCount}>· {count}</span></div>
        </div>
        <Rune kind="chev-r" size={17} className={s.chev} />
      </summary>
      <div className={s.secBody}>{children}</div>
    </details>
  );
}

function Row({ iconColor, iconContent, name, nameColor, sub, badge, badgeColor, children }: {
  iconColor?: string; iconContent: React.ReactNode; name: string; nameColor?: string;
  sub?: string; badge?: React.ReactNode; badgeColor?: string; children: React.ReactNode;
}) {
  return (
    <details className={s.row}>
      <summary>
        <span className={s.rowIcon} style={iconColor ? { background: `${iconColor}22`, color: iconColor } : undefined}>{iconContent}</span>
        <div className={s.rowMain}>
          <div className={s.rowName} style={nameColor ? { color: nameColor } : undefined}>{name}</div>
          {sub && <div className={s.rowSub}>{sub}</div>}
        </div>
        {badge != null && <span className={s.rowBadge} style={badgeColor ? { color: badgeColor } : undefined}>{badge}</span>}
        <Rune kind="chev-r" size={15} className={s.rowChev} />
      </summary>
      <div className={s.l3}>{children}</div>
    </details>
  );
}

/* ── SPELL (grouped by school, sorted by level) ──────────────── */
function SpellSection({ anchor, title, kicker, spells, t }: { anchor: string; title: string; kicker: string; spells: HomebrewSpellResponse[]; t: TF }) {
  const groups = useMemo(() => {
    const m = new Map<string, HomebrewSpellResponse[]>();
    for (const sp of spells) { const k = sp.school || t('hb.pv.noSchool'); (m.get(k) ?? m.set(k, []).get(k)!).push(sp); }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ru'))
      .map(([school, list]) => [school, [...list].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))] as const);
  }, [spells, t]);
  return (
    <SectionShell anchor={anchor} glyph="sigil-1" kicker={kicker} title={title} count={spells.length}>
      {groups.map(([school, list]) => (
        <div key={school}>
          <div className={s.groupLabel}>{school}</div>
          {list.map((sp) => {
            const color = SPELL_COLORS[(sp.level ?? 0) % SPELL_COLORS.length];
            const dmg = sp.damageDice ? `${sp.damageDice} ${nm({ name: sp.damageType })}`.trim() : sp.healingFormula ? `${sp.healingFormula} ${t('hb.pv.heal')}` : '';
            return (
              <Row key={sp.id} iconColor="#8f6fb5" iconContent={sp.level ?? 0} name={sp.name}
                sub={[sp.school, sp.concentration ? t('hb.pv.concentration') : '', sp.ritual ? t('hb.pv.ritual') : ''].filter(Boolean).join(' · ')}
                badge={dmg || undefined} badgeColor={sp.healingFormula ? 'var(--oa-green)' : 'var(--oa-red)'}>
                <SpellL3 sp={sp} color={color} t={t} />
              </Row>
            );
          })}
        </div>
      ))}
    </SectionShell>
  );
}
function SpellL3({ sp, t }: { sp: HomebrewSpellResponse; color: string; t: TF }) {
  const cells: [string, React.ReactNode][] = [];
  if (sp.castingTimeRaw) cells.push([t('hb.pv.f.time'), sp.castingTimeRaw]);
  if (sp.rangeType || sp.rangeDistance) cells.push([t('hb.pv.f.range'), sp.rangeDistance ? `${sp.rangeDistance} ${sp.rangeUnit || t('hb.pv.ft')}` : sp.rangeType]);
  if (sp.durationRaw) cells.push([t('hb.pv.f.duration'), sp.durationRaw]);
  if (sp.areaShape) cells.push([t('hb.pv.f.area'), `${sp.areaShape} ${sp.areaSizeFt ?? ''}`]);
  return (
    <>
      <div className={s.l3Head}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 className={s.l3Title}>{sp.name}</h3>
          {sp.nameEn && <div className={s.l3Sub}>{sp.nameEn}</div>}
        </div>
        <div className={s.l3Chips}>
          {sp.level != null && <span className={cn(s.chip, s.chipSolid)} style={{ background: 'var(--oa-purple)' }}>{sp.level === 0 ? t('hb.pv.cantrip') : t('hb.pv.levelN', { n: sp.level })}</span>}
          {sp.school && <span className={cn(s.chip, s.chipPurple)}>{sp.school}</span>}
          {sp.concentration && <span className={cn(s.chip, s.chipGold)}>{t('hb.pv.concentration')}</span>}
          {sp.ritual && <span className={cn(s.chip, s.chipGold)}>{t('hb.pv.ritual')}</span>}
        </div>
      </div>
      {cells.length > 0 && <div className={s.grid}>{cells.map(([k, v], i) => <div className={s.cell} key={i}><div className={s.cellKey}>{k}</div><div className={s.cellVal}>{v}</div></div>)}</div>}
      {sp.description && <p className={s.l3Desc}>{sp.description}</p>}
      {(sp.damageDice || sp.healingFormula || sp.saveAbility) && (
        <>
          <div className={s.mechLabel}>{t('hb.pv.mechanics')}</div>
          <div className={s.mechRow}>
            {sp.damageDice && <div className={cn(s.mechBox, s.mechBoxDmg)}><span className={s.mechK}>{t('hb.pv.f.damage')}</span><span className={s.mechBig}>{sp.damageDice}</span><span className={s.mechNote}>{nm({ name: sp.damageType })}</span></div>}
            {sp.healingFormula && <div className={cn(s.mechBox, s.mechBoxHeal)}><span className={s.mechK}>{t('hb.pv.f.heal')}</span><span className={cn(s.mechBig, s.mechBigHeal)}>{sp.healingFormula}</span></div>}
            {sp.saveAbility && <div className={s.mechBox}><span className={s.mechK}>{t('hb.pv.f.save')}</span><span className={s.mechNote} style={{ color: 'var(--oa-ink)' }}>{abilName(sp.saveAbility)}</span>{sp.halfOnSave && <span className={s.mechNoteGood}>{t('hb.pv.halfOnSave')}</span>}</div>}
            {sp.requiresAttackHit && <div className={s.mechBox}><span className={s.mechK}>{t('hb.pv.f.attackRoll')}</span></div>}
          </div>
          <div className={s.mechRow}>
            {(sp.conditionSlugs ?? []).length > 0 && <div className={s.panelBox} style={{ flex: 1, minWidth: 220 }}><div className={s.panelK}>{t('hb.pv.appliesCondition')}</div><div className={s.cellVal}>{sp.conditionSlugs!.join(', ')}{sp.conditionDurationRounds ? ` — ${sp.conditionDurationRounds} ${t('hb.pv.rounds')}` : ''}</div></div>}
            {sp.higherLevels && <div className={s.panelBox} style={{ flex: 1, minWidth: 220 }}><div className={s.panelK}>{t('hb.pv.upcast')}</div><div className={s.cellVal}>{sp.higherLevels}</div></div>}
          </div>
        </>
      )}
    </>
  );
}

/* ── ITEM (grouped by kind) ──────────────────────────────────── */
function itemGroup(it: ItemDefinition, t: TF): string {
  if (it.kind === 'MAGIC') return t('hb.pv.g.magic');
  const k = (it.equipmentKind || '').toUpperCase();
  if (k === 'WEAPON') return t('hb.pv.g.weapon');
  if (k === 'ARMOR') return t('hb.pv.g.armor');
  if (k === 'TOOL') return t('hb.pv.g.tool');
  if (k === 'GEAR') return t('hb.pv.g.gear');
  return t('hb.pv.g.other');
}
function ItemSection({ anchor, title, kicker, items, t }: { anchor: string; title: string; kicker: string; items: ItemDefinition[]; t: TF }) {
  const groups = useMemo(() => {
    const m = new Map<string, ItemDefinition[]>();
    for (const it of items) { const k = itemGroup(it, t); (m.get(k) ?? m.set(k, []).get(k)!).push(it); }
    return [...m.entries()].map(([g, list]) => [g, [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'))] as const);
  }, [items, t]);
  return (
    <SectionShell anchor={anchor} glyph="diamond" kicker={kicker} title={title} count={items.length}>
      {groups.map(([g, list]) => (
        <div key={g}>
          <div className={s.groupLabel}>{g}</div>
          {list.map((it) => (
            <Row key={it.id} iconContent={<Rune kind={it.kind === 'MAGIC' ? 'diamond' : (it.equipmentKind === 'ARMOR' ? 'sigil-2' : 'sword')} size={22} color="var(--oa-purple)" />}
              name={it.name} nameColor="var(--oa-purple)" sub={[nm(it.type), it.attunementRequired ? t('hb.pv.needsAttune') : ''].filter(Boolean).join(' · ')}
              badge={nm(it.rarity) || undefined} badgeColor="var(--oa-purple)">
              <ItemL3 it={it} t={t} />
            </Row>
          ))}
        </div>
      ))}
    </SectionShell>
  );
}
function ItemL3({ it, t }: { it: ItemDefinition; t: TF }) {
  const cells: [string, React.ReactNode][] = [];
  cells.push([t('hb.pv.f.kind'), it.kind === 'MAGIC' ? t('hb.pv.g.magic') : nm(it.type) || it.equipmentKind]);
  if (it.rarity) cells.push([t('hb.pv.f.rarity'), nm(it.rarity)]);
  if (it.cost?.rawText || it.cost?.amount) cells.push([t('hb.pv.f.cost'), it.cost.rawText || `${it.cost.amount} ${nm(it.cost.currency)}`]);
  if (it.weightLb) cells.push([t('hb.pv.f.weight'), it.weightLb]);
  const w = it.weaponStat, a = it.armorStat;
  return (
    <>
      <div className={s.l3Head}>
        <div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title} style={{ color: 'var(--oa-purple)' }}>{it.name}</h3>{it.nameEn && <div className={s.l3Sub}>{it.nameEn}</div>}</div>
        <div className={s.l3Chips}>{it.rarity && <span className={cn(s.chip, s.chipPurple)}>{nm(it.rarity)}</span>}{it.attunementRequired && <span className={cn(s.chip, s.chipRed)}>{t('hb.pv.needsAttune')}</span>}</div>
      </div>
      <div className={s.grid}>{cells.map(([k, v], i) => <div className={s.cell} key={i}><div className={s.cellKey}>{k}</div><div className={cn(s.cellVal, k === t('hb.pv.f.cost') && s.cellValGold)}>{v}</div></div>)}</div>
      {it.description && <p className={s.l3Desc}>{it.description}</p>}
      {w && (w.damageDice || w.damageType) && (
        <div className={cn(s.panelBox, s.panelBoxRed)}>
          <div className={s.panelK}>{t('hb.pv.f.weapon')}</div>
          <div className="ao-row ao-gap-10" style={{ marginBottom: 8 }}><span className={s.mechBig}>{w.damageDice?.rawText}{w.flatDamage ? ` + ${w.flatDamage}` : ''}</span><span className={s.mechNote}>{nm(w.damageType)}</span></div>
          <div className="ao-row ao-wrap ao-gap-6">
            {w.mastery && <span className={s.chip}>{t('hb.pv.mastery')}: {nm(w.mastery)}</span>}
            {(it.weaponProperties ?? []).map((p, i) => <span key={i} className={s.chip}>{nm(p.property)}{p.versatileDice?.rawText ? ` (${p.versatileDice.rawText})` : ''}{p.normalRangeFt ? ` ${p.normalRangeFt}/${p.longRangeFt ?? ''}` : ''}</span>)}
          </div>
        </div>
      )}
      {a && a.baseAc != null && (
        <div className={s.panelBox}>
          <div className={s.panelK}>{t('hb.pv.f.armor')}</div>
          <div className="ao-row ao-wrap ao-gap-10">
            <span className={s.cellNum}>{t('hb.pv.f.baseAc')} {a.baseAc}</span>
            {a.dexBonusAllowed && <span className={s.mechNote}>+ {t('hb.pv.dex')}{a.maxDexBonus != null ? ` (max ${a.maxDexBonus})` : ''}</span>}
            {a.strengthRequired != null && <span className={s.chip}>{t('hb.pv.strReq')} {a.strengthRequired}</span>}
            {a.stealthDisadvantage && <span className={cn(s.chip, s.chipRed)}>{t('hb.pv.stealthDis')}</span>}
          </div>
        </div>
      )}
      {it.grantsAbilities && <div className="ao-row ao-gap-6"><span className={cn(s.chip, s.chipGold)}>{t('hb.pv.grantsAbility')}</span></div>}
    </>
  );
}

/* ── CLASS ───────────────────────────────────────────────────── */
function ClassSection({ anchor, title, kicker, classes, t }: { anchor: string; title: string; kicker: string; classes: ContentClassDetailResponse[]; t: TF }) {
  return (
    <SectionShell anchor={anchor} glyph="helm" kicker={kicker} title={title} count={classes.length}>
      {classes.map((c) => {
        const caster = c.spellcasting?.spellcaster || c.spellcasting?.isSpellcaster;
        return (
          <Row key={c.id} iconContent={<Rune kind="helm" size={22} color="var(--oa-gold)" />} name={c.name}
            sub={[caster ? t('hb.pv.caster') : '', c.hitDie ? `d${c.hitDie}` : ''].filter(Boolean).join(' · ')}
            badge={nm(c.spellcasting?.spellcastingAbility) || undefined} badgeColor="var(--oa-purple)">
            <ClassL3 c={c} t={t} />
          </Row>
        );
      })}
    </SectionShell>
  );
}
function ClassL3({ c, t }: { c: ContentClassDetailResponse; t: TF }) {
  const feats = [...(c.features ?? [])].sort((a, b) => a.level - b.level).slice(0, 6);
  const moreLevels = Math.max(0, new Set((c.features ?? []).map((f) => f.level)).size - new Set(feats.map((f) => f.level)).size);
  return (
    <>
      <div className={s.l3Head}>
        <div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title}>{c.name}</h3>{c.subtitle && <div className={s.l3Sub}>{c.subtitle}</div>}</div>
        <div className={s.l3Chips}>{c.hitDie && <span className={cn(s.chip, s.chipSolid)} style={{ background: '#5a4a35' }}>{t('hb.pv.hitDie')} d{c.hitDie}</span>}{(c.spellcasting?.spellcaster || c.spellcasting?.isSpellcaster) && <span className={cn(s.chip, s.chipPurple)}>{t('hb.pv.caster')}</span>}</div>
      </div>
      {c.description && <p className={s.l3Desc}>{c.description}</p>}
      <div className={s.grid}>
        {(c.primaryAbilities ?? []).length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.primary')}</div><div className={s.cellVal}>{c.primaryAbilities!.map(nm).join(', ')}</div></div>}
        {(c.savingThrows ?? []).length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.saves')}</div><div className={s.cellVal}>{c.savingThrows!.map(nm).join(', ')}</div></div>}
        {(c.armorProficiencyText || c.weaponProficiencyText) && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.prof')}</div><div className={s.cellVal}>{[c.armorProficiencyText, c.weaponProficiencyText].filter(Boolean).join('; ')}</div></div>}
        {c.spellcasting?.spellcastingAbility && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.spellAbility')}</div><div className={s.cellVal} style={{ color: 'var(--oa-purple)' }}>{nm(c.spellcasting.spellcastingAbility)}</div></div>}
      </div>
      {feats.length > 0 && (
        <>
          <div className={s.mechLabel}>{t('hb.pv.progression')}</div>
          <div className={s.progTable}>
            <div className={s.progHead}><div className={cn(s.progCell, s.progHk)}>{t('hb.pv.lvl')}</div><div className={cn(s.progCell, s.progHk)}>{t('hb.pv.feature')}</div><div className={cn(s.progCell, s.progHk)}>{t('hb.pv.activation')}</div></div>
            {feats.map((f) => (
              <div className={s.progRow} key={f.id}>
                <div className={cn(s.progCell, s.progLvl)}>{f.level}</div>
                <div className={s.progCell}><div className={s.progName}>{f.title}</div>{f.description && <div className={s.stackDesc}>{f.description}</div>}</div>
                <div className={cn(s.progCell, s.progAct)} style={{ color: f.activationType === 'PASSIVE' ? 'var(--oa-green)' : 'var(--oa-gold)' }}>{f.activationType ? t(`hb.pv.act.${f.activationType}`) : ''}</div>
              </div>
            ))}
          </div>
          {moreLevels > 0 && <div className={s.stackDesc}>{t('hb.pv.moreLevels', { n: moreLevels })}</div>}
        </>
      )}
    </>
  );
}

/* ── SPECIES ─────────────────────────────────────────────────── */
function SpeciesSection({ anchor, title, kicker, species, t }: { anchor: string; title: string; kicker: string; species: SpeciesDetail[]; t: TF }) {
  return (
    <SectionShell anchor={anchor} glyph="hex" kicker={kicker} title={title} count={species.length}>
      {species.map((sp) => {
        const resist = sp.traits.flatMap((tr) => tr.effects).find((e) => e.effectType?.includes('resist'));
        return (
          <Row key={sp.id} iconContent={<Rune kind="hex" size={22} color="var(--oa-green)" />} name={sp.name}
            sub={[nm(sp.creatureType), sp.sizeOptions.map(nm).join('/')].filter(Boolean).join(' · ')}
            badge={resist ? `${t('hb.pv.resist')} ${nm(resist.damageType)}` : undefined} badgeColor="var(--oa-red)">
            <SpeciesL3 sp={sp} t={t} />
          </Row>
        );
      })}
    </SectionShell>
  );
}
function SpeciesL3({ sp, t }: { sp: SpeciesDetail; t: TF }) {
  const darkvision = sp.traits.flatMap((tr) => tr.effects).find((e) => e.effectType === 'darkvision');
  return (
    <>
      <div className={s.l3Head}>
        <div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title}>{sp.name}</h3>{sp.nameEn && <div className={s.l3Sub}>{sp.nameEn}</div>}</div>
        <div className={s.l3Chips}>{sp.creatureType && <span className={cn(s.chip, s.chipGold)}>{nm(sp.creatureType)}</span>}{sp.sizeOptions.map((sz) => <span key={sz.id} className={s.chip}>{nm(sz)}</span>)}</div>
      </div>
      {sp.description && <p className={s.l3Desc}>{sp.description}</p>}
      <div className={s.mechRow}>
        {sp.speeds.length > 0 && <div className={s.mechBox}><span className={s.mechK}>{t('hb.pv.speed')}</span><span className={s.mechNote} style={{ color: 'var(--oa-ink)' }}>{sp.speeds.map((sd) => `${sd.type ? t(`hb.pv.spd.${sd.type}`) : ''} ${sd.amountFt ?? ''}`.trim()).join(', ')} {t('hb.pv.ft')}</span></div>}
        {darkvision && <div className={s.mechBox}><span className={s.mechK}>{t('hb.pv.darkvision')}</span><span className={s.mechNote} style={{ color: 'var(--oa-ink)' }}>{darkvision.rangeFt} {t('hb.pv.ft')}</span></div>}
      </div>
      {sp.traits.length > 0 && (
        <div className={s.stack}>
          {sp.traits.map((tr) => (
            <div className={s.stackItem} key={tr.slug || tr.name}>
              <div className={s.stackName}>{tr.name}{tr.effects.some((e) => e.effectType?.includes('resist')) && <span className={s.miniBadge} style={{ color: 'var(--oa-red)', border: '1px solid rgba(179,70,26,0.4)' }}>{t('hb.pv.resist')}</span>}{tr.effects.some((e) => e.spell) && <span className={s.miniBadge} style={{ color: 'var(--oa-purple)', border: '1px solid rgba(143,111,181,0.4)' }}>{t('hb.pv.innate')}</span>}</div>
              {tr.description && <div className={s.stackDesc}>{tr.description}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── FEAT ────────────────────────────────────────────────────── */
function FeatSection({ anchor, title, kicker, feats, t }: { anchor: string; title: string; kicker: string; feats: FeatDetail[]; t: TF }) {
  return (
    <SectionShell anchor={anchor} glyph="sigil-3" kicker={kicker} title={title} count={feats.length}>
      {feats.map((f) => (
        <Row key={f.id} iconContent={<Rune kind="sigil-3" size={22} color="var(--oa-gold)" />} name={f.name} sub={nm(f.category)} badge={undefined}>
          <div className={s.l3Head}>
            <div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title}>{f.name}</h3>{f.nameEn && <div className={s.l3Sub}>{f.nameEn}</div>}</div>
            <div className={s.l3Chips}>{f.category && <span className={cn(s.chip, s.chipGold)}>{nm(f.category)}</span>}{f.repeatable && <span className={s.chip}>{t('hb.pv.repeatable')}</span>}</div>
          </div>
          {f.prerequisites.length > 0 && <div className={s.panelBox} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><span className={s.mechK}>{t('hb.pv.prereq')}</span><span className={s.cellVal}>{f.prerequisites.map((p) => p.rawText || [p.levelRequired && t('hb.pv.levelN', { n: p.levelRequired }), nm(p.abilityScore), p.minimumScore].filter(Boolean).join(' ')).join('; ')}</span></div>}
          {f.description && <p className={s.l3Desc}>{f.description}</p>}
          {f.sections.map((sec, i) => <div key={i} style={{ marginBottom: 12 }}><div className={s.mechLabel}>{sec.title}</div><div className={s.cellVal} style={{ fontSize: 17, lineHeight: 1.6 }}>{sec.body}</div></div>)}
        </Row>
      ))}
    </SectionShell>
  );
}

/* ── BACKGROUND ──────────────────────────────────────────────── */
function BackgroundSection({ anchor, title, kicker, backgrounds, t }: { anchor: string; title: string; kicker: string; backgrounds: BackgroundDetail[]; t: TF }) {
  return (
    <SectionShell anchor={anchor} glyph="scroll" kicker={kicker} title={title} count={backgrounds.length}>
      {backgrounds.map((b) => (
        <Row key={b.id} iconContent={<Rune kind="scroll" size={22} color="var(--oa-gold)" />} name={b.name} sub={(b.skillProficiencies ?? []).map(nm).join(', ')} badge={undefined}>
          <div className={s.l3Head}><div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title}>{b.name}</h3>{b.nameEn && <div className={s.l3Sub}>{b.nameEn}</div>}</div></div>
          {b.description && <p className={s.l3Desc}>{b.description}</p>}
          <div className={s.grid}>
            {(b.abilityOptions ?? []).length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.abilities')}</div><div className={s.cellVal}>{b.abilityOptions!.map(nm).join(', ')}</div></div>}
            {(b.skillProficiencies ?? []).length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.skillProf')}</div><div className={s.cellVal}>{b.skillProficiencies!.map(nm).join(', ')}</div></div>}
            {(b.toolProficiencies ?? []).length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.tools')}</div><div className={s.cellVal}>{b.toolProficiencies!.map((tp) => tp.rawText).filter(Boolean).join(', ')}</div></div>}
            {b.grantedFeat && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.feat')}</div><div className={s.cellVal} style={{ color: 'var(--oa-gold)' }}>{nm(b.grantedFeat)}</div></div>}
          </div>
        </Row>
      ))}
    </SectionShell>
  );
}

/* ── MONSTER ─────────────────────────────────────────────────── */
function MonsterSection({ anchor, title, kicker, monsters, t }: { anchor: string; title: string; kicker: string; monsters: MonsterResponse[]; t: TF }) {
  const sorted = useMemo(() => [...monsters].sort((a, b) => (a.crValue ?? 0) - (b.crValue ?? 0)), [monsters]);
  return (
    <SectionShell anchor={anchor} glyph="sword" kicker={kicker} title={title} count={monsters.length}>
      {sorted.map((m) => (
        <Row key={m.id} iconContent={<Rune kind="sword" size={22} color="var(--oa-red)" />} name={m.nameRusloc || m.name || ''} nameColor="var(--oa-red)"
          sub={[nm(m.size), nm(m.creatureTypes?.[0]), nm(m.alignment)].filter(Boolean).join(' · ')}
          badge={`${t('hb.pv.cr')} ${m.crRating}`} badgeColor="var(--oa-ink-bright)">
          <MonsterL3 m={m} t={t} />
        </Row>
      ))}
    </SectionShell>
  );
}
function MonsterL3({ m, t }: { m: MonsterResponse; t: TF }) {
  const scores: [string, number][] = [['СИЛ', m.strScore], ['ЛОВ', m.dexScore], ['ТЕЛ', m.conScore], ['ИНТ', m.intScore], ['МДР', m.wisScore], ['ХАР', m.chaScore]];
  const dmg = (arr: { damageType: unknown; note?: string | null }[]) => arr.map((d) => nm(d.damageType as Lbl) + (d.note ? ` (${d.note})` : '')).join(', ');
  return (
    <>
      <div className={s.l3Head}>
        <div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title} style={{ color: 'var(--oa-red)' }}>{m.nameRusloc || m.name}</h3>{m.nameEngloc && <div className={s.l3Sub}>{m.nameEngloc} · {nm(m.size)} {nm(m.creatureTypes?.[0])}, {nm(m.alignment)}</div>}</div>
        <div className={s.l3Chips}><span className={cn(s.chip, s.chipSolid)} style={{ background: '#7d2f10' }}>{t('hb.pv.cr')} {m.crRating}{m.xpBase ? ` · ${m.xpBase} XP` : ''}</span>{m.proficiencyBonus != null && <span className={s.chip}>{t('hb.pv.profBonus')} +{m.proficiencyBonus}</span>}</div>
      </div>
      <div className={s.grid}>
        <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.ac')}</div><div className={s.cellNum}>{m.armorClass}</div></div>
        <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.hp')}</div><div className={s.cellNum}>{m.hpAverage} {m.hpFormula && <span className={s.mechNote}>({m.hpFormula})</span>}</div></div>
        {m.speeds.length > 0 && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.speed')}</div><div className={s.cellVal}>{m.speeds.map((sd) => `${sd.ft}${sd.hover ? ` ${t('hb.pv.hover')}` : ''}`).join(', ')}</div></div>}
        {m.passivePerception != null && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.passive')}</div><div className={s.cellVal}>{m.passivePerception}</div></div>}
      </div>
      <div className={s.abilGrid}>{scores.map(([k, v]) => <div className={s.abil} key={k}><div className={s.abilK}>{k}</div><div className={s.abilV}>{v}</div><div className={cn(s.abilM, v >= 10 && s.abilMod)}>{mod(v)}</div></div>)}</div>
      <div className={s.monLines}>
        {m.savingThrows.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.saves')}</span>{m.savingThrows.map((sv) => `${nm(sv.ability)} ${sv.bonus >= 0 ? '+' : ''}${sv.bonus}`).join(', ')}</div>}
        {m.damageResistances.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.resist')}</span>{dmg(m.damageResistances)}</div>}
        {m.damageImmunities.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.immunities')}</span>{dmg(m.damageImmunities)}</div>}
        {m.conditionImmunities.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.condImm')}</span>{m.conditionImmunities.map(nm).join(', ')}</div>}
        {m.senses.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.senses')}</span>{m.senses.map((sn) => `${nm(sn.senseType)} ${sn.ft}`).join(', ')}</div>}
        {m.languages.length > 0 && <div><span className={s.monLineK}>{t('hb.pv.languages')}</span>{m.languages.map(nm).join(', ')}</div>}
      </div>
      {m.features.length > 0 && (
        <>
          <div className={s.actLabel}>{t('hb.pv.actions')}</div>
          <div className={s.actList}>
            {m.features.map((f) => (
              <div key={f.id}>
                <div className={s.actBody}><span className={s.actName}>{f.nameRusloc || f.name}.</span>{f.rechargeMin ? <span className={s.chip} style={{ marginLeft: 8 }}>{t('hb.pv.recharge')} {f.rechargeMin}{f.rechargeMax && f.rechargeMax !== f.rechargeMin ? `–${f.rechargeMax}` : ''}</span> : null} {f.descriptionRusloc || f.description}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── LIGHT (summary-only) types ──────────────────────────────── */
function LightSection({ anchor, title, kicker, glyph, rows, t, kind }: { anchor: string; title: string; kicker: string; glyph: string; rows: ContentSummaryDto[]; t: TF; kind: 'itemType' | 'subclass' | 'skill' | 'buff' | 'resource' }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ru')), [rows]);
  return (
    <SectionShell anchor={anchor} glyph={glyph} kicker={kicker} title={title} count={rows.length}>
      {sorted.map((r) => {
        let badge: React.ReactNode; let sub = '';
        if (kind === 'buff') { badge = r.isBuff ? t('hb.pv.buff') : t('hb.pv.debuff'); sub = [r.effectType, r.durationRounds ? `${r.durationRounds} ${t('hb.pv.rounds')}` : ''].filter(Boolean).join(' · '); }
        else if (kind === 'itemType') { badge = r.slot ? `${t('hb.pv.slot')}: ${r.slot}` : undefined; }
        else if (kind === 'skill') { sub = r.skillType || ''; }
        else if (kind === 'subclass' || kind === 'resource') { sub = r.className ? `${t('hb.pv.class')}: ${r.className}` : ''; }
        return (
          <Row key={r.id} iconContent={<Rune kind={glyph} size={20} color="var(--oa-gold)" />} name={r.name} sub={sub}
            badge={badge} badgeColor={kind === 'buff' ? (r.isBuff ? 'var(--oa-green)' : 'var(--oa-red)') : 'var(--oa-gold)'}>
            <div className={s.l3Head}><div style={{ flex: 1, minWidth: 240 }}><h3 className={s.l3Title}>{r.name}</h3></div></div>
            {r.description && <p className={s.l3Desc}>{r.description}</p>}
            {kind === 'buff' && (
              <div className={s.grid}>
                {r.effectType && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.effectType')}</div><div className={s.cellVal}>{r.effectType}</div></div>}
                {r.modifierValue != null && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.modifier')}</div><div className={s.cellNum} style={{ color: r.isBuff ? 'var(--oa-green)' : 'var(--oa-red)' }}>{r.modifierValue > 0 ? '+' : ''}{r.modifierValue}</div></div>}
                {r.durationRounds != null && <div className={s.cell}><div className={s.cellKey}>{t('hb.pv.f.duration')}</div><div className={s.cellVal}>{r.durationRounds} {t('hb.pv.rounds')}</div></div>}
              </div>
            )}
          </Row>
        );
      })}
    </SectionShell>
  );
}
