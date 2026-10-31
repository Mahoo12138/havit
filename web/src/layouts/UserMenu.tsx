import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { IconLogout, IconUserCircle } from '@tabler/icons-react';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { authApi, clearPrivateCaches, clearToken } from '../api/client';
import * as s from './userMenu.css';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
];

interface UserMenuProps {
  username: string;
  nickname?: string;
  avatar?: string;
  version: string;
}

/**
 * Header avatar that opens the account panel: identity, language switch and
 * sign out. Kept out of the sidebar so the nav column ends with the menu.
 */
export function UserMenu({ username, nickname, avatar, version }: UserMenuProps) {
  const { t, i18n } = useTranslation();
  const displayName = nickname?.trim() || username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    await clearPrivateCaches();
    window.location.href = '/login';
  }

  return (
    <Popover>
      <PopoverTrigger className={s.trigger} aria-label={t('common.accountMenu')}>
        {avatar ? <img className={s.triggerImage} src={avatar} alt="" /> : initials}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8}>
        <div className={s.panel}>
          <div className={s.identity}>
            <span className={s.identityAvatar}>
              {avatar ? <img className={s.identityAvatarImage} src={avatar} alt="" /> : initials}
            </span>
            <div className={s.identityMeta}>
              <span className={s.identityName}>{displayName}</span>
              <span className={s.identityVersion}>{version}</span>
            </div>
          </div>

          <div className={s.language}>
            <span className={s.languageLabel}>{t('settings.language')}</span>
            <div
              className={s.languageSwitch}
              role="group"
              aria-label={t('settings.language')}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  className={s.languageOption}
                  data-active={activeLanguage === lang.value}
                  aria-pressed={activeLanguage === lang.value}
                  onClick={() => i18n.changeLanguage(lang.value)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/settings"
            search={{ tab: 'account', panel: 'profile' }}
            className={s.navItem}
          >
            <IconUserCircle size={16} />
            {t('auth.accountSettings')}
          </Link>

          <button type="button" className={s.logout} onClick={handleLogout}>
            <IconLogout size={16} />
            {t('auth.logout')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
