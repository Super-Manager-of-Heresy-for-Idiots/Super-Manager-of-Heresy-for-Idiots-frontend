import { useEffect, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { router } from '@/router';
import { LoadingRite } from './LoadingRite';

/* Полноэкранный обряд загрузки, который появляется, только если бэкенд
   отвечает дольше SHOW_DELAY. Фазы (calm → anomaly → collapse) нарастают
   внутри самого LoadingRite по времени ожидания. */
const SHOW_DELAY = 700; // мс: не мигать оверлеем на быстрых ответах
const FADE_MS = 420; // мс: длительность .fadeOut в LoadingRite.module.css

export function GlobalLoadingRite() {
  const fetching = useIsFetching();
  const [show, setShow] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const showTimer = useRef<number | undefined>(undefined);
  const fadeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (fetching > 0) {
      if (fadeTimer.current !== undefined) {
        window.clearTimeout(fadeTimer.current);
        fadeTimer.current = undefined;
      }
      setFadingOut(false);
      if (!show && showTimer.current === undefined) {
        showTimer.current = window.setTimeout(() => {
          showTimer.current = undefined;
          setShow(true);
        }, SHOW_DELAY);
      }
    } else {
      if (showTimer.current !== undefined) {
        window.clearTimeout(showTimer.current);
        showTimer.current = undefined;
      }
      if (show && fadeTimer.current === undefined) {
        setFadingOut(true);
        fadeTimer.current = window.setTimeout(() => {
          fadeTimer.current = undefined;
          setShow(false);
          setFadingOut(false);
        }, FADE_MS);
      }
    }
  }, [fetching, show]);

  useEffect(
    () => () => {
      if (showTimer.current !== undefined) window.clearTimeout(showTimer.current);
      if (fadeTimer.current !== undefined) window.clearTimeout(fadeTimer.current);
    },
    [],
  );

  if (!show) return null;
  return (
    <LoadingRite
      variant="fixed"
      fadingOut={fadingOut}
      onRedirect={() => router.navigate('/campaigns')}
    />
  );
}

export default GlobalLoadingRite;
