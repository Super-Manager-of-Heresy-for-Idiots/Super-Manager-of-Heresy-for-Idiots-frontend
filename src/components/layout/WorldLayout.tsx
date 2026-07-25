import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SectionTabs } from '@/components/campaigns';
import { WORLD_TABS } from '@/config/campaignSections';
import { PageFallback } from './PageFallback';

/**
 * Shell for `/campaigns/:campaignId/world/*`.
 *
 * The world is one subject area, so the GM tools that used to sit as separate
 * top-level tabs (locations, maps, world management) are sub-tabs here.
 * Players only ever see the index view — {@link SectionTabs} hides a strip that
 * would hold a single entry.
 */
export function WorldLayout() {
  return (
    <div>
      <SectionTabs sections={WORLD_TABS} labelKey="camp.world.tabs.label" />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
