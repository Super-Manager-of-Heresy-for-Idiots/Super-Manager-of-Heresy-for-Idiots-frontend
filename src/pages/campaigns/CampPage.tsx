import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CampActivitiesPanel,
  CampEventLog,
  CampEventModal,
  CampHeader,
  CampInterruptPanel,
  CampMemberCard,
  CampRestPanel,
  CampSetupModal,
  CampStoragePanel,
  CampWatchCheckModal,
  CampWatchPanel,
} from '@/components/camp';
import { EmptyVault, OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import {
  useApplyPartialRest,
  useCompleteCampRest,
  useCreateCamp,
  useCreateCampEvent,
  useCurrentCamp,
  useDeleteCampEvent,
  useEndCamp,
  useInterruptCamp,
  useStartCamp,
  useStartCampRest,
  useTriggerCampEvent,
} from '@/hooks/useCamp';
import { useT } from '@/i18n/I18nContext';
import { isRetryableError } from '@/lib/errors';
import { useAuthStore } from '@/store/authStore';
import type { CreateCampRequest } from '@/types';
import s from './CampPage.module.css';

/**
 * Экран лагеря и привала. Одна вёрстка для мастера и игрока: игроку показывается
 * то же состояние без управляющих элементов, а не отдельный экран.
 */
export default function CampPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const user = useAuthStore((state) => state.user);
  const isGm = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const [setupOpen, setSetupOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [checkTarget, setCheckTarget] = useState<{ characterId: string; name: string; slot: number } | null>(null);

  const { data: camp, isLoading, error, refetch } = useCurrentCamp(campaignId!);
  const createCamp = useCreateCamp();
  const startCamp = useStartCamp();
  const startRest = useStartCampRest();
  const completeRest = useCompleteCampRest();
  const interruptCamp = useInterruptCamp();
  const partialRest = useApplyPartialRest();
  const endCamp = useEndCamp();
  const createEvent = useCreateCampEvent();
  const triggerEvent = useTriggerCampEvent();
  const deleteEvent = useDeleteCampEvent();

  const busy = createCamp.isPending
    || startCamp.isPending
    || startRest.isPending
    || completeRest.isPending
    || interruptCamp.isPending
    || partialRest.isPending
    || endCamp.isPending
    || createEvent.isPending
    || triggerEvent.isPending
    || deleteEvent.isPending;

  /* ── loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={`ao-panel ao-breathe ${s.skelHead}`}>
          <div className="ao-ph" />
        </div>
        <div className={s.skelRows}>
          {[0, 1, 2].map((row) => (
            <div key={row} className={`ao-panel ao-breathe ${s.skelRow}`}>
              <div className="ao-ph" />
            </div>
          ))}
        </div>
        <p className={`ao-italic ${s.quiet}`}>{t('campfire.loading')}</p>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className={s.page}>
        <div className={s.errorBanner}>
          <Rune kind="tri-inv" size={16} color="#d8896a" />
          <div className={s.errorBody}>
            <div className={s.errorTitle}>{t('campfire.error.title')}</div>
            <div className={`ao-italic ${s.quiet}`}>{t('campfire.error.body')}</div>
          </div>
          {isRetryableError(error) && (
            <button className="ao-btn ao-btn--sm" onClick={() => refetch()}>
              <Rune kind="arrow-r" size={11} />
              {t('campfire.retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── no camp ─────────────────────────────────────────── */
  if (!camp) {
    return (
      <div className={s.page} data-testid="camp-page" data-camp="none">
        <OrdoPanel frame padding={0}>
          <EmptyVault
            glyph="flame"
            overline={t('campfire.empty.overline')}
            title={t('campfire.empty.title')}
            body={isGm ? t('campfire.empty.body') : t('campfire.empty.bodyPlayer')}
            action={isGm ? (
              <button
                className="ao-btn ao-btn--primary ao-btn--lg"
                data-testid="camp-setup-open"
                onClick={() => setSetupOpen(true)}
              >
                <Rune kind="flame" size={13} />
                {t('campfire.empty.action')}
              </button>
            ) : undefined}
          />
        </OrdoPanel>

        {isGm && (
          <CampSetupModal
            open={setupOpen}
            campaignId={campaignId!}
            busy={createCamp.isPending}
            onOpenChange={setSetupOpen}
            onSubmit={(data: CreateCampRequest) => {
              createCamp.mutate(
                { campaignId: campaignId!, data },
                { onSuccess: () => setSetupOpen(false) },
              );
            }}
          />
        )}
      </div>
    );
  }

  /* ── camp ────────────────────────────────────────────── */
  const restedCount = camp.participants.filter(
    (participant) => participant.state === 'RESTED' || participant.state === 'PARTIAL',
  ).length;
  const showRestPanel = camp.status === 'RESTING' || camp.restCompletedAt != null;

  return (
    <div className={s.page} data-testid="camp-page" data-camp={camp.id}>
      <CampHeader
        camp={camp}
        isGm={isGm}
        busy={busy}
        onStart={() => startCamp.mutate({ campaignId: campaignId!, campId: camp.id })}
        onStartRest={(restType) => startRest.mutate({
          campaignId: campaignId!,
          campId: camp.id,
          data: { restType },
        })}
        onInterrupt={() => interruptCamp.mutate({ campaignId: campaignId!, campId: camp.id })}
        onEnd={() => endCamp.mutate({ campaignId: campaignId!, campId: camp.id })}
      />

      {camp.status === 'INTERRUPTED' && (
        <CampInterruptPanel
          camp={camp}
          isGm={isGm}
          busy={busy}
          onApplyPartialRest={() => partialRest.mutate({ campaignId: campaignId!, campId: camp.id })}
        />
      )}

      {showRestPanel && (
        <CampRestPanel
          camp={camp}
          isGm={isGm}
          busy={completeRest.isPending}
          onApply={() => completeRest.mutate({ campaignId: campaignId!, campId: camp.id })}
          onRetry={(characterIds) => completeRest.mutate({
            campaignId: campaignId!,
            campId: camp.id,
            data: { characterIds },
          })}
        />
      )}

      <div className={s.columns}>
        <OrdoPanel padding={0} className={s.partyColumn}>
          <PanelHeader
            title={t('campfire.party.title')}
            sub={t('campfire.party.sub', { count: camp.participants.length })}
            glyph="helm"
            right={(
              <span className="ao-codex">
                {t('campfire.party.restedCounter', {
                  rested: restedCount,
                  total: camp.participants.length,
                })}
              </span>
            )}
          />
          <div className={s.party}>
            {camp.participants.length === 0 ? (
              <EmptyVault
                glyph="helm"
                title={t('campfire.party.empty.title')}
                body={t('campfire.party.empty.body')}
              />
            ) : (
              camp.participants.map((participant) => (
                <CampMemberCard key={participant.id} participant={participant} />
              ))
            )}
          </div>
        </OrdoPanel>

        <div className={s.sideColumn}>
          <CampWatchPanel
            campaignId={campaignId!}
            camp={camp}
            isGm={isGm}
            onRequestCheck={(characterId, slot) => {
              const participant = camp.participants.find((item) => item.characterId === characterId);
              setCheckTarget({ characterId, name: participant?.characterName ?? '', slot });
            }}
          />

          <CampEventLog
            events={camp.events}
            isGm={isGm}
            busy={busy}
            onAdd={() => setEventOpen(true)}
            onTrigger={(eventId) => triggerEvent.mutate({ campaignId: campaignId!, campId: camp.id, eventId })}
            onDelete={(eventId) => deleteEvent.mutate({ campaignId: campaignId!, campId: camp.id, eventId })}
          />
        </div>
      </div>

      <div className={s.columns}>
        <div className={s.partyColumn}>
          <CampStoragePanel campaignId={campaignId!} />
        </div>
        <div className={s.sideColumn}>
          <CampActivitiesPanel
            campaignId={campaignId!}
            camp={camp}
            isGm={isGm}
            ownCharacterIds={camp.participants
              .filter((participant) => participant.ownerId === user?.id)
              .map((participant) => participant.characterId)}
          />
        </div>
      </div>

      {isGm && (
        <>
          <CampEventModal
            open={eventOpen}
            campaignId={campaignId!}
            busy={createEvent.isPending}
            onOpenChange={setEventOpen}
            onSubmit={(data) => {
              createEvent.mutate(
                { campaignId: campaignId!, campId: camp.id, data },
                { onSuccess: () => setEventOpen(false) },
              );
            }}
          />

          <CampWatchCheckModal
            open={checkTarget != null}
            campaignId={campaignId!}
            characterId={checkTarget?.characterId}
            characterName={checkTarget?.name}
            slot={checkTarget?.slot}
            onOpenChange={(open) => {
              if (!open) setCheckTarget(null);
            }}
          />
        </>
      )}
    </div>
  );
}
