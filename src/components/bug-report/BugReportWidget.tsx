import { useEffect, useState } from 'react';
import { Bug, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bugReportsApi } from '@/api/bug-reports.api';
import {
  buildBugReportPayload,
  clearBugReportSignal,
  subscribeBugReportSignal,
  type BugReportSignal,
} from '@/lib/bugReport';
import { useAuthStore } from '@/store/authStore';

export function BugReportWidget() {
  const [signal, setSignal] = useState<BugReportSignal | null>(null);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => subscribeBugReportSignal(setSignal), []);

  if (!signal) {
    return null;
  }

  const submit = async () => {
    setSubmitting(true);
    try {
      await bugReportsApi.create(buildBugReportPayload(description, signal, user));
      toast.success('Отчет об ошибке отправлен');
      setDescription('');
      setOpen(false);
      clearBugReportSignal();
    } catch {
      toast.error('Не удалось отправить отчет');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-11 gap-2 border border-[var(--rule-strong)] bg-[var(--burgundy-deep)] px-4 text-[var(--ink-bright)] shadow-[var(--shadow-high)] hover:bg-[var(--burgundy)]"
      >
        <Bug className="h-4 w-4" />
        Сообщить об ошибке
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[var(--rule)] bg-[var(--panel)] text-[var(--ink)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--ink-bright)]">Сообщить об ошибке</DialogTitle>
            <DialogDescription className="text-[var(--ink-quiet)]">
              {signal.title}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Опишите, что произошло. Можно оставить поле пустым."
              maxLength={4000}
              className="min-h-32 resize-y border-[var(--rule)] bg-[var(--stone)] text-[var(--ink-bright)] placeholder:text-[var(--ink-faint)]"
            />
            <div className="text-xs text-[var(--ink-faint)]">{description.length}/4000</div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="border-[var(--rule)]"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="gap-2 bg-[var(--gold)] text-[var(--void)] hover:bg-[var(--gold-pale)]"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
