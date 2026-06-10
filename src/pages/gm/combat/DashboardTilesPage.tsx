import { OrdoPanel as Panel, OrdoChip as Chip, PanelHeader, Sigil, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { EncounterStatusBadge, AvatarStack } from '@/components/combat/kit';
import { SkeletonLine } from '@/components/combat/primitives';

export default function DashboardTilesPage() {
  const t = useT();
  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.preview.title')} breadcrumb={t('combat.preview.overline')} />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
          {/* Active combat tile */}
          <Panel padding={0} frame className="cb-hoverable" style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}>
            <span className="ao-frame-c" />
            <PanelHeader title={t('combat.tiles.combat')} glyph="sword" tone="ember" right={<EncounterStatusBadge status="ACTIVE" round={3} />} />
            <div style={{ padding: 18 }}>
              <div className="ao-h5">{t('combat.tiles.activeEnc')}</div>
              <div className="ao-codex" style={{ marginTop: 4 }}>{t('combat.tiles.activeMeta')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <AvatarStack kinds={['pc', 'pc', 'pc', 'mon']} extra={3} />
                <span style={{ flex: 1 }} />
                <button className="ao-btn ao-btn--primary">{t('combat.tiles.openTracker')} <Rune kind="arrow-r" size={11} /></button>
              </div>
            </div>
          </Panel>
          {/* Loot tile */}
          <Panel padding={0} frame className="cb-hoverable" style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}>
            <span className="ao-frame-c" />
            <PanelHeader title={t('combat.tiles.loot')} glyph="coin" right={<Chip tone="gold">{t('combat.tiles.tables')}</Chip>} />
            <div style={{ padding: 18 }}>
              <div className="ao-h5">{t('combat.tiles.lootGen')}</div>
              <div className="ao-codex" style={{ marginTop: 4 }}>{t('combat.tiles.lootMeta')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <span className="ao-chip" style={{ color: '#968c75', borderColor: '#968c7555' }}>{t('combat.tiles.common')}</span>
                <span className="ao-chip" style={{ color: '#6f93c4', borderColor: '#6f93c455' }}>{t('combat.tiles.rare')}</span>
                <span className="ao-chip" style={{ color: '#d4b478', borderColor: '#d4b47855' }}>{t('combat.tiles.legendary')}</span>
                <span style={{ flex: 1 }} />
                <button className="ao-btn"><Rune kind="hex" size={11} /> {t('combat.tiles.generate')}</button>
              </div>
            </div>
          </Panel>
          {/* Empty combat tile */}
          <Panel padding={0} style={{ position: 'relative', zIndex: 2 }}>
            <PanelHeader title={t('combat.tiles.combat')} glyph="sword" right={<span className="ao-codex">{t('combat.tiles.noActive')}</span>} />
            <div style={{ padding: '22px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Sigil size={44} glyph="sigil-1" color="var(--ink-quiet)" />
              <div style={{ flex: 1 }}>
                <div className="ao-italic" style={{ color: 'var(--ink-quiet)' }}>{t('combat.tiles.bladesSheathed')}</div>
              </div>
              <button className="ao-btn"><Rune kind="plus" size={11} /> {t('combat.tiles.newCombat')}</button>
            </div>
          </Panel>
          {/* Skeleton tile */}
          <Panel padding={0} style={{ position: 'relative', zIndex: 2 }}>
            <PanelHeader title={t('combat.tiles.combat')} glyph="sword" right={<SkeletonLine w={80} h={18} />} />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonLine w="55%" h={16} />
              <SkeletonLine w="80%" h={10} />
              <SkeletonLine w="40%" h={28} style={{ marginTop: 6 }} />
            </div>
          </Panel>
        </div>
      </div>
    </CombatBackdrop>
  );
}
