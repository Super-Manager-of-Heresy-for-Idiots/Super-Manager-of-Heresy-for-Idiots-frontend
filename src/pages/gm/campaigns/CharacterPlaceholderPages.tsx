import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { useCharacterV2 } from '@/hooks/useCharacterV2';

interface PlaceholderSpec {
  overline: string;
  title: string;
  glyph: string;
  todo: string;
  details: string[];
}

function CharacterFeaturePlaceholder({ overline, title, glyph, todo, details }: PlaceholderSpec) {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character } = useCharacterV2(campaignId!, characterId!);
  const backTo = characterId
    ? `/campaigns/${campaignId}/characters/${characterId}`
    : `/campaigns/${campaignId}`;

  return (
    <div>
      <BackLink to={backTo} label="К персонажу" style={{ marginBottom: 12 }} />
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={title}
          glyph={glyph}
          tone="gold"
          sub={character ? character.name : 'Character scoped screen'}
        />
      <div style={{ padding: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          {overline}
        </p>
        <h3 className="ao-h3" style={{ marginBottom: 12 }}>
          TODO: {todo}
        </h3>
        <div style={{ display: 'grid', gap: 10, maxWidth: 760 }}>
          {details.map((detail) => (
            <div
              key={detail}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                color: 'var(--ink-quiet)',
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              <Rune kind="diamond-fill" size={8} color="var(--gold)" />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>
      </OrdoPanel>
    </div>
  );
}

// Roster page links to dashboard, not character.
function CampaignFeaturePlaceholder({ overline, title, glyph, todo, details }: PlaceholderSpec) {
  const { campaignId } = useParams<{ campaignId: string }>();
  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />
      <OrdoPanel frame padding={0}>
        <PanelHeader title={title} glyph={glyph} tone="gold" sub="Campaign scoped screen" />
        <div style={{ padding: 24 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>{overline}</p>
          <h3 className="ao-h3" style={{ marginBottom: 12 }}>TODO: {todo}</h3>
          <div style={{ display: 'grid', gap: 10, maxWidth: 760 }}>
            {details.map((detail) => (
              <div key={detail} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--ink-quiet)', fontSize: 13, lineHeight: 1.45 }}>
                <Rune kind="diamond-fill" size={8} color="var(--gold)" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </OrdoPanel>
    </div>
  );
}

export function CampaignRosterPage() {
  return (
    <CampaignFeaturePlaceholder
      overline="Campaign roster"
      title="CAMPAIGN ROSTER"
      glyph="helm"
      todo="сделать полноценный список персонажей кампании"
      details={[
        'Для игрока здесь должен быть список только его персонажей в этой кампании.',
        'Для GAME_MASTER/admin здесь должен быть общий список персонажей кампании с владельцами, статусами, HP и быстрым переходом в управление.',
        'Нужны фильтры по статусу, владельцу и классу, а также массовые GAME_MASTER-действия, если они появятся в контракте.',
      ]}
    />
  );
}

export function CharacterEditPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Character profile"
      title="EDIT CHARACTER"
      glyph="scroll"
      todo="сделать форму редактирования профиля персонажа"
      details={[
        'Экран должен использовать PUT /campaigns/{campaignId}/characters/{characterId} для имени и расы.',
        'Для владельца и GAME_MASTER нужно показать доступные поля редактирования, для остальных оставить только просмотр.',
        'Здесь же нужен опасный блок удаления через DELETE персонажа с подтверждением.',
      ]}
    />
  );
}

export function CharacterStatsPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Character stats"
      title="CHARACTER STATS"
      glyph="sigil-2"
      todo="сделать экран характеристик и проверок"
      details={[
        'Нужно вывести base value, effective value и список active modifiers по GET /stats.',
        'Владелец и GAME_MASTER должны иметь форму изменения значения через PUT /stats/{statId}.',
        'Для каждого стата нужен запуск ability-check и отображение base modifier, buffs, equipment и total modifier.',
      ]}
    />
  );
}

export function AbilityCheckPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Ability check"
      title="ABILITY CHECK"
      glyph="eye"
      todo="сделать экран расчета модификатора проверки"
      details={[
        'Экран должен читать statTypeId из URL и вызывать GET /ability-check/{statTypeId}.',
        'Нужно показать базовое значение, стандартный модификатор, бонус эффектов, бонус экипировки и итог.',
        'Позже сюда можно добавить бросок d20, историю проверок и отправку результата GAME_MASTER.',
      ]}
    />
  );
}

export function CharacterWalletPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Character wallet"
      title="CHARACTER WALLET"
      glyph="coin"
      todo="сделать кошелек персонажа"
      details={[
        'Экран должен показывать все валюты персонажа через GET /wallet, включая goldEquivalent.',
        'Владелец и GAME_MASTER должны иметь форму начисления и списания валюты через POST /wallet.',
        'Нужен компактный журнал последних операций, если backend позже отдаст историю.',
      ]}
    />
  );
}

export function CharacterResourcesPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Character resources"
      title="CHARACTER RESOURCES"
      glyph="hex"
      todo="сделать управление расходуемыми ресурсами"
      details={[
        'Экран должен показывать currentValue/maxValue для каждого ресурса через GET /resources.',
        'Владелец и GAME_MASTER должны менять currentValue через POST /resources.',
        'Нужно предусмотреть быстрые кнопки spend/restore и визуальное заполнение ресурса.',
      ]}
    />
  );
}

export function CharacterHpPage() {
  return (
    <CharacterFeaturePlaceholder
      overline="Character HP"
      title="CHARACTER HP"
      glyph="cross"
      todo="сделать экран урона и лечения"
      details={[
        'Экран должен использовать POST /hp, где отрицательное amount наносит урон, а положительное лечит.',
        'Нужно показывать текущие HP, максимальные HP, статус персонажа и результат последнего изменения.',
        'Для будущего дизайна стоит добавить быстрые пресеты урона/лечения и подтверждение критичных изменений.',
      ]}
    />
  );
}
