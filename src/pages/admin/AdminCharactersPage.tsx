import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { campaignsApi } from '@/api/campaigns.api';
import { charactersApi } from '@/api/characters.api';
import { formatDate, cn } from '@/lib/utils';
import type { CampaignResponse, CharacterResponse } from '@/types';
import s from './AdminCharactersPage.module.css';

type CharacterGroup = {
  campaign: CampaignResponse;
  characters: CharacterResponse[];
  isLoading: boolean;
  isError: boolean;
};

type StatusFilter = 'all' | 'ACTIVE' | 'DEAD' | 'RETIRED';

const statusOptions: StatusFilter[] = ['all', 'ACTIVE', 'DEAD', 'RETIRED'];

function primaryClass(character: CharacterResponse): string {
  return character.classLevels?.[0]?.className ?? 'Без класса';
}

function classLabel(character: CharacterResponse): string {
  if (!character.classLevels?.length) return 'Без класса';
  return character.classLevels.map((level) => `${level.className} ${level.classLevel}`).join(' / ');
}

function matchesNumber(value: number, raw: string, predicate: (a: number, b: number) => boolean): boolean {
  if (!raw.trim()) return true;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return true;
  return predicate(value, parsed);
}

export default function AdminCharactersPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');

  const campaignsQuery = useQuery({
    queryKey: ['admin-characters', 'campaigns'],
    queryFn: async (): Promise<CampaignResponse[]> => {
      const response = await campaignsApi.list({ size: 500, sort: 'name,asc' });
      return response.data?.content ?? [];
    },
  });

  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const characterQueries = useQueries({
    queries: campaigns.map((campaign) => ({
      queryKey: ['admin-characters', 'campaign', campaign.id, 'characters'],
      queryFn: async (): Promise<CharacterResponse[]> => {
        const response = await charactersApi.listInCampaign(campaign.id);
        return response.data ?? [];
      },
      enabled: campaignsQuery.isSuccess,
    })),
  });

  const groups = useMemo<CharacterGroup[]>(() => {
    return campaigns.map((campaign, index) => {
      const query = characterQueries[index];
      return {
        campaign,
        characters: query?.data ?? [],
        isLoading: !!query?.isLoading,
        isError: !!query?.isError,
      };
    });
  }, [campaigns, characterQueries]);

  const allCharacters = useMemo(
    () => groups.flatMap((group) => group.characters.map((character) => ({ campaign: group.campaign, character }))),
    [groups],
  );

  const classOptions = useMemo(() => {
    const names = new Set<string>();
    allCharacters.forEach(({ character }) => names.add(primaryClass(character)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [allCharacters]);

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groups.map((group) => {
      const characters = group.characters.filter((character) => {
        const className = primaryClass(character);
        const searchable = [
          character.name,
          character.ownerUsername,
          character.race?.name,
          classLabel(character),
          group.campaign.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const status = character.status ?? 'ACTIVE';
        return (
          (!needle || searchable.includes(needle)) &&
          (classFilter === 'all' || className === classFilter) &&
          (statusFilter === 'all' || status === statusFilter) &&
          matchesNumber(character.totalLevel, minLevel, (value, filter) => value >= filter) &&
          matchesNumber(character.totalLevel, maxLevel, (value, filter) => value <= filter)
        );
      });
      return { ...group, characters };
    });
  }, [groups, search, classFilter, statusFilter, minLevel, maxLevel]);

  const visibleCharacters = filteredGroups.reduce((sum, group) => sum + group.characters.length, 0);
  const totalCharacters = allCharacters.length;
  const loadingCharacters = characterQueries.some((query) => query.isLoading);
  const failedGroups = characterQueries.filter((query) => query.isError).length;

  if (campaignsQuery.isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.state)}>
        <span className="ao-frame-c" />
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
        <p className={cn('ao-italic', s.stateText)}>Загружаем кампании...</p>
      </div>
    );
  }

  if (campaignsQuery.error) {
    return (
      <div className={s.state}>
        <p className={cn('ao-italic', s.stateText)}>Не удалось загрузить кампании.</p>
        <button className="ao-btn" onClick={() => campaignsQuery.refetch()}>Повторить</button>
      </div>
    );
  }

  return (
    <div>
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overline)}>Администрирование</p>
          <h3 className={cn('ao-h3', s.title)}>Персонажи по кампаниям</h3>
        </div>
        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.statValue}>{campaigns.length}</div>
            <div className={cn('ao-overline', s.statLabel)}>Кампаний</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>{totalCharacters}</div>
            <div className={cn('ao-overline', s.statLabel)}>Персонажей</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>{visibleCharacters}</div>
            <div className={cn('ao-overline', s.statLabel)}>В выборке</div>
          </div>
        </div>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader
          title="Реестр персонажей"
          sub={loadingCharacters ? 'Данные кампаний еще загружаются' : 'Группировка по кампаниям'}
          glyph="helm"
          tone="gold"
        />

        <div className={s.toolbar}>
          <label className={s.field}>
            <span className={s.label}>Поиск</span>
            <input
              className={cn('ao-input', s.input)}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Имя, игрок, раса, класс, кампания"
            />
          </label>
          <label className={s.field}>
            <span className={s.label}>Класс</span>
            <select className={cn('ao-input', s.select)} value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">Все классы</option>
              {classOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Статус</span>
            <select className={cn('ao-input', s.select)} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status === 'all' ? 'Все' : status}</option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Уровень от</span>
            <input className={cn('ao-input', s.input)} inputMode="numeric" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} />
          </label>
          <label className={s.field}>
            <span className={s.label}>Уровень до</span>
            <input className={cn('ao-input', s.input)} inputMode="numeric" value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)} />
          </label>
        </div>

        <div className={s.groups}>
          {filteredGroups.length === 0 && (
            <div className={s.empty}>
              <p className={cn('ao-italic', s.muted)}>Кампаний пока нет.</p>
            </div>
          )}

          {filteredGroups.map((group) => (
            <section key={group.campaign.id} className={s.campaign}>
              <div className={s.campaignHead}>
                <div className={s.campaignTitle}>
                  <Rune kind="scroll" size={13} color="var(--gold-pale)" />
                  <span className={s.campaignName}>{group.campaign.name}</span>
                  <CharStatusBadge status={group.campaign.status} />
                </div>
                <div className={s.campaignMeta}>
                  {group.isLoading ? 'Загрузка...' : `${group.characters.length} персонажей`}
                </div>
              </div>

              {group.isError ? (
                <div className={s.empty}>
                  <p className={cn('ao-italic', s.muted)}>Не удалось загрузить персонажей этой кампании.</p>
                </div>
              ) : group.isLoading ? (
                <div className={s.empty}>
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </div>
              ) : group.characters.length === 0 ? (
                <div className={s.empty}>
                  <p className={cn('ao-italic', s.muted)}>Нет персонажей, подходящих под фильтры.</p>
                </div>
              ) : (
                <table className={cn('ao-table', s.table)}>
                  <thead>
                    <tr>
                      <th className={s.th}>Персонаж</th>
                      <th className={s.th}>Игрок</th>
                      <th className={s.th}>Класс</th>
                      <th className={s.th}>Уровень</th>
                      <th className={cn(s.th, s.hideSmall)}>HP</th>
                      <th className={cn(s.th, s.hideSmall)}>Создан</th>
                      <th className={s.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {group.characters.map((character) => (
                      <tr key={character.id}>
                        <td className={s.td}>
                          <div className={s.charCell}>
                            {character.avatarUrl ? (
                              <img className={s.avatar} src={character.avatarUrl} alt="" />
                            ) : (
                              <span className={s.avatarPh}><Rune kind="character" size={13} color="var(--ink-faint)" /></span>
                            )}
                            <div className={s.charMain}>
                              <div className={s.charName}>{character.name}</div>
                              <div className={s.charSub}>{character.race?.name ?? 'Раса не указана'}</div>
                            </div>
                          </div>
                        </td>
                        <td className={s.td}>{character.ownerUsername}</td>
                        <td className={s.td}>{classLabel(character)}</td>
                        <td className={cn(s.td, s.num)}>{character.totalLevel}</td>
                        <td className={cn(s.td, s.hideSmall)}>
                          <span className={s.num}>{character.currentHp ?? 0}</span>
                          <span className={s.muted}> / {character.maxHp ?? 0}</span>
                        </td>
                        <td className={cn(s.td, s.hideSmall)}>{formatDate(character.createdAt)}</td>
                        <td className={s.td}>
                          <div className={s.actions}>
                            <Link className="ao-btn ao-btn--ghost ao-btn--sm" to={`/campaigns/${group.campaign.id}/characters/${character.id}/sheet`}>
                              Открыть
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>

        <div className={s.footer}>
          <span>Показано {visibleCharacters} из {totalCharacters}</span>
          {failedGroups > 0 && <span>Ошибок загрузки кампаний: {failedGroups}</span>}
        </div>
      </OrdoPanel>
    </div>
  );
}
