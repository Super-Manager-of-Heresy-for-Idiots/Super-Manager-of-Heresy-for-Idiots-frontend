import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { SuspenseLayout } from '@/components/layout/SuspenseLayout';

// Eager: auth + core landing pages (entry points, hit on first load)
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import TodoPage from '@/pages/TodoPage';
import CampaignListPage from '@/pages/gm/campaigns/CampaignListPage';
import CampaignDashboardPage from '@/pages/gm/campaigns/CampaignDashboardPage';
import {
  AbilityCheckPage,
  CharacterEditPage,
  CharacterHpPage,
  CharacterStatsPage,
} from '@/pages/gm/campaigns/CharacterPlaceholderPages';

// Lazy: campaign character + management flows
const CampaignMembersPage = lazy(() => import('@/pages/gm/campaigns/CampaignMembersPage'));
const CampaignInvitePage = lazy(() => import('@/pages/gm/campaigns/CampaignInvitePage'));
const SharedStoragePage = lazy(() => import('@/pages/gm/campaigns/SharedStoragePage'));
const SessionNotesPage = lazy(() => import('@/pages/gm/campaigns/SessionNotesPage'));
const XPGrantPage = lazy(() => import('@/pages/gm/campaigns/XPGrantPage'));
const ApplyEffectPage = lazy(() => import('@/pages/gm/campaigns/ApplyEffectPage'));
const InventoryPage = lazy(() => import('@/pages/gm/campaigns/InventoryPage'));
const CharacterManagementPage = lazy(() => import('@/pages/gm/campaigns/CharacterManagementPage'));
const CharacterCreationWizardPage = lazy(() => import('@/pages/gm/campaigns/CharacterCreationWizardPage'));
const AddCharacterPage = lazy(() => import('@/pages/gm/campaigns/AddCharacterPage'));
const LevelUpWizardPage = lazy(() => import('@/pages/gm/campaigns/LevelUpWizardPage'));
const CharacterRewardsPage = lazy(() => import('@/pages/gm/campaigns/CharacterRewardsPage'));
const FolioPage = lazy(() => import('@/pages/gm/campaigns/FolioPage'));
const CharacterWalletPage = lazy(() => import('@/pages/gm/campaigns/CharacterWalletPage'));
const CharacterResourcesPage = lazy(() => import('@/pages/gm/campaigns/CharacterResourcesPage'));
const BalanceManagementPage = lazy(() => import('@/pages/gm/campaigns/BalanceManagementPage'));
const MyCharactersPage = lazy(() => import('@/pages/player/MyCharactersPage'));
const TemplateWizardPage = lazy(() => import('@/pages/player/TemplateWizardPage'));
const TemplateDetailPage = lazy(() => import('@/pages/player/TemplateDetailPage'));
const NPCManagerPage = lazy(() => import('@/pages/gm/campaigns/NPCManagerPage'));
const NPCDetailPage = lazy(() => import('@/pages/gm/campaigns/NPCDetailPage'));
const QuestManagerPage = lazy(() => import('@/pages/gm/campaigns/QuestManagerPage'));
const QuestDetailPage = lazy(() => import('@/pages/gm/campaigns/QuestDetailPage'));
const LocationsPage = lazy(() => import('@/pages/gm/campaigns/LocationsPage'));

// Lazy: combat / loot prototype preview pages (screens only, no API wiring)
const CombatPreviewIndexPage = lazy(() => import('@/pages/gm/combat/CombatPreviewIndexPage'));
const CombatTrackerGMPage = lazy(() => import('@/pages/gm/combat/CombatTrackerGMPage'));
const CombatTrackerPlayerPage = lazy(() => import('@/pages/gm/combat/CombatTrackerPlayerPage'));
const EncounterBuilderPage = lazy(() => import('@/pages/gm/combat/EncounterBuilderPage'));
const EncounterListPage = lazy(() => import('@/pages/gm/combat/EncounterListPage'));
const CombatSummaryPage = lazy(() => import('@/pages/gm/combat/CombatSummaryPage'));
const DashboardTilesPage = lazy(() => import('@/pages/gm/combat/DashboardTilesPage'));
const LootTableEditorPage = lazy(() => import('@/pages/gm/combat/LootTableEditorPage'));
const LootGeneratorPage = lazy(() => import('@/pages/gm/combat/LootGeneratorPage'));
const QuestDetailV2Page = lazy(() => import('@/pages/gm/combat/QuestDetailV2Page'));
const NPCDetailV2Page = lazy(() => import('@/pages/gm/combat/NPCDetailV2Page'));
const QuestListV2Page = lazy(() => import('@/pages/gm/combat/QuestListV2Page'));
const NPCListV2Page = lazy(() => import('@/pages/gm/combat/NPCListV2Page'));
const SystemPatternsPage = lazy(() => import('@/pages/gm/combat/SystemPatternsPage'));
const CombatKitReferencePage = lazy(() => import('@/pages/gm/combat/CombatKitReferencePage'));
const MobilePreviewPage = lazy(() => import('@/pages/gm/combat/MobilePreviewPage'));

// Lazy: homebrew pages
const MarketplacePage = lazy(() => import('@/pages/gm/homebrew/MarketplacePage'));
const MarketplaceDetailPage = lazy(() => import('@/pages/gm/homebrew/MarketplaceDetailPage'));
const MyDoctrinesPage = lazy(() => import('@/pages/gm/homebrew/MyDoctrinesPage'));
const CreateDoctrinePage = lazy(() => import('@/pages/gm/homebrew/CreateDoctrinePage'));
const EditDoctrinePage = lazy(() => import('@/pages/gm/homebrew/EditDoctrinePage'));
const InstalledDoctrinesPage = lazy(() => import('@/pages/gm/homebrew/InstalledDoctrinesPage'));
const HomebrewLibraryPage = lazy(() => import('@/pages/gm/homebrew/HomebrewLibraryPage'));

// Lazy: campaign blueprint pages
const BlueprintMarketplacePage = lazy(() => import('@/pages/gm/blueprints/BlueprintMarketplacePage'));
const BlueprintMarketplaceDetailPage = lazy(() => import('@/pages/gm/blueprints/BlueprintMarketplaceDetailPage'));
const MyBlueprintsPage = lazy(() => import('@/pages/gm/blueprints/MyBlueprintsPage'));
const BlueprintEditorPage = lazy(() => import('@/pages/gm/blueprints/BlueprintEditorPage'));

// Lazy: bestiary (monsters + dictionaries)
const BestiaryMonstersPage = lazy(() => import('@/pages/admin/BestiaryMonstersPage'));
const BestiaryDictionariesPage = lazy(() => import('@/pages/admin/BestiaryDictionariesPage'));
const HomebrewBestiaryPage = lazy(() => import('@/pages/gm/homebrew/HomebrewBestiaryPage'));
const CampaignBestiaryPage = lazy(() => import('@/pages/gm/campaigns/CampaignBestiaryPage'));
const MonsterDetailPage = lazy(() => import('@/pages/bestiary/MonsterDetailPage'));
const MonsterFormPage = lazy(() => import('@/pages/bestiary/MonsterFormPage'));

// Lazy: admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UsersListPage = lazy(() => import('@/pages/admin/UsersListPage'));
const StatTypesPage = lazy(() => import('@/pages/admin/StatTypesPage'));
const ItemTypesPage = lazy(() => import('@/pages/admin/ItemTypesPage'));
const CharacterClassesPage = lazy(() => import('@/pages/admin/CharacterClassesPage'));
const CharacterRacesPage = lazy(() => import('@/pages/admin/CharacterRacesPage'));
const SkillsPage = lazy(() => import('@/pages/admin/SkillsPage'));
const SubclassesPage = lazy(() => import('@/pages/admin/SubclassesPage'));
const FeatsPage = lazy(() => import('@/pages/admin/FeatsPage'));
const LevelRewardsPage = lazy(() => import('@/pages/admin/LevelRewardsPage'));
const BuffsDebuffsPage = lazy(() => import('@/pages/admin/BuffsDebuffsPage'));
const EnchantmentTypesPage = lazy(() => import('@/pages/admin/EnchantmentTypesPage'));
const AdminHomebrewPage = lazy(() => import('@/pages/admin/AdminHomebrewPage'));

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Contract campaign routes
  {
    element: <ProtectedRoute allowedRoles={['PLAYER', 'GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/campaigns', element: <CampaignListPage /> },
          { path: '/campaigns/:campaignId', element: <CampaignDashboardPage /> },
          { path: '/campaigns/:campaignId/characters/create', element: <CharacterCreationWizardPage /> },
          { path: '/campaigns/:campaignId/characters/add', element: <AddCharacterPage /> },
          { path: '/characters/templates', element: <MyCharactersPage /> },
          { path: '/characters/templates/new', element: <TemplateWizardPage /> },
          { path: '/characters/templates/:templateId', element: <TemplateDetailPage /> },
          { path: '/campaigns/:campaignId/members', element: <CampaignMembersPage /> },
          { path: '/campaigns/:campaignId/invite', element: <CampaignInvitePage /> },
          { path: '/campaigns/:campaignId/storage', element: <SharedStoragePage /> },
          { path: '/campaigns/:campaignId/characters/:characterId', element: <CharacterManagementPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/sheet', element: <FolioPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/edit', element: <CharacterEditPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/stats', element: <CharacterStatsPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/ability-check/:statTypeId', element: <AbilityCheckPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/inventory', element: <InventoryPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/effects', element: <ApplyEffectPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/wallet', element: <CharacterWalletPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/resources', element: <CharacterResourcesPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/hp', element: <CharacterHpPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/level-up', element: <LevelUpWizardPage /> },
          { path: '/campaigns/:campaignId/characters/:characterId/rewards', element: <CharacterRewardsPage /> },
          { path: '/marketplace', element: <MarketplacePage /> },
          { path: '/marketplace/:id', element: <MarketplaceDetailPage /> },
          // Campaign blueprint marketplace — browse/read for every role (PLAYER read-only).
          { path: '/blueprints/marketplace', element: <BlueprintMarketplacePage /> },
          { path: '/blueprints/marketplace/:id', element: <BlueprintMarketplaceDetailPage /> },
          { path: '/combat-preview', element: <CombatPreviewIndexPage /> },
          // Campaign bestiary — read access for every member; mutations are GM-only (below).
          { path: '/campaigns/:campaignId/bestiary', element: <CampaignBestiaryPage /> },
          { path: '/campaigns/:campaignId/bestiary/monsters/:monsterId', element: <MonsterDetailPage source="campaign" /> },
        ],
      },
    ],
  },

  // Combat / Loot prototype previews — full-screen standalone routes
  // (screens only, no API wiring). Rendered outside AppLayout so the
  // tracker's queue | actions | log layout owns the whole viewport.
  {
    element: <ProtectedRoute allowedRoles={['PLAYER', 'GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: <SuspenseLayout />,
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
        ],
      },
    ],
  },

  // Campaign management routes available only to GMs and admins.
  {
    element: <ProtectedRoute allowedRoles={['GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/campaigns/:campaignId/notes', element: <SessionNotesPage /> },
          { path: '/campaigns/:campaignId/wallet', element: <BalanceManagementPage /> },
          { path: '/campaigns/:campaignId/balances', element: <Navigate to="../wallet" replace /> },
          { path: '/campaigns/:campaignId/xp', element: <XPGrantPage /> },
          { path: '/campaigns/:campaignId/npcs', element: <NPCManagerPage /> },
          { path: '/campaigns/:campaignId/npcs/:npcId', element: <NPCDetailPage /> },
          { path: '/campaigns/:campaignId/quests', element: <QuestManagerPage /> },
          { path: '/campaigns/:campaignId/quests/:questId', element: <QuestDetailPage /> },
          { path: '/campaigns/:campaignId/locations', element: <LocationsPage /> },
          // Campaign bestiary — GM-only create/edit.
          { path: '/campaigns/:campaignId/bestiary/monsters/new', element: <MonsterFormPage /> },
          { path: '/campaigns/:campaignId/bestiary/monsters/:monsterId/edit', element: <MonsterFormPage /> },
        ],
      },
    ],
  },

  // Game Master routes
  {
    element: <ProtectedRoute allowedRoles={['GAME_MASTER', 'ADMIN']} />,
    children: [
      {
        element: <AppLayout />,
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
        element: <AppLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <UsersListPage /> },
          { path: '/admin/characters', element: <TodoPage title="Characters" /> },
          { path: '/admin/stat-types', element: <StatTypesPage /> },
          { path: '/admin/item-types', element: <ItemTypesPage /> },
          { path: '/admin/character-classes', element: <CharacterClassesPage /> },
          { path: '/admin/character-races', element: <CharacterRacesPage /> },
          { path: '/admin/skills', element: <SkillsPage /> },
          { path: '/admin/subclasses', element: <SubclassesPage /> },
          { path: '/admin/feats', element: <FeatsPage /> },
          { path: '/admin/character-classes/:classId/rewards', element: <LevelRewardsPage /> },
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
]);
