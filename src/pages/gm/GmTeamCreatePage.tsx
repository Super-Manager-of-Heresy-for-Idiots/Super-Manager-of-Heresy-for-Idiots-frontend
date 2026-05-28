import { useNavigate } from 'react-router-dom';
import { TeamForm } from '@/components/teams/TeamForm';
import { useCreateTeam } from '@/hooks/useTeams';

export default function GmTeamCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateTeam();

  const handleSubmit = (data: { name: string }) => {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        navigate(`/gm/teams/${response.data.id}`);
      },
    });
  };

  return (
    <TeamForm
      title="Create New Team"
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
    />
  );
}
