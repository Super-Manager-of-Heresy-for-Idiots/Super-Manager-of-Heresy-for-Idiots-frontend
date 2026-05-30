import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip, Sigil, PanelHeader } from '@/components/ordo';
import { useCreateHomebrew } from '@/hooks/useHomebrew';

export default function CreateDoctrinePage() {
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
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header area ──────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingTop: 12 }}>
        <div style={{ display: 'inline-block' }}>
          <Sigil size={56} glyph="sigil-2" />
        </div>
        <div
          className="ao-codex"
          style={{ marginTop: 16, color: 'var(--gold-pale)', fontSize: 12 }}
        >
          &mdash; RITE OF REGISTRATION &mdash;
        </div>
        <div className="ao-h2" style={{ fontSize: 40, marginTop: 8 }}>
          A New Doctrine
        </div>
        <p
          className="ao-italic"
          style={{ fontSize: 14, marginTop: 10, color: 'var(--ink-quiet)', maxWidth: 500, margin: '10px auto 0' }}
        >
          Inscribe its outer form. Content shall be added once it is laid into the Workshop.
        </p>
      </div>

      {/* ── Form panel ───────────────────────────────── */}
      <OrdoPanel padding={0} frame>
        <PanelHeader title="Outer Inscription" sub="metadata &middot; tags &middot; description" glyph="scroll" />

        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Title field ─────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="ao-label">
                Title <span style={{ color: 'var(--ember)' }}>&middot; required</span>
              </label>
              <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {title.length} / 120
              </span>
            </div>
            <input
              className="ao-input"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="Enter doctrine title..."
              style={{ fontFamily: 'var(--font-heading)', fontSize: 18, width: '100%' }}
            />
          </div>

          {/* ── Description field ───────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="ao-label">Description</label>
              <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {description.length} / 2000
              </span>
            </div>
            <textarea
              className="ao-input"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Describe the contents of your doctrine..."
              style={{ width: '100%', resize: 'vertical' }}
            />
            <p className="ao-italic" style={{ fontSize: 12, marginTop: 8, color: 'var(--ink-faint)' }}>
              The first 240 characters appear on the catalogue card.
            </p>
          </div>

          {/* ── Tags (Classification Marks) ─────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label className="ao-label">Classification Marks</label>
              <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {tags.length} / 10 &middot; lowercase, hyphenated
              </span>
            </div>

            {/* Tag container */}
            <div
              style={{
                padding: 10,
                background: 'var(--abyss)',
                border: '1px solid var(--rule)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(176,141,78,0.10)',
                    border: '1px solid rgba(176,141,78,0.30)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--gold)',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      background: 'var(--gold)',
                      transform: 'rotate(45deg)',
                      flexShrink: 0,
                    }}
                  />
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: 2,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--ink-faint)',
                    }}
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
                placeholder="add mark and press Enter"
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink)',
                  padding: '4px 6px',
                }}
              />
            </div>

            {/* Normalization preview */}
            {tagText && (
              <p style={{ fontSize: 12, marginTop: 8, color: 'var(--gold)' }}>
                will be sealed as &middot;{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{normalizeTag(tagText)}</span>
              </p>
            )}

            {/* Examples */}
            <p className="ao-italic" style={{ fontSize: 12, marginTop: 6, color: 'var(--ink-faint)' }}>
              Examples:{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>dark-fantasy</span> &middot;{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>necromancy</span> &middot;{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>imperial</span>
            </p>
          </div>

          {/* ── Validation strip ────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              border: `1px solid ${isValid ? 'rgba(176,141,78,0.30)' : 'rgba(179,70,26,0.30)'}`,
              borderLeft: `3px solid ${isValid ? 'var(--gold)' : 'var(--ember)'}`,
              background: isValid ? 'rgba(176,141,78,0.05)' : 'rgba(179,70,26,0.05)',
            }}
          >
            <Rune
              kind={isValid ? 'check' : 'minus'}
              size={16}
              color={isValid ? 'var(--gold)' : 'var(--ember)'}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: isValid ? 'var(--gold)' : 'var(--ember)' }}>
                {isValid ? 'Inscription valid' : 'Title required'}
              </p>
              <p className="ao-italic" style={{ fontSize: 12, marginTop: 2, color: 'var(--ink-faint)' }}>
                {isValid
                  ? 'Doctrine may now be registered as a draft. Content can be added afterwards.'
                  : 'Please provide a title to continue.'}
              </p>
            </div>
            <OrdoChip tone="gold">DRAFT</OrdoChip>
          </div>

          {/* ── Bottom actions ──────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              By registering, thou agree to the Archive Charter &mdash; Article XIV.
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="ao-btn ao-btn--ghost"
                onClick={() => navigate('/gm/homebrew/my')}
              >
                Cancel
              </button>
              <button
                className="ao-btn ao-btn--primary ao-btn--lg"
                onClick={handleSubmit}
                disabled={!isValid || createMutation.isPending}
              >
                <Rune kind="diamond-fill" size={9} />
                {createMutation.isPending ? 'Registering...' : 'Register Draft'}
              </button>
            </div>
          </div>

        </div>
      </OrdoPanel>
    </div>
  );
}
