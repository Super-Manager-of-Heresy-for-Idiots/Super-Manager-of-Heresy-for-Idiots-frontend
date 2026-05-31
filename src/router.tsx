import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

import CharactersListPage from '@/pages/player/CharactersListPage';
import CharacterCreatePage from '@/pages/player/CharacterCreatePage';
import CharacterEditPage from '@/pages/player/CharacterEditPage';
import CharacterDetailPage from '@/pages/player/CharacterDetailPage';
import LevelUpPage from '@/pages/player/LevelUpPage';
import JoinTeamPage from '@/pages/player/JoinTeamPage';
import MyTeamsPage from '@/pages/player/MyTeamsPage';

import GmCharacterViewPage from '@/pages/gm/GmCharacterViewPage';
import ArtifactsPage from '@/pages/gm/ArtifactsPage';
import ConditionsPage from '@/pages/gm/ConditionsPage';

// Campaign v2 pages
import CampaignListPage from '@/pages/gm/campaigns/CampaignListPage';
import CampaignDashboardPage from '@/pages/gm/campaigns/CampaignDashboardPage';
import CampaignMembersPage from '@/pages/gm/campaigns/CampaignMembersPage';
import CampaignInvitePage from '@/pages/gm/campaigns/CampaignInvitePage';
import SharedStoragePage from '@/pages/gm/campaigns/SharedStoragePage';
import SessionNotesPage from '@/pages/gm/campaigns/SessionNotesPage';
import XPGrantPage from '@/pages/gm/campaigns/XPGrantPage';
import ApplyEffectPage from '@/pages/gm/campaigns/ApplyEffectPage';
import InventoryV2Page from '@/pages/gm/campaigns/InventoryV2Page';
import NPCManagerPage from '@/pages/gm/campaigns/NPCManagerPage';
import NPCDetailPage from '@/pages/gm/campaigns/NPCDetailPage';
import QuestManagerPage from '@/pages/gm/campaigns/QuestManagerPage';
import QuestDetailPage from '@/pages/gm/campaigns/QuestDetailPage';
import LocationsPage from '@/pages/gm/campaigns/LocationsPage';

// Homebrew pages
import MarketplacePage from '@/pages/gm/homebrew/MarketplaceV2Page';
import MarketplaceDetailPage from '@/pages/gm/homebrew/MarketplaceDetailPage';
import MyDoctrinesPage from '@/pages/gm/homebrew/MyDoctrinesPage';
import CreateDoctrinePage from '@/pages/gm/homebrew/CreateDoctrinePage';
import EditDoctrinePage from '@/pages/gm/homebrew/EditDoctrinePage';
import InstalledDoctrinesPage from '@/pages/gm/homebrew/InstalledDoctrinesPage';
import VersionManagerPage from '@/pages/gm/homebrew/VersionManagerPage';
import OverrideCreatorPage from '@/pages/gm/homebrew/OverrideCreatorPage';
import HomebrewLibraryPage from '@/pages/gm/homebrew/HomebrewLibraryPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import UsersListPage from '@/pages/admin/UsersListPage';
import TeamsListPage from '@/pages/admin/TeamsListPage';
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

  // Player routes
  {
    element: <ProtectedRoute allowedRoles={['PLAYER']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/characters', element: <CharactersListPage /> },
          { path: '/characters/new', element: <CharacterCreatePage /> },
          { path: '/characters/:id', element: <CharacterDetailPage /> },
          { path: '/characters/:id/edit', element: <CharacterEditPage /> },
          { path: '/characters/:id/level-up', element: <LevelUpPage /> },
          { path: '/teams/join', element: <JoinTeamPage /> },
          { path: '/teams', element: <MyTeamsPage /> },
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
          // Legacy redirects
          { path: '/gm/teams', element: <Navigate to="/gm/campaigns" replace /> },
          { path: '/gm/teams/*', element: <Navigate to="/gm/campaigns" replace /> },
          { path: '/gm/characters/:id', element: <GmCharacterViewPage /> },
          { path: '/gm/artifacts', element: <ArtifactsPage /> },
          { path: '/gm/conditions', element: <ConditionsPage /> },

          // Campaigns v2
          { path: '/gm/campaigns', element: <CampaignListPage /> },
          { path: '/gm/campaigns/:id', element: <CampaignDashboardPage /> },
          { path: '/gm/campaigns/:id/members', element: <CampaignMembersPage /> },
          { path: '/gm/campaigns/:id/invite', element: <CampaignInvitePage /> },
          { path: '/gm/campaigns/:id/storage', element: <SharedStoragePage /> },
          { path: '/gm/campaigns/:id/notes', element: <SessionNotesPage /> },
          { path: '/gm/campaigns/:id/xp', element: <XPGrantPage /> },
          { path: '/gm/campaigns/:id/characters/:characterId/effects', element: <ApplyEffectPage /> },
          { path: '/gm/campaigns/:id/characters/:characterId/inventory', element: <InventoryV2Page /> },
          { path: '/gm/campaigns/:id/npcs', element: <NPCManagerPage /> },
          { path: '/gm/campaigns/:id/npcs/:npcId', element: <NPCDetailPage /> },
          { path: '/gm/campaigns/:id/quests', element: <QuestManagerPage /> },
          { path: '/gm/campaigns/:id/quests/:questId', element: <QuestDetailPage /> },
          { path: '/gm/campaigns/:id/locations', element: <LocationsPage /> },

          // Homebrew
          { path: '/gm/homebrew/marketplace', element: <MarketplacePage /> },
          { path: '/gm/homebrew/marketplace/:id', element: <MarketplaceDetailPage /> },
          { path: '/gm/homebrew/my', element: <MyDoctrinesPage /> },
          { path: '/gm/homebrew/new', element: <CreateDoctrinePage /> },
          { path: '/gm/homebrew/:id/edit', element: <EditDoctrinePage /> },
          { path: '/gm/homebrew/installed', element: <InstalledDoctrinesPage /> },
          { path: '/gm/homebrew/library', element: <HomebrewLibraryPage /> },
          { path: '/gm/homebrew/versions/:packageId', element: <VersionManagerPage /> },
          { path: '/gm/homebrew/override/new', element: <OverrideCreatorPage /> },
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
          { path: '/admin/teams', element: <TeamsListPage /> },
          { path: '/admin/stat-types', element: <StatTypesPage /> },
          { path: '/admin/item-types', element: <ItemTypesPage /> },
          { path: '/admin/character-classes', element: <CharacterClassesPage /> },
          { path: '/admin/character-races', element: <CharacterRacesPage /> },
          { path: '/admin/skills', element: <SkillsPage /> },
          { path: '/admin/subclasses', element: <SubclassesPage /> },
          { path: '/admin/feats', element: <FeatsPage /> },
          { path: '/admin/classes/:classId/rewards', element: <LevelRewardsPage /> },
          { path: '/admin/buffs-debuffs', element: <BuffsDebuffsPage /> },
          { path: '/admin/enchantment-types', element: <EnchantmentTypesPage /> },
          { path: '/admin/homebrew', element: <AdminHomebrewPage /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
