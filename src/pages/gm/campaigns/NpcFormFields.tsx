import { Plus, X } from 'lucide-react';
import { OrdoField } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type {
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  CreateNpcRequest,
  MonsterSummaryResponse,
  NpcResponse,
  NpcSourceType,
  SpellReferenceResponse,
} from '@/types';
import s from './NpcFormFields.module.css';

export interface NpcFormState {
  name: string;
  publicDescription: string;
  privateDescription: string;
  isVisibleToPlayers: boolean;
  sourceType: NpcSourceType | null;
  raceId: string;
  classId: string;
  level: string;
  abilities: string;
  spellIds: string[];
  sourceMonsterId: string;
}

export function emptyNpcForm(): NpcFormState {
  return {
    name: '',
    publicDescription: '',
    privateDescription: '',
    isVisibleToPlayers: true,
    sourceType: null,
    raceId: '',
    classId: '',
    level: '',
    abilities: '',
    spellIds: [],
    sourceMonsterId: '',
  };
}

export function npcFormFromResponse(npc: NpcResponse): NpcFormState {
  return {
    name: npc.name ?? '',
    publicDescription: npc.publicDescription ?? '',
    privateDescription: npc.privateDescription ?? '',
    isVisibleToPlayers: npc.isVisibleToPlayers,
    sourceType: npc.sourceType ?? null,
    raceId: npc.race?.id ?? '',
    classId: npc.characterClass?.id ?? '',
    level: npc.level != null ? String(npc.level) : '',
    abilities: npc.abilities ?? '',
    spellIds: npc.spells?.map((sp) => sp.id) ?? [],
    sourceMonsterId: npc.sourceMonster?.id ?? '',
  };
}

export function isNpcFormValid(f: NpcFormState): boolean {
  if (!f.name.trim()) return false;
  if (f.sourceType === 'CLASS_BASED') {
    return !!f.raceId && !!f.classId && f.level.trim() !== '' && Number(f.level) > 0;
  }
  if (f.sourceType === 'MONSTER_BASED') {
    return !!f.sourceMonsterId;
  }
  return true;
}

export function buildNpcPayload(f: NpcFormState): CreateNpcRequest {
  const base: CreateNpcRequest = {
    name: f.name.trim(),
    publicDescription: f.publicDescription.trim() || undefined,
    privateDescription: f.privateDescription.trim() || undefined,
    isVisibleToPlayers: f.isVisibleToPlayers,
    sourceType: f.sourceType,
  };
  if (f.sourceType === 'CLASS_BASED') {
    return {
      ...base,
      raceId: f.raceId || undefined,
      classId: f.classId || undefined,
      level: f.level ? Number(f.level) : undefined,
      abilities: f.abilities.trim() || undefined,
      spellIds: f.spellIds.length ? f.spellIds : undefined,
    };
  }
  if (f.sourceType === 'MONSTER_BASED') {
    return { ...base, sourceMonsterId: f.sourceMonsterId || undefined };
  }
  return base;
}

interface Props {
  value: NpcFormState;
  onChange: (patch: Partial<NpcFormState>) => void;
  classes: CharacterClassDetailResponse[];
  races: CharacterRaceDetailResponse[];
  spells: SpellReferenceResponse[];
  monsters: MonsterSummaryResponse[];
  spellsLoading?: boolean;
}

export function NpcFormFields({ value: v, onChange, classes, races, spells, monsters, spellsLoading }: Props) {
  const t = useT();

  const sources: { key: NpcSourceType | null; label: string }[] = [
    { key: null, label: t('camp2.npcForm.source.free') },
    { key: 'CLASS_BASED', label: t('camp2.npcForm.source.class') },
    { key: 'MONSTER_BASED', label: t('camp2.npcForm.source.monster') },
  ];

  const toggleSpell = (id: string) =>
    onChange({
      spellIds: v.spellIds.includes(id) ? v.spellIds.filter((x) => x !== id) : [...v.spellIds, id],
    });

  return (
    <div className={s.col}>
      <OrdoField label={t('camp2.npcMgr.field.name')} required>
        <input
          className="ao-input"
          value={v.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('camp2.npcMgr.field.namePlaceholder')}
        />
      </OrdoField>

      <OrdoField label={t('camp2.npcForm.source.label')} hint={t('camp2.npcForm.source.hint')}>
        <div className={s.seg}>
          {sources.map((src) => (
            <button
              type="button"
              key={src.key ?? 'free'}
              className={cn(s.segBtn, v.sourceType === src.key && s.on)}
              onClick={() => onChange({ sourceType: src.key })}
            >
              {src.label}
            </button>
          ))}
        </div>
      </OrdoField>

      {v.sourceType === 'CLASS_BASED' && (
        <div className={s.originBox}>
          <div className={s.grid2}>
            <OrdoField label={t('camp2.npcForm.race')} required>
              <select
                className={cn('ao-input', s.sel)}
                value={v.raceId}
                onChange={(e) => onChange({ raceId: e.target.value })}
              >
                <option value="" className={s.opt}>{t('camp2.npcForm.racePlaceholder')}</option>
                {races.map((r) => (
                  <option key={r.id} value={r.id} className={s.opt}>{r.name}</option>
                ))}
              </select>
            </OrdoField>
            <OrdoField label={t('camp2.npcForm.class')} required>
              <select
                className={cn('ao-input', s.sel)}
                value={v.classId}
                onChange={(e) => onChange({ classId: e.target.value, spellIds: [] })}
              >
                <option value="" className={s.opt}>{t('camp2.npcForm.classPlaceholder')}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className={s.opt}>{c.name}</option>
                ))}
              </select>
            </OrdoField>
          </div>

          <OrdoField label={t('camp2.npcForm.level')} required>
            <input
              className={cn('ao-input', s.numNarrow)}
              type="number"
              min={1}
              value={v.level}
              onChange={(e) => onChange({ level: e.target.value })}
            />
          </OrdoField>

          <OrdoField label={t('camp2.npcForm.abilities')} hint={t('camp2.npcForm.abilitiesHint')}>
            <textarea
              className={cn('ao-input', s.resizeV)}
              rows={3}
              value={v.abilities}
              onChange={(e) => onChange({ abilities: e.target.value })}
              placeholder={t('camp2.npcForm.abilitiesPlaceholder')}
            />
          </OrdoField>

          <OrdoField label={t('camp2.npcForm.spells')}>
            {!v.classId ? (
              <div className={s.empty}>{t('camp2.npcForm.spellsPickClass')}</div>
            ) : spellsLoading ? (
              <div className={s.empty}>{t('camp2.npcForm.refLoading')}</div>
            ) : spells.length === 0 ? (
              <div className={s.empty}>{t('camp2.npcForm.spellsEmpty')}</div>
            ) : (
              <div className={s.chips}>
                {spells.map((sp) => {
                  const on = v.spellIds.includes(sp.id);
                  return (
                    <button
                      type="button"
                      key={sp.id}
                      className={cn(s.chip, on && s.on)}
                      onClick={() => toggleSpell(sp.id)}
                    >
                      {on ? <X size={11} /> : <Plus size={11} />}{sp.name}
                    </button>
                  );
                })}
              </div>
            )}
          </OrdoField>
        </div>
      )}

      {v.sourceType === 'MONSTER_BASED' && (
        <div className={s.originBox}>
          <OrdoField label={t('camp2.npcForm.monster')} required hint={t('camp2.npcForm.monsterHint')}>
            {monsters.length === 0 ? (
              <div className={s.empty}>{t('camp2.npcForm.monsterEmpty')}</div>
            ) : (
              <select
                className={cn('ao-input', s.sel)}
                value={v.sourceMonsterId}
                onChange={(e) => onChange({ sourceMonsterId: e.target.value })}
              >
                <option value="" className={s.opt}>{t('camp2.npcForm.monsterPlaceholder')}</option>
                {monsters.map((mo) => (
                  <option key={mo.id} value={mo.id} className={s.opt}>{mo.nameRusloc}</option>
                ))}
              </select>
            )}
          </OrdoField>
        </div>
      )}

      <OrdoField label={t('camp2.npcMgr.field.publicDesc')} hint={t('camp2.npcMgr.field.publicDescHint')}>
        <textarea
          className={cn('ao-input', s.resizeV)}
          rows={3}
          value={v.publicDescription}
          onChange={(e) => onChange({ publicDescription: e.target.value })}
          placeholder={t('camp2.npcMgr.field.publicDescPlaceholder')}
        />
      </OrdoField>

      <OrdoField label={t('camp2.npcMgr.field.privateDesc')} hint={t('camp2.npcMgr.field.privateDescHint')}>
        <textarea
          className={cn('ao-input', s.resizeV)}
          rows={3}
          value={v.privateDescription}
          onChange={(e) => onChange({ privateDescription: e.target.value })}
          placeholder={t('camp2.npcMgr.field.privateDescPlaceholder')}
        />
      </OrdoField>

      <label className={s.checkRow}>
        <input
          type="checkbox"
          checked={v.isVisibleToPlayers}
          onChange={(e) => onChange({ isVisibleToPlayers: e.target.checked })}
        />
        <span className={cn('ao-label', s.checkLabel)}>{t('camp2.npcMgr.field.visible')}</span>
      </label>
    </div>
  );
}
