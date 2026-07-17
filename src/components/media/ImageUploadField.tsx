import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Placeholder } from '@/components/ordo/Placeholder';
import { mediaApi, type MediaOwnerType } from '@/api/media.api';
import s from './ImageUploadField.module.css';

/** Client-side allowlist — mirrors the backend (image/png, image/jpeg, image/webp). */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** Hard client cap (backend enforces per-owner-type limits; this is a friendly early check). */
const MAX_BYTES = 10 * 1024 * 1024;

export interface ImageUploadFieldProps {
  /** Owner type — picks the backend slot + permission policy. */
  ownerType: MediaOwnerType;
  /** Owner id — the entity the image belongs to. */
  ownerId: string;
  /** Current image URL (media proxy path or legacy URL); null/undefined shows the placeholder. */
  value?: string | null;
  /** When true, show upload/replace/delete controls. When false, render the image read-only. */
  canEdit?: boolean;
  /** Notified with the new proxy URL after upload, or null after delete. */
  onChange?: (url: string | null) => void;
  /** Placeholder content shown when there is no image. */
  placeholder?: ReactNode;
  /** Wrapper class. */
  className?: string;
  /** Preview box class — the caller controls dimensions (e.g. 140×180 portrait vs 16:9 cover). */
  previewClassName?: string;
  /** Button labels (Russian defaults; pass translated strings from callers that use i18n). */
  uploadLabel?: string;
  replaceLabel?: string;
  removeLabel?: string;
  /** Alt text for the preview image. */
  alt?: string;
}

/**
 * ImageUploadField — переиспользуемое поле загрузки картинки для любого владельца media-слота.
 * Показывает превью (или заглушку), а для владельца/редактора — кнопки загрузки/замены/удаления,
 * индикатор процесса и текст ошибки от backend. Стили — только через CSS Modules / .ao-*,
 * без inline-стилей (см. конвенцию репозитория).
 */
export function ImageUploadField({
  ownerType,
  ownerId,
  value,
  canEdit = false,
  onChange,
  placeholder,
  className,
  previewClassName,
  uploadLabel = 'Загрузить изображение',
  replaceLabel = 'Заменить изображение',
  removeLabel = 'Удалить',
  alt = 'Изображение',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input so selecting the same file again re-triggers change.
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Неподдерживаемый формат. Разрешены PNG, JPEG и WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Файл слишком большой (максимум 10 МБ).');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await mediaApi.upload(ownerType, ownerId, file);
      onChange?.(res.data?.url ?? null);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить изображение.'));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      await mediaApi.remove(ownerType, ownerId);
      onChange?.(null);
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить изображение.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(s.wrap, className)}>
      {value ? (
        <img src={value} alt={alt} className={cn(s.preview, previewClassName)} />
      ) : (
        <Placeholder className={cn(s.preview, previewClassName)}>{placeholder}</Placeholder>
      )}

      {canEdit && (
        <div className={s.controls}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={onFileSelected}
            className={s.hidden}
            disabled={busy}
          />
          <button
            type="button"
            className="ao-btn ao-btn--block"
            onClick={pickFile}
            disabled={busy}
          >
            {value ? replaceLabel : uploadLabel}
          </button>
          {value && (
            <button
              type="button"
              className="ao-btn ao-btn--ghost ao-btn--block"
              onClick={onRemove}
              disabled={busy}
            >
              {removeLabel}
            </button>
          )}
          {busy && <span className={s.busy}>Загрузка…</span>}
          {error && <span className={s.error}>{error}</span>}
        </div>
      )}
    </div>
  );
}

/** Pulls a human-readable message out of an axios error (backend ApiResponse.message). */
function extractError(err: unknown, fallback: string): string {
  const maybe = err as { response?: { data?: { message?: string } }; message?: string };
  return maybe?.response?.data?.message || maybe?.message || fallback;
}
