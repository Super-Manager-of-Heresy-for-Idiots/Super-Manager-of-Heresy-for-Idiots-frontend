import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface AccountSwitcherProps {
  /** Called after any navigation so the host (mobile drawer) can close itself. */
  onNavigate?: () => void;
}

/**
 * Quick account switcher shared by the desktop rail and the mobile drawer.
 * Lists locally remembered logins. Because the session lives in HttpOnly cookies
 * (one per browser), switching can't be a silent token swap — it sends the user to
 * the login form pre-filled with the chosen username to re-authenticate.
 */
export function AccountSwitcher({ onNavigate }: AccountSwitcherProps) {
  const { user, savedAccounts, removeAccount } = useAuthStore();
  const navigate = useNavigate();
  const logout = useLogout();
  const t = useT();

  const others = savedAccounts.filter((a) => a.user.id !== user?.id);

  const handleSwitch = (username: string) => {
    navigate(`/login?add=1&user=${encodeURIComponent(username)}`);
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

  const handleLogout = async () => {
    await logout();
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
            onClick={() => handleSwitch(acc.user.username)}
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
