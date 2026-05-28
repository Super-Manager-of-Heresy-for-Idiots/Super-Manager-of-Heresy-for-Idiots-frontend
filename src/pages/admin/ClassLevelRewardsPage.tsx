import { useState } from 'react';
import {
  Panel,
  PanelHeader,
  Table,
  Button,
  Select,
  Label,
  Input,
  Chip,
  Rune,
  Dialog,
  AlertDialog,
} from '@/components/ao';
import {
  useCharacterClasses,
  useClassLevelRewards,
  useCreateClassLevelReward,
  useDeleteClassLevelReward,
  useFeats,
  useSubclasses,
  useSkills,
} from '@/hooks/useAdmin';
import type { ClassLevelReward } from '@/types';

const rewardTypeTone: Record<string, 'gold' | 'arcane' | 'ember' | 'muted'> = {
  FEAT: 'gold',
  SUBCLASS: 'arcane',
  SKILL: 'ember',
};

export default function ClassLevelRewardsPage() {
  const { data: classes } = useCharacterClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const { data: rewards, isLoading } = useClassLevelRewards(selectedClassId || undefined);

  const createMutation = useCreateClassLevelReward();
  const deleteMutation = useDeleteClassLevelReward();

  const { data: feats } = useFeats();
  const { data: subclasses } = useSubclasses();
  const { data: skills } = useSkills();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state for add dialog
  const [formLevel, setFormLevel] = useState(1);
  const [formRewardType, setFormRewardType] = useState('');
  const [formRewardId, setFormRewardId] = useState('');
  const [formIsChoice, setFormIsChoice] = useState(false);

  const getRewardOptions = () => {
    switch (formRewardType) {
      case 'FEAT':
        return (feats || []).map((f) => ({ value: f.id, label: f.name }));
      case 'SUBCLASS':
        return (subclasses || [])
          .filter((s) => s.parentClass?.id === selectedClassId)
          .map((s) => ({ value: s.id, label: s.name }));
      case 'SKILL':
        return (skills || []).map((s) => ({ value: s.id, label: s.name }));
      default:
        return [];
    }
  };

  const handleAdd = () => {
    if (!selectedClassId || !formRewardType || !formRewardId) return;
    createMutation.mutate(
      {
        classId: selectedClassId,
        level: formLevel,
        rewardType: formRewardType,
        rewardId: formRewardId,
        isChoice: formIsChoice,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setFormLevel(1);
          setFormRewardType('');
          setFormRewardId('');
          setFormIsChoice(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const filteredRewards = rewards || [];

  return (
    <div>
      <h1 className="ao-h2" style={{ marginBottom: 24 }}>Class Level Rewards</h1>

      <div style={{ marginBottom: 20, maxWidth: 300 }}>
        <Label htmlFor="class-select">Select Class</Label>
        <Select
          id="class-select"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="">Choose a class...</option>
          {(classes || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {selectedClassId ? (
        <Panel>
          <PanelHeader
            title={`Rewards — ${classes?.find((c) => c.id === selectedClassId)?.name || ''}`}
            glyph="hex"
            right={
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                <Rune kind="plus" size={14} color="var(--bg)" />
                <span style={{ marginLeft: 4 }}>Add Reward</span>
              </Button>
            }
          />

          {isLoading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ao-skeleton" style={{ height: 40, width: '100%' }} />
              ))}
            </div>
          ) : filteredRewards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-faint)' }}>
              No rewards configured for this class. Click "Add Reward" to begin.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: 'level',
                  header: 'Level',
                  width: '80px',
                  render: (row: ClassLevelReward & Record<string, unknown>) =>
                    String(row.level),
                },
                {
                  key: 'rewardType',
                  header: 'Type',
                  render: (row: ClassLevelReward & Record<string, unknown>) => (
                    <Chip tone={rewardTypeTone[row.rewardType] || 'muted'}>
                      {row.rewardType}
                    </Chip>
                  ),
                },
                {
                  key: 'reward',
                  header: 'Reward',
                  render: (row: ClassLevelReward & Record<string, unknown>) =>
                    row.reward?.name || '—',
                },
                {
                  key: 'isChoice',
                  header: 'Choice?',
                  width: '80px',
                  render: (row: ClassLevelReward & Record<string, unknown>) =>
                    row.isChoice ? (
                      <Chip tone="arcane">Yes</Chip>
                    ) : (
                      <span style={{ color: 'var(--ink-faint)' }}>No</span>
                    ),
                },
                {
                  key: 'actions',
                  header: '',
                  width: '60px',
                  align: 'right' as const,
                  render: (row: ClassLevelReward & Record<string, unknown>) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(row.id)}
                      style={{ color: 'var(--ember)' }}
                    >
                      <Rune kind="x" size={14} />
                    </Button>
                  ),
                },
              ]}
              data={filteredRewards as (ClassLevelReward & Record<string, unknown>)[]}
              rowKey={(row) => (row as ClassLevelReward).id}
            />
          )}
        </Panel>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-faint)' }}>
          <Rune kind="hex" size={48} color="var(--rule)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Select a class to manage its level rewards.</p>
        </div>
      )}

      {/* Add Reward Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add Level Reward">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label htmlFor="reward-level">Level</Label>
            <Input
              id="reward-level"
              type="number"
              min={1}
              max={20}
              value={formLevel}
              onChange={(e) => setFormLevel(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <Label htmlFor="reward-type">Reward Type</Label>
            <Select
              id="reward-type"
              value={formRewardType}
              onChange={(e) => {
                setFormRewardType(e.target.value);
                setFormRewardId('');
              }}
            >
              <option value="">Select type...</option>
              <option value="FEAT">Feat</option>
              <option value="SUBCLASS">Subclass</option>
              <option value="SKILL">Skill</option>
            </Select>
          </div>
          {formRewardType && (
            <div>
              <Label htmlFor="reward-id">Reward</Label>
              <Select
                id="reward-id"
                value={formRewardId}
                onChange={(e) => setFormRewardId(e.target.value)}
              >
                <option value="">Select reward...</option>
                {getRewardOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="reward-choice"
              checked={formIsChoice}
              onChange={(e) => setFormIsChoice(e.target.checked)}
              style={{ accentColor: 'var(--gold)' }}
            />
            <Label htmlFor="reward-choice" style={{ margin: 0 }}>Is a player choice (not auto-granted)</Label>
          </div>
        </div>
        <div className="ao-dialog__actions" style={{ marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={createMutation.isPending || !formRewardType || !formRewardId}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Reward'}
          </Button>
        </div>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Reward?"
        description="This will permanently remove this reward from the class level table."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
