/**
 * Dev-only class reference viewer (Phase 3).
 *
 * Hidden route (`/dev/content-classes`, no nav link). Lets us inspect the new
 * normalized content model coming from the final reference endpoints, OR from
 * the Phase 2 contract fixtures when the backend isn't serving full data yet.
 *
 * Renders: class mechanics (multi-primary ability, saving throws, separate
 * armor/weapon/tool proficiency, spellcasting, skill choice), features by level,
 * and reward groups by level with typed-grant rendering (incl. unknown → custom).
 *
 * Read-only: option selection is local preview state only — NO persistence
 * (Phase 7 owns commit). Reuses the production `RewardGroupRenderer`.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reference.api';
import { OrdoChip, OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { RewardGroupView } from '@/components/content-rewards/RewardGroupRenderer';
import { FeatureTimeline } from '@/components/content-rewards/FeatureTimeline';
import { isUnknownGrantKind } from '@/components/content-rewards/grants';
import { useI18n } from '@/i18n/I18nContext';
import { localizedName, normalizeClassDetail } from '@/lib/contentAdapters';
import { cn } from '@/lib/utils';
import { contentClassFixtures } from '@/fixtures/contentModel';
import type { CharacterClassDetailResponse, ContentRewardGrant, RewardGroup } from '@/types';
import s from './ContentClassViewerPage.module.css';

type Source = 'live' | 'fixtures';

// Fixtures are final-contract payloads; run them through the same normalizer the
// API client uses so the viewer treats both sources identically.
const fixtureClasses: CharacterClassDetailResponse[] = contentClassFixtures.map((f) =>
  normalizeClassDetail(f as unknown as CharacterClassDetailResponse),
);

function groupByLevel<T extends { classLevel?: number; level?: number; sortOrder?: number }>(
  items: T[],
  levelOf: (item: T) => number,
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const lvl = levelOf(item);
    const bucket = map.get(lvl) ?? [];
    bucket.push(item);
    map.set(lvl, bucket);
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

export default function ContentClassViewerPage() {
  const { lang } = useI18n();
  const [source, setSource] = useState<Source>('live');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Local preview selection per reward group (read-flow only, not persisted).
  const [picks, setPicks] = useState<Record<string, string[]>>({});

  const live = useQuery({
    queryKey: ['dev', 'reference', 'classes'],
    queryFn: async () => (await referenceApi.getClasses()).data ?? [],
    enabled: source === 'live',
  });

  const classes = useMemo<CharacterClassDetailResponse[]>(
    () => (source === 'fixtures' ? fixtureClasses : live.data ?? []),
    [source, live.data],
  );

  const selected = useMemo(
    () => classes.find((c) => c.id === selectedId) ?? classes[0],
    [classes, selectedId],
  );

  return (
    <div className={s.wrap}>
      <div className={cn('ao-row ao-between', s.topbar)}>
        <div className="ao-row ao-gap-10">
          <Rune kind="scroll" size={20} color="var(--gold)" />
          <span className="ao-engraved ao-h4">Content Class Viewer</span>
          <OrdoChip tone="arcane">dev-only · Phase 3</OrdoChip>
        </div>
        <div className={cn('ao-row', s.toggle)}>
          <button
            className={cn(s.toggleBtn, source === 'live' && s.toggleOn)}
            onClick={() => setSource('live')}
          >
            Live API
          </button>
          <button
            className={cn(s.toggleBtn, source === 'fixtures' && s.toggleOn)}
            onClick={() => setSource('fixtures')}
          >
            Fixtures ({contentClassFixtures.length})
          </button>
        </div>
      </div>

      {source === 'live' && live.isLoading && <p className="ao-codex">Загрузка классов…</p>}
      {source === 'live' && live.isError && (
        <OrdoPanel frame className={s.error}>
          <span className="ao-frame-c" />
          <p className="ao-h5">Ошибка загрузки <code>/reference/classes</code></p>
          <p className="ao-codex">Переключись на <b>Fixtures</b>, чтобы инспектировать контракт без бэкенда.</p>
        </OrdoPanel>
      )}

      <div className={s.layout}>
        <nav className={s.rail}>
          {classes.length === 0 && source === 'live' && !live.isLoading && (
            <p className="ao-italic ao-codex">Нет классов с финального эндпоинта.</p>
          )}
          {classes.map((c) => (
            <button
              key={c.id}
              className={cn(s.railItem, selected?.id === c.id && s.railItemOn)}
              onClick={() => setSelectedId(c.id)}
            >
              <span className="ao-h6">{localizedName({ name: c.name, nameRu: c.nameRu, nameEn: c.nameEn }, lang)}</span>
              {c.hitDie != null && <span className="ao-codex">d{c.hitDie}</span>}
            </button>
          ))}
        </nav>

        <div className={s.detail}>
          {selected ? (
            <ClassDetailView
              cls={selected}
              lang={lang}
              picks={picks}
              onPick={(groupId, ids) => setPicks((p) => ({ ...p, [groupId]: ids }))}
            />
          ) : (
            <p className="ao-italic ao-codex">Выбери класс слева.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassDetailView({
  cls,
  lang,
  picks,
  onPick,
}: {
  cls: CharacterClassDetailResponse;
  lang: ReturnType<typeof useI18n>['lang'];
  picks: Record<string, string[]>;
  onPick: (groupId: string, ids: string[]) => void;
}) {
  const primary = cls.primaryAbilities ?? [];
  const saves = cls.savingThrows ?? [];
  const skillOpts = cls.skillOptions ?? [];
  const groups = cls.rewardGroups ?? [];
  const features = cls.features ?? [];

  const groupsByLevel = groupByLevel<RewardGroup>(groups, (g) => g.classLevel ?? 0);
  const sc = cls.spellcasting;

  // --- Data-completeness analysis ---
  const allGrants = (g: RewardGroup): ContentRewardGrant[] => [
    ...(g.grants ?? []),
    ...(g.options ?? []).flatMap((o) => o.grants ?? []),
  ];
  const rewardLevels = [...new Set(groups.map((g) => g.classLevel ?? 0).filter((l) => l > 0))];
  const warnLevels = [
    ...new Set(
      groups
        .filter((g) => allGrants(g).some((gr) => isUnknownGrantKind(gr.grantType)))
        .map((g) => g.classLevel ?? 0)
        .filter((l) => l > 0),
    ),
  ];
  const unknownGrantCount = groups.reduce(
    (n, g) => n + allGrants(g).filter((gr) => isUnknownGrantKind(gr.grantType)).length,
    0,
  );
  const emptyGroups = groups.filter((g) => allGrants(g).length === 0 && (g.options?.length ?? 0) === 0);

  return (
    <div className="ao-col ao-gap-16">
      {/* Identity */}
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={localizedName({ name: cls.name, nameRu: cls.nameRu, nameEn: cls.nameEn }, lang)}
          glyph="shield"
          sub={cls.subtitle}
          tone="gold"
          right={cls.hitDie != null ? <OrdoChip tone="ember" glyph="diamond-fill">Hit Die d{cls.hitDie}</OrdoChip> : undefined}
        />
        <div className={s.section}>
          <Field label="Основные характеристики">
            {primary.length ? (
              <Badges items={primary.map((a) => localizedName(a, lang))} />
            ) : (
              <Missing>нет primaryAbilities</Missing>
            )}
          </Field>
          <Field label="Спасброски">
            {saves.length ? (
              <Badges items={saves.map((a) => localizedName(a, lang))} tone="arcane" />
            ) : (
              <Missing>нет savingThrows</Missing>
            )}
          </Field>
          <Field label="Выбор навыков">
            {cls.skillChoiceCount ? (
              <div className="ao-col ao-gap-6">
                <span className="ao-codex">
                  Выберите {cls.skillChoiceCount}{' '}
                  {cls.skillChoiceAny ? '— любой навык' : `из ${skillOpts.length}`}
                </span>
                {!cls.skillChoiceAny && skillOpts.length > 0 && (
                  <Badges items={skillOpts.map((sk) => localizedName(sk, lang))} tone="rune" />
                )}
              </div>
            ) : (
              <Missing>skillChoiceCount = 0</Missing>
            )}
          </Field>
        </div>
      </OrdoPanel>

      {/* Proficiency — armor / weapon / tool separately */}
      <OrdoPanel frame padding={0}>
        <PanelHeader title="Владения" glyph="shield" tone="arcane" />
        <div className={cn(s.section, s.profGrid)}>
          <ProfCard label="Доспехи" text={cls.armorProficiencyText} />
          <ProfCard label="Оружие" text={cls.weaponProficiencyText} />
          <ProfCard label="Инструменты" text={cls.toolProficiencyText} />
        </div>
      </OrdoPanel>

      {/* Spellcasting */}
      <OrdoPanel frame padding={0}>
        <PanelHeader title="Заклинательство" glyph="sigil-3" tone="arcane" />
        <div className={s.section}>
          {sc?.isSpellcaster ? (
            <div className="ao-row ao-wrap ao-gap-8">
              <OrdoChip tone="gold">{sc.isHalfCaster ? 'Полузаклинатель' : 'Полный заклинатель'}</OrdoChip>
              {sc.spellcastingAbility && (
                <OrdoChip tone="arcane">Базовая: {localizedName(sc.spellcastingAbility, lang)}</OrdoChip>
              )}
              {!sc.spellcastingAbility && sc.spellcastingStatName && (
                <OrdoChip tone="arcane">Базовая: {sc.spellcastingStatName}</OrdoChip>
              )}
              <OrdoChip tone="rune">{sc.hasCantrips ? 'Есть заговоры' : 'Без заговоров'}</OrdoChip>
            </div>
          ) : (
            <span className="ao-italic ao-codex">Не заклинатель.</span>
          )}
        </div>
      </OrdoPanel>

      {/* Data completeness */}
      <OrdoPanel frame padding={0}>
        <PanelHeader title="Полнота данных" glyph="diamond" tone={warnLevels.length || emptyGroups.length ? 'ember' : 'gold'} />
        <div className={cn(s.section, 'ao-row ao-wrap ao-gap-8')}>
          <OrdoChip tone="rune">{features.length} умений</OrdoChip>
          <OrdoChip tone="rune">{groups.length} reward groups</OrdoChip>
          <OrdoChip tone={rewardLevels.length ? 'arcane' : 'ember'}>
            уровни с наградами: {rewardLevels.length ? rewardLevels.sort((a, b) => a - b).join(', ') : '—'}
          </OrdoChip>
          {unknownGrantCount > 0 && (
            <OrdoChip tone="ember" glyph="diamond">неизвестных grant: {unknownGrantCount}</OrdoChip>
          )}
          {emptyGroups.length > 0 && (
            <OrdoChip tone="ember" glyph="diamond">пустых групп: {emptyGroups.length}</OrdoChip>
          )}
          {!unknownGrantCount && !emptyGroups.length && (
            <OrdoChip tone="gold" glyph="check">данные полны</OrdoChip>
          )}
        </div>
      </OrdoPanel>

      {/* Features timeline (with reward / unknown-grant markers) */}
      <OrdoPanel frame padding={0}>
        <PanelHeader title="Умения по уровням" glyph="book" tone="gold" />
        <div className={s.section}>
          <FeatureTimeline
            features={features}
            rewardLevels={rewardLevels}
            warnLevels={warnLevels}
            emptyLabel="features пуст"
          />
        </div>
      </OrdoPanel>

      {/* Reward groups by level */}
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title="Группы наград по уровням"
          glyph="scroll"
          tone="gold"
          right={<OrdoChip tone="rune">{groups.length} групп</OrdoChip>}
        />
        <div className={s.section}>
          {groupsByLevel.size === 0 ? (
            <Missing>rewardGroups пуст</Missing>
          ) : (
            [...groupsByLevel.entries()].map(([lvl, items]) => (
              <div key={lvl} className="ao-col ao-gap-8">
                <div className={s.levelTitle}>
                  <Rune kind="diamond" size={12} color="var(--brass)" />
                  <span className="ao-overline">Уровень {lvl}</span>
                </div>
                {items.map((g, gi) => {
                  const gKey = g.id ?? g.groupKey ?? `${lvl}-${gi}`;
                  return (
                    <RewardGroupView
                      key={gKey}
                      group={g}
                      selectedOptionIds={picks[gKey] ?? []}
                      onChange={(ids) => onPick(gKey, ids)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </OrdoPanel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.field}>
      <span className="ao-overline">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Badges({ items, tone }: { items: string[]; tone?: 'gold' | 'arcane' | 'ember' | 'rune' }) {
  return (
    <div className="ao-row ao-wrap ao-gap-6">
      {items.map((it, i) => (
        <OrdoChip key={`${it}-${i}`} tone={tone ?? 'gold'}>{it}</OrdoChip>
      ))}
    </div>
  );
}

function ProfCard({ label, text }: { label: string; text?: string }) {
  return (
    <div className={cn('ao-panel ao-panel--inset', s.profCard)}>
      <span className="ao-overline">{label}</span>
      {text?.trim() ? <span className="ao-codex">{text}</span> : <Missing>—</Missing>}
    </div>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <span className={cn('ao-italic', s.missing)}>{children}</span>;
}
