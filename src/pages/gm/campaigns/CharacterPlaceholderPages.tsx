import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { useCharacter } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';

interface PlaceholderSpec {
  overline: string;
  title: string;
  glyph: string;
  todo: string;
  details: string[];
}

function CharacterFeaturePlaceholder({ overline, title, glyph, todo, details }: PlaceholderSpec) {
  const t = useT();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { data: character } = useCharacter(campaignId!, characterId!);
  const backTo = characterId
    ? `/campaigns/${campaignId}/characters/${characterId}`
    : `/campaigns/${campaignId}`;

  return (
    <div>
      <BackLink to={backTo} label={t('camp.backToCharacter')} style={{ marginBottom: 12 }} />
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={title}
          glyph={glyph}
          tone="gold"
          sub={character ? character.name : t('camp.ph.scopedCharacter')}
        />
      <div style={{ padding: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>
          {overline}
        </p>
        <h3 className="ao-h3" style={{ marginBottom: 12 }}>
          {t('camp.ph.todoPrefix')}{todo}
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
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp.backToCampaign')} style={{ marginBottom: 12 }} />
      <OrdoPanel frame padding={0}>
        <PanelHeader title={title} glyph={glyph} tone="gold" sub={t('camp.ph.scopedCampaign')} />
        <div style={{ padding: 24 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>{overline}</p>
          <h3 className="ao-h3" style={{ marginBottom: 12 }}>{t('camp.ph.todoPrefix')}{todo}</h3>
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
  const t = useT();
  return (
    <CampaignFeaturePlaceholder
      overline={t('camp.ph.roster.overline')}
      title={t('camp.ph.roster.title')}
      glyph="helm"
      todo={t('camp.ph.roster.todo')}
      details={[
        t('camp.ph.roster.d1'),
        t('camp.ph.roster.d2'),
        t('camp.ph.roster.d3'),
      ]}
    />
  );
}

export function CharacterEditPage() {
  const t = useT();
  return (
    <CharacterFeaturePlaceholder
      overline={t('camp.ph.edit.overline')}
      title={t('camp.ph.edit.title')}
      glyph="scroll"
      todo={t('camp.ph.edit.todo')}
      details={[
        t('camp.ph.edit.d1'),
        t('camp.ph.edit.d2'),
        t('camp.ph.edit.d3'),
      ]}
    />
  );
}

export function CharacterStatsPage() {
  const t = useT();
  return (
    <CharacterFeaturePlaceholder
      overline={t('camp.ph.stats.overline')}
      title={t('camp.ph.stats.title')}
      glyph="sigil-2"
      todo={t('camp.ph.stats.todo')}
      details={[
        t('camp.ph.stats.d1'),
        t('camp.ph.stats.d2'),
        t('camp.ph.stats.d3'),
      ]}
    />
  );
}

export function AbilityCheckPage() {
  const t = useT();
  return (
    <CharacterFeaturePlaceholder
      overline={t('camp.ph.check.overline')}
      title={t('camp.ph.check.title')}
      glyph="eye"
      todo={t('camp.ph.check.todo')}
      details={[
        t('camp.ph.check.d1'),
        t('camp.ph.check.d2'),
        t('camp.ph.check.d3'),
      ]}
    />
  );
}

export function CharacterHpPage() {
  const t = useT();
  return (
    <CharacterFeaturePlaceholder
      overline={t('camp.ph.hp.overline')}
      title={t('camp.ph.hp.title')}
      glyph="cross"
      todo={t('camp.ph.hp.todo')}
      details={[
        t('camp.ph.hp.d1'),
        t('camp.ph.hp.d2'),
        t('camp.ph.hp.d3'),
      ]}
    />
  );
}
