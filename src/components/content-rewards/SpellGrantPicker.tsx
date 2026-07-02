import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rune } from '@/components/ordo';
import { useSpell } from '@/hooks/useContentCatalog';
import { useT, useI18n } from '@/i18n/I18nContext';
import { localizedName } from '@/lib/contentAdapters';
import { spellComponentsText, spellMaterialText, spellRangeText } from '@/lib/spells';
import type { SpellReferenceResponse } from '@/types';
import s from './SpellGrantPicker.module.css';

/* ── grouped spell picker ────────────────────────────────────────
   The selectable spell pool (already filtered by class + level by the
   caller) is grouped first by spell level ("круг"), then by school of
   magic inside each level. Clicking a spell focuses it and the detail
   pane fetches the full SpellDetail (casting time, range, components,
   duration, higher-level scaling). Selection is a separate control
   (the checkbox on the row + the button in the detail pane), so a spell
   can be inspected without being chosen — important once the choose
   limit is reached. */

const NONE_SCHOOL = '__none';

interface SchoolGroup {
  school: string;
  items: SpellReferenceResponse[];
}
interface LevelGroup {
  level: number;
  count: number;
  schools: SchoolGroup[];
}

function buildGroups(pool: SpellReferenceResponse[]): LevelGroup[] {
  const byLevel = new Map<number, SpellReferenceResponse[]>();
  for (const sp of pool) {
    const arr = byLevel.get(sp.level);
    if (arr) arr.push(sp);
    else byLevel.set(sp.level, [sp]);
  }
  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, spells]) => {
      const bySchool = new Map<string, SpellReferenceResponse[]>();
      for (const sp of spells) {
        const key = sp.school?.trim() || NONE_SCHOOL;
        const arr = bySchool.get(key);
        if (arr) arr.push(sp);
        else bySchool.set(key, [sp]);
      }
      const schools = [...bySchool.entries()]
        .sort((a, b) => {
          if (a[0] === NONE_SCHOOL) return 1;
          if (b[0] === NONE_SCHOOL) return -1;
          return a[0].localeCompare(b[0]);
        })
        .map(([school, items]) => ({
          school,
          items: items.slice().sort((x, y) => x.name.localeCompare(y.name)),
        }));
      return { level, count: spells.length, schools };
    });
}

export interface SpellGrantPickerProps {
  pool: SpellReferenceResponse[];
  chosen: string[];
  need: number;
  onToggle: (id: string) => void;
  campaignId?: string;
}

export function SpellGrantPicker({ pool, chosen, need, onToggle, campaignId }: SpellGrantPickerProps) {
  const t = useT();
  const { lang } = useI18n();
  const [activeId, setActiveId] = useState('');

  const groups = useMemo(() => buildGroups(pool), [pool]);
  const active = useMemo(() => pool.find((sp) => sp.id === activeId) ?? null, [pool, activeId]);

  const atLimit = chosen.length >= need;
  const levelLabel = (level: number) =>
    level === 0 ? t('camp.lvl.cantrips') : t('camp.lvl.spell.circle', { level });

  return (
    <div className={s.wrap}>
      <div className={s.list} role="listbox" aria-label={t('camp.lvl.spells')}>
        {groups.map((lvl) => (
          <div key={lvl.level} className={s.levelGroup}>
            <div className={s.levelHead}>
              <span className={s.levelTitle}>{levelLabel(lvl.level)}</span>
              <span className={cn('ao-num', s.levelCount)}>{lvl.count}</span>
            </div>
            {lvl.schools.map((sc) => (
              <div key={sc.school} className={s.schoolGroup}>
                <div className={s.schoolHead}>
                  <Rune kind="hex" size={11} color="var(--brass)" />
                  <span className={s.schoolName}>
                    {sc.school === NONE_SCHOOL ? t('camp.lvl.spell.schoolOther') : sc.school}
                  </span>
                </div>
                <div className={s.rows}>
                  {sc.items.map((sp) => {
                    const isChosen = chosen.includes(sp.id);
                    const isActive = sp.id === activeId;
                    const lockSelect = atLimit && !isChosen;
                    return (
                      <div key={sp.id} className={cn(s.row, isChosen && s.rowChosen)}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isChosen}
                          aria-label={localizedName(sp, lang)}
                          className={cn(s.selectBox, isChosen && s.selectBoxOn)}
                          disabled={lockSelect}
                          onClick={() => onToggle(sp.id)}
                        >
                          {isChosen && <Rune kind="check" size={12} color="var(--stone)" />}
                        </button>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={cn(s.rowBody, isActive && s.rowBodyActive)}
                          onClick={() => setActiveId(sp.id)}
                        >
                          <span className={s.rowName}>{localizedName(sp, lang)}</span>
                          <Rune kind="chev-r" size={13} className={s.rowChev} color="var(--ink-faint)" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={s.detail}>
        {active ? (
          <SpellDetailPane
            spellRef={active}
            campaignId={campaignId}
            chosen={chosen.includes(active.id)}
            lockSelect={atLimit && !chosen.includes(active.id)}
            levelLabel={levelLabel}
            onToggle={() => onToggle(active.id)}
          />
        ) : (
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <Rune kind="sigil-3" size={24} color="var(--ink-ghost)" />
            </div>
            <div className={cn('ao-italic', s.emptyText)}>{t('camp.lvl.spell.pickHint')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpellDetailPane({
  spellRef,
  campaignId,
  chosen,
  lockSelect,
  levelLabel,
  onToggle,
}: {
  spellRef: SpellReferenceResponse;
  campaignId?: string;
  chosen: boolean;
  lockSelect: boolean;
  levelLabel: (level: number) => string;
  onToggle: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const { data: detail, isLoading } = useSpell(spellRef.id, campaignId);

  const name = detail
    ? localizedName({ name: detail.name, nameRu: detail.nameRu ?? undefined, nameEn: detail.nameEn ?? undefined }, lang)
    : localizedName(spellRef, lang);
  const level = detail?.level ?? spellRef.level;
  const school = detail?.school?.name ?? spellRef.school;
  const description = detail?.description ?? spellRef.description;

  const stats: { k: string; v: string }[] = [];
  if (detail) {
    const ct = detail.castingTimeRaw ?? detail.castingActionSlug;
    const rng = spellRangeText(detail);
    const dur = detail.durationRaw ?? detail.durationType;
    const comp = spellComponentsText(detail);
    if (ct) stats.push({ k: t('camp.lvl.spell.castingTime'), v: ct });
    if (rng) stats.push({ k: t('camp.lvl.spell.range'), v: rng });
    if (dur) stats.push({ k: t('camp.lvl.spell.duration'), v: dur });
    if (comp) stats.push({ k: t('camp.lvl.spell.components'), v: comp });
    const dmg = (detail.damage ?? [])
      .map((d) => [d.dice, d.damageType?.name].filter(Boolean).join(' ') || d.raw)
      .filter(Boolean)
      .join(', ');
    if (dmg) stats.push({ k: t('camp.lvl.spell.damage'), v: dmg });
  }
  const material = detail ? spellMaterialText(detail) : undefined;

  return (
    <>
      <div className={s.detailScroll}>
        <div className={s.dHead}>
          <div className={s.dIcon}>
            <Rune kind="sigil-3" size={26} color="var(--gold)" />
          </div>
          <div className={s.dHeadMain}>
            <div className={cn('ao-h5', s.dName)}>{name}</div>
            <div className={s.dMeta}>
              <span className={s.dLevel}>{levelLabel(level)}</span>
              {school && <span className={cn('ao-italic', s.dSchool)}>{school}</span>}
            </div>
          </div>
        </div>

        {detail && (detail.ritual || detail.concentration || detail.saveAbility || detail.attackRoll) && (
          <div className={s.badges}>
            {detail.saveAbility && (
              <span className={s.badge}>
                <Rune kind="shield" size={11} color="var(--gold-pale)" /> {t('camp.lvl.spell.save')}: {t(`best.ability.${detail.saveAbility}`)}
              </span>
            )}
            {detail.attackRoll && (
              <span className={s.badge}>
                <Rune kind="sword" size={11} color="var(--gold-pale)" /> {t('camp.lvl.spell.attackRoll')}
              </span>
            )}
            {detail.concentration && (
              <span className={s.badge}>
                <Rune kind="eye" size={11} color="var(--gold-pale)" /> {t('camp.lvl.spell.concentration')}
              </span>
            )}
            {detail.ritual && (
              <span className={s.badge}>
                <Rune kind="sigil-1" size={11} color="var(--gold-pale)" /> {t('camp.lvl.spell.ritual')}
              </span>
            )}
          </div>
        )}

        {isLoading && !detail ? (
          <div className={s.detailState}>
            <Loader2 className="h-4 w-4 animate-spin" /> {t('camp.lvl.spell.loading')}
          </div>
        ) : (
          <>
            {stats.length > 0 && (
              <div className={s.stats}>
                {stats.map((st) => (
                  <div key={st.k} className={s.statChip}>
                    <span className={s.statKey}>{st.k}</span>
                    <span className={s.statVal}>{st.v}</span>
                  </div>
                ))}
              </div>
            )}
            {material && (
              <div className={cn('ao-italic', s.material)}>
                {t('camp.lvl.spell.components')}: {material}
              </div>
            )}
            {description && <div className={s.descText}>{description}</div>}
            {detail?.higherLevels && (
              <div className={s.higher}>
                <div className={cn('ao-overline', s.higherHead)}>{t('camp.lvl.spell.higherLevels')}</div>
                <div className={s.descText}>{detail.higherLevels}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={s.detailFoot}>
        {lockSelect && (
          <span className={cn('ao-codex', s.limitHint)}>{t('camp.lvl.spell.limitReached')}</span>
        )}
        <button
          type="button"
          className={cn('ao-btn', chosen ? 'ao-btn--ghost' : 'ao-btn--primary')}
          disabled={lockSelect}
          onClick={onToggle}
        >
          {chosen ? (
            <>
              <Rune kind="x" size={11} /> {t('camp.lvl.spell.remove')}
            </>
          ) : (
            <>
              <Rune kind="check" size={11} /> {t('camp.lvl.spell.choose')}
            </>
          )}
        </button>
      </div>
    </>
  );
}
