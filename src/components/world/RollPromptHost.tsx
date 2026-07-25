import { useMemo, useState } from 'react';
import { Dices, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRollPrompts, useRollPromptRoll } from '@/hooks/useRollPrompts';
import { useAuthStore } from '@/store/authStore';
import type { RollPromptResponse } from '@/types';

const ROLL_TYPE_LABEL: Record<string, string> = {
  ABILITY_CHECK: 'Проверка характеристики',
  SAVING_THROW: 'Спасбросок',
  CUSTOM: 'Бросок d20',
};

const ADVANTAGE_LABEL: Record<string, string> = {
  ADVANTAGE: 'с преимуществом',
  DISADVANTAGE: 'с помехой',
};

/**
 * Окно броска у игрока (ROLL_PROMPT): мастер инициирует проверку — здесь всплывает
 * модалка "Бросить d20". Бросок исполняется на сервере; результат показывается
 * в этом же окне. Хост монтируется в CampaignLayout и работает на любой странице кампании.
 */
export function RollPromptHost({ campaignId }: { campaignId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: prompts } = useRollPrompts(campaignId, 'PENDING');
  const rollMutation = useRollPromptRoll();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<RollPromptResponse | null>(null);

  // Только запросы к персонажам текущего пользователя (мастеру своё окно не показываем).
  const myPending = useMemo(
    () =>
      (prompts ?? []).filter(
        (p) => p.ownerUserId === user?.id && p.status === 'PENDING' && !dismissedIds.has(p.id),
      ),
    [prompts, user?.id, dismissedIds],
  );

  const active = result ?? myPending[0] ?? null;
  if (!active) return null;

  const isRolled = active.status === 'ROLLED';

  const doRoll = () => {
    rollMutation.mutate(
      { campaignId, promptId: active.id },
      { onSuccess: (resp) => setResult(resp.data ?? null) },
    );
  };

  const close = () => {
    if (!isRolled) {
      setDismissedIds((prev) => new Set(prev).add(active.id));
    }
    setResult(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5" />
            {ROLL_TYPE_LABEL[active.rollType] ?? 'Проверка'}
            {active.statName ? `: ${active.statName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            Персонаж: <span className="font-medium">{active.characterName}</span>
          </p>
          {active.description && <p className="text-muted-foreground">{active.description}</p>}
          {active.advantageMode !== 'NORMAL' && (
            <Badge variant="secondary">{ADVANTAGE_LABEL[active.advantageMode]}</Badge>
          )}
          {typeof active.dc === 'number' && (
            <p>
              Сложность (DC): <span className="font-medium">{active.dc}</span>
            </p>
          )}
          {active.requestedByName && (
            <p className="text-xs text-muted-foreground">Запросил мастер: {active.requestedByName}</p>
          )}

          {isRolled && (
            <div className="rounded border p-3 text-center">
              <p className="text-3xl font-bold">{active.total}</p>
              <p className="text-xs text-muted-foreground">
                d20: {active.rollNatural}
                {typeof active.rollSecond === 'number' ? ` (второй куб: ${active.rollSecond})` : ''}
                {typeof active.modifier === 'number'
                  ? ` ${active.modifier >= 0 ? '+' : ''}${active.modifier} модификатор`
                  : ''}
              </p>
              {active.success === true && <Badge className="mt-2">Успех</Badge>}
              {active.success === false && (
                <Badge variant="destructive" className="mt-2">
                  Провал
                </Badge>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isRolled ? (
            <>
              <Button variant="ghost" onClick={close}>
                Позже
              </Button>
              <Button onClick={doRoll} disabled={rollMutation.isPending}>
                {rollMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Dices className="mr-1 h-4 w-4" />
                )}
                Бросить d20
              </Button>
            </>
          ) : (
            <Button onClick={close}>Закрыть</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
