import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { getRoleRedirectPath } from '@/lib/utils';

interface AccountSwitcherProps {
  /** Called after any navigation so the host (mobile drawer) can close itself. */
  onNavigate?: () => void;
}

/**
 * Quick account switcher shared by the desktop rail and the mobile drawer.
 * Lists locally remembered logins, lets the user switch without re-entering
 * credentials, add another account, or sign out of the current one.
 */
export function AccountSwitcher({ onNavigate }: AccountSwitcherProps) {
  const { user, savedAccounts, switchAccount, removeAccount, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

  const others = savedAccounts.filter((a) => a.user.id !== user?.id);

  const handleSwitch = (userId: string) => {
    switchAccount(userId);
    queryClient.clear();
    const next = useAuthStore.getState().user;
    navigate(getRoleRedirectPath(next?.role ?? ''));
    onNavigate?.();
  };

  const handleRemove = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    removeAccount(userId);
  };

  const handleAdd = () => {
    navigate('/login?add=1');
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login');
    onNavigate?.();
  };

  return (
    <div className="ao-acct">
      <div className="ao-overline ao-acct-section">{t('acct.section')}</div>

      {/* Current account */}
      {user && (
        <div className="ao-acct-current">
          <span className="ao-acct-avatar">
            <Rune kind="helm" size={16} color="var(--gold)" />
          </span>
          <span className="ao-acct-meta">
            <span className="ao-acct-name">{user.username}</span>
            <span className="ao-acct-role">{t(`role.${user.role}`)}</span>
          </span>
          <span className="ao-acct-badge">{t('acct.active')}</span>
        </div>
      )}

      {/* Other saved accounts */}
      {others.map((acc) => (
        <div key={acc.user.id} className="ao-acct-row">
          <button
            type="button"
            onClick={() => handleSwitch(acc.user.id)}
            className="ao-acct-pick"
            title={t('acct.switch')}
          >
            <span className="ao-acct-avatar ao-acct-avatar--dim">
              <Rune kind="helm" size={16} color="var(--ink-faint)" />
            </span>
            <span className="ao-acct-meta">
              <span className="ao-acct-name">{acc.user.username}</span>
              <span className="ao-acct-role">{t(`role.${acc.user.role}`)}</span>
            </span>
          </button>
          <button
            type="button"
            className="ao-acct-remove"
            aria-label={t('acct.remove')}
            title={t('acct.remove')}
            onClick={(e) => handleRemove(e, acc.user.id)}
          >
            <Rune kind="x" size={12} color="var(--ink-faint)" />
          </button>
        </div>
      ))}

      {/* Actions */}
      <div className="ao-acct-actions">
        <button type="button" onClick={handleAdd} className="ao-acct-action">
          <Rune kind="plus" size={13} />
          {t('acct.add')}
        </button>
        <button type="button" onClick={handleLogout} className="ao-acct-action ao-acct-action--danger">
          <Rune kind="x" size={13} />
          {t('topbar.logout')}
        </button>
      </div>
    </div>
  );
}
