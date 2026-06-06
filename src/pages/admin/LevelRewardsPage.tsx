import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rune, Sigil, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useLevelRewards,
  useCreateLevelReward,
  useDeleteLevelReward,
  useCharacterClasses,
  useSkills,
  useSubclasses,
  useFeats,
} from '@/hooks/useAdmin';
import type { ClassLevelRewardResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const REWARD_TYPES = ['SKILL', 'SUBCLASS', 'FEAT'] as const;

const ROMAN_NUMERALS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

const REWARD_TYPE_CONFIG: Record<string, { c: string; glyph: string }> = {
  SKILL:    { c: '#6f93c4', glyph: 'eye' },
  SUBCLASS: { c: '#9a7ec0', glyph: 'hex' },
  FEAT:     { c: '#c06a32', glyph: 'sigil-3' },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RewardChip({ reward }: { reward: ClassLevelRewardResponse }) {
  const cfg = REWARD_TYPE_CONFIG[reward.rewardType] || { c: 'var(--gold)', glyph: 'diamond' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '5px 11px',
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${cfg.c}66`,
      borderLeft: `2px solid ${cfg.c}`,
    }}>
      <Rune kind={cfg.glyph} size={11} color={cfg.c} />
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.16em',
        color: cfg.c,
        textTransform: 'uppercase',
      }}>
        {reward.rewardType}
      </span>
      <span style={{
        color: 'var(--ink-bright)',
        fontFamily: 'var(--font-serif)',
        fontSize: 13,
      }}>
        {reward.rewardName}
      </span>
    </span>
  );
}

function ChoiceFlag({ isChoice }: { isChoice: boolean }) {
  const t = useT();
  if (isChoice) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--gold-pale)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.08em',
      }}>
        <Rune kind="sword" size={11} color="var(--gold-pale)" /> {t('adm.rewards.chooseOne')}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      color: 'var(--arcane)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.08em',
    }}>
      <Rune kind="diamond-fill" size={9} color="var(--arcane)" /> {t('adm.rewards.autoGranted')}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function LevelRewardsPage() {
  const t = useT();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const { data: rewards, isLoading, error, refetch } = useLevelRewards(classId!);
  const { data: classes } = useCharacterClasses();
  const { data: skills } = useSkills();
  const { data: subclasses } = useSubclasses();
  const { data: feats } = useFeats();

  const createMutation = useCreateLevelReward();
  const deleteMutation = useDeleteLevelReward();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLevel, setFormLevel] = useState('1');
  const [formRewardType, setFormRewardType] = useState<string>('SKILL');
  const [formRewardId, setFormRewardId] = useState('');
  const [formIsChoice, setFormIsChoice] = useState('false');

  const className = classes?.find((c) => c.id === classId)?.name || t('adm.rewards.unknownClass');

  const rewardOptions = useMemo(() => {
    if (formRewardType === 'SKILL') return (skills || []).map((s) => ({ value: s.id, label: s.name }));
    if (formRewardType === 'SUBCLASS') return (subclasses || []).filter((s) => s.classId === classId).map((s) => ({ value: s.id, label: s.name }));
    if (formRewardType === 'FEAT') return (feats || []).map((f) => ({ value: f.id, label: f.name }));
    return [];
  }, [formRewardType, skills, subclasses, feats, classId]);

  const rewardsByLevel = useMemo(() => {
    const grouped: Record<number, ClassLevelRewardResponse[]> = {};
    (rewards || []).forEach((r) => {
      if (!grouped[r.requiredLevel]) grouped[r.requiredLevel] = [];
      grouped[r.requiredLevel].push(r);
    });
    return grouped;
  }, [rewards]);

  const handleCreate = () => {
    createMutation.mutate(
      {
        classId: classId!,
        data: {
          requiredLevel: Number(formLevel),
          rewardType: formRewardType as 'SKILL' | 'SUBCLASS' | 'FEAT',
          rewardId: formRewardId,
          isChoice: formIsChoice === 'true',
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormRewardId('');
        },
      }
    );
  };

  const handleDelete = (rewardEntryId: string) => {
    deleteMutation.mutate({ classId: classId!, rewardEntryId });
  };

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('adm.rewards.loadingOverline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('adm.rewards.loadingTitle')}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 64 }} />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('adm.rewards.errorBody')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div>
      {/* ── Breadcrumb ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className="ao-btn ao-btn--ghost ao-btn--sm"
          onClick={() => navigate('/admin')}
          style={{ padding: '2px 0', fontSize: 12, color: 'var(--ink-quiet)' }}
        >
          {t('adm.rewards.breadcrumbAdmin')}
        </button>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <button
          className="ao-btn ao-btn--ghost ao-btn--sm"
          onClick={() => navigate('/admin/homebrew')}
          style={{ padding: '2px 0', fontSize: 12, color: 'var(--ink-quiet)' }}
        >
          {t('adm.rewards.breadcrumbClasses')}
        </button>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <span style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>{className}</span>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <span style={{ fontSize: 12, color: 'var(--gold-pale)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
          {t('adm.rewards.breadcrumbLevelRewards')}
        </span>
      </nav>

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>

        {/* Left: Sigil + titles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Sigil size={52} glyph="sigil-3" />
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 2 }}>
              {t('adm.rewards.classLabel', { name: className })}
            </p>
            <h3 className="ao-h3" style={{ margin: 0 }}>
              {t('adm.rewards.headerTitle', { name: className })}
            </h3>
            <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
              {t('adm.rewards.headerSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--gold-pale)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
            <Rune kind="sword" size={11} color="var(--gold-pale)" /> {t('adm.rewards.chooseOne')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--arcane)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
            <Rune kind="diamond-fill" size={9} color="var(--arcane)" /> {t('adm.rewards.autoGranted')}
          </span>
        </div>
      </div>

      {/* ── Top buttons row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          className="ao-btn ao-btn--ghost"
          onClick={() => navigate(`/admin/homebrew`)}
        >
          {t('adm.rewards.previewClass')}
        </button>
        <OrdoChip tone="ember" glyph="shield">
          {t('adm.shared.inquisitorPrivileges')}
        </OrdoChip>
      </div>

      {/* ── Timeline panel ── */}
      <OrdoPanel frame padding={0} style={{ overflow: 'auto' }}>
        {LEVELS.map((level) => {
          const levelRewards = rewardsByLevel[level] || [];
          const hasRewards = levelRewards.length > 0;

          return (
            <div
              key={level}
              style={{
                display: 'grid',
                gridTemplateColumns: '92px 1fr 130px',
                minHeight: 52,
                background: hasRewards ? 'transparent' : 'rgba(0,0,0,0.12)',
                borderBottom: level < 20 ? '1px solid var(--hairline)' : 'none',
              }}
            >
              {/* ─ Level marker column ─ */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--abyss)',
                borderRight: '1px solid var(--hairline)',
                padding: '8px 0',
                gap: 2,
              }}>
                <span className="ao-overline" style={{ fontSize: 8, letterSpacing: '0.14em', color: 'var(--ink-faint)' }}>
                  {t('adm.rewards.levelAbbr')}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  color: hasRewards ? 'var(--gold-pale)' : 'var(--ink-faint)',
                  lineHeight: 1,
                }}>
                  {ROMAN_NUMERALS[level]}
                </span>
              </div>

              {/* ─ Rewards column ─ */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 14px',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                {hasRewards ? (
                  levelRewards.map((reward) => (
                    <div key={reward.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <RewardChip reward={reward} />
                      <ChoiceFlag isChoice={reward.isChoice} />
                      {/* Delete trigger */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="ao-iconbtn" title={t('adm.rewards.remove')} style={{ marginLeft: 2 }}>
                            <Rune kind="x" size={12} color="var(--ember)" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('adm.rewards.removeRewardTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('adm.rewards.removeRewardDescription', { level: ROMAN_NUMERALS[level] })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('adm.shared.withhold')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(reward.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('adm.rewards.remove')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                ) : (
                  <div style={{
                    flex: 1,
                    padding: '8px 14px',
                    border: '1px dashed var(--rule)',
                    textAlign: 'center',
                  }}>
                    <span className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
                      {t('adm.rewards.emptyLevel')}
                    </span>
                  </div>
                )}
              </div>

              {/* ─ Add column ─ */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 0',
              }}>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => {
                    setFormLevel(String(level));
                    setDialogOpen(true);
                  }}
                >
                  <Rune kind="plus" size={12} color="var(--gold)" />
                  <span style={{ marginLeft: 4 }}>{t('adm.rewards.addReward')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </OrdoPanel>

      {/* ── Add Reward Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adm.rewards.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label={t('adm.rewards.fieldLevel')} required>
              <Select value={formLevel} onValueChange={setFormLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.rewards.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      {t('adm.rewards.levelOption', { roman: ROMAN_NUMERALS[l], num: l })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label={t('adm.rewards.fieldRewardType')} required>
              <Select
                value={formRewardType}
                onValueChange={(v) => {
                  setFormRewardType(v);
                  setFormRewardId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.rewards.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label={t('adm.rewards.fieldReward')} required>
              <Select value={formRewardId} onValueChange={setFormRewardId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.rewards.selectReward')} />
                </SelectTrigger>
                <SelectContent>
                  {rewardOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label={t('adm.rewards.fieldGrantMethod')}>
              <Select value={formIsChoice} onValueChange={setFormIsChoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">{t('adm.rewards.grantAuto')}</SelectItem>
                  <SelectItem value="true">{t('adm.rewards.grantPlayer')}</SelectItem>
                </SelectContent>
              </Select>
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('adm.shared.withhold')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!formRewardId || createMutation.isPending}
            >
              {t('adm.rewards.bindRite')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
