import { OrdoPanel as Panel } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import {
  ParticipantCard,
  CombatHPBar,
  HealthWordBadge,
  ConditionChip,
  AttackResultCard,
  EncounterStatusBadge,
} from '@/components/combat/kit';
import { RarityBadge } from '@/components/items/RarityBadge';
import { GM_INITIAL, CONDITIONS, RARITY_ORDER } from '@/components/combat/data';

export default function CombatKitReferencePage() {
  const t = useT();
  const sample = { ...GM_INITIAL[1] };
  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.preview.title')} breadcrumb={t('combat.preview.overline')} />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.cardVariants')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
                <ParticipantCard p={GM_INITIAL[0]} active view="gm" />
                <ParticipantCard p={sample} view="gm" />
                <ParticipantCard p={GM_INITIAL[4]} view="gm" />
                <ParticipantCard p={GM_INITIAL[5]} view="player" />
                <ParticipantCard p={GM_INITIAL[3]} view="player" />
              </div>
              <div className="ao-codex" style={{ marginTop: 8 }}>{t('combat.kit.cardNote')}</div>
            </div>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.hpBars')}</div>
              <Panel padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <CombatHPBar cur={34} max={42} size="lg" />
                <CombatHPBar cur={12} max={20} temp={3} size="lg" />
                <CombatHPBar cur={4} max={42} size="lg" />
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <HealthWordBadge cur={20} max={20} />
                  <HealthWordBadge cur={12} max={20} />
                  <HealthWordBadge cur={7} max={20} />
                  <HealthWordBadge cur={1} max={20} />
                </div>
              </Panel>
            </div>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.condChips')}</div>
              <Panel padding={16}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.keys(CONDITIONS).map((c) => <ConditionChip key={c} id={c} />)}
                  <ConditionChip id="POISONED" active={false} />
                </div>
              </Panel>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.atkCard')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AttackResultCard mode="MISS" roll={6} bonus={5} vsAC={15} compact />
                <AttackResultCard mode="HIT" roll={14} bonus={5} vsAC={15} dmg={9} compact />
                <AttackResultCard mode="CRIT" roll={20} bonus={5} vsAC={15} dmg={18} compact />
              </div>
            </div>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.rarities')}</div>
              <Panel padding={16}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {RARITY_ORDER.map((r) => <RarityBadge key={r} rarity={r} />)}
                </div>
              </Panel>
            </div>
            <div>
              <div className="ao-overline" style={{ marginBottom: 10 }}>{t('combat.kit.statuses')}</div>
              <Panel padding={16}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <EncounterStatusBadge status="DRAFT" />
                  <EncounterStatusBadge status="ACTIVE" round={3} />
                  <EncounterStatusBadge status="PAUSED" />
                  <EncounterStatusBadge status="FINISHED" />
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </CombatBackdrop>
  );
}
