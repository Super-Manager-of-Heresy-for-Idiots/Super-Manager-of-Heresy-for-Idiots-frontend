import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dices, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import {
  useRollPrompts,
  useCreateRollPrompts,
  useCancelRollPrompt,
} from '@/hooks/useRollPrompts';
import type { RollAdvantageMode, RollPromptResponse, RollPromptType } from '@/types';

const ROLL_TYPE_LABEL: Record<RollPromptType, string> = {
  ABILITY_CHECK: 'Проверка характеристики',
  SAVING_THROW: 'Спасбросок',
  CUSTOM: 'Чистый d20',
};

/**
 * Окно мастера (ROLL_PROMPT): инициирует появление окон броска у игроков —
 * выбор персонажей, тип проверки, характеристика, DC, преимущество/помеха.
 * Ниже — живой журнал запросов с результатами (обновляется по WS).
 */
export default function RollPromptsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const cid = campaignId!;

  const { data: characters } = useCampaignCharacters(cid);
  const { data: prompts, isLoading } = useRollPrompts(cid);
  const createMutation = useCreateRollPrompts();
  const cancelMutation = useCancelRollPrompt();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rollType, setRollType] = useState<RollPromptType>('ABILITY_CHECK');
  const [statTypeId, setStatTypeId] = useState('');
  const [dc, setDc] = useState('');
  const [hideDc, setHideDc] = useState(false);
  const [advantage, setAdvantage] = useState<RollAdvantageMode>('NORMAL');
  const [description, setDescription] = useState('');

  // Список характеристик берём из статов первого персонажа кампании (общий справочник).
  const statOptions = useMemo(() => {
    const first = (characters ?? []).find((c) => c.stats?.length);
    return (first?.stats ?? []).map((s) => ({ id: s.statTypeId, name: s.statTypeName }));
  }, [characters]);

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit =
    selectedIds.size > 0 && (rollType === 'CUSTOM' || !!statTypeId) && !createMutation.isPending;

  const submit = () => {
    createMutation.mutate(
      {
        campaignId: cid,
        data: {
          characterIds: [...selectedIds],
          rollType,
          statTypeId: rollType === 'CUSTOM' ? undefined : statTypeId,
          dc: dc ? Number(dc) : undefined,
          hideDc,
          advantageMode: advantage,
          description: description || undefined,
        },
      },
      { onSuccess: () => setDescription('') },
    );
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Dices className="h-4 w-4" /> Запросить проверку у игроков
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Characters */}
          <div>
            <Label className="mb-1 block text-xs">Персонажи</Label>
            <div className="flex flex-wrap gap-2">
              {(characters ?? []).map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={selectedIds.has(c.id) ? 'default' : 'outline'}
                  onClick={() => toggleCharacter(c.id)}
                >
                  {c.name}
                </Button>
              ))}
              {!characters?.length && (
                <p className="text-sm text-muted-foreground">В кампании нет персонажей.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label className="mb-1 block text-xs">Тип проверки</Label>
              <Select value={rollType} onValueChange={(v) => setRollType(v as RollPromptType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLL_TYPE_LABEL) as RollPromptType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {ROLL_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rollType !== 'CUSTOM' && (
              <div>
                <Label className="mb-1 block text-xs">Характеристика</Label>
                <Select value={statTypeId} onValueChange={setStatTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выбрать…" />
                  </SelectTrigger>
                  <SelectContent>
                    {statOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-1 block text-xs">Сложность (DC)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={dc}
                onChange={(e) => setDc(e.target.value)}
                placeholder="—"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Режим</Label>
              <Select value={advantage} onValueChange={(v) => setAdvantage(v as RollAdvantageMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Обычный</SelectItem>
                  <SelectItem value="ADVANTAGE">Преимущество</SelectItem>
                  <SelectItem value="DISADVANTAGE">Помеха</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input
              className="flex-1"
              placeholder="Описание (напр. «Заметить ловушку в коридоре»)"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input type="checkbox" checked={hideDc} onChange={(e) => setHideDc(e.target.checked)} />
              Скрыть DC
            </label>
            <Button disabled={!canSubmit} onClick={submit}>
              {createMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Запросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live journal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Журнал проверок</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {!prompts?.length && !isLoading && (
            <p className="text-sm text-muted-foreground">Проверок ещё не было.</p>
          )}
          {prompts?.map((p) => (
            <PromptRow
              key={p.id}
              prompt={p}
              onCancel={() => cancelMutation.mutate({ campaignId: cid, promptId: p.id })}
              cancelPending={cancelMutation.isPending}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PromptRow({
  prompt,
  onCancel,
  cancelPending,
}: {
  prompt: RollPromptResponse;
  onCancel: () => void;
  cancelPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded border p-2 text-sm">
      <div>
        <p className="font-medium">
          {prompt.characterName} — {ROLL_TYPE_LABEL[prompt.rollType]}
          {prompt.statName ? ` (${prompt.statName})` : ''}
          {typeof prompt.dc === 'number' ? ` · DC ${prompt.dc}` : ''}
          {prompt.hideDc ? ' · DC скрыт' : ''}
        </p>
        {prompt.description && <p className="text-xs text-muted-foreground">{prompt.description}</p>}
        {prompt.status === 'ROLLED' && (
          <p className="text-xs">
            Итог: <span className="font-semibold">{prompt.total}</span> (d20 {prompt.rollNatural}
            {typeof prompt.modifier === 'number'
              ? `, ${prompt.modifier >= 0 ? '+' : ''}${prompt.modifier}`
              : ''}
            )
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {prompt.status === 'PENDING' && (
          <>
            <Badge variant="secondary">Ожидает броска</Badge>
            <Button size="sm" variant="ghost" disabled={cancelPending} onClick={onCancel}>
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        {prompt.status === 'ROLLED' &&
          (prompt.success === true ? (
            <Badge>Успех</Badge>
          ) : prompt.success === false ? (
            <Badge variant="destructive">Провал</Badge>
          ) : (
            <Badge variant="secondary">Брошено</Badge>
          ))}
        {prompt.status === 'CANCELLED' && <Badge variant="outline">Отменено</Badge>}
      </div>
    </div>
  );
}
