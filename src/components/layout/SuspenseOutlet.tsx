import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageFallback } from './PageFallback';

/**
 * Pathless layout that provides a Suspense boundary for lazily-loaded routes
 * which render outside {@link AppLayout} (e.g. full-screen combat previews).
 */
export function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}
