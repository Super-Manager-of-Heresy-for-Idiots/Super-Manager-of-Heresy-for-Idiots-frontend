import { Suspense, type ReactNode } from 'react';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { SuspenseOutlet } from '@/components/layout/SuspenseOutlet';
import { PageFallback } from '@/components/layout/PageFallback';

// Auth pages — eager (first paint, no surrounding Suspense boundary)
const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
);

const AppLayout = lazyWithRetry(() => import('@/components/layout/AppLayout').then((m) => ({ default: m.AppLayout })));
const CampaignLayout = lazyWithRetry(() =>
  import('@/components/layout/CampaignLayout').then((m) => ({ default: m.CampaignLayout })),
);

const LoginPage = lazyWithRetry(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('@/pages/auth/RegisterPage'));

// Campaign pages
const CampaignListPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignListPage'));
const CampaignDashboardPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignDashboardPage'));
const DashboardSectionsView = lazyWithRetry(() => import('@/pages/gm/campaigns/dashboard/DashboardSectionsView'));
const DashboardRosterView = lazyWithRetry(() => import('@/pages/gm/campaigns/dashboard/DashboardRosterView'));
const DashboardBattleView = lazyWithRetry(() => import('@/pages/gm/campaigns/dashboard/DashboardBattleView'));
const CampaignMembersPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignMembersPage'));
const CampaignInvitePage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignInvitePage'));
const SharedStoragePage = lazyWithRetry(() => import('@/pages/gm/campaigns/SharedStoragePage'));
const SessionNotesPage = lazyWithRetry(() => import('@/pages/gm/campaigns/SessionNotesPage'));
const XPGrantPage = lazyWithRetry(() => import('@/pages/gm/campaigns/XPGrantPage'));
const ApplyEffectPage = lazyWithRetry(() => import('@/pages/gm/campaigns/ApplyEffectPage'));
const InventoryPage = lazyWithRetry(() => import('@/pages/gm/campaigns/InventoryPage'));
const CharacterManagementPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CharacterManagementPage'));
const CharacterCreationWizardPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CharacterCreationWizardPage'));
const AddCharacterPage = lazyWithRetry(() => import('@/pages/gm/campaigns/AddCharacterPage'));
const LevelUpWizardPage = lazyWithRetry(() => import('@/pages/gm/campaigns/LevelUpWizardPage'));
const CharacterRewardsPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CharacterRewardsPage'));
const FolioPage = lazyWithRetry(() => import('@/pages/gm/campaigns/FolioPage'));
const CharacterWalletPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CharacterWalletPage'));
const CharacterResourcesPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CharacterResourcesPage'));
const BalanceManagementPage = lazyWithRetry(() => import('@/pages/gm/campaigns/BalanceManagementPage'));
const MyCharactersPage = lazyWithRetry(() => import('@/pages/player/MyCharactersPage'));
const ItemCatalogPage = lazyWithRetry(() => import('@/pages/library/ItemCatalogPage'));
const TemplateWizardPage = lazyWithRetry(() => import('@/pages/player/TemplateWizardPage'));
const TemplateDetailPage = lazyWithRetry(() => import('@/pages/player/TemplateDetailPage'));
const AbilityCheckPage = lazyWithRetry(() =>
  import('@/pages/gm/campaigns/CharacterPlaceholderPages').then((m) => ({ default: m.AbilityCheckPage })),
);
const CharacterEditPage = lazyWithRetry(() =>
  import('@/pages/gm/campaigns/CharacterPlaceholderPages').then((m) => ({ default: m.CharacterEditPage })),
);
const CharacterHpPage = lazyWithRetry(() =>
  import('@/pages/gm/campaigns/CharacterPlaceholderPages').then((m) => ({ default: m.CharacterHpPage })),
);
const CharacterStatsPage = lazyWithRetry(() =>
  import('@/pages/gm/campaigns/CharacterPlaceholderPages').then((m) => ({ default: m.CharacterStatsPage })),
);
const NPCManagerPage = lazyWithRetry(() => import('@/pages/gm/campaigns/NPCManagerPage'));
const NPCDetailPage = lazyWithRetry(() => import('@/pages/gm/campaigns/NPCDetailPage'));
const QuestManagerPage = lazyWithRetry(() => import('@/pages/gm/campaigns/QuestManagerPage'));
const QuestDetailPage = lazyWithRetry(() => import('@/pages/gm/campaigns/QuestDetailPage'));
const LocationsPage = lazyWithRetry(() => import('@/pages/gm/campaigns/LocationsPage'));
const CampaignHomebrewPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignHomebrewPage'));

// Map feature (battle map / VTT) — isolated module under src/features/map
const CampaignMapListPage = lazyWithRetry(() => import('@/features/map/pages/CampaignMapListPage'));
const MapEditorPage = lazyWithRetry(() => import('@/features/map/pages/MapEditorPage'));
const MapSessionPage = lazyWithRetry(() => import('@/features/map/pages/MapSessionPage'));
const TacticalBattlePage = lazyWithRetry(() => import('@/features/map/tactical/TacticalBattlePage'));

// Social: friends + ephemeral messenger (isolated feature module).
const FriendsPage = lazyWithRetry(() => import('@/pages/social/FriendsPage'));
const MessengerPage = lazyWithRetry(() => import('@/features/messenger/pages/MessengerPage'));

// Combat / Loot prototype preview pages (screens only, no API wiring)
const CombatPreviewIndexPage = lazyWithRetry(() => import('@/pages/gm/combat/CombatPreviewIndexPage'));
const CombatTrackerGMPage = lazyWithRetry(() => import('@/pages/gm/combat/CombatTrackerGMPage'));
const CombatTrackerPlayerPage = lazyWithRetry(() => import('@/pages/gm/combat/CombatTrackerPlayerPage'));
const EncounterBuilderPage = lazyWithRetry(() => import('@/pages/gm/combat/EncounterBuilderPage'));
const EncounterListPage = lazyWithRetry(() => import('@/pages/gm/combat/EncounterListPage'));
const CombatSummaryPage = lazyWithRetry(() => import('@/pages/gm/combat/CombatSummaryPage'));
const DashboardTilesPage = lazyWithRetry(() => import('@/pages/gm/combat/DashboardTilesPage'));
const LootTableEditorPage = lazyWithRetry(() => import('@/pages/gm/combat/LootTableEditorPage'));
const LootGeneratorPage = lazyWithRetry(() => import('@/pages/gm/combat/LootGeneratorPage'));
const QuestDetailV2Page = lazyWithRetry(() => import('@/pages/gm/combat/QuestDetailV2Page'));
const NPCDetailV2Page = lazyWithRetry(() => import('@/pages/gm/combat/NPCDetailV2Page'));
const QuestListV2Page = lazyWithRetry(() => import('@/pages/gm/combat/QuestListV2Page'));
const NPCListV2Page = lazyWithRetry(() => import('@/pages/gm/combat/NPCListV2Page'));
const SystemPatternsPage = lazyWithRetry(() => import('@/pages/gm/combat/SystemPatternsPage'));
const CombatKitReferencePage = lazyWithRetry(() => import('@/pages/gm/combat/CombatKitReferencePage'));
const MobilePreviewPage = lazyWithRetry(() => import('@/pages/gm/combat/MobilePreviewPage'));

// Dev-only content-model viewer (hidden, no nav link) — Phase 3
const ContentClassViewerPage = lazyWithRetry(() => import('@/pages/dev/ContentClassViewerPage'));

// Homebrew pages
const MarketplacePage = lazyWithRetry(() => import('@/pages/gm/homebrew/MarketplacePage'));
const MarketplaceDetailPage = lazyWithRetry(() => import('@/pages/gm/homebrew/MarketplacePreviewPage'));
const MyDoctrinesPage = lazyWithRetry(() => import('@/pages/gm/homebrew/MyDoctrinesPage'));
const CreateDoctrinePage = lazyWithRetry(() => import('@/pages/gm/homebrew/CreateDoctrinePage'));
const EditDoctrinePage = lazyWithRetry(() => import('@/pages/gm/homebrew/EditDoctrinePage'));
const InstalledDoctrinesPage = lazyWithRetry(() => import('@/pages/gm/homebrew/InstalledDoctrinesPage'));
const HomebrewLibraryPage = lazyWithRetry(() => import('@/pages/gm/homebrew/HomebrewLibraryPage'));

// Campaign Blueprint pages
const BlueprintMarketplacePage = lazyWithRetry(() => import('@/pages/gm/blueprints/BlueprintMarketplacePage'));
const BlueprintMarketplaceDetailPage = lazyWithRetry(() => import('@/pages/gm/blueprints/BlueprintMarketplaceDetailPage'));
const MyBlueprintsPage = lazyWithRetry(() => import('@/pages/gm/blueprints/MyBlueprintsPage'));
const BlueprintEditorPage = lazyWithRetry(() => import('@/pages/gm/blueprints/BlueprintEditorPage'));

// Bestiary (monsters + dictionaries)
const BestiaryMonstersPage = lazyWithRetry(() => import('@/pages/admin/BestiaryMonstersPage'));
const BestiaryDictionariesPage = lazyWithRetry(() => import('@/pages/admin/BestiaryDictionariesPage'));
const HomebrewBestiaryPage = lazyWithRetry(() => import('@/pages/gm/homebrew/HomebrewBestiaryPage'));
const CampaignBestiaryPage = lazyWithRetry(() => import('@/pages/gm/campaigns/CampaignBestiaryPage'));
const MonsterDetailPage = lazyWithRetry(() => import('@/pages/bestiary/MonsterDetailPage'));
const MonsterFormPage = lazyWithRetry(() => import('@/pages/bestiary/MonsterFormPage'));

const AdminDashboardPage = lazyWithRetry(() => import('@/pages/admin/AdminDashboardPage'));
const UsersListPage = lazyWithRetry(() => import('@/pages/admin/UsersListPage'));
const AdminCharactersPage = lazyWithRetry(() => import('@/pages/admin/AdminCharactersPage'));
const StatTypesPage = lazyWithRetry(() => import('@/pages/admin/StatTypesPage'));
const CharacterClassesPage = lazyWithRetry(() => import('@/pages/admin/CharacterClassesPage'));
const SpeciesPage = lazyWithRetry(() => import('@/pages/admin/SpeciesPage'));
const BuffsDebuffsPage = lazyWithRetry(() => import('@/pages/admin/BuffsDebuffsPage'));
const EnchantmentTypesPage = lazyWithRetry(() => import('@/pages/admin/EnchantmentTypesPage'));
const ItemTemplatesPage = lazyWithRetry(() => import('@/pages/admin/ItemTemplatesPage'));
const AdminHomebrewPage = lazyWithRetry(() => import('@/pages/admin/AdminHomebrewPage'));
const ContentQualityPage = lazyWithRetry(() => import('@/pages/admin/ContentQualityPage'));
const SpellWarningsPage = lazyWithRetry(() => import('@/pages/admin/SpellWarningsPage'));
const ClassFeatureWarningsPage = lazyWithRetry(() => import('@/pages/admin/ClassFeatureWarningsPage'));
const RuleWorkbenchPage = lazyWithRetry(() => import('@/pages/admin/RuleWorkbenchPage'));
const ResourceTypesPage = lazyWithRetry(() => import('@/pages/admin/ResourceTypesPage'));
const SpellEditorPage = lazyWithRetry(() => import('@/pages/admin/SpellEditorPage'));

export const router = createBrowserRouter([
  // Единый errorElement на все маршруты: аккуратный экран вместо сырого «Unexpected Application Error!»
  // + тихая перезагрузка при устаревшем чанке (см. RouteErrorBoundary / lazyWithRetry).
  {
    errorElement: <RouteErrorBoundary />,
    children: [
  // Public routes
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/register', element: withSuspense(<RegisterPage />) },

  // Authenticated app shell (PLAYER / GAME_MASTER / ADMIN)
  {
    element: <ProtectedRoute allowedRoles={['PLAYER', 'GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: withSuspense(<AppLayout />),
        children: [
          { path: '/campaigns', element: <CampaignListPage /> },

          // Character templates (player library)
          { path: '/characters/templates', element: <MyCharactersPage /> },
          { path: '/characters/templates/new', element: <TemplateWizardPage /> },
          { path: '/characters/templates/:templateId', element: <TemplateDetailPage /> },

          // Marketplaces (read for every role)
          { path: '/marketplace', element: <MarketplacePage /> },
          { path: '/marketplace/:id', element: <MarketplaceDetailPage /> },
          { path: '/blueprints/marketplace', element: <BlueprintMarketplacePage /> },
          { path: '/blueprints/marketplace/:id', element: <BlueprintMarketplaceDetailPage /> },

          // Item reference catalog (read-only, every role)
          { path: '/library/items', element: <ItemCatalogPage /> },

          // Social — friends graph + ephemeral 1:1 messenger (master-detail)
          { path: '/friends', element: <FriendsPage /> },
          { path: '/messages', element: <MessengerPage /> },
          { path: '/messages/:sessionId', element: <MessengerPage /> },

          // Combat/Loot prototype index — dev-only, physically absent from prod builds.
          ...(import.meta.env.DEV
            ? [{ path: '/combat-preview', element: <CombatPreviewIndexPage /> }]
            : []),

          // ── Campaign shell: persistent header + role-aware sub-nav + WS ──
          {
            path: '/campaigns/:campaignId',
            element: withSuspense(<CampaignLayout />),
            children: [
              // Overview (dashboard) — URL-driven Sections / Characters / Battle tabs
              {
                element: <CampaignDashboardPage />,
                children: [
                  { index: true, element: <DashboardSectionsView /> },
                  { path: 'roster', element: <DashboardRosterView /> },
                  { path: 'battle', element: <DashboardBattleView /> },
                ],
              },

              // Sections available to every member
              { path: 'members', element: <CampaignMembersPage /> },
              { path: 'storage', element: <SharedStoragePage /> },
              { path: 'items', element: <ItemCatalogPage /> },
              { path: 'bestiary', element: <CampaignBestiaryPage /> },
              { path: 'bestiary/monsters/:monsterId', element: <MonsterDetailPage source="campaign" /> },
              { path: 'homebrew', element: <CampaignHomebrewPage /> },

              // Live map session — every member (server authorizes per-token movement)
              { path: 'map-sessions/:sessionId', element: <MapSessionPage /> },

              // Tactical battle workspace — battle state + linked map session (?session=)
              { path: 'battles/:battleId/tactical', element: <TacticalBattlePage /> },

              // Character management (every member)
              { path: 'characters/create', element: <CharacterCreationWizardPage /> },
              { path: 'characters/add', element: <AddCharacterPage /> },
              { path: 'characters/:characterId', element: <CharacterManagementPage /> },
              { path: 'characters/:characterId/sheet', element: <FolioPage /> },
              { path: 'characters/:characterId/edit', element: <CharacterEditPage /> },
              { path: 'characters/:characterId/stats', element: <CharacterStatsPage /> },
              { path: 'characters/:characterId/ability-check/:statTypeId', element: <AbilityCheckPage /> },
              { path: 'characters/:characterId/inventory', element: <InventoryPage /> },
              { path: 'characters/:characterId/effects', element: <ApplyEffectPage /> },
              { path: 'characters/:characterId/wallet', element: <CharacterWalletPage /> },
              { path: 'characters/:characterId/resources', element: <CharacterResourcesPage /> },
              { path: 'characters/:characterId/hp', element: <CharacterHpPage /> },
              { path: 'characters/:characterId/level-up', element: <LevelUpWizardPage /> },
              { path: 'characters/:characterId/rewards', element: <CharacterRewardsPage /> },

              // GM / Admin-only campaign sections (nested role gate)
              {
                element: <ProtectedRoute allowedRoles={['GAME_MASTER', 'ADMIN']} />,
                children: [
                  { path: 'invite', element: <CampaignInvitePage /> },
                  { path: 'notes', element: <SessionNotesPage /> },
                  { path: 'wallet', element: <BalanceManagementPage /> },
                  { path: 'balances', element: <Navigate to="../wallet" replace /> },
                  { path: 'xp', element: <XPGrantPage /> },
                  { path: 'npcs', element: <NPCManagerPage /> },
                  { path: 'npcs/:npcId', element: <NPCDetailPage /> },
                  { path: 'quests', element: <QuestManagerPage /> },
                  { path: 'quests/:questId', element: <QuestDetailPage /> },
                  { path: 'locations', element: <LocationsPage /> },

                  // Map authoring (GM library + grid editor)
                  { path: 'maps', element: <CampaignMapListPage /> },
                  { path: 'maps/new', element: <MapEditorPage /> },
                  { path: 'maps/:mapId/edit', element: <MapEditorPage /> },

                  { path: 'bestiary/monsters/new', element: <MonsterFormPage /> },
                  { path: 'bestiary/monsters/:monsterId/edit', element: <MonsterFormPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // Combat / Loot prototype previews — full-screen standalone routes
  // (screens only, no API wiring). Rendered outside AppLayout so the
  // tracker's queue | actions | log layout owns the whole viewport.
  // Dev-only: the whole block (incl. /dev/content-classes) is stripped from prod
  // builds, so these routes 404→redirect in production.
  ...(import.meta.env.DEV ? [{
    element: <ProtectedRoute allowedRoles={['PLAYER', 'GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: <SuspenseOutlet />,
        children: [
          { path: '/combat-preview/kit', element: <CombatKitReferencePage /> },
          { path: '/combat-preview/tracker-gm', element: <CombatTrackerGMPage /> },
          { path: '/combat-preview/tracker-gm-paused', element: <CombatTrackerGMPage initialPaused /> },
          { path: '/combat-preview/tracker-player', element: <CombatTrackerPlayerPage myTurn /> },
          { path: '/combat-preview/tracker-player-wait', element: <CombatTrackerPlayerPage myTurn={false} /> },
          { path: '/combat-preview/encounter-builder', element: <EncounterBuilderPage /> },
          { path: '/combat-preview/encounters', element: <EncounterListPage /> },
          { path: '/combat-preview/summary', element: <CombatSummaryPage /> },
          { path: '/combat-preview/dashboard', element: <DashboardTilesPage /> },
          { path: '/combat-preview/loot-table', element: <LootTableEditorPage /> },
          { path: '/combat-preview/loot-gen', element: <LootGeneratorPage /> },
          { path: '/combat-preview/loot-gen-empty', element: <LootGeneratorPage empty /> },
          { path: '/combat-preview/quest', element: <QuestDetailV2Page /> },
          { path: '/combat-preview/npc', element: <NPCDetailV2Page /> },
          { path: '/combat-preview/npc-empty', element: <NPCDetailV2Page noStatblock /> },
          { path: '/combat-preview/quests-list', element: <QuestListV2Page /> },
          { path: '/combat-preview/npc-list', element: <NPCListV2Page /> },
          { path: '/combat-preview/patterns', element: <SystemPatternsPage /> },
          { path: '/combat-preview/mobile', element: <MobilePreviewPage /> },

          // Dev-only content-model viewer (Phase 3) — hidden, no nav entry
          { path: '/dev/content-classes', element: <ContentClassViewerPage /> },
        ],
      },
    ],
  }] : []),

  // Game Master routes (non-campaign)
  {
    element: <ProtectedRoute allowedRoles={['GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: withSuspense(<AppLayout />),
        children: [
          { path: '/gm', element: <Navigate to="/campaigns" replace /> },
          // Campaign blueprints — authoring (own drafts, forks, editor)
          { path: '/blueprints/my', element: <MyBlueprintsPage /> },
          { path: '/blueprints/my/new', element: <BlueprintEditorPage /> },
          { path: '/blueprints/my/:id/edit', element: <BlueprintEditorPage /> },
          // Homebrew
          { path: '/gm/homebrew', element: <Navigate to="/gm/homebrew/my" replace /> },
          { path: '/gm/homebrew/marketplace', element: <Navigate to="/marketplace" replace /> },
          { path: '/gm/homebrew/marketplace/:id', element: <MarketplaceDetailPage /> },
          { path: '/gm/homebrew/my', element: <MyDoctrinesPage /> },
          { path: '/gm/homebrew/new', element: <CreateDoctrinePage /> },
          { path: '/gm/homebrew/:id/edit', element: <EditDoctrinePage /> },
          { path: '/gm/homebrew/installed', element: <InstalledDoctrinesPage /> },
          { path: '/gm/homebrew/library', element: <HomebrewLibraryPage /> },
          // Homebrew package bestiary (GAME_MASTER, DRAFT package)
          { path: '/gm/homebrew/:packageId/bestiary', element: <HomebrewBestiaryPage /> },
          { path: '/gm/homebrew/:packageId/bestiary/monsters/new', element: <MonsterFormPage /> },
          { path: '/gm/homebrew/:packageId/bestiary/monsters/:monsterId', element: <MonsterDetailPage source="homebrew" /> },
          { path: '/gm/homebrew/:packageId/bestiary/monsters/:monsterId/edit', element: <MonsterFormPage /> },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: withSuspense(<AppLayout />),
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <UsersListPage /> },
          { path: '/admin/characters', element: <AdminCharactersPage /> },
          { path: '/admin/stat-types', element: <StatTypesPage /> },
          { path: '/admin/item-types', element: <Navigate to="/library/items" replace /> },
          { path: '/admin/item-templates', element: <ItemTemplatesPage /> },
          { path: '/admin/character-classes', element: <CharacterClassesPage /> },
          { path: '/admin/species', element: <SpeciesPage /> },
          { path: '/admin/content-quality', element: <ContentQualityPage /> },
          { path: '/admin/spell-warnings', element: <SpellWarningsPage /> },
          { path: '/admin/class-feature-warnings', element: <ClassFeatureWarningsPage /> },
          { path: '/admin/rule-workbench', element: <RuleWorkbenchPage /> },
          { path: '/admin/resource-types', element: <ResourceTypesPage /> },
          { path: '/admin/spells', element: <SpellEditorPage /> },
          { path: '/admin/character-races', element: <Navigate to="/admin/species" replace /> },
          { path: '/admin/races', element: <Navigate to="/admin/species" replace /> },
          { path: '/admin/skills', element: <Navigate to="/admin/character-classes" replace /> },
          { path: '/admin/subclasses', element: <Navigate to="/admin/character-classes" replace /> },
          { path: '/admin/feats', element: <Navigate to="/admin/character-classes" replace /> },
          { path: '/admin/buffs-debuffs', element: <BuffsDebuffsPage /> },
          { path: '/admin/enchantment-types', element: <EnchantmentTypesPage /> },
          { path: '/admin/homebrew', element: <AdminHomebrewPage /> },
          // System bestiary (ADMIN)
          { path: '/admin/bestiary/monsters', element: <BestiaryMonstersPage /> },
          { path: '/admin/bestiary/monsters/new', element: <MonsterFormPage /> },
          { path: '/admin/bestiary/monsters/:monsterId', element: <MonsterDetailPage source="admin" /> },
          { path: '/admin/bestiary/monsters/:monsterId/edit', element: <MonsterFormPage /> },
          { path: '/admin/bestiary/dictionaries', element: <BestiaryDictionariesPage /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/campaigns" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);
