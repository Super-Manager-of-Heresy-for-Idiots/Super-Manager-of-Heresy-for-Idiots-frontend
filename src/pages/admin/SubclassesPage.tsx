import { useState } from 'react';
import { Rune, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
import { PanelHeader } from '@/components/ordo';
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
  useSubclasses,
  useCreateSubclass,
  useUpdateSubclass,
  useDeleteSubclass,
  useCharacterClasses,
} from '@/hooks/useAdmin';
import type { SubclassResponse } from '@/types';

export default function SubclassesPage() {
  const { data, isLoading, error, refetch } = useSubclasses();
  const { data: classes } = useCharacterClasses();
  const createMutation = useCreateSubclass();
  const updateMutation = useUpdateSubclass();
  const deleteMutation = useDeleteSubclass();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubclassResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormClassId('');
    setFormDescription('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: SubclassResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormClassId(item.classId);
    setFormDescription(item.description || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      classId: formClassId,
      description: formDescription || undefined,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const filtered = (data || []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="ao-overline">Reference · oaths</div>
            <div className="ao-h3" style={{ marginTop: 4 }}>Tome of Subclasses</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The tome could not be consulted.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="ao-overline">Reference · oaths</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>Tome of Subclasses</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <OrdoChip tone="ember" glyph="lock">Inquisitor privileges</OrdoChip>
          <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
            <Rune kind="plus" size={11} /> New Entry
          </button>
        </div>
      </div>

      {/* Table */}
      <OrdoPanel frame padding={0}>
        <PanelHeader
          title="Tome of Subclasses"
          sub={`${data?.length || 0} entries`}
          glyph="hex"
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="ao-input"
                placeholder="Search subclasses…"
                style={{ width: 220, padding: '6px 12px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />

        <table className="ao-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Description</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td style={{ color: 'var(--ink-bright)' }}>{s.name}</td>
                <td>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    background: 'rgba(154,126,192,0.08)',
                    border: '1px solid rgba(154,126,192,0.3)',
                    borderLeft: '2px solid #9a7ec0',
                    fontFamily: 'var(--font-display)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    color: '#9a7ec0',
                    textTransform: 'uppercase',
                  }}>
                    <Rune kind="hex" size={10} color="#9a7ec0" />
                    {s.className || '—'}
                  </span>
                </td>
                <td className="ao-italic" style={{ color: 'var(--ink-quiet)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.description || '—'}
                </td>
                <td>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button className="ao-iconbtn" style={{ width: 26, height: 26 }} onClick={() => handleEdit(s)} title="Edit">
                      <Rune kind="scroll" size={11} />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="ao-iconbtn" style={{ width: 26, height: 26, color: '#d8896a' }} title="Delete">
                          <Rune kind="x" size={11} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unmake this Subclass?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This rite cannot be undone. The subclass shall be purged from the tome.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Withhold</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)}>Unmake</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <span className="ao-italic" style={{ color: 'var(--ink-faint)' }}>No subclasses inscribed</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--rule)', background: 'var(--abyss)' }}>
          <span className="ao-codex">{filtered.length} of {data?.length || 0} entries</span>
          <span className="ao-codex">sorted by · class</span>
        </div>
      </OrdoPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Amend Subclass' : 'Inscribe New Subclass'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Subclass name"
                style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}
              />
            </OrdoField>
            <OrdoField label="Parent Class" required>
              <Select value={formClassId} onValueChange={setFormClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(classes || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>
            <OrdoField label="Description">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the oath or path"
                rows={3}
                style={{ resize: 'vertical', fontSize: 14 }}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || !formClassId || createMutation.isPending || updateMutation.isPending}
            >
              <Rune kind="diamond-fill" size={9} /> {editing ? 'Amend' : 'Inscribe'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
