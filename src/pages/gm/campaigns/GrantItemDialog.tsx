import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OrdoInterfaceIcon, Rune, type OrdoInterfaceIconKey } from '@/components/ordo';
import { RarityBadge, rarityLabelKey } from '@/components/items/RarityBadge';
import { useGrantItem } from '@/hooks/useInventory';
import { useItems } from '@/hooks/useContentCatalog';
import { isRetryableError } from '@/lib/errors';
import { rarityColor, normalizeRarity, RARITY_ORDER } from '@/lib/itemVisuals';
import { formatApproxGold, goldFromCopper } from '@/lib/price';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import type {
  GrantItemRequest,
  GrantItemKind,
  ItemDefinition,
  DiceFormula,
} from '@/types';
import { ItemBuffPickerDialog } from './ItemBuffPickerDialog';
import s from './GrantItemDialog.module.css';

/* ── grant picker model (unified over the campaign item catalog) ──
   Sourced from the same content catalog the /campaigns/{id}/items page
   shows: equipment_item + magic_item. Each catalog item is normalized into
   a GrantEntry so the picker can group, search and grant by a single shape,
   and so the payload carries the right (itemId, itemKind) pair to the server. */

type ItemCategory = 'weapon' | 'armor' | 'gear' | 'tool' | 'magic';

const CATEGORY_ORDER: ItemCategory[] = ['weapon', 'armor', 'gear', 'tool', 'magic'];

const CATEGORY_ICON: Record<ItemCategory, OrdoInterfaceIconKey> = {
  weapon: 'weapon',
  armor: 'armor',
  gear: 'equipment',
  tool: 'tool',
  magic: 'magic-item',
};

const DESC_WORD_LIMIT = 40;

interface GrantEntry {
  id: string;
  kind: GrantItemKind;
  category: ItemCategory;
  name: string;
  itemTypeName?: string;
  rarity?: string;
  damageDice?: string;
  priceGold?: number | null;
  homebrew: boolean;
  description?: string;
}

function diceText(d?: DiceFormula | null): string | undefined {
  if (!d) return undefined;
  if (d.rawText) return d.rawText;
  const count = d.diceCount ?? '';
  const size = d.dieSize ? `d${d.dieSize}` : '';
  const bonus = d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : `${d.bonus}`) : '';
  const txt = `${count}${size}${bonus}`;
  return txt || undefined;
}

/* ── unified item catalog (IT-1) → single GrantEntry normalizer ──
   Одна выдача /campaigns/{id}/reference/items несёт три вида предметов
   (EQUIPMENT / MAGIC / TEMPLATE-легаси); дискриминатор kind сохраняется в
   GrantEntry, чтобы грант ушёл с правильной парой (itemId, itemKind). */

function itemCategory(d: ItemDefinition): ItemCategory {
  if (d.kind === 'MAGIC') return 'magic';
  if (d.kind === 'TEMPLATE') return d.rarity ? 'magic' : 'gear';
  const kind = (d.equipmentKind ?? '').toLowerCase();
  if (kind === 'weapon' || d.weaponStat) return 'weapon';
  if (kind === 'armor' || d.armorStat) return 'armor';
  if (kind === 'tool') return 'tool';
  return 'gear';
}

function itemPriceGold(d: ItemDefinition): number | null {
  if (d.cost?.copperValue != null) return goldFromCopper(d.cost.copperValue);
  if (d.cost?.amount != null) {
    const n = Number(d.cost.amount);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function itemEntry(d: ItemDefinition): GrantEntry {
  return {
    id: d.id,
    kind: d.kind,
    category: itemCategory(d),
    name: d.name,
    itemTypeName: d.type?.name ?? d.equipmentKind ?? undefined,
    rarity: d.rarity?.slug ?? d.rarity?.name ?? undefined,
    damageDice: diceText(d.weaponStat?.damageDice),
    priceGold: itemPriceGold(d),
    homebrew: !!d.packageId,
    description: d.description ?? undefined,
  };
}

interface GrantItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  characterId: string;
}

export function GrantItemDialog({
  open,
  onOpenChange,
  campaignId,
  characterId,
}: GrantItemDialogProps) {
  const t = useT();
  const grantMutation = useGrantItem();
  const { user } = useAuthStore();
  const canManageItemBuffs = user?.role === 'ADMIN' || user?.role === 'GAME_MASTER';

  const {
    data: itemsData,
    isLoading: loading,
    isError,
    error: loadError,
    refetch: refetchAll,
  } = useItems(campaignId);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [unique, setUnique] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [buffPickerOpen, setBuffPickerOpen] = useState(false);
  const [selectedBuffIds, setSelectedBuffIds] = useState<string[]>([]);

  /* ── derived ── */

  const entries: GrantEntry[] = useMemo(
    () => (itemsData ?? []).map(itemEntry),
    [itemsData],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const haystack = [
        e.name,
        e.itemTypeName,
        e.rarity,
        e.rarity ? t(rarityLabelKey(e.rarity)) : '',
        t(`camp2.inv.cat.${e.category}`),
        e.damageDice,
        e.priceGold != null ? formatApproxGold(e.priceGold) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, t]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<ItemCategory, number>();
    for (const e of filtered) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return counts;
  }, [filtered]);

  const groups = useMemo(() => {
    const buckets = new Map<ItemCategory, GrantEntry[]>();
    for (const e of filtered) {
      if (category !== 'all' && e.category !== category) continue;
      const list = buckets.get(e.category);
      if (list) list.push(e);
      else buckets.set(e.category, [e]);
    }
    const rank = (r?: string) => {
      const k = normalizeRarity(r);
      return k ? RARITY_ORDER.indexOf(k) : -1;
    };
    return CATEGORY_ORDER.filter((key) => buckets.has(key)).map((key) => ({
      key,
      items: buckets
        .get(key)!
        .slice()
        .sort((a, b) => rank(b.rarity) - rank(a.rarity) || a.name.localeCompare(b.name)),
    }));
  }, [filtered, category]);

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const descLong = selected?.description
    ? selected.description.trim().split(/\s+/).filter(Boolean).length > DESC_WORD_LIMIT
    : false;
  const descCollapsed = descLong && !descExpanded;

  const stats = useMemo(() => {
    if (!selected) return [] as { k: string; v: string; color?: string }[];
    const out: { k: string; v: string; color?: string }[] = [];
    if (selected.damageDice) out.push({ k: t('camp2.inv.relic.damage'), v: selected.damageDice });
    if (selected.itemTypeName) out.push({ k: t('camp2.inv.relic.type'), v: selected.itemTypeName });
    if (selected.priceGold != null) out.push({ k: 'Price', v: formatApproxGold(selected.priceGold), color: 'var(--gold-pale)' });
    if (selected.rarity)
      out.push({
        k: t('camp2.inv.relic.rarity'),
        v: t(rarityLabelKey(selected.rarity)),
        color: rarityColor(selected.rarity),
      });
    return out;
  }, [selected, t]);

  const summaryName = customName.trim() || selected?.name || '';

  /* ── handlers ── */

  const reset = () => {
    setQuery('');
    setCategory('all');
    setSelectedId('');
    setQuantity(1);
    setCustomName('');
    setUnique(false);
    setDescExpanded(false);
    setBuffPickerOpen(false);
    setSelectedBuffIds([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const selectEntry = (id: string) => {
    setSelectedId(id);
    setDescExpanded(false);
  };

  const handleGrant = () => {
    if (!selected) return;
    const data: GrantItemRequest = {
      itemId: selected.id,
      itemKind: selected.kind,
      quantity: quantity || 1,
      isUnique: unique || undefined,
      customName: customName.trim() || undefined,
      buffDebuffIds: selectedBuffIds.length > 0 ? selectedBuffIds : undefined,
    };
    grantMutation.mutate(
      { campaignId, characterId, data },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  /* ── render ── */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('ao-panel ao-frame ao-modal', s.modal)}
        aria-describedby={undefined}
        style={{ maxWidth: 980, '--accent': 'var(--gold)' } as CSSProperties}
      >
        <span className="ao-frame-c" />
        <div className={s.shell}>
          {/* ── header ── */}
          <div className={s.head}>
            <div className={s.headTitle}>
              <div className={s.headRune}>
                <Rune kind="book" size={18} color="var(--accent)" />
              </div>
              <DialogTitle asChild>
                <div className={cn('ao-h4', s.headText)}>{t('camp2.inv.dialog.grantTitle')}</div>
              </DialogTitle>
            </div>
          </div>

          {/* ── body: two panes ── */}
          <div className={s.body}>
            {/* LEFT — catalog */}
            <div className={s.catalog}>
              <div className={s.catalogHead}>
                <div className={s.search}>
                  <Rune kind="search" size={15} color="var(--ink-faint)" />
                  <input
                    className={s.searchInput}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('camp2.inv.grant.searchPlaceholder')}
                    disabled={loading}
                  />
                  {query && (
                    <button
                      type="button"
                      className={s.searchClear}
                      onClick={() => setQuery('')}
                      title={t('camp2.inv.clear')}
                    >
                      <Rune kind="x" size={12} color="var(--ink-faint)" />
                    </button>
                  )}
                </div>

                {!loading && !isError && entries.length > 0 && (
                  <div className={s.chips}>
                    <button
                      type="button"
                      className={cn(s.chip, category === 'all' && s.chipOn)}
                      onClick={() => setCategory('all')}
                    >
                      <span>{t('camp2.inv.cat.all')}</span>
                      <span className={cn('ao-num', s.chipCount)}>{filtered.length}</span>
                    </button>
                    {CATEGORY_ORDER.filter((c) => categoryCounts.has(c)).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={cn(s.chip, category === c && s.chipOn)}
                        onClick={() => setCategory(c)}
                      >
                        <span>{t(`camp2.inv.cat.${c}`)}</span>
                        <span className={cn('ao-num', s.chipCount)}>{categoryCounts.get(c)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={s.list} role="listbox" aria-label={t('camp2.inv.chooseTemplate')}>
                {loading ? (
                  <div className={s.state}>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('camp2.inv.loadingTemplates')}
                  </div>
                ) : isError ? (
                  <div className={s.state}>
                    <div>{t('camp2.inv.templatesLoadError')}</div>
                    {isRetryableError(loadError) && (
                      <button type="button" className="ao-btn ao-btn--ghost" onClick={() => refetchAll()}>
                        <Rune kind="arrow-r" size={11} /> {t('camp2.inv.retry')}
                      </button>
                    )}
                  </div>
                ) : entries.length === 0 ? (
                  <div className={cn('ao-italic', s.state)}>{t('camp2.inv.templatesEmptyHint')}</div>
                ) : groups.length === 0 ? (
                  <div className={s.noResults}>
                    <div className={s.noResultsTitle}>{t('camp2.inv.grant.noResultsTitle')}</div>
                    <div className={cn('ao-italic', s.noResultsSub)}>
                      {t('camp2.inv.grant.noResultsSub')}
                    </div>
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.key} className={s.group}>
                      <div className={s.groupHead}>
                        <span className={s.groupName}>
                          <OrdoInterfaceIcon icon={CATEGORY_ICON[g.key]} size={13} style={{ color: 'var(--accent)' }} />
                          {t(`camp2.inv.cat.${g.key}`)}
                        </span>
                        <span className={cn('ao-num', s.groupCount)}>{g.items.length}</span>
                      </div>
                      <div className={s.groupItems}>
                        {g.items.map((e) => {
                          const sel = e.id === selectedId;
                          return (
                            <button
                              key={e.id}
                              type="button"
                              role="option"
                              aria-selected={sel}
                              className={cn(s.opt, sel && s.optOn)}
                              onClick={() => selectEntry(e.id)}
                            >
                              <span className={s.optIcon}>
                                <OrdoInterfaceIcon
                                  icon={CATEGORY_ICON[e.category]}
                                  size={17}
                                  style={{ color: rarityColor(e.rarity) }}
                                />
                              </span>
                              <span className={s.optMain}>
                                <span className={s.optName}>{e.name}</span>
                                <span className={s.optMeta}>
                                  {e.rarity && <RarityBadge rarity={e.rarity} size="sm" />}
                                  {e.itemTypeName && <span className={s.optType}>{e.itemTypeName}</span>}
                                  {e.damageDice && <span className="ao-num">{e.damageDice}</span>}
                                  {e.priceGold != null && (
                                    <span className={cn('ao-num', s.optPrice)}>{formatApproxGold(e.priceGold)}</span>
                                  )}
                                  {e.homebrew && (
                                    <span className={s.hbBadge}>{t('camp2.inv.homebrew')}</span>
                                  )}
                                </span>
                              </span>
                              {sel && <Rune kind="check" size={16} color="var(--accent)" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT — detail / empty */}
            <div className={s.detail}>
              {selected ? (
                <div className={s.detailScroll}>
                  <div className={s.itemHead}>
                    <div className={s.itemIcon}>
                      <OrdoInterfaceIcon
                        icon={CATEGORY_ICON[selected.category]}
                        size={28}
                        style={{ color: rarityColor(selected.rarity) }}
                      />
                    </div>
                    <div className={s.itemHeadMain}>
                      <div className={cn('ao-h4', s.itemName)}>{selected.name}</div>
                      <div className={s.itemSub}>
                        {selected.rarity && <RarityBadge rarity={selected.rarity} size="md" />}
                        {selected.itemTypeName && (
                          <span className={cn('ao-italic', s.itemType)}>{selected.itemTypeName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {stats.length > 0 && (
                    <div className={s.statRow}>
                      {stats.map((st) => (
                        <div key={st.k} className={s.statChip}>
                          <span className={s.statKey}>{st.k}</span>
                          <span
                            className={s.statVal}
                            style={st.color ? { color: st.color } : undefined}
                          >
                            {st.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selected.description && (
                    <div className={s.descBlock}>
                      <div className={s.descClip}>
                        <div className={cn(s.descText, descCollapsed && s.descCollapsed)}>
                          {selected.description}
                        </div>
                        {descCollapsed && <div className={s.descFade} />}
                      </div>
                      {descLong && (
                        <button
                          type="button"
                          className={s.descToggle}
                          onClick={() => setDescExpanded((v) => !v)}
                        >
                          <span>
                            {descExpanded
                              ? t('camp2.inv.grant.descLess')
                              : t('camp2.inv.grant.descMore')}
                          </span>
                          <Rune
                            kind="chev-d"
                            size={13}
                            className={cn(s.descChev, descExpanded && s.descChevUp)}
                          />
                        </button>
                      )}
                    </div>
                  )}

                  <div className={s.form}>
                    <div className={s.formRow}>
                      <div className={s.qtyField}>
                        <div className={s.fieldLabel}>{t('camp2.inv.field.quantity')}</div>
                        <div className={s.stepper}>
                          <button
                            type="button"
                            className={s.stepBtn}
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            aria-label={t('camp2.inv.field.quantity')}
                          >
                            <Rune kind="minus" size={14} />
                          </button>
                          <input
                            className={cn('ao-num', s.stepInput)}
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => {
                              const n = parseInt(e.target.value, 10);
                              setQuantity(isNaN(n) ? 1 : Math.max(1, Math.min(999, n)));
                            }}
                          />
                          <button
                            type="button"
                            className={s.stepBtn}
                            onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                            aria-label={t('camp2.inv.field.quantity')}
                          >
                            <Rune kind="plus" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className={s.nameField}>
                        <div className={s.fieldLabel}>
                          {t('camp2.inv.grant.customNameLabel')}{' '}
                          <span className={s.fieldOptional}>{t('camp2.inv.grant.optionalMark')}</span>
                        </div>
                        <input
                          className={s.nameInput}
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={t('camp2.inv.field.overrideName')}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className={cn(s.uniqueRow, unique && s.uniqueOn)}
                      onClick={() => setUnique((v) => !v)}
                      aria-pressed={unique}
                    >
                      <span className={cn(s.uniqueBox, unique && s.uniqueBoxOn)}>
                        {unique && <Rune kind="check" size={13} color="var(--stone)" />}
                      </span>
                      <span className={s.uniqueText}>
                        <span className={s.uniqueLabel}>{t('camp2.inv.field.uniqueItem')}</span>
                        <span className={cn('ao-italic', s.uniqueSub)}>
                          {t('camp2.inv.grant.uniqueSub')}
                        </span>
                      </span>
                    </button>

                    {canManageItemBuffs && (
                      <button
                        type="button"
                        className={cn(s.buffRow, selectedBuffIds.length > 0 && s.buffRowOn)}
                        onClick={() => setBuffPickerOpen(true)}
                      >
                        <Rune kind="hex" size={16} color="var(--accent)" />
                        <span className={s.uniqueText}>
                          <span className={s.uniqueLabel}>Item buffs</span>
                          <span className={cn('ao-italic', s.uniqueSub)}>
                            {selectedBuffIds.length > 0
                              ? `${selectedBuffIds.length} linked to this granted item`
                              : 'Choose buffs linked to this granted item'}
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>
                    <Rune kind="hex" size={26} color="var(--ink-ghost)" />
                  </div>
                  <div className={cn('ao-h5', s.emptyTitle)}>
                    {t('camp2.inv.grant.pickEmptyTitle')}
                  </div>
                  <div className={cn('ao-italic', s.emptySub)}>
                    {t('camp2.inv.grant.pickEmptySub')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── footer ── */}
          <div className={s.foot}>
            <div className={s.summary}>
              {selected ? (
                <span className={s.summaryText}>
                  <span className={cn('ao-italic', s.summaryLabel)}>
                    {t('camp2.inv.grant.summaryLabel')}
                  </span>{' '}
                  <span className={s.summaryName}>{summaryName}</span>{' '}
                  <span className={cn('ao-num', s.summaryQty)}>× {quantity}</span>
                </span>
              ) : (
                <span className={cn('ao-italic', s.summaryEmpty)}>
                  {t('camp2.inv.grant.nothingSelected')}
                </span>
              )}
            </div>
            <div className={s.footActions}>
              <button
                className="ao-btn ao-btn--ghost"
                onClick={() => handleOpenChange(false)}
                disabled={grantMutation.isPending}
              >
                {t('camp2.inv.withhold')}
              </button>
              <button
                className="ao-btn ao-btn--primary"
                onClick={handleGrant}
                disabled={!selected || loading || grantMutation.isPending}
              >
                {grantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('camp2.inv.grant')}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
      <ItemBuffPickerDialog
        open={buffPickerOpen}
        onOpenChange={setBuffPickerOpen}
        selectedIds={selectedBuffIds}
        onSave={(ids) => {
          setSelectedBuffIds(ids);
          setBuffPickerOpen(false);
        }}
        title="Choose item buffs"
        itemName={selected?.name}
      />
    </Dialog>
  );
}
