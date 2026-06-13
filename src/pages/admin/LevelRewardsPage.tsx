import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
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
import { cn } from '@/lib/utils';
import s from './LevelRewardsPage.module.css';

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
    <span className={s.rewardChip} style={{ '--c': cfg.c } as CSSProperties}>
      <Rune kind={cfg.glyph} size={11} color={cfg.c} />
      <span className={s.rewardType}>{reward.rewardType}</span>
      <span className={s.rewardName}>{reward.rewardName}</span>
    </span>
  );
}

function ChoiceFlag({ isChoice }: { isChoice: boolean }) {
  const t = useT();
  if (isChoice) {
    return (
      <span className={s.flagChoice}>
        <Rune kind="sword" size={11} color="var(--gold-pale)" /> {t('adm.rewards.chooseOne')}
      </span>
    );
  }
  return (
    <span className={s.flagAuto}>
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
    if (formRewardType === 'SKILL') return (skills || []).map((sk) => ({ value: sk.id, label: sk.name }));
    if (formRewardType === 'SUBCLASS') return (subclasses || []).filter((sub) => sub.classId === classId).map((sub) => ({ value: sub.id, label: sub.name }));
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
        <div className={s.loadingHead}>
          <p className={cn('ao-overline', s.loadingOverline)}>{t('adm.rewards.loadingOverline')}</p>
          <h3 className={cn('ao-h3', s.titleH3)}>{t('adm.rewards.loadingTitle')}</h3>
        </div>
        <div className={s.skelCol}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn('ao-ph', s.skelRow)} />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
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
      <nav className={s.breadcrumb}>
        <button
          className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.crumbBtn)}
          onClick={() => navigate('/admin')}
        >
          {t('adm.rewards.breadcrumbAdmin')}
        </button>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <button
          className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.crumbBtn)}
          onClick={() => navigate('/admin/homebrew')}
        >
          {t('adm.rewards.breadcrumbClasses')}
        </button>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <span className={s.crumbCurrent}>{className}</span>
        <Rune kind="chev-r" size={10} color="var(--ink-ghost)" />
        <span className={s.crumbActive}>
          {t('adm.rewards.breadcrumbLevelRewards')}
        </span>
      </nav>

      {/* ── Header row ── */}
      <div className={s.header}>

        {/* Left: Sigil + titles */}
        <div className={s.headLeft}>
          <Sigil size={52} glyph="sigil-3" />
          <div>
            <p className={cn('ao-overline', s.headOverline)}>
              {t('adm.rewards.classLabel', { name: className })}
            </p>
            <h3 className={cn('ao-h3', s.headTitle)}>
              {t('adm.rewards.headerTitle', { name: className })}
            </h3>
            <p className={cn('ao-italic', s.headSub)}>
              {t('adm.rewards.headerSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: legend */}
        <div className={s.legend}>
          <span className={s.flagChoice}>
            <Rune kind="sword" size={11} color="var(--gold-pale)" /> {t('adm.rewards.chooseOne')}
          </span>
          <span className={s.flagAuto}>
            <Rune kind="diamond-fill" size={9} color="var(--arcane)" /> {t('adm.rewards.autoGranted')}
          </span>
        </div>
      </div>

      {/* ── Top buttons row ── */}
      <div className={s.topButtons}>
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
      <OrdoPanel frame padding={0} className={s.panelScroll}>
        {LEVELS.map((level) => {
          const levelRewards = rewardsByLevel[level] || [];
          const hasRewards = levelRewards.length > 0;

          return (
            <div
              key={level}
              className={cn('ao-rgrid', s.levelRow, !hasRewards && s.empty, level === 20 && s.last)}
            >
              {/* ─ Level marker column ─ */}
              <div className={s.levelMarker}>
                <span className={cn('ao-overline', s.levelAbbr)}>
                  {t('adm.rewards.levelAbbr')}
                </span>
                <span className={cn(s.levelNum, hasRewards && s.active)}>
                  {ROMAN_NUMERALS[level]}
                </span>
              </div>

              {/* ─ Rewards column ─ */}
              <div className={s.rewardsCol}>
                {hasRewards ? (
                  levelRewards.map((reward) => (
                    <div key={reward.id} className={s.rewardItem}>
                      <RewardChip reward={reward} />
                      <ChoiceFlag isChoice={reward.isChoice} />
                      {/* Delete trigger */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className={cn('ao-iconbtn', s.removeBtn)} title={t('adm.rewards.remove')}>
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
                  <div className={s.emptyLevel}>
                    <span className={cn('ao-italic', s.emptyLevelText)}>
                      {t('adm.rewards.emptyLevel')}
                    </span>
                  </div>
                )}
              </div>

              {/* ─ Add column ─ */}
              <div className={s.addCol}>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => {
                    setFormLevel(String(level));
                    setDialogOpen(true);
                  }}
                >
                  <Rune kind="plus" size={12} color="var(--gold)" />
                  <span className={s.addLabel}>{t('adm.rewards.addReward')}</span>
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
          <div className={s.dialogCol}>
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
