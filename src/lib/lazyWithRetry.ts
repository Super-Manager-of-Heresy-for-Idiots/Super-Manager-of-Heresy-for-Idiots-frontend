import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

// Фабрика чанка в форме, которую ждёт React.lazy. `any` в пропах — как в сигнатуре самого React.lazy:
// это сохраняет конкретный тип компонента T (с его пропами) при выводе типов на месте вызова.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChunkFactory<T extends ComponentType<any>> = () => Promise<{ default: T }>;

/**
 * Обёртка над React.lazy: при сбое динамического import() повторяет попытку несколько раз с
 * нарастающей паузой, прежде чем пробросить ошибку в errorElement. Лечит транзиентные сбои
 * загрузки чанков (CDN-блип, HTTP/2 reset, промежуточный кэш), из-за которых интерфейс мигал
 * ошибкой «Unexpected Application Error!» и перезагружался. 404 хешированного чанка после
 * редеплоя ретраем не лечится — им займётся errorElement (перезагрузка за свежим index.html).
 * @param factory загрузчик чанка (тот же, что передавали в lazy)
 * @param retries число повторов после первой неудачи (по умолчанию 3)
 * @param baseDelayMs базовая пауза между повторами, растёт линейно (по умолчанию 350 мс)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: ChunkFactory<T>,
  retries = 3,
  baseDelayMs = 350,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await factory();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, baseDelayMs * (attempt + 1)));
      }
    }
    throw lastError;
  });
}
