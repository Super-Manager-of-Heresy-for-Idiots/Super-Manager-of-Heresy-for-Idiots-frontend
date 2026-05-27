import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { useUsers } from '@/hooks/useAdmin';

const roleColors: Record<string, string> = {
  PLAYER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  GAME_MASTER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN: 'bg-gold/20 text-gold border-gold/30',
};

export default function UsersListPage() {
  const { data: users, isLoading, error, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load users</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Users Management</h1>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="PLAYER">Player</SelectItem>
            <SelectItem value="GAME_MASTER">Game Master</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={roleColors[user.role] || ''}>
                      {user.role === 'GAME_MASTER' ? 'Game Master' : user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
