import { Link } from 'react-router-dom';
import { Loader2, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpell } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';
import { spellComponentsText, spellMaterialText, spellRangeText } from '@/lib/spells';
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

  const stats: { k: string; v: string }[] = [];
  const ct = detail.castingTimeRaw ?? detail.castingActionSlug;
  const rng = spellRangeText(detail);
  const dur = detail.durationRaw ?? detail.durationType;
  const comp = spellComponentsText(detail);
  if (ct) stats.push({ k: t('camp.lvl.spell.castingTime'), v: ct });
  if (rng) stats.push({ k: t('camp.lvl.spell.range'), v: rng });
  if (dur) stats.push({ k: t('camp.lvl.spell.duration'), v: dur });
  if (comp) stats.push({ k: t('camp.lvl.spell.components'), v: comp });
  const material = spellMaterialText(detail);
  const damage = (detail.damage ?? []).filter((d) => d.dice || d.raw || d.damageType);
  const healing = (detail.healing ?? []).filter((h) => h.dice || h.flat || h.raw);
  const summoned = detail.summonedMonsters ?? [];
  // Summoned statblocks are core (SYSTEM) monsters; navigate within the current
  // scope — the campaign bestiary route when opened from a campaign, otherwise admin.
  const monsterHref = (id: string) =>
    campaignId ? `/campaigns/${campaignId}/bestiary/monsters/${id}` : `/admin/bestiary/monsters/${id}`;
  const hasBody =
    stats.length > 0 || damage.length > 0 || healing.length > 0 || summoned.length > 0 ||
    !!material || !!detail.description || !!detail.higherLevels;

  return (
    <div className={s.card}>
      {(detail.concentration || detail.ritual || detail.saveAbility || detail.attackRoll || detail.checkAbility) && (
        <div className={s.badges}>
          {detail.saveAbility && (
            <span className={cn(s.badge, s.badgeResolve)}>
              {t('camp.lvl.spell.save')}: {t(`best.ability.${detail.saveAbility}`)}
            </span>
          )}
          {detail.attackRoll && (
            <span className={cn(s.badge, s.badgeResolve)}>{t('camp.lvl.spell.attackRoll')}</span>
          )}
          {detail.checkAbility && (
            <span className={cn(s.badge, s.badgeResolve)}>
              {t('camp.lvl.spell.check')}: {t(`best.ability.${detail.checkAbility}`)}
              {detail.checkSkill ? ` (${detail.checkSkill})` : ''}
            </span>
          )}
          {detail.concentration && <span className={s.badge}>{t('camp.lvl.spell.concentration')}</span>}
          {detail.ritual && <span className={s.badge}>{t('camp.lvl.spell.ritual')}</span>}
        </div>
      )}

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

      {damage.length > 0 && (
        <div className={s.damage}>
          <span className={s.statKey}>{t('camp.lvl.spell.damage')}</span>
          <div className={s.damageChips}>
            {damage.map((d, i) => (
              <span key={i} className={s.damageChip}>
                {d.dice && <span className={s.damageDice}>{d.dice}</span>}
                {d.damageType?.name
                  ? <span className={s.damageType}>{d.damageType.name}</span>
                  : (!d.dice && d.raw ? <span className={s.damageType}>{d.raw}</span> : null)}
              </span>
            ))}
          </div>
        </div>
      )}

      {healing.length > 0 && (
        <div className={s.healing}>
          <span className={s.statKey}>{t('camp.lvl.spell.healing')}</span>
          <div className={s.healChips}>
            {healing.map((h, i) => (
              <span key={i} className={s.healChip}>
                {h.dice || h.flat != null ? (
                  <span className={s.healAmount}>{h.dice ?? h.flat}</span>
                ) : (
                  h.raw && <span className={s.healRaw}>{h.raw}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {summoned.length > 0 && (
        <div className={s.summons}>
          <span className={s.statKey}>{t('camp.lvl.spell.summons')}</span>
          <div className={s.summonChips}>
            {summoned.map((m) => (
              <Link
                key={m.id}
                to={monsterHref(m.id)}
                className={s.summonChip}
                title={t('camp.lvl.spell.summonsHint')}
              >
                <PawPrint size={12} className={s.summonIcon} />
                <span className={s.summonName}>{m.name}</span>
                {m.crRating && <span className={s.summonCr}>CR {m.crRating}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {material && (
        <div className={cn('ao-italic', s.material)}>
          {t('camp.lvl.spell.components')}: {material}
        </div>
      )}

      {detail.description && <div className={s.desc}>{detail.description}</div>}

      {detail.higherLevels && (
        <div className={s.higher}>
          <div className={cn('ao-overline', s.higherHead)}>{t('camp.lvl.spell.higherLevels')}</div>
          <div className={s.desc}>{detail.higherLevels}</div>
        </div>
      )}

      {!hasBody && <div className={cn('ao-italic', s.state)}>{t('camp.lvl.spell.noDetails')}</div>}
    </div>
  );
}
