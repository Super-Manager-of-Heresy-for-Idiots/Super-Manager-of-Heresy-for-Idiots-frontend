import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { RouteFallback } from './RouteFallback';

/**
 * Suspense boundary for route groups rendered outside AppLayout
 * (AppLayout already wraps its own Outlet in Suspense).
 */
export function SuspenseLayout() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}
