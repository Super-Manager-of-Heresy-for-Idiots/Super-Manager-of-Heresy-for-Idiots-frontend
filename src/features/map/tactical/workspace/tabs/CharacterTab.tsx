/**
 * Player "Персонаж" tab — the player's combat hub. On their turn: resources,
 * abilities (attacks via the shared AttackForm + spell list), active effects, and
 * end-turn. When they have characters not yet in the battle: a join panel. The
 * attack target is pre-filled from the token selected on the map, if any.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bar, Rune } from '@/components/ordo';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useBackpackInventory } from '@/hooks/useInventory';
import {
  useBattleCastSpell,
  useBattleCurrentTurn,
  useEndTurn,
  useInitiativeBonus,
  useJoinBattle,
} from '@/hooks/useBattles';
import { battlesApi } from '@/api/battles.api';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse, BattleResponse, CharacterV2Response } from '@/types';
import { useMapTransientStore } from '../../../state';
import { AttackForm } from '../AttackForm';
import { DefaultActions } from '../DefaultActions';
import { characterAttackOptions, liveTargets } from '../combat';
import type { MovementConfig } from '../movement';
import { currentTurnCombatant, type TacticalTokenView } from '../../tacticalView';
import s from '../workspace.module.css';

interface CharacterTabProps {
  campaignId: string;
  battle: BattleResponse;
  currentUserId: string | null;
  tacticalTokens: TacticalTokenView[];
  movement: MovementConfig | null;
}

export function CharacterTab({
  campaignId,
  battle,
  currentUserId,
  tacticalTokens,
  movement,
}: CharacterTabProps) {
  const t = useT();
  const { data: characters } = useCampaignCharacters(campaignId);
  const current = currentTurnCombatant(battle.combatants);
  const isMyTurn = current?.type === 'CHARACTER' && current.ownerUserId === currentUserId;

  const joinedCharIds = useMemo(
    () => new Set(battle.combatants.filter((c) => c.type === 'CHARACTER').map((c) => c.characterId)),
    [battle.combatants],
  );
  const myChars = (characters ?? []).filter((c) => c.ownerId === currentUserId);
  const available = myChars.filter((c) => !joinedCharIds.has(c.id));

  return (
    <div className={s.tabPad}>
      {isMyTurn && current ? (
        <ActionPanel
          campaignId={campaignId}
          battle={battle}
          current={current}
          tacticalTokens={tacticalTokens}
          movement={movement}
        />
      ) : battle.status === 'ACTIVE' && available.length > 0 ? (
        <JoinPanel campaignId={campaignId} battle={battle} chars={available} />
      ) : battle.status === 'ASSEMBLING' && available.length > 0 ? (
        <div className={s.note}>{t('battle.empty.player.body')}</div>
      ) : (
        <div className={s.note}>
          {myChars.length === 0
            ? t('battle.join.noCharacters')
            : current
              ? t('battle.gm.currentTurnOf', { name: current.displayName })
              : t('battle.tracker.waiting')}
        </div>
      )}
    </div>
  );
}

/* ── action panel (their turn) ─────────────────────────────── */

function ActionPanel({
  campaignId,
  battle,
  current,
  tacticalTokens,
  movement,
}: {
  campaignId: string;
  battle: BattleResponse;
  current: BattleCombatantResponse;
  tacticalTokens: TacticalTokenView[];
  movement: MovementConfig | null;
}) {
  const t = useT();
  const endTurn = useEndTurn();
  const { data: turn, isLoading } = useBattleCurrentTurn(campaignId, battle.id, true);

  const resources = turn?.resources ?? [];
  const attacks = useMemo(() => characterAttackOptions(turn), [turn]);
  const spells = turn?.character?.knownSpells ?? [];
  const effects = turn?.activeEffects ?? [];
  const targets = useMemo(() => liveTargets(battle.combatants, current), [battle.combatants, current]);

  // Pre-fill the target from the token selected on the map (if it is a live target).
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const lockedTargetId = useMemo(() => {
    if (!selectedTokenId) return null;
    const view = tacticalTokens.find((tk) => tk.tokenId === selectedTokenId);
    const id = view?.linkedCombatantId ?? null;
    return id && targets.some((c) => c.id === id) ? id : null;
  }, [selectedTokenId, tacticalTokens, targets]);

  return (
    <div>
      <p className={cn('ao-overline', s.goldOverline)}>{t('battle.action.title')}</p>
      <h4 className={cn('ao-h4', s.tabTitle)}>{current.displayName}</h4>

      <DefaultActions movement={movement} />

      {isLoading ? (
        <div className={cn('ao-breathe', s.skWrap)}>
          <div className="ao-ph" />
          <div className="ao-ph" />
        </div>
      ) : (
        <>
          <div className={s.block}>
            <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.resources')}</div>
            {resources.length === 0 ? (
              <div className={s.muted}>{t('battle.action.noResources')}</div>
            ) : (
              resources.map((r) => (
                <div key={r.resourceTypeId} className={s.resItem}>
                  <div className="ao-row ao-between">
                    <span>{r.resourceName ?? r.name}</span>
                    <span className="ao-num">
                      {r.currentValue} / {r.maxValue}
                    </span>
                  </div>
                  <Bar value={r.currentValue} max={r.maxValue} tone="arcane" height={6} showNumbers={false} />
                </div>
              ))
            )}
          </div>

          <div className={s.block}>
            <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.attacks')}</div>
            <AttackForm
              campaignId={campaignId}
              battleId={battle.id}
              attacks={attacks}
              targets={targets}
              lockedTargetId={lockedTargetId}
            />
          </div>

          {current.characterId && (
            <ItemsSection campaignId={campaignId} battleId={battle.id} characterId={current.characterId} />
          )}

          {spells.length > 0 && (
            <SpellCastSection
              campaignId={campaignId}
              battleId={battle.id}
              spells={spells}
              targets={targets}
              lockedTargetId={lockedTargetId}
            />
          )}

          {effects.length > 0 && (
            <div className={s.block}>
              <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.effects')}</div>
              <div className={s.chips}>
                {effects.map((e) => (
                  <span key={e.id} className={cn('ao-chip', e.isBuff ? 'ao-chip--gold' : 'ao-chip--ember')}>
                    {e.buffDebuffName}
                    {e.remainingRounds != null && <span className={s.chipMeta}>{e.remainingRounds}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        className={cn('ao-btn ao-btn--primary ao-btn--block', s.mt12)}
        onClick={() => endTurn.mutate({ campaignId, battleId: battle.id })}
        disabled={endTurn.isPending}
      >
        <Rune kind="check" size={14} color="currentColor" />
        <span className={s.ml6}>{t('battle.action.endTurn')}</span>
      </button>
    </div>
  );
}

/* ── spells (cast on their turn) ───────────────────────────── */

function SpellCastSection({
  campaignId,
  battleId,
  spells,
  targets,
  lockedTargetId,
}: {
  campaignId: string;
  battleId: string;
  spells: Array<{ spellId: string; name: string; level: number }>;
  targets: BattleCombatantResponse[];
  lockedTargetId: string | null;
}) {
  const t = useT();
  const cast = useBattleCastSpell();
  const targetName = lockedTargetId
    ? targets.find((c) => c.id === lockedTargetId)?.displayName ?? null
    : null;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.spells')}</div>
      <div className={cn('ao-italic', s.hint)}>
        {targetName
          ? t('battle.action.spell.target', { name: targetName })
          : t('battle.action.spell.selfTarget')}
      </div>
      <div className={s.itemList}>
        {spells.map((sp) => (
          <SpellRow
            key={sp.spellId}
            spell={sp}
            pending={cast.isPending}
            onCast={(slotLevel) =>
              cast.mutate({
                campaignId,
                battleId,
                data: {
                  spellId: sp.spellId,
                  targetCombatantId: lockedTargetId ?? undefined,
                  slotLevel,
                },
              })
            }
          />
        ))}
      </div>
      <div className={cn('ao-italic', s.hint)}>{t('battle.action.spell.hint')}</div>
    </div>
  );
}

/** One spell: cast button + (for leveled spells) an upcast slot-level selector. */
function SpellRow({
  spell,
  pending,
  onCast,
}: {
  spell: { spellId: string; name: string; level: number };
  pending: boolean;
  onCast: (slotLevel: number | undefined) => void;
}) {
  const t = useT();
  // Cantrips (level 0) never consume a slot; leveled spells default to their own level and may upcast.
  const [slot, setSlot] = useState(spell.level);
  const upcastLevels = useMemo(
    () => (spell.level > 0 ? Array.from({ length: 9 - spell.level + 1 }, (_, i) => spell.level + i) : []),
    [spell.level],
  );

  return (
    <div className="ao-row ao-gap-4 ao-wrap">
      <button
        type="button"
        className={cn('ao-btn ao-btn--sm', s.itemBtn)}
        disabled={pending}
        onClick={() => onCast(spell.level > 0 ? slot : undefined)}
        title={t('battle.action.spell.castTitle')}
      >
        <Rune kind="book" size={10} color="var(--arcane)" />
        <span className={s.itemName}>{spell.name}</span>
        <span className={s.chipMeta}>
          {spell.level === 0
            ? t('battle.action.spell.cantrip')
            : t('battle.action.spell.level', { n: spell.level })}
        </span>
      </button>
      {upcastLevels.length > 1 && (
        <select
          className={cn('ao-input', s.sizeSelect)}
          value={slot}
          disabled={pending}
          onChange={(e) => setSlot(Number(e.target.value))}
          title={t('battle.action.spell.upcast')}
          aria-label={t('battle.action.spell.upcast')}
        >
          {upcastLevels.map((lvl) => (
            <option key={lvl} value={lvl}>
              {t('battle.action.spell.slotLevel', { n: lvl })}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/* ── items (consume a carried item on their turn) ──────────── */

function ItemsSection({
  campaignId,
  battleId,
  characterId,
}: {
  campaignId: string;
  battleId: string;
  characterId: string;
}) {
  const t = useT();
  const qc = useQueryClient();
  const { data: backpack } = useBackpackInventory(campaignId, characterId);
  const items = useMemo(() => (backpack ?? []).filter((i) => i.quantity > 0), [backpack]);

  const useItem = useMutation({
    mutationFn: (itemInstanceId: string) => battlesApi.useItem(campaignId, battleId, { itemInstanceId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory'] });
      toast.success(t('battle.action.item.used'));
    },
    onError: () => toast.error(t('battle.action.item.failed')),
  });

  if (!items.length) return null;

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.action.items')}</div>
      <div className={s.itemList}>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={cn('ao-btn ao-btn--sm', s.itemBtn)}
            disabled={useItem.isPending}
            onClick={() => useItem.mutate(it.id)}
            title={t('battle.action.item.use')}
          >
            <span className={s.itemName}>{it.displayName}</span>
            {it.quantity > 1 && <span className={s.chipMeta}>×{it.quantity}</span>}
          </button>
        ))}
      </div>
      <div className={cn('ao-italic', s.hint)}>{t('battle.action.item.hint')}</div>
    </div>
  );
}

/* ── join panel ────────────────────────────────────────────── */

function JoinPanel({
  campaignId,
  battle,
  chars,
}: {
  campaignId: string;
  battle: BattleResponse;
  chars: CharacterV2Response[];
}) {
  const t = useT();
  const join = useJoinBattle();
  const [charId, setCharId] = useState(chars[0]?.id ?? '');
  const [initStr, setInitStr] = useState('');
  const { data: bonus } = useInitiativeBonus(campaignId, battle.id, charId || undefined);

  useEffect(() => {
    if (!chars.some((c) => c.id === charId)) setCharId(chars[0]?.id ?? '');
  }, [chars, charId]);

  const initNum = parseInt(initStr, 10);
  const d20Manual = Number.isFinite(initNum) && initNum >= 1 && initNum <= 20;
  // No d20 entered ⇒ the server rolls the initiative die (A2 — no client Math.random).
  const valid = !!charId;
  const total = d20Manual && bonus != null ? initNum + bonus : null;
  const fmtSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  const submit = () => {
    if (!valid) return;
    join.mutate(
      {
        campaignId,
        battleId: battle.id,
        data: { characters: [{ characterId: charId, ...(d20Manual ? { d20: initNum } : {}) }] },
      },
      { onSuccess: () => setInitStr('') },
    );
  };

  return (
    <div>
      <p className={cn('ao-overline', s.goldOverline)}>{t('battle.join.title')}</p>

      <div className={s.block}>
        <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.pickCharacter')}</div>
        <div className={s.optGrid}>
          {chars.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(s.optBtn, charId === c.id && s.optBtnActive)}
              onClick={() => setCharId(c.id)}
            >
              <span className={s.optName}>{c.name}</span>
              <span className={s.optMeta}>
                {c.classLevels?.[0]?.className ?? ''} · LVL {c.totalLevel}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={s.block}>
        <div className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.initiative')}</div>
        <input
          className={cn('ao-input', s.numField)}
          inputMode="numeric"
          value={initStr}
          placeholder="—"
          onChange={(e) => setInitStr(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <div className={s.hint}>{t('battle.join.serverRollHint')}</div>
        {total != null && bonus != null && (
          <div className={s.initResult}>
            <span className={cn('ao-overline', s.fieldLabel)}>{t('battle.join.computed')}</span>
            <span className={s.initResultVal}>{total}</span>
            <span className={s.listMeta}>
              {t('battle.join.formula', { d20: initNum, bonus: fmtSigned(bonus) })}
            </span>
          </div>
        )}
      </div>

      <button
        className="ao-btn ao-btn--primary ao-btn--block"
        onClick={submit}
        disabled={!valid || join.isPending}
      >
        <Rune kind="check" size={14} color="currentColor" />
        <span className={s.ml6}>{t('battle.join.confirm')}</span>
      </button>
    </div>
  );
}
