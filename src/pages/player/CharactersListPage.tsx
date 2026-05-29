import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacters, useDeleteCharacter } from '@/hooks/useCharacters';
import { Rune, Sigil, OrdoPanel, OrdoDivider, OrdoChip, PanelHeader } from '@/components/ordo';
import type { CharacterResponse } from '@/types';

function StatusGlyph({ hp, hpMax }: { hp?: number; hpMax?: number }) {
  if (!hp || !hpMax) return null;
  const ratio = hp / hpMax;
  if (ratio <= 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--burgundy)' }}><Rune kind="cross-pat" size={10} color="var(--burgundy)" /><span className="ao-overline" style={{ color: 'inherit' }}>Fallen</span></span>;
  if (ratio < 0.3) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ember)' }}><Rune kind="flame" size={10} color="var(--ember)" /><span className="ao-overline" style={{ color: 'inherit' }}>Wounded</span></span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold)' }}><Rune kind="cir-dot" size={10} color="var(--gold)" /><span className="ao-overline" style={{ color: 'inherit' }}>Vigilant</span></span>;
}

function CharacterRosterCard({ character, onDelete }: { character: CharacterResponse; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const classDisplay = character.classLevels?.map(cl => cl.className).join(' / ') || 'Unknown';

  return (
    <div className="ao-panel ao-frame" style={{ padding: 0, position: 'relative' }}>
      <span className="ao-frame-c" />
      {/* Card head */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--hairline)' }}>
        <span className="ao-codex">No {character.id.slice(0, 8).toUpperCase()}</span>
        <div style={{ flex: 1 }} />
        <StatusGlyph hp={100} hpMax={100} />
      </div>

      {/* Portrait + name */}
      <div style={{ padding: 16, display: 'flex', gap: 14 }}>
        <div className="ao-ph" style={{ width: 88, height: 110, flexShrink: 0, border: '1px solid var(--rule)' }}>portrait</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ao-h6" style={{ fontSize: 17, lineHeight: 1.15 }}>{character.name}</div>
          <div className="ao-italic" style={{ fontSize: 13, marginTop: 4, color: 'var(--ink-quiet)' }}>{classDisplay}</div>
          <div className="ao-codex" style={{ marginTop: 6 }}>{character.race?.name}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="ao-overline">Level</span>
            <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 22, fontFamily: 'var(--font-serif)' }}>{character.totalLevel}</span>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
            <span className="ao-overline">To Ascend</span>
            <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>XP {character.experience || 0}</span>
          </div>
          <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--gold" style={{ width: `${Math.min(100, (character.experience || 0) % 100)}%` }} /></div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--rule)' }}>
        <button className="ao-btn ao-btn--ghost" style={{ flex: 1, border: 0, padding: '12px 0' }} onClick={() => navigate(`/characters/${character.id}`)}>
          <Rune kind="book" size={12} /> Open Folio
        </button>
        <div style={{ width: 1, background: 'var(--rule)' }} />
        <button className="ao-btn ao-btn--ghost" style={{ width: 48, border: 0, padding: '12px 0' }} onClick={() => onDelete(character.id)}>
          <Rune kind="x" size={12} color="#d8896a" />
        </button>
      </div>
    </div>
  );
}

export default function CharactersListPage() {
  const navigate = useNavigate();
  const { data: characters, isLoading, error, refetch } = useCharacters();
  const deleteMutation = useDeleteCharacter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 56, textAlign: 'center' }}>
        <Sigil size={64} glyph="sigil-3" color="var(--ink-quiet)" />
        <div className="ao-h6" style={{ marginTop: 14, color: 'var(--ink-quiet)' }}>Failed to load the roster</div>
        <button className="ao-btn" style={{ marginTop: 16 }} onClick={() => refetch()}>
          <Rune kind="scroll" size={11} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Heading band */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div className="ao-overline">Thy sworn companions</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>Codex of Souls</div>
          <div className="ao-italic" style={{ marginTop: 4, color: 'var(--ink-quiet)' }}>
            {characters ? `${characters.length} soul${characters.length !== 1 ? 's' : ''} recorded under thy seal.` : 'Loading the rolls...'}
          </div>
        </div>
        <button className="ao-btn ao-btn--primary" onClick={() => navigate('/characters/new')}>
          <Rune kind="plus" size={11} /> Inscribe New
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-panel" style={{ height: 280, opacity: 0.3 }} />
          ))}
        </div>
      ) : !characters || characters.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '56px 40px' }}>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <div style={{ position: 'absolute', inset: -22, background: 'radial-gradient(circle, rgba(176,141,78,0.06), transparent 70%)' }} />
            <Sigil size={84} glyph="sigil-3" color="var(--ink-quiet)" />
          </div>
          <div className="ao-codex" style={{ marginTop: 16, color: 'var(--ink-faint)' }}>— THE ROSTER STANDS EMPTY —</div>
          <div className="ao-h4" style={{ marginTop: 10, color: 'var(--ink)' }}>No souls yet recorded</div>
          <p className="ao-italic" style={{ marginTop: 8, fontSize: 15, color: 'var(--ink-quiet)', maxWidth: 460 }}>
            The Codex awaits its first entry. Inscribe a name, and the chronicle begins.
          </p>
          <div style={{ marginTop: 22 }}>
            <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={() => navigate('/characters/new')}>
              <Rune kind="plus" size={11} /> Inscribe Your First Soul
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {characters.map((character) => (
            <CharacterRosterCard key={character.id} character={character} onDelete={(id) => setDeleteId(id)} />
          ))}
        </div>
      )}

      <OrdoDivider glyph="diamond-fill">Vault foot</OrdoDivider>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', color: 'var(--ink-faint)' }}>
        <span className="ao-codex">Archive sealed</span>
        <span className="ao-codex">Page I</span>
      </div>

      {/* Delete confirmation overlay */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setDeleteId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)' }} />
          <div style={{ position: 'relative' }} className="ao-rise">
            <OrdoPanel frame padding={28} style={{ width: 420 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Sigil size={48} glyph="flame" color="var(--ember)" />
                <div className="ao-codex" style={{ marginTop: 10, color: '#d8896a' }}>— RITE OF UNMAKING —</div>
                <div className="ao-h5" style={{ marginTop: 8 }}>Unmake this Soul?</div>
              </div>
              <OrdoDivider glyph="diamond-fill" color="var(--ember)" />
              <p className="ao-italic" style={{ marginTop: 12, fontSize: 14, color: 'var(--ink)', textAlign: 'center' }}>
                This action cannot be undone. The soul and all their records shall be expunged from the Archive.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'space-between' }}>
                <button className="ao-btn ao-btn--ghost" onClick={() => setDeleteId(null)}>Defer</button>
                <button className="ao-btn ao-btn--danger ao-btn--lg" onClick={handleDelete}>
                  <Rune kind="flame" size={10} /> Unmake
                </button>
              </div>
            </OrdoPanel>
          </div>
        </div>
      )}
    </div>
  );
}
