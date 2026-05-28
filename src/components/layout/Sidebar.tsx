import { NavLink } from 'react-router-dom';
import {
  Sword,
  Users,
  Shield,
  ScrollText,
  Dices,
  UserPlus,
  LayoutDashboard,
  Package,
  Swords,
  Gem,
  Crown,
  BookOpen,
  Store,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const playerNav: NavItem[] = [
  { label: 'My Characters', path: '/characters', icon: <Sword className="h-5 w-5" /> },
  { label: 'Join Team', path: '/teams/join', icon: <UserPlus className="h-5 w-5" /> },
  { label: 'My Teams', path: '/teams', icon: <Users className="h-5 w-5" /> },
];

const gmNav: NavItem[] = [
  { label: 'My Teams', path: '/gm/teams', icon: <Shield className="h-5 w-5" /> },
  { label: 'My Doctrines', path: '/gm/homebrew/my', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Catalogue', path: '/gm/homebrew/marketplace', icon: <Store className="h-5 w-5" /> },
  { label: 'Instated', path: '/gm/homebrew/installed', icon: <Download className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Teams', path: '/admin/teams', icon: <Shield className="h-5 w-5" /> },
  { label: 'Stat Types', path: '/admin/stat-types', icon: <ScrollText className="h-5 w-5" /> },
  { label: 'Item Types', path: '/admin/item-types', icon: <Package className="h-5 w-5" /> },
  { label: 'Classes', path: '/admin/character-classes', icon: <Swords className="h-5 w-5" /> },
  { label: 'Races', path: '/admin/character-races', icon: <Crown className="h-5 w-5" /> },
  { label: 'Homebrew', path: '/admin/homebrew', icon: <ShieldAlert className="h-5 w-5" /> },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);

  const navItems: NavItem[] =
    user?.role === 'ADMIN'
      ? adminNav
      : user?.role === 'GAME_MASTER'
        ? gmNav
        : playerNav;

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <Dices className="h-8 w-8 text-gold" />
        <h1 className="text-xl font-heading font-bold text-gold">D&D Manager</h1>
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {user?.role === 'ADMIN' ? 'Admin Panel' : user?.role === 'GAME_MASTER' ? 'Game Master' : 'Player Portal'}
        </p>
      </div>
    </aside>
  );
}
