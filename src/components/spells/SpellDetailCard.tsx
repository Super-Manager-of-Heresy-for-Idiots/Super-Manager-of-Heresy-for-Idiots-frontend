import { Loader2 } from 'lucide-react';
import { useSpell } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';
import { spellComponentsText, spellMaterialText, spellRangeText } from '@/lib/spells';
import { SpellCardView, type SpellCardModel } from './SpellCardView';
import s from './SpellDetailCard.module.css';

/**
 * Lazily-loaded full spell profile, rendered inside an expandable panel.
 * Reuses the content-catalog `useSpell` detail query and the same
 * `camp.lvl.spell.*` labels as the level-up spell picker, so a known
 * spell can be inspected from the character sheet without navigating away.
 *
 * Only fields already returned by the API are shown — nothing invented.
 */
export function SpellDetailCard({ spellId, campaignId }: { spellId: string; campaignId?: string }) {
  const t = useT();
  const { data: detail, isLoading, isError } = useSpell(spellId, campaignId);

  if (isLoading) {
    return (
      <div className={s.state}>
        <Loader2 className="h-4 w-4 animate-spin" /> {t('camp.lvl.spell.loading')}
      </div>
    );
  }
  if (isError || !detail) {
    return <div className={s.state}>{t('camp.lvl.spell.loadError')}</div>;
  }

  // Summoned statblocks are core (SYSTEM) monsters; navigate within the current
  // scope — the campaign bestiary route when opened from a campaign, otherwise admin.
  const monsterHref = (id: string) =>
    campaignId ? `/campaigns/${campaignId}/bestiary/monsters/${id}` : `/admin/bestiary/monsters/${id}`;

  const model: SpellCardModel = {
    name: detail.name ?? '',
    nameEn: detail.nameEn ?? undefined,
    source: detail.source ?? undefined,
    homebrewTitle: detail.homebrewTitle ?? undefined,
    level: detail.level ?? undefined,
    schoolName: detail.school?.name ?? undefined,
    castingTime: detail.castingTimeRaw ?? detail.castingActionSlug ?? undefined,
    range: spellRangeText(detail),
    duration: detail.durationRaw ?? detail.durationType ?? undefined,
    components: spellComponentsText(detail),
    material: spellMaterialText(detail),
    concentration: detail.concentration ?? undefined,
    ritual: detail.ritual ?? undefined,
    saveAbility: detail.saveAbility ?? undefined,
    attackRoll: detail.attackRoll ?? undefined,
    checkAbility: detail.checkAbility ?? undefined,
    checkSkill: detail.checkSkill ?? undefined,
    damage: (detail.damage ?? []).map((d) => ({ dice: d.dice ?? undefined, raw: d.raw ?? undefined, damageTypeName: d.damageType?.name ?? undefined })),
    healing: (detail.healing ?? []).map((h) => ({ dice: h.dice ?? undefined, flat: h.flat ?? undefined, raw: h.raw ?? undefined })),
    summoned: (detail.summonedMonsters ?? []).map((m) => ({ id: m.id, name: m.name, crRating: m.crRating ?? undefined })),
    description: detail.description ?? undefined,
    higherLevels: detail.higherLevels ?? undefined,
  };

  return <SpellCardView model={model} summonHref={monsterHref} emptyNote={t('camp.lvl.spell.noDetails')} />;
}
