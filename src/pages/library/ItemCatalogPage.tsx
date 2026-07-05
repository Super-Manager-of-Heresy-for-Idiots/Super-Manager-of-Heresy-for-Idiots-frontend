import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoInterfaceIcon, Rune, OrdoChip, EmptyVault, ErrorAltar, OrdoAssetIcon } from '@/components/ordo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEquipmentItems, useMagicItems } from '@/hooks/useContentCatalog';
import type {
  DiceFormula,
  EquipmentCost,
  EquipmentItemDetail,
  MagicItemCost,
  MagicItemDetail,
} from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { normalizeRarity, rarityColor, RARITY_ORDER } from '@/lib/itemVisuals';
import { RarityBadge, rarityLabelKey } from '@/components/items/RarityBadge';
import s from './ItemCatalogPage.module.css';

const ALL = '__all__';

/* ── Shared helpers ─────────────────────────────────────── */

const KIND_GLYPH: Record<string, string> = {
  weapon: 'sword',
  armor: 'shield',
  gear: 'square',
  tool: 'hex',
  ammunition: 'diamond',
};
const KIND_COLOR: Record<string, string> = {
  weapon: 'var(--ember-pale)',
  armor: 'var(--rar-rare)',
  gear: 'var(--gold)',
  tool: 'var(--bronze)',
  ammunition: 'var(--rar-uncommon)',
};
const kindGlyph = (kind?: string) => (kind && KIND_GLYPH[kind.toLowerCase()]) || 'scroll';
const kindColor = (kind?: string) => (kind && KIND_COLOR[kind.toLowerCase()]) || 'var(--ink-quiet)';

const KNOWN_KINDS = new Set(['weapon', 'armor', 'gear', 'tool', 'ammunition']);
function kindLabel(t: (k: string) => string, kind: string) {
  const k = kind.toLowerCase();
  return KNOWN_KINDS.has(k) ? t(`cat.kind.${k}`) : kind;
}

function diceText(d?: DiceFormula | null): string {
  if (!d) return '';
  if (d.rawText) return d.rawText;
  const count = d.diceCount ?? '';
  const size = d.dieSize ? `d${d.dieSize}` : '';
  const bonus = d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : `${d.bonus}`) : '';
  return `${count}${size}${bonus}`;
}

function costText(cost?: EquipmentCost | MagicItemCost | null): string {
  if (!cost) return '';
  if (cost.rawText) return cost.rawText;
  if (cost.amount && cost.currency?.name) return `${cost.amount} ${cost.currency.name}`;
  return cost.amount ?? '';
}

/* ── Small presentational pieces ────────────────────────── */

interface ChipOption {
  value: string;
  label: string;
  color?: string;
}

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={s.chipRow}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn(s.fchip, value === o.value && s.fchipOn)}
          onClick={() => onChange(o.value)}
          style={o.color ? ({ '--fc': o.color } as CSSProperties) : undefined}
        >
          {o.color && <span className={s.dot} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={s.detailRow}>
      <span className={s.detailLabel}>{label}</span>
      <span className={s.detailValue}>{value}</span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={cn('ao-rgrid', s.grid)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-ph', s.phW40)} />
          <div className={cn('ao-ph', s.phW70)} />
          <div className={cn('ao-ph', s.phW50)} />
        </div>
      ))}
    </div>
  );
}

/* ── Equipment tab ──────────────────────────────────────── */

function EquipmentCatalog({ campaignId }: { campaignId?: string }) {
  const t = useT();
  const { data, isLoading, error, refetch } = useEquipmentItems(campaignId);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [selected, setSelected] = useState<EquipmentItemDetail | null>(null);

  const items = useMemo(() => data ?? [], [data]);

  const kindOptions = useMemo<ChipOption[]>(() => {
    const set = new Set<string>();
    items.forEach((it) => it.kind && set.add(it.kind.toLowerCase()));
    const opts = Array.from(set)
      .sort()
      .map((k) => ({ value: k, label: kindLabel(t, k), color: kindColor(k) }));
    return [{ value: ALL, label: t('cat.filter.all') }, ...opts];
  }, [items, t]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (kind !== ALL && it.kind?.toLowerCase() !== kind) return;
      if (it.category?.name) set.add(it.category.name);
    });
    return Array.from(set).sort();
  }, [items, kind]);

  // Selected category may no longer be valid after a kind change — fold to ALL.
  const effCategory = categories.includes(category) ? category : ALL;

  const sourceOptions: ChipOption[] = [
    { value: ALL, label: t('cat.filter.all') },
    { value: 'core', label: t('cat.source.core') },
    { value: 'homebrew', label: t('cat.source.homebrew') },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (kind !== ALL && it.kind?.toLowerCase() !== kind) return false;
      if (effCategory !== ALL && it.category?.name !== effCategory) return false;
      if (source === 'core' && it.packageId) return false;
      if (source === 'homebrew' && !it.packageId) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, kind, effCategory, source, search]);

  if (isLoading) return <SkeletonGrid />;
  if (error) {
    return (
      <ErrorAltar
        title={t('cat.error.title')}
        body={t('cat.error.body')}
        error={error}
        onRetry={() => refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <div>
      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Rune kind="search" size={13} color="var(--ink-faint)" />
          <input
            className={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cat.search')}
          />
        </div>
        <FilterChips options={kindOptions} value={kind} onChange={setKind} />
        <div className={s.toolbarRow}>
          {categories.length > 0 && (
            <Select value={effCategory} onValueChange={setCategory}>
              <SelectTrigger className={s.catSelect}>
                <SelectValue placeholder={t('cat.filter.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('cat.filter.allCategories')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FilterChips options={sourceOptions} value={source} onChange={setSource} />
        </div>
      </div>

      <div className={cn('ao-overline', s.count)}>{t('cat.count', { n: filtered.length })}</div>

      {filtered.length === 0 ? (
        <EmptyVault glyph="sword" icon="equipment" title={t('cat.empty.title')} body={t('cat.empty.body')} />
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {filtered.map((it) => {
            const c = kindColor(it.kind);
            return (
              <button
                key={it.id}
                type="button"
                className={cn('ao-panel ao-frame', s.card)}
                style={{ '--c': c } as CSSProperties}
                onClick={() => setSelected(it)}
              >
                <span className="ao-frame-c" />
                <div className={s.cardHead}>
                  <div className={s.cardHeadMain}>
                    <div className={cn('ao-h5', s.cardName)}>{it.name}</div>
                    {it.category?.name && <div className={s.cardSub}>{it.category.name}</div>}
                  </div>
                  <span className={s.iconBox}>
                    <OrdoAssetIcon
                      names={[it.nameEn, it.name]}
                      source="equipment"
                      imgClassName={s.assetIcon}
                      fallback={<Rune kind={kindGlyph(it.kind)} size={18} color={c} />}
                    />
                  </span>
                </div>

                <div className={s.badges}>
                  <span className={s.kindChip} style={{ '--fc': c } as CSSProperties}>
                    <span className={s.dot} />
                    {kindLabel(t, it.kind)}
                  </span>
                  {it.weaponStat?.damageDice && (
                    <span className={s.dmgChip}>
                      <Rune kind="diamond-fill" size={7} color="var(--ember-pale)" />
                      {diceText(it.weaponStat.damageDice)}
                    </span>
                  )}
                  {it.armorStat && (it.armorStat.baseAc != null || it.armorStat.armorClassRaw) && (
                    <span className={s.acChip}>
                      <Rune kind="shield" size={8} color="var(--rar-rare)" />
                      {t('cat.armor.acRaw')} {it.armorStat.armorClassRaw ?? it.armorStat.baseAc}
                    </span>
                  )}
                  {it.packageId && (
                    <OrdoChip tone="rune" glyph="scroll">
                      {t('cat.homebrew')}
                    </OrdoChip>
                  )}
                </div>

                <div className={s.cardFoot}>
                  {costText(it.cost) && <span className={s.footItem}>{costText(it.cost)}</span>}
                  {it.weightLb && (
                    <span className={s.footItem}>
                      {it.weightLb} {t('cat.field.weightUnit')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className={s.detail}>
                <div className={s.detailChips}>
                  <span className={s.kindChip} style={{ '--fc': kindColor(selected.kind) } as CSSProperties}>
                    <span className={s.dot} />
                    {kindLabel(t, selected.kind)}
                  </span>
                  {selected.packageId && (
                    <OrdoChip tone="rune" glyph="scroll">
                      {t('cat.homebrew')}
                    </OrdoChip>
                  )}
                </div>

                <Field label={t('cat.field.category')} value={selected.category?.name} />
                <Field label={t('cat.field.cost')} value={costText(selected.cost)} />
                <Field
                  label={t('cat.field.weight')}
                  value={selected.weightLb ? `${selected.weightLb} ${t('cat.field.weightUnit')}` : ''}
                />
                <Field label={t('cat.field.properties')} value={selected.propertiesText} />

                {selected.weaponStat && (
                  <section className={s.detailSec}>
                    <div className="ao-overline">{t('cat.weapon.title')}</div>
                    <Field label={t('cat.weapon.damage')} value={diceText(selected.weaponStat.damageDice)} />
                    <Field label={t('cat.weapon.damageType')} value={selected.weaponStat.damageType?.name} />
                    <Field
                      label={t('cat.weapon.flat')}
                      value={selected.weaponStat.flatDamage ?? ''}
                    />
                    <Field label={t('cat.weapon.mastery')} value={selected.weaponStat.mastery?.name} />
                  </section>
                )}

                {selected.weaponProperties.length > 0 && (
                  <section className={s.detailSec}>
                    <div className="ao-overline">{t('cat.weapon.properties')}</div>
                    <ul className={s.propList}>
                      {selected.weaponProperties.map((p, i) => (
                        <li key={i}>
                          {p.property?.name ?? p.rawText}
                          {(p.normalRangeFt || p.longRangeFt) && (
                            <span className={s.propMeta}>
                              {' '}
                              {p.normalRangeFt ?? '—'}/{p.longRangeFt ?? '—'} {t('cat.weapon.rangeUnit')}
                            </span>
                          )}
                          {p.versatileDice && (
                            <span className={s.propMeta}>
                              {' '}
                              ({t('cat.weapon.versatile')} {diceText(p.versatileDice)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {selected.armorStat && (
                  <section className={s.detailSec}>
                    <div className="ao-overline">{t('cat.armor.title')}</div>
                    <Field label={t('cat.armor.acRaw')} value={selected.armorStat.armorClassRaw} />
                    <Field label={t('cat.armor.baseAc')} value={selected.armorStat.baseAc ?? ''} />
                    <Field
                      label={t('cat.armor.maxDex')}
                      value={selected.armorStat.maxDexBonus ?? ''}
                    />
                    <Field
                      label={t('cat.armor.strReq')}
                      value={selected.armorStat.strengthRequired ?? ''}
                    />
                    <Field
                      label={t('cat.armor.stealth')}
                      value={
                        selected.armorStat.stealthDisadvantage == null
                          ? ''
                          : selected.armorStat.stealthDisadvantage
                            ? t('cat.yes')
                            : t('cat.no')
                      }
                    />
                  </section>
                )}

                {selected.url && (
                  <a className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.srcLink)} href={selected.url} target="_blank" rel="noreferrer">
                    <Rune kind="book" size={11} /> {t('cat.field.sourceLink')}
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Magic items tab ────────────────────────────────────── */

function MagicCatalog({ campaignId }: { campaignId?: string }) {
  const t = useT();
  const { data, isLoading, error, refetch } = useMagicItems(campaignId);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(ALL);
  const [rarity, setRarity] = useState(ALL);
  const [attune, setAttune] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [selected, setSelected] = useState<MagicItemDetail | null>(null);

  const items = useMemo(() => data ?? [], [data]);

  const rawRarity = (it: MagicItemDetail) => it.rarity?.slug ?? it.rarity?.name ?? '';

  const types = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => it.type?.name && set.add(it.type.name));
    return Array.from(set).sort();
  }, [items]);

  const rarityOptions = useMemo<ChipOption[]>(() => {
    const present = new Set(items.map((it) => normalizeRarity(rawRarity(it))).filter(Boolean));
    const opts = RARITY_ORDER.filter((k) => present.has(k)).map((k) => ({
      value: k,
      label: t(rarityLabelKey(k)),
      color: rarityColor(k),
    }));
    return [{ value: ALL, label: t('cat.filter.all') }, ...opts];
  }, [items, t]);

  const attuneOptions: ChipOption[] = [
    { value: ALL, label: t('cat.filter.all') },
    { value: 'yes', label: t('cat.attunement.required') },
    { value: 'no', label: t('cat.attunement.no') },
  ];
  const sourceOptions: ChipOption[] = [
    { value: ALL, label: t('cat.filter.all') },
    { value: 'core', label: t('cat.source.core') },
    { value: 'homebrew', label: t('cat.source.homebrew') },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (type !== ALL && it.type?.name !== type) return false;
      if (rarity !== ALL && normalizeRarity(rawRarity(it)) !== rarity) return false;
      if (attune === 'yes' && !it.attunementRequired) return false;
      if (attune === 'no' && it.attunementRequired) return false;
      if (source === 'core' && it.packageId) return false;
      if (source === 'homebrew' && !it.packageId) return false;
      if (q && !it.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, type, rarity, attune, source, search]);

  if (isLoading) return <SkeletonGrid />;
  if (error) {
    return (
      <ErrorAltar
        title={t('cat.error.title')}
        body={t('cat.error.body')}
        error={error}
        onRetry={() => refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  return (
    <div>
      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Rune kind="search" size={13} color="var(--ink-faint)" />
          <input
            className={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cat.search')}
          />
        </div>
        <FilterChips options={rarityOptions} value={rarity} onChange={setRarity} />
        <div className={s.toolbarRow}>
          {types.length > 0 && (
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className={s.catSelect}>
                <SelectValue placeholder={t('cat.filter.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('cat.filter.allTypes')}</SelectItem>
                {types.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {ty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FilterChips options={attuneOptions} value={attune} onChange={setAttune} />
          <FilterChips options={sourceOptions} value={source} onChange={setSource} />
        </div>
      </div>

      <div className={cn('ao-overline', s.count)}>{t('cat.count', { n: filtered.length })}</div>

      {filtered.length === 0 ? (
        <EmptyVault glyph="hex" icon="magic-item" title={t('cat.empty.title')} body={t('cat.empty.body')} />
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {filtered.map((it) => {
            const rk = normalizeRarity(rawRarity(it));
            const c = rarityColor(rawRarity(it));
            return (
              <button
                key={it.id}
                type="button"
                className={cn('ao-panel ao-frame', s.card)}
                style={{ '--c': c } as CSSProperties}
                onClick={() => setSelected(it)}
              >
                <span className="ao-frame-c" />
                <div className={s.cardHead}>
                  <div className={s.cardHeadMain}>
                    <div className={cn('ao-h5', s.cardName)}>{it.name}</div>
                    {it.type?.name && <div className={s.cardSub}>{it.type.name}</div>}
                  </div>
                  <span className={s.iconBox}>
                    <OrdoAssetIcon
                      names={[it.nameEn, it.name]}
                      source="items"
                      imgClassName={s.assetIcon}
                      fallback={<Rune kind="hex" size={18} color={c} />}
                    />
                  </span>
                </div>

                <div className={s.badges}>
                  {rk ? (
                    <RarityBadge rarity={rawRarity(it)} size="md" />
                  ) : (
                    it.rarity?.name && <OrdoChip tone="arcane">{it.rarity.name}</OrdoChip>
                  )}
                  {it.attunementRequired && (
                    <OrdoChip tone="ember" glyph="lock">
                      {t('cat.attunement.short')}
                    </OrdoChip>
                  )}
                  {it.packageId && (
                    <OrdoChip tone="rune" glyph="scroll">
                      {t('cat.homebrew')}
                    </OrdoChip>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className={s.detail}>
                <div className={s.detailChips}>
                  {normalizeRarity(rawRarity(selected)) ? (
                    <RarityBadge rarity={rawRarity(selected)} size="md" />
                  ) : (
                    selected.rarity?.name && <OrdoChip tone="arcane">{selected.rarity.name}</OrdoChip>
                  )}
                  {selected.packageId && (
                    <OrdoChip tone="rune" glyph="scroll">
                      {t('cat.homebrew')}
                    </OrdoChip>
                  )}
                </div>

                <Field label={t('cat.magic.type')} value={selected.type?.name} />
                <Field label={t('cat.magic.typeRestriction')} value={selected.typeRestrictionRaw} />
                <Field
                  label={t('cat.magic.variableRarity')}
                  value={selected.variableRarity ? t('cat.yes') : ''}
                />
                <Field
                  label={t('cat.magic.attunement')}
                  value={
                    selected.attunementRequired
                      ? selected.attunementRequirement || t('cat.attunement.required')
                      : t('cat.attunement.no')
                  }
                />
                <Field label={t('cat.field.cost')} value={costText(selected.cost)} />

                {selected.allowedEquipment.length > 0 && (
                  <section className={s.detailSec}>
                    <div className="ao-overline">{t('cat.magic.allowedEquipment')}</div>
                    <ul className={s.propList}>
                      {selected.allowedEquipment.map((a, i) => (
                        <li key={i}>{a.equipment?.name ?? a.rawText}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {selected.description && (
                  <section className={s.detailSec}>
                    <div className="ao-overline">{t('cat.magic.description')}</div>
                    <p className={s.desc}>{selected.description}</p>
                  </section>
                )}

                {selected.url && (
                  <a className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.srcLink)} href={selected.url} target="_blank" rel="noreferrer">
                    <Rune kind="book" size={11} /> {t('cat.field.sourceLink')}
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Page shell ─────────────────────────────────────────── */

type Tab = 'equipment' | 'magic';

export default function ItemCatalogPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId?: string }>();
  const [tab, setTab] = useState<Tab>('equipment');

  return (
    <div>
      <div className={s.header}>
        <div className="ao-overline">{t('cat.overline')}</div>
        <h3 className={cn('ao-h3', s.titleH3)}>{t('cat.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {campaignId ? t('cat.subtitleCampaign') : t('cat.subtitle')}
        </p>
      </div>

      <div className={cn('ao-tabs', s.tabRow)}>
        <button
          type="button"
          className={cn('ao-tab', s.tab, tab === 'equipment' && 'is-active')}
          onClick={() => setTab('equipment')}
        >
          <OrdoInterfaceIcon icon="equipment" size={13} /> {t('cat.tab.equipment')}
        </button>
        <button
          type="button"
          className={cn('ao-tab', s.tab, tab === 'magic' && 'is-active')}
          onClick={() => setTab('magic')}
        >
          <OrdoInterfaceIcon icon="magic-item" size={13} /> {t('cat.tab.magic')}
        </button>
      </div>

      {tab === 'equipment' ? (
        <EquipmentCatalog campaignId={campaignId} />
      ) : (
        <MagicCatalog campaignId={campaignId} />
      )}
    </div>
  );
}
