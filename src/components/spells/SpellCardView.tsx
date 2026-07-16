import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import {
  OrdoAssetIcon,
  OrdoInterfaceIcon,
  abilityIconForCode,
  damageIconForType,
  spellLevelIcon,
} from '@/components/ordo';
import { OriginBadge } from '@/components/homebrew';
import s from './SpellDetailCard.module.css';

/** Одна строка урона в карточке (кости/сырой текст + тип урона). */
export interface SpellCardDamage { dice?: string; raw?: string; damageTypeName?: string }
/** Одна строка лечения. */
export interface SpellCardHealing { dice?: string; flat?: number | string; raw?: string }
/** Призванное существо (со ссылкой на статблок). */
export interface SpellCardSummon { id: string; name: string; crRating?: string | number }

/**
 * Полностью разрешённая модель отображения заклинания — единый контракт для карточки.
 * Строится и из ответа API (сохранённое заклинание), и из состояния формы конструктора (живое превью),
 * поэтому «что видит игрок» гарантированно одинаково в игре и в редакторе.
 */
export interface SpellCardModel {
  name: string;
  nameEn?: string;
  source?: string;
  homebrewTitle?: string;
  level?: number;
  schoolName?: string;
  castingTime?: string;
  reactionNote?: string;
  range?: string;
  duration?: string;
  components?: string;
  material?: string;
  area?: string;
  concentration?: boolean;
  ritual?: boolean;
  saveAbility?: string;
  attackRoll?: boolean;
  checkAbility?: string;
  checkSkill?: string;
  damage?: SpellCardDamage[];
  healing?: SpellCardHealing[];
  summoned?: SpellCardSummon[];
  description?: string;
  higherLevels?: string;
}

interface SpellCardViewProps {
  model: SpellCardModel;
  /** Построитель ссылки на статблок призванного существа; без него призванные рендерятся без ссылок. */
  summonHref?: (id: string) => string;
  /** Подпись «нет деталей», показываемая, когда у карточки нет тела (только заголовок). */
  emptyNote?: string;
  className?: string;
}

/**
 * Презентационная карточка заклинания в игровом стиле (Ordo). Не тянет данные — рендерит переданную модель.
 * Используется и {@link SpellDetailCard} (лист персонажа), и живым превью конструктора homebrew (HB_UX Фаза 6),
 * поэтому визуальный язык един и не дублируется.
 */
export function SpellCardView({ model, summonHref, emptyNote, className }: SpellCardViewProps) {
  const t = useT();

  const stats: { k: string; v: string }[] = [];
  if (model.castingTime) stats.push({ k: t('camp.lvl.spell.castingTime'), v: model.castingTime });
  if (model.range) stats.push({ k: t('camp.lvl.spell.range'), v: model.range });
  if (model.duration) stats.push({ k: t('camp.lvl.spell.duration'), v: model.duration });
  if (model.area) stats.push({ k: t('hb.spell.areaSection'), v: model.area });
  if (model.components) stats.push({ k: t('camp.lvl.spell.components'), v: model.components });
  if (model.reactionNote) stats.push({ k: t('hb.spell.reactionTrigger'), v: model.reactionNote });

  const damage = (model.damage ?? []).filter((d) => d.dice || d.raw || d.damageTypeName);
  const healing = (model.healing ?? []).filter((h) => h.dice || h.flat != null || h.raw);
  const summoned = model.summoned ?? [];
  const hasBody = stats.length > 0 || damage.length > 0 || healing.length > 0 || summoned.length > 0
    || !!model.material || !!model.description || !!model.higherLevels;

  return (
    <div className={cn(s.card, className)}>
      <div className={s.head}>
        <span className={s.icon} aria-hidden="true">
          <OrdoAssetIcon
            names={[model.nameEn, model.name]}
            source="spells"
            fallback={<OrdoInterfaceIcon icon={spellLevelIcon(model.level)} size={16} style={{ color: 'var(--arcane)' }} />}
          />
        </span>
        <div className={s.headText}>
          <div className={s.title}>
            {model.name}
            <OriginBadge source={model.source} homebrewTitle={model.homebrewTitle} />
          </div>
          <div className={s.sub}>
            <OrdoInterfaceIcon icon={spellLevelIcon(model.level)} size={11} />
            {model.level === 0 ? t('wiz.spells.cantrip') : t('wiz.spells.lvl', { level: model.level ?? 0 })}
            {model.schoolName ? ` · ${model.schoolName}` : ''}
          </div>
        </div>
      </div>

      {(model.concentration || model.ritual || model.saveAbility || model.attackRoll || model.checkAbility) && (
        <div className={s.badges}>
          {model.saveAbility && (
            <span className={cn(s.badge, s.badgeResolve)}>
              <OrdoInterfaceIcon icon={abilityIconForCode(model.saveAbility)} size={11} />
              <OrdoInterfaceIcon icon="spell-saving-throw" size={11} />
              {t('camp.lvl.spell.save')}: {t(`best.ability.${model.saveAbility}`)}
            </span>
          )}
          {model.attackRoll && (
            <span className={cn(s.badge, s.badgeResolve)}>
              <OrdoInterfaceIcon icon="spell-attack-roll" size={11} />
              {t('camp.lvl.spell.attackRoll')}
            </span>
          )}
          {model.checkAbility && (
            <span className={cn(s.badge, s.badgeResolve)}>
              <OrdoInterfaceIcon icon={abilityIconForCode(model.checkAbility)} size={11} />
              {t('camp.lvl.spell.check')}: {t(`best.ability.${model.checkAbility}`)}
              {model.checkSkill ? ` (${model.checkSkill})` : ''}
            </span>
          )}
          {model.concentration && <span className={s.badge}><OrdoInterfaceIcon icon="concentration" size={11} />{t('camp.lvl.spell.concentration')}</span>}
          {model.ritual && <span className={s.badge}><OrdoInterfaceIcon icon="ritual" size={11} />{t('camp.lvl.spell.ritual')}</span>}
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
                <OrdoInterfaceIcon icon={damageIconForType(d.damageTypeName)} size={12} />
                {d.dice && <span className={s.damageDice}>{d.dice}</span>}
                {d.damageTypeName
                  ? <span className={s.damageType}>{d.damageTypeName}</span>
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
                <OrdoInterfaceIcon icon="spell-healing" size={12} />
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
              summonHref ? (
                <Link key={m.id} to={summonHref(m.id)} className={s.summonChip} title={t('camp.lvl.spell.summonsHint')}>
                  <OrdoInterfaceIcon icon="spell-summon" size={12} className={s.summonIcon} />
                  <span className={s.summonName}>{m.name}</span>
                  {m.crRating && <span className={s.summonCr}>CR {m.crRating}</span>}
                </Link>
              ) : (
                <span key={m.id} className={s.summonChip}>
                  <OrdoInterfaceIcon icon="spell-summon" size={12} className={s.summonIcon} />
                  <span className={s.summonName}>{m.name}</span>
                  {m.crRating && <span className={s.summonCr}>CR {m.crRating}</span>}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {model.material && (
        <div className={cn('ao-italic', s.material)}>
          {t('camp.lvl.spell.components')}: {model.material}
        </div>
      )}

      {model.description && <div className={s.desc}>{model.description}</div>}

      {model.higherLevels && (
        <div className={s.higher}>
          <div className={cn('ao-overline', s.higherHead)}>{t('camp.lvl.spell.higherLevels')}</div>
          <div className={s.desc}>{model.higherLevels}</div>
        </div>
      )}

      {!hasBody && emptyNote && <div className={cn('ao-italic', s.state)}>{emptyNote}</div>}
    </div>
  );
}
