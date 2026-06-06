import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS } from '@/types';
import { useT } from '@/i18n/I18nContext';

interface SelectOption {
  value: string;
  label: string;
}

interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'slot-select' | 'select';
  required?: boolean;
  options?: SelectOption[];
}

interface CrudFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  isSubmitting: boolean;
  title: string;
  fields: FieldDef[];
  defaultValues?: Record<string, string>;
}

export function CrudFormModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  fields,
  defaultValues,
}: CrudFormModalProps) {
  const t = useT();
  const schemaShape: Record<string, z.ZodString> = {};
  fields.forEach((f) => {
    let schema = z.string();
    if (f.required !== false) {
      schema = schema.min(1, t('cmp2.crudForm.required', { label: f.label }));
    }
    if (f.type === 'text') {
      schema = schema.max(50);
    }
    schemaShape[f.name] = schema;
  });

  const schema = z.object(schemaShape);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues || {});
    }
  }, [open, defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea {...register(field.name)} placeholder={t('cmp2.crudForm.enterField', { field: field.label.toLowerCase() })} />
              ) : field.type === 'slot-select' ? (
                <Select
                  value={watch(field.name) || ''}
                  onValueChange={(v) => setValue(field.name, v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cmp2.crudForm.selectSlot')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {EQUIPMENT_SLOT_LABELS[slot]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'select' && field.options ? (
                <Select
                  value={watch(field.name) || ''}
                  onValueChange={(v) => setValue(field.name, v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('cmp2.crudForm.selectField', { field: field.label.toLowerCase() })} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...register(field.name)} placeholder={t('cmp2.crudForm.enterField', { field: field.label.toLowerCase() })} />
              )}
              {errors[field.name] && (
                <p className="text-sm text-dnd-red">{errors[field.name]?.message as string}</p>
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
