import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip, Sigil, PanelHeader } from '@/components/ordo';
import { useCreateHomebrew } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './CreateDoctrinePage.module.css';

export default function CreateDoctrinePage() {
  const t = useT();
  const navigate = useNavigate();
  const createMutation = useCreateHomebrew();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagText, setTagText] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const isValid = title.trim().length > 0;

  const normalizeTag = (raw: string) =>
    raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleAddTag = () => {
    const norm = normalizeTag(tagText);
    if (norm && !tags.includes(norm) && tags.length < 10) {
      setTags([...tags, norm]);
    }
    setTagText('');
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: (res) => {
          const pkg = res.data;
          navigate(`/gm/homebrew/${pkg?.id}/edit`);
        },
      }
    );
  };

  return (
    <div className={s.page}>

      {/* ── Header area ──────────────────────────────── */}
      <div className={s.header}>
        <div className={s.sigilWrap}>
          <Sigil size={56} glyph="sigil-2" />
        </div>
        <div className={cn('ao-codex', s.riteLabel)}>
          {t('hb.create.riteLabel')}
        </div>
        <div className={cn('ao-h2', s.bigTitle)}>
          {t('hb.create.title')}
        </div>
        <p className={cn('ao-italic', s.subtitle)}>
          {t('hb.create.subtitle')}
        </p>
      </div>

      {/* ── Form panel ───────────────────────────────── */}
      <OrdoPanel padding={0} frame>
        <PanelHeader title={t('hb.create.panelTitle')} sub={t('hb.create.panelSub')} glyph="scroll" />

        <div className={s.formBody}>

          {/* ── Title field ─────────────────────────── */}
          <div>
            <div className={s.fieldHead}>
              <label className="ao-label">
                {t('hb.create.titleLabel')} <span className={s.reqMark}>{t('hb.create.required')}</span>
              </label>
              <span className={cn('ao-codex', s.charCount)}>
                {title.length} / 120
              </span>
            </div>
            <input
              className={cn('ao-input', s.titleInput)}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder={t('hb.create.titlePlaceholder')}
            />
          </div>

          {/* ── Description field ───────────────────── */}
          <div>
            <div className={s.fieldHead}>
              <label className="ao-label">{t('hb.create.descriptionLabel')}</label>
              <span className={cn('ao-codex', s.charCount)}>
                {description.length} / 2000
              </span>
            </div>
            <textarea
              className={cn('ao-input', s.descInput)}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder={t('hb.create.descriptionPlaceholder')}
            />
            <p className={cn('ao-italic', s.descHint)}>
              {t('hb.create.descriptionHint')}
            </p>
          </div>

          {/* ── Tags (Classification Marks) ─────────── */}
          <div>
            <div className={s.fieldHead}>
              <label className="ao-label">{t('hb.create.classificationLabel')}</label>
              <span className={cn('ao-codex', s.charCount)}>
                {tags.length} / 10 {t('hb.create.classificationHint')}
              </span>
            </div>

            {/* Tag container */}
            <div className={s.tagBox}>
              {tags.map((tag, i) => (
                <span key={i} className={s.tag}>
                  <span className={s.tagDiamond} />
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    className={s.tagRemove}
                  >
                    <Rune kind="x" size={10} color="var(--ink-faint)" />
                  </button>
                </span>
              ))}

              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t('hb.create.tagPlaceholder')}
                className={s.tagInput}
              />
            </div>

            {/* Normalization preview */}
            {tagText && (
              <p className={s.tagPreview}>
                {t('hb.create.tagSealedAs')}{' '}
                <span className={s.mono}>{normalizeTag(tagText)}</span>
              </p>
            )}

            {/* Examples */}
            <p className={cn('ao-italic', s.examples)}>
              {t('hb.create.examples')}{' '}
              <span className={s.mono}>dark-fantasy</span> &middot;{' '}
              <span className={s.mono}>necromancy</span> &middot;{' '}
              <span className={s.mono}>imperial</span>
            </p>
          </div>

          {/* ── Validation strip ────────────────────── */}
          <div className={cn(s.validStrip, isValid && s.valid)}>
            <Rune
              kind={isValid ? 'check' : 'minus'}
              size={16}
              color={isValid ? 'var(--gold)' : 'var(--ember)'}
            />
            <div className={s.validGrow}>
              <p className={s.validTitle}>
                {isValid ? t('hb.create.validTitle') : t('hb.create.invalidTitle')}
              </p>
              <p className={cn('ao-italic', s.validBody)}>
                {isValid
                  ? t('hb.create.validBody')
                  : t('hb.create.invalidBody')}
              </p>
            </div>
            <OrdoChip tone="gold">{t('hb.create.draft')}</OrdoChip>
          </div>

          {/* ── Bottom actions ──────────────────────── */}
          <div className={s.actions}>
            <span className={cn('ao-codex', s.actionsNote)}>
              {t('hb.create.charter')}
            </span>
            <div className={s.actionsBtns}>
              <button
                className="ao-btn ao-btn--ghost"
                onClick={() => navigate('/gm/homebrew/my')}
              >
                {t('hb.create.cancel')}
              </button>
              <button
                className="ao-btn ao-btn--primary ao-btn--lg"
                onClick={handleSubmit}
                disabled={!isValid || createMutation.isPending}
              >
                <Rune kind="diamond-fill" size={9} />
                {createMutation.isPending ? t('hb.create.registering') : t('hb.create.registerDraft')}
              </button>
            </div>
          </div>

        </div>
      </OrdoPanel>
    </div>
  );
}
