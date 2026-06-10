import { useNavigate } from 'react-router-dom';
import { OrdoPanel as Panel, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface PreviewLink {
  labelKey: string;
  path: string;
  glyph: string;
}

const LINKS: PreviewLink[] = [
  { labelKey: 'combat.kit.cardVariants', path: 'kit', glyph: 'sigil-2' },
  { labelKey: 'combat.tracker.title', path: 'tracker-gm', glyph: 'sword' },
  { labelKey: 'combat.banner.pausedTag', path: 'tracker-gm-paused', glyph: 'minus' },
  { labelKey: 'combat.player.yourTurn', path: 'tracker-player', glyph: 'helm' },
  { labelKey: 'combat.player.waitTitle', path: 'tracker-player-wait', glyph: 'cir-dot' },
  { labelKey: 'combat.eb.title', path: 'encounter-builder', glyph: 'plus' },
  { labelKey: 'combat.list.title', path: 'encounters', glyph: 'book' },
  { labelKey: 'combat.sum.title', path: 'summary', glyph: 'check' },
  { labelKey: 'combat.tiles.combat', path: 'dashboard', glyph: 'hex' },
  { labelKey: 'combat.loot.tableTitle', path: 'loot-table', glyph: 'coin' },
  { labelKey: 'combat.gen.title', path: 'loot-gen', glyph: 'coin' },
  { labelKey: 'combat.gen.emptyTitle', path: 'loot-gen-empty', glyph: 'sigil-1' },
  { labelKey: 'combat.quest.title', path: 'quest', glyph: 'scroll' },
  { labelKey: 'combat.npc.title', path: 'npc', glyph: 'helm' },
  { labelKey: 'combat.npc.noStatTitle', path: 'npc-empty', glyph: 'sword' },
  { labelKey: 'combat.lists.quests', path: 'quests-list', glyph: 'scroll' },
  { labelKey: 'combat.lists.npc', path: 'npc-list', glyph: 'helm' },
  { labelKey: 'combat.pat.banners', path: 'patterns', glyph: 'flame' },
  { labelKey: 'combat.mobile.title', path: 'mobile', glyph: 'square' },
];

export default function CombatPreviewIndexPage() {
  const t = useT();
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('combat.preview.overline')}</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('combat.preview.title')}</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>{t('combat.preview.sub')}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {LINKS.map((l) => (
          <Panel
            key={l.path}
            frame
            padding={0}
            className="cb-hoverable"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/combat-preview/${l.path}`)}
          >
            <span className="ao-frame-c" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, border: '1px solid var(--rule-strong)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Rune kind={l.glyph} size={18} color="var(--gold)" />
              </div>
              <span style={{ flex: 1, minWidth: 0, color: 'var(--ink-bright)', fontSize: 14 }}>{t(l.labelKey)}</span>
              <Rune kind="arrow-r" size={14} color="var(--ink-faint)" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
