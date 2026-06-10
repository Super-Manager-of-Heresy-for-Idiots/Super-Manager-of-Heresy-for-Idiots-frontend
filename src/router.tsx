import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import TodoPage from '@/pages/TodoPage';

// Campaign pages
import CampaignListPage from '@/pages/gm/campaigns/CampaignListPage';
import CampaignDashboardPage from '@/pages/gm/campaigns/CampaignDashboardPage';
import CampaignMembersPage from '@/pages/gm/campaigns/CampaignMembersPage';
import CampaignInvitePage from '@/pages/gm/campaigns/CampaignInvitePage';
import SharedStoragePage from '@/pages/gm/campaigns/SharedStoragePage';
import SessionNotesPage from '@/pages/gm/campaigns/SessionNotesPage';
import XPGrantPage from '@/pages/gm/campaigns/XPGrantPage';
import ApplyEffectPage from '@/pages/gm/campaigns/ApplyEffectPage';
import InventoryPage from '@/pages/gm/campaigns/InventoryPage';
import CharacterManagementPage from '@/pages/gm/campaigns/CharacterManagementPage';
import CharacterCreationWizardPage from '@/pages/gm/campaigns/CharacterCreationWizardPage';
import AddCharacterPage from '@/pages/gm/campaigns/AddCharacterPage';
import LevelUpWizardPage from '@/pages/gm/campaigns/LevelUpWizardPage';
import CharacterRewardsPage from '@/pages/gm/campaigns/CharacterRewardsPage';
import FolioPage from '@/pages/gm/campaigns/FolioPage';
import CharacterWalletPage from '@/pages/gm/campaigns/CharacterWalletPage';
import CharacterResourcesPage from '@/pages/gm/campaigns/CharacterResourcesPage';
import BalanceManagementPage from '@/pages/gm/campaigns/BalanceManagementPage';
import MyCharactersPage from '@/pages/player/MyCharactersPage';
import TemplateWizardPage from '@/pages/player/TemplateWizardPage';
import TemplateDetailPage from '@/pages/player/TemplateDetailPage';
import {
  AbilityCheckPage,
  CampaignRosterPage,
  CharacterEditPage,
  CharacterHpPage,
  CharacterStatsPage,
} from '@/pages/gm/campaigns/CharacterPlaceholderPages';
import NPCManagerPage from '@/pages/gm/campaigns/NPCManagerPage';
import NPCDetailPage from '@/pages/gm/campaigns/NPCDetailPage';
import QuestManagerPage from '@/pages/gm/campaigns/QuestManagerPage';
import QuestDetailPage from '@/pages/gm/campaigns/QuestDetailPage';
import LocationsPage from '@/pages/gm/campaigns/LocationsPage';

// Combat / Loot prototype preview pages (screens only, no API wiring)
import CombatPreviewIndexPage from '@/pages/gm/combat/CombatPreviewIndexPage';
import CombatTrackerGMPage from '@/pages/gm/combat/CombatTrackerGMPage';
import CombatTrackerPlayerPage from '@/pages/gm/combat/CombatTrackerPlayerPage';
import EncounterBuilderPage from '@/pages/gm/combat/EncounterBuilderPage';
import EncounterListPage from '@/pages/gm/combat/EncounterListPage';
import CombatSummaryPage from '@/pages/gm/combat/CombatSummaryPage';
import DashboardTilesPage from '@/pages/gm/combat/DashboardTilesPage';
import LootTableEditorPage from '@/pages/gm/combat/LootTableEditorPage';
import LootGeneratorPage from '@/pages/gm/combat/LootGeneratorPage';
import QuestDetailV2Page from '@/pages/gm/combat/QuestDetailV2Page';
import NPCDetailV2Page from '@/pages/gm/combat/NPCDetailV2Page';
import QuestListV2Page from '@/pages/gm/combat/QuestListV2Page';
import NPCListV2Page from '@/pages/gm/combat/NPCListV2Page';
import SystemPatternsPage from '@/pages/gm/combat/SystemPatternsPage';
import CombatKitReferencePage from '@/pages/gm/combat/CombatKitReferencePage';
import MobilePreviewPage from '@/pages/gm/combat/MobilePreviewPage';

// Homebrew pages
import MarketplacePage from '@/pages/gm/homebrew/MarketplacePage';
import MarketplaceDetailPage from '@/pages/gm/homebrew/MarketplaceDetailPage';
import MyDoctrinesPage from '@/pages/gm/homebrew/MyDoctrinesPage';
import CreateDoctrinePage from '@/pages/gm/homebrew/CreateDoctrinePage';
import EditDoctrinePage from '@/pages/gm/homebrew/EditDoctrinePage';
import InstalledDoctrinesPage from '@/pages/gm/homebrew/InstalledDoctrinesPage';
import HomebrewLibraryPage from '@/pages/gm/homebrew/HomebrewLibraryPage';

// Bestiary (monsters + dictionaries) — wired to the bestiary API contract
import BestiaryMonstersPage from '@/pages/admin/BestiaryMonstersPage';
import BestiaryDictionariesPage from '@/pages/admin/BestiaryDictionariesPage';
import HomebrewBestiaryPage from '@/pages/gm/homebrew/HomebrewBestiaryPage';
import CampaignBestiaryPage from '@/pages/gm/campaigns/CampaignBestiaryPage';
import MonsterDetailPage from '@/pages/bestiary/MonsterDetailPage';
import MonsterFormPage from '@/pages/bestiary/MonsterFormPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import UsersListPage from '@/pages/admin/UsersListPage';
import StatTypesPage from '@/pages/admin/StatTypesPage';
import ItemTypesPage from '@/pages/admin/ItemTypesPage';
import CharacterClassesPage from '@/pages/admin/CharacterClassesPage';
import CharacterRacesPage from '@/pages/admin/CharacterRacesPage';
import SkillsPage from '@/pages/admin/SkillsPage';
import SubclassesPage from '@/pages/admin/SubclassesPage';
import FeatsPage from '@/pages/admin/FeatsPage';
import LevelRewardsPage from '@/pages/admin/LevelRewardsPage';
import BuffsDebuffsPage from '@/pages/admin/BuffsDebuffsPage';
import EnchantmentTypesPage from '@/pages/admin/EnchantmentTypesPage';
import AdminHomebrewPage from '@/pages/admin/AdminHomebrewPage';

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
          { path: '/campaigns/:campaignId/roster', element: <CampaignRosterPage /> },
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
