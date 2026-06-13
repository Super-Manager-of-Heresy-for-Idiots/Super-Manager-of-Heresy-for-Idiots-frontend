import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import { useCharacter } from '@/hooks/useCharacter';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './CharacterPlaceholderPages.module.css';

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
      <BackLink to={backTo} label={t('camp.backToCharacter')} className={s.backLink} />
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={title}
          glyph={glyph}
          tone="gold"
          sub={character ? character.name : t('camp.ph.scopedCharacter')}
        />
      <div className={s.body}>
        <p className={cn('ao-overline', s.overlineGold)}>
          {overline}
        </p>
        <h3 className={cn('ao-h3', s.todoTitle)}>
          {t('camp.ph.todoPrefix')}{todo}
        </h3>
        <div className={s.detailGrid}>
          {details.map((detail) => (
            <div key={detail} className={s.detailRow}>
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
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp.backToCampaign')} className={s.backLink} />
      <OrdoPanel frame padding={0}>
        <PanelHeader title={title} glyph={glyph} tone="gold" sub={t('camp.ph.scopedCampaign')} />
        <div className={s.body}>
          <p className={cn('ao-overline', s.overlineGold)}>{overline}</p>
          <h3 className={cn('ao-h3', s.todoTitle)}>{t('camp.ph.todoPrefix')}{todo}</h3>
          <div className={s.detailGrid}>
            {details.map((detail) => (
              <div key={detail} className={s.detailRow}>
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
