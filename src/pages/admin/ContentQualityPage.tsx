import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reference.api';
import { grantKind, isUnknownGrantKind } from '@/components/content-rewards/grants';
import { classDetailToDraft } from '@/features/class-builder/classDetailToDraft';
import { issuesAt, validateClassDraft } from '@/features/class-builder/classDraft';
import { KNOWN_GRANT_TYPES } from '@/types';
import { cn } from '@/lib/utils';
import type { CharacterClassDetailResponse, ContentRewardGrant, RewardGroup } from '@/types';
import s from './ContentQualityPage.module.css';

type StatusFilter = 'all' | 'issues' | 'unknown' | 'empty';

interface GroupRow {
  classId: string;
  className: string;
  level: number;
  groupKind: string;
  prompt: string;
  grantTypes: string[];
  unknownTypes: string[];
  empty: boolean;
  errors: number;
  warnings: number;
}

const allGrants = (g: RewardGroup): ContentRewardGrant[] => [
  ...(g.grants ?? []),
  ...(g.options ?? []).flatMap((o) => o.grants ?? []),
];

function buildRows(classes: CharacterClassDetailResponse[]): GroupRow[] {
  const rows: GroupRow[] = [];
  for (const cls of classes) {
    // Per-class validation (errors/warnings) via the authoring draft mirror.
    let issues: ReturnType<typeof validateClassDraft> = [];
    try {
      issues = validateClassDraft(classDetailToDraft(cls));
    } catch {
      issues = [];
    }
    (cls.rewardGroups ?? []).forEach((g, gi) => {
      const grants = allGrants(g);
      const grantTypes = [...new Set(grants.map((gr) => gr.grantType))];
      const unknownTypes = grantTypes.filter((t) => isUnknownGrantKind(t));
      const groupIssues = issuesAt(issues, `rewardGroups[${gi}]`);
      rows.push({
        classId: cls.id,
        className: cls.name,
        level: g.classLevel ?? 0,
        groupKind: g.groupKind ?? (g.options?.length ? 'CHOICE' : 'AUTO'),
        prompt: g.prompt ?? '',
        grantTypes,
        unknownTypes,
        empty: grants.length === 0 && (g.options?.length ?? 0) === 0,
        errors: groupIssues.filter((i) => i.severity === 'ERROR').length,
        warnings: groupIssues.filter((i) => i.severity === 'WARNING').length,
      });
    });
  }
  return rows;
}

export default function ContentQualityPage() {
  const classesQuery = useQuery({
    queryKey: ['content-quality', 'classes'],
    queryFn: async () => (await referenceApi.getClasses()).data ?? [],
  });

  const [classId, setClassId] = useState('all');
  const [level, setLevel] = useState('all');
  const [grantType, setGrantType] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const rows = useMemo(() => buildRows(classes), [classes]);

  const filtered = rows.filter((r) => {
    if (classId !== 'all' && r.classId !== classId) return false;
    if (level !== 'all' && r.level !== Number(level)) return false;
    if (grantType !== 'all') {
      if (grantType === 'UNKNOWN' ? r.unknownTypes.length === 0 : !r.grantTypes.includes(grantType)) return false;
    }
    if (status === 'issues' && r.errors === 0 && r.warnings === 0) return false;
    if (status === 'unknown' && r.unknownTypes.length === 0) return false;
    if (status === 'empty' && !r.empty) return false;
    return true;
  });

  const summary = useMemo(() => ({
    classes: classes.length,
    groups: rows.length,
    unknownGrants: rows.reduce((n, r) => n + r.unknownTypes.length, 0),
    emptyGroups: rows.filter((r) => r.empty).length,
    errorGroups: rows.filter((r) => r.errors > 0).length,
  }), [classes.length, rows]);

  const levels = useMemo(() => [...new Set(rows.map((r) => r.level))].sort((a, b) => a - b), [rows]);

  return (
    <div className={s.wrap}>
      <div>
        <h1 className="ao-h4">Качество контента классов</h1>
        <p className={cn('ao-codex', s.muted)}>Инспекция новой content-модели без доступа к БД: reward groups, typed grants, валидация.</p>
      </div>

      {classesQuery.isLoading && <p className="ao-codex">Загрузка…</p>}
      {classesQuery.isError && <p className={cn('ao-codex', s.bad)}>Не удалось загрузить классы из <code>/reference/classes</code>.</p>}

      <div className={s.summary}>
        <Stat label="Классов" value={summary.classes} />
        <Stat label="Reward groups" value={summary.groups} />
        <Stat label="Неизвестных grant" value={summary.unknownGrants} bad={summary.unknownGrants > 0} />
        <Stat label="Пустых групп" value={summary.emptyGroups} bad={summary.emptyGroups > 0} />
        <Stat label="Групп с ошибками" value={summary.errorGroups} bad={summary.errorGroups > 0} />
      </div>

      <div className={s.filters}>
        <Filter label="Класс">
          <select className="ao-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="all">все</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Filter>
        <Filter label="Уровень">
          <select className="ao-input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">все</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Filter>
        <Filter label="Grant type">
          <select className="ao-input" value={grantType} onChange={(e) => setGrantType(e.target.value)}>
            <option value="all">все</option>
            {KNOWN_GRANT_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </Filter>
        <Filter label="Статус">
          <select className="ao-input" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">любой</option>
            <option value="issues">с проблемами</option>
            <option value="unknown">неизвестный grant</option>
            <option value="empty">пустые</option>
          </select>
        </Filter>
        <span className={cn('ao-codex', s.muted)}>{filtered.length} / {rows.length}</span>
      </div>

      <table className={s.table}>
        <thead>
          <tr>
            <th>Класс</th><th>Ур.</th><th>Тип</th><th>Гранты</th><th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={`${r.classId}-${r.level}-${i}`}>
              <td>{r.className}</td>
              <td>{r.level}</td>
              <td>
                <span className="ao-codex">{r.groupKind}</span>
                {r.prompt && <div className={cn('ao-italic', s.muted)}>{r.prompt}</div>}
              </td>
              <td>
                <div className={s.chips}>
                  {r.grantTypes.length === 0 && <span className={cn('ao-codex', s.muted)}>—</span>}
                  {r.grantTypes.map((t) => (
                    <span key={t} className={cn(s.chip, isUnknownGrantKind(t) && s.chipUnknown)}>
                      {grantKind(t) === 'UNKNOWN' ? `${t}?` : t}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <span className="ao-row ao-gap-6">
                  {r.empty && <span className={s.bad}>пусто</span>}
                  {r.errors > 0 && <span className={s.bad}>● {r.errors}</span>}
                  {r.warnings > 0 && <span className={s.warn}>▲ {r.warnings}</span>}
                  {!r.empty && r.errors === 0 && r.warnings === 0 && <span className={s.ok}>ok</span>}
                </span>
              </td>
            </tr>
          ))}
          {!classesQuery.isLoading && filtered.length === 0 && (
            <tr><td colSpan={5} className={cn('ao-codex', s.muted)}>Нет строк по фильтрам.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div className={s.stat}>
      <span className={cn(s.statNum, bad && s.statNumBad)}>{value}</span>
      <span className={cn('ao-codex', s.muted)}>{label}</span>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.filter}>
      <span className="ao-overline">{label}</span>
      {children}
    </label>
  );
}
