import { useEffect, useMemo, useState } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Copy, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import s from './RouteErrorBoundary.module.css';

// Признаки транзиентного сбоя загрузки чанка (динамический import упал/404 после редеплоя).
const CHUNK_RE =
  /dynamically imported module|failed to fetch dynamically|importing a module script failed|chunkloaderror|error loading dynamically imported|loading chunk \d+ failed/i;

const RELOAD_KEY = 'route-error:lastReload';

interface ErrLike {
  name?: string;
  message?: string;
  stack?: string;
}

function asErr(error: unknown): ErrLike {
  if (error && typeof error === 'object') {
    return error as ErrLike;
  }
  return { message: String(error) };
}

function isChunkError(error: unknown): boolean {
  const e = asErr(error);
  return CHUNK_RE.test(`${e.name ?? ''} ${e.message ?? ''}`);
}

/** Плоский текст ошибки для копирования: контекст + имя/сообщение + стек. */
function describe(error: unknown): string {
  const e = asErr(error);
  const lines = [
    `URL: ${window.location.href}`,
    `Time: ${new Date().toISOString()}`,
    `UA: ${navigator.userAgent}`,
    `Name: ${e.name ?? 'Error'}`,
    `Message: ${e.message ?? String(error)}`,
  ];
  if (e.stack) {
    lines.push('', e.stack);
  }
  return lines.join('\n');
}

/**
 * Корневой errorElement роутера: вместо сырого «Unexpected Application Error!» показывает
 * аккуратный экран. Транзиентный сбой чанка → тихая одноразовая перезагрузка (троттлинг 10 с).
 * Прочие ошибки → карточка с деталями и кнопкой «Скопировать» (для отчёта).
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const chunk = useMemo(() => isChunkError(error), [error]);
  const details = useMemo(() => describe(error), [error]);

  // Сбой загрузки чанка обычно значит устаревший index.html после редеплоя — тянем свежий
  // перезагрузкой (не чаще раза в 10 с, чтобы не зациклиться при реальном 404/оффлайне).
  useEffect(() => {
    if (!chunk) {
      return;
    }
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last > 10_000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
  }, [chunk]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер недоступен (нет https/разрешения) — выделяем текст, чтобы скопировать вручную.
      const pre = document.getElementById('route-error-details');
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  if (chunk) {
    // Пока идёт перезагрузка — показываем спокойный статус, а не алярм.
    return (
      <div className={s.wrap}>
        <div className={s.card}>
          <div className={cn('ao-row ao-gap-8', s.head)}>
            <RefreshCw className={cn('h-5 w-5', s.spin)} />
            <h1 className="ao-h5 m-0">Обновляем приложение…</h1>
          </div>
          <p className={s.hint}>Загрузка свежей версии. Если ничего не произошло — обновите страницу.</p>
          <div className="ao-row ao-gap-8">
            <button type="button" className="ao-btn ao-btn--primary" onClick={() => window.location.reload()}>
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div className={cn('ao-row ao-gap-8', s.head)}>
          <AlertTriangle className={cn('h-5 w-5', s.warn)} />
          <h1 className="ao-h5 m-0">Произошла ошибка интерфейса</h1>
        </div>
        <p className={s.hint}>
          Скопируйте детали кнопкой ниже и приложите к отчёту об ошибке — так починим быстрее.
        </p>

        <pre id="route-error-details" className={s.details}>{details}</pre>

        <div className="ao-row ao-wrap ao-gap-8">
          <button type="button" className="ao-btn ao-btn--primary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Скопировано' : 'Скопировать детали'}
          </button>
          <button type="button" className="ao-btn ao-btn--ghost" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Перезагрузить
          </button>
          <button type="button" className="ao-btn ao-btn--ghost" onClick={() => navigate('/campaigns')}>
            <Home className="h-4 w-4" /> На главную
          </button>
        </div>
      </div>
    </div>
  );
}
