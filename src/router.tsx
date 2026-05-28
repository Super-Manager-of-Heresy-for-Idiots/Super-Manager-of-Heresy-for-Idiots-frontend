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

import GmTeamsListPage from '@/pages/gm/GmTeamsListPage';
import GmTeamCreatePage from '@/pages/gm/GmTeamCreatePage';
import GmTeamDetailPage from '@/pages/gm/GmTeamDetailPage';
import GmCharacterViewPage from '@/pages/gm/GmCharacterViewPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import UsersListPage from '@/pages/admin/UsersListPage';
import TeamsListPage from '@/pages/admin/TeamsListPage';
import StatTypesPage from '@/pages/admin/StatTypesPage';
import ItemTypesPage from '@/pages/admin/ItemTypesPage';
import CharacterClassesPage from '@/pages/admin/CharacterClassesPage';
import CharacterRacesPage from '@/pages/admin/CharacterRacesPage';
import FeatsPage from '@/pages/admin/FeatsPage';
import SubclassesPage from '@/pages/admin/SubclassesPage';
import SkillsPage from '@/pages/admin/SkillsPage';
import ClassLevelRewardsPage from '@/pages/admin/ClassLevelRewardsPage';

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
    element: <ProtectedRoute allowedRoles={['GAME_MASTER']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/gm/teams', element: <GmTeamsListPage /> },
          { path: '/gm/teams/new', element: <GmTeamCreatePage /> },
          { path: '/gm/teams/:id', element: <GmTeamDetailPage /> },
          { path: '/gm/characters/:id', element: <GmCharacterViewPage /> },
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
          { path: '/admin/feats', element: <FeatsPage /> },
          { path: '/admin/subclasses', element: <SubclassesPage /> },
          { path: '/admin/skills', element: <SkillsPage /> },
          { path: '/admin/class-level-rewards', element: <ClassLevelRewardsPage /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
