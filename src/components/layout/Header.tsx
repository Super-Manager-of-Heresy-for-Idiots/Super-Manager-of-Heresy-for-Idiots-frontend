import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';

const roleLabels: Record<string, string> = {
  PLAYER: 'Player',
  GAME_MASTER: 'Game Master',
  ADMIN: 'Admin',
};

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium">{user.username}</span>
              <Badge variant="gold">{roleLabels[user.role] || user.role}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
