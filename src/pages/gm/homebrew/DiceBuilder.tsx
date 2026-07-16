import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DICE_SIDES, diceAverage, diceMax } from '@/lib/dice';
import s from './DiceBuilder.module.css';

/** Разобранная формула билдера: кости + необязательный плоский бонус + необязательный модификатор характеристики. */
interface Parsed {
  count: number;
  sides: number;
  bonus: number;
  abilityMod: string; // '' | 'str' | 'dex' | ...
}

interface DiceBuilderProps {
  /** Текущее значение-строка (напр. «8d6» или «2d8 + 2 + wis_mod»). */
  value: string;
  onChange: (next: string) => void;
  /** Разрешить плоский бонус «+ N» (для лечения/умений). */
  allowBonus?: boolean;
  /** Опции модификатора характеристики (str/dex/…); показывают чип-селектор. */
  abilityMods?: { slug: string; label: string }[];
  /** i18n-подписи. */
  labels: { count: string; die: string; bonus: string; abilityMod: string; none: string; avg: string; max: string };
}

/** Пусто → дефолт 1d6, чтобы билдер всегда собирал валидную кость. */
function parse(value: string): Parsed {
  const norm = (value || '').toLowerCase().replace(/\s+/g, '');
  const dice = norm.match(/(\d{0,4})d(\d{1,4})/);
  const count = dice ? (dice[1] === '' ? 1 : Number(dice[1])) : 1;
  const sides = dice ? Number(dice[2]) : 6;
  const bonusMatch = norm.replace(/(\d{0,4})d(\d{1,4})/, '').match(/(?:^|\+)(\d+)/);
  const bonus = bonusMatch ? Number(bonusMatch[1]) : 0;
  const modMatch = norm.match(/([a-zа-я]{3})_mod/);
  const abilityMod = modMatch ? modMatch[1] : '';
  return { count, sides: DICE_SIDES.includes(sides as never) ? sides : 6, bonus, abilityMod };
}

/** Собирает каноническую строку из разобранных частей. */
function compose(p: Parsed, allowBonus?: boolean, allowMod?: boolean): string {
  let out = `${Math.max(1, Math.min(40, Math.round(p.count)))}d${p.sides}`;
  if (allowBonus && p.bonus > 0) out += ` + ${p.bonus}`;
  if (allowMod && p.abilityMod) out += ` + ${p.abilityMod}_mod`;
  return out;
}

/**
 * Дайс-билдер (HB_UX Фаза 2): степпер количества (1–40) × кость (d4…d100) [+ бонус] [+ мод. характеристики]
 * с превью среднего/максимума. Заменяет сырой текстовый ввод костей — «1000d1000» собрать невозможно.
 */
export function DiceBuilder({ value, onChange, allowBonus, abilityMods, labels }: DiceBuilderProps) {
  const p = useMemo(() => parse(value), [value]);
  const allowMod = !!(abilityMods && abilityMods.length);
  const set = (patch: Partial<Parsed>) => onChange(compose({ ...p, ...patch }, allowBonus, allowMod));

  return (
    <div className={s.builder}>
      <div className={s.controls}>
        <div className={s.field}>
          <span className="ao-label">{labels.count}</span>
          <div className={s.stepper}>
            <button type="button" className={s.stepBtn} onClick={() => set({ count: Math.max(1, p.count - 1) })}>−</button>
            <input
              className={cn('ao-input', s.stepInput)}
              type="number"
              min={1}
              max={40}
              value={p.count}
              onChange={(e) => set({ count: Math.max(1, Math.min(40, Number(e.target.value) || 1)) })}
            />
            <button type="button" className={s.stepBtn} onClick={() => set({ count: Math.min(40, p.count + 1) })}>+</button>
          </div>
        </div>
        <div className={s.field}>
          <span className="ao-label">{labels.die}</span>
          <select className="ao-input" value={p.sides} onChange={(e) => set({ sides: Number(e.target.value) })}>
            {DICE_SIDES.map((d) => <option key={d} value={d}>d{d}</option>)}
          </select>
        </div>
        {allowBonus && (
          <div className={s.field}>
            <span className="ao-label">{labels.bonus}</span>
            <input
              className="ao-input"
              type="number"
              min={0}
              value={p.bonus}
              onChange={(e) => set({ bonus: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        )}
        {allowMod && (
          <div className={s.field}>
            <span className="ao-label">{labels.abilityMod}</span>
            <select className="ao-input" value={p.abilityMod} onChange={(e) => set({ abilityMod: e.target.value })}>
              <option value="">{labels.none}</option>
              {abilityMods!.map((a) => <option key={a.slug} value={a.slug}>{a.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className={s.preview}>
        <code className={s.formula}>{compose(p, allowBonus, allowMod)}</code>
        <span className={s.stats}>
          {labels.avg} {diceAverage(p.count, p.sides) + (allowBonus ? p.bonus : 0)} · {labels.max} {diceMax(p.count, p.sides) + (allowBonus ? p.bonus : 0)}
        </span>
      </div>
    </div>
  );
}
