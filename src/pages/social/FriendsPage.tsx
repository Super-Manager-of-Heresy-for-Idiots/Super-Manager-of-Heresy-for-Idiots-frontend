import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrdoInterfaceIcon } from '@/components/ordo';
import { ExpandableRow, ExpandChevron } from '@/components/common/ExpandableRow';
import { useOpenSession } from '@/features/messenger/hooks/useMessengerQueries';
import {
  useBlockedQuery,
  useFriendMutations,
  useFriendRealtime,
  useFriendRequestsQuery,
  useFriendsQuery,
  useUserSearchQuery,
} from '@/hooks/useFriends';
import type { FriendRelationshipView } from '@/types';
import s from './FriendsPage.module.css';

type Tab = 'friends' | 'requests' | 'blocked';

export default function FriendsPage() {
  useFriendRealtime();
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');

  return (
    <div className={s.page}>
      <div className="ao-row ao-between">
        <h3 className="ao-h3">Друзья</h3>
      </div>

      <UserSearch query={query} onQueryChange={setQuery} />

      <div className={cn('ao-tabs', s.tabs)}>
        <button className={cn('ao-tab', tab === 'friends' && 'is-active')} onClick={() => setTab('friends')}>
          <OrdoInterfaceIcon icon="friends" size={13} />
          Друзья
        </button>
        <button className={cn('ao-tab', tab === 'requests' && 'is-active')} onClick={() => setTab('requests')}>
          <OrdoInterfaceIcon icon="friend-request" size={13} />
          Заявки
        </button>
        <button className={cn('ao-tab', tab === 'blocked' && 'is-active')} onClick={() => setTab('blocked')}>
          <OrdoInterfaceIcon icon="blocked-user" size={13} />
          Заблокированные
        </button>
      </div>

      {tab === 'friends' && <FriendsTab />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'blocked' && <BlockedTab />}
    </div>
  );
}

function relationshipLabel(rel: FriendRelationshipView): string {
  switch (rel) {
    case 'FRIENDS':
      return 'В друзьях';
    case 'PENDING_OUTGOING':
      return 'Заявка отправлена';
    case 'PENDING_INCOMING':
      return 'Ждёт вашего ответа';
    case 'BLOCKED':
      return 'Заблокирован';
    default:
      return '';
  }
}

function UserSearch({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  const { data, isFetching } = useUserSearchQuery(query);
  const { sendRequest } = useFriendMutations();
  const results = data ?? [];
  const showResults = query.trim().length >= 3;

  return (
    <div className="ao-col ao-gap-8">
      <div className={s.searchRow}>
        <input
          className={cn('ao-input', s.searchInput)}
          value={query}
          placeholder="Поиск по имени (мин. 3 символа)"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      {showResults && (
        <div className={s.results}>
          {isFetching && results.length === 0 ? (
            <div className={s.muted}>
              <Loader2 className="animate-spin" size={16} />
            </div>
          ) : results.length === 0 ? (
            <div className={s.muted}>Ничего не найдено.</div>
          ) : (
            results.map((user) => (
              <div key={user.id} className={s.resultRow}>
                <div className="ao-col">
                  <span className={s.name}>{user.username}</span>
                  <span className={s.role}>{user.role}</span>
                </div>
                {user.relationship === 'NONE' ? (
                  <button
                    className="ao-btn ao-btn--sm ao-btn--primary"
                    disabled={sendRequest.isPending}
                    onClick={() => sendRequest.mutate(user.id)}
                  >
                    Добавить в друзья
                  </button>
                ) : (
                  <span className={s.role}>{relationshipLabel(user.relationship)}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FriendsTab() {
  const { data, isLoading, error } = useFriendsQuery();
  const { removeFriend, block } = useFriendMutations();
  const openSession = useOpenSession();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const friends = data ?? [];

  const message = async (userId: string) => {
    const snapshot = await openSession.mutateAsync(userId);
    navigate(`/messages/${snapshot.id}`);
  };

  if (isLoading) return <TabLoading />;
  if (error) return <div className={s.muted}>Не удалось загрузить друзей.</div>;
  if (friends.length === 0) return <div className={s.muted}>У вас пока нет друзей.</div>;

  return (
    <table className={s.table}>
      <tbody>
        {friends.map((friend) => {
          const open = expandedId === friend.id;
          return (
            <Fragment key={friend.id}>
              <tr className={s.row} onClick={() => setExpandedId(open ? null : friend.id)}>
                <td className={s.expander}>
                  <ExpandChevron open={open} />
                </td>
                <td className={s.name}>{friend.username}</td>
                <td className={s.role}>{friend.role}</td>
              </tr>
              <ExpandableRow open={open} colSpan={3}>
                <div className={s.actions}>
                  <button
                    className="ao-btn ao-btn--sm ao-btn--primary"
                    disabled={openSession.isPending}
                    onClick={() => message(friend.id)}
                  >
                    Написать сообщение
                  </button>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => removeFriend.mutate(friend.id)}
                  >
                    Удалить из друзей
                  </button>
                  <button
                    className="ao-btn ao-btn--sm ao-btn--danger"
                    onClick={() => block.mutate(friend.id)}
                  >
                    Заблокировать
                  </button>
                </div>
              </ExpandableRow>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function RequestsTab() {
  const incoming = useFriendRequestsQuery('incoming');
  const outgoing = useFriendRequestsQuery('outgoing');
  const { accept, decline, cancel } = useFriendMutations();

  if (incoming.isLoading || outgoing.isLoading) return <TabLoading />;
  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];

  return (
    <div className="ao-col ao-gap-8">
      <div className={s.sectionTitle}>Входящие</div>
      {incomingList.length === 0 ? (
        <div className={s.muted}>Нет входящих заявок.</div>
      ) : (
        <div className={s.results}>
          {incomingList.map((request) => (
            <div key={request.relationshipId} className={s.resultRow}>
              <div className="ao-col">
                <span className={s.name}>{request.username}</span>
                <span className={s.role}>{request.role}</span>
              </div>
              <div className="ao-row ao-gap-8">
                <button
                  className="ao-btn ao-btn--sm ao-btn--primary"
                  onClick={() => accept.mutate(request.relationshipId)}
                >
                  Принять
                </button>
                <button className="ao-btn ao-btn--sm" onClick={() => decline.mutate(request.relationshipId)}>
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={s.sectionTitle}>Исходящие</div>
      {outgoingList.length === 0 ? (
        <div className={s.muted}>Нет исходящих заявок.</div>
      ) : (
        <div className={s.results}>
          {outgoingList.map((request) => (
            <div key={request.relationshipId} className={s.resultRow}>
              <div className="ao-col">
                <span className={s.name}>{request.username}</span>
                <span className={s.role}>{request.role}</span>
              </div>
              <button className="ao-btn ao-btn--sm" onClick={() => cancel.mutate(request.relationshipId)}>
                Отменить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockedTab() {
  const { data, isLoading } = useBlockedQuery();
  const { unblock } = useFriendMutations();
  if (isLoading) return <TabLoading />;
  const blocked = data ?? [];
  if (blocked.length === 0) return <div className={s.muted}>Список пуст.</div>;

  return (
    <div className={s.results}>
      {blocked.map((user) => (
        <div key={user.id} className={s.resultRow}>
          <div className="ao-col">
            <span className={s.name}>{user.username}</span>
            <span className={s.role}>{user.role}</span>
          </div>
          <button className="ao-btn ao-btn--sm" onClick={() => unblock.mutate(user.id)}>
            Разблокировать
          </button>
        </div>
      ))}
    </div>
  );
}

function TabLoading() {
  return (
    <div className={s.muted}>
      <Loader2 className="animate-spin" size={18} />
    </div>
  );
}
