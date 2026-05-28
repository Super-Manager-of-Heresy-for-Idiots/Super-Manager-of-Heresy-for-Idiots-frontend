import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Button, Input, Label, Textarea, Select } from '@/components/ao';
import { EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS } from '@/types';

interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'slot-select' | 'select' | 'number';
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
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
  const schemaShape: Record<string, z.ZodString> = {};
  fields.forEach((f) => {
    let schema = z.string();
    if (f.required !== false) {
      schema = schema.min(1, `${f.label} is required`);
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
    <Dialog open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                {...register(field.name)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                error={errors[field.name]?.message as string}
              />
            ) : field.type === 'number' ? (
              <Input
                type="number"
                min={field.min}
                max={field.max}
                {...register(field.name)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                error={errors[field.name]?.message as string}
              />
            ) : field.type === 'select' && field.options ? (
              <Select
                value={watch(field.name) || ''}
                onChange={(e) =>
                  setValue(field.name, e.target.value, { shouldValidate: true })
                }
                error={errors[field.name]?.message as string}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            ) : field.type === 'slot-select' ? (
              <Select
                value={watch(field.name) || ''}
                onChange={(e) =>
                  setValue(field.name, e.target.value, { shouldValidate: true })
                }
                error={errors[field.name]?.message as string}
              >
                <option value="">Select a slot</option>
                {EQUIPMENT_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {EQUIPMENT_SLOT_LABELS[slot]}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                {...register(field.name)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                error={errors[field.name]?.message as string}
              />
            )}
          </div>
        ))}

        <div className="ao-dialog__actions">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
