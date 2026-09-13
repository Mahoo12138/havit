import { useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconHome, IconLogout, IconMenu2, IconSearch } from '@tabler/icons-react';
import {
  uiStyles,
} from '../components/ui';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { SelectField } from '../components/ui/select-field';
import { authApi, clearToken, type SystemStatus } from '../api/client';
import { DemoBanner } from './DemoBanner';
import { getNavSections, formatToday } from './nav-data';
import { ThemeToggle } from '../lib/theme';
import { NotificationBell } from '../features/reminders/NotificationBell';

interface ShellProps {
  systemStatus: SystemStatus;
}

export function DesktopShell({ systemStatus }: ShellProps) {
  const { t, i18n } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [navCollapsed, setNavCollapsed] = useState(false);

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 60_000,
  });

  const navSections = getNavSections(t);
  const username = me.data?.username ?? t('common.user');
  const initials = username.slice(0, 1).toUpperCase();

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get('q') ?? '').trim();
    if (!q) return;
    navigate({ to: '/search', search: { q } as never });
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    window.location.href = '/login';
  }

  return (
    <div
      className={[
        uiStyles.shell,
        navCollapsed ? uiStyles.shellNavCollapsed : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className={uiStyles.shellNav}>
        <div className={uiStyles.sidebarBrand}>
          <span className={uiStyles.sidebarBrandMark}>
            <IconHome size={17} />
          </span>
          <span className={uiStyles.sidebarBrandText}>Havit</span>
        </div>

        <ScrollArea className={uiStyles.sidebarScroll}>
          {navSections.map((section, sectionIdx) => (
            <div key={section.label}>
              {sectionIdx > 0 && (
                <div className={uiStyles.navGroupDivider} aria-hidden />
              )}
              <div className={uiStyles.navSectionLabel}>{section.label}</div>
              <div className={uiStyles.navGroup}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.to === '/' ? path === '/' : path.startsWith(item.to);
                  return (
                    <Link
                      className={uiStyles.navLink}
                      data-active={active}
                      key={item.to}
                      to={item.to}
                    >
                      <span className={uiStyles.navLinkIcon}>
                        <Icon size={17} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className={uiStyles.sidebarFooter}>
          <div style={{ padding: '0.5rem 0.75rem' }}>
            <SelectField
              label={t('settings.language')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'zh-CN', label: '简体中文' },
              ]}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.currentTarget.value)}
            />
          </div>
          <div className={uiStyles.sidebarUser}>
            <span className={uiStyles.sidebarUserAvatar}>{initials}</span>
            <div className={uiStyles.sidebarUserMeta}>
              <span className={uiStyles.sidebarUserName}>{username}</span>
              <span className={uiStyles.sidebarUserMetaSub}>
                v{systemStatus.version}
              </span>
            </div>
            <Button
              variant="subtle"
              className={uiStyles.sidebarLogout}
              aria-label={t('auth.logout')}
              onClick={handleLogout}
            >
              <IconLogout size={16} />
            </Button>
          </div>
        </div>
      </nav>

      <div className={uiStyles.shellMainArea}>
        <header className={uiStyles.shellHeader}>
          <Button
            variant="subtle"
            className={uiStyles.burger}
            aria-label={t('common.toggleNav')}
            aria-expanded={!navCollapsed}
            onClick={() => setNavCollapsed((v) => !v)}
          >
            <IconMenu2 size={18} />
          </Button>

          <form className={uiStyles.headerSearchWrap} onSubmit={handleSearchSubmit} role="search">
            <span className={uiStyles.headerSearchIcon} aria-hidden>
              <IconSearch size={16} />
            </span>
            <Input
              className={uiStyles.headerSearchInput}
              name="q"
              type="search"
              placeholder={t('search.placeholder')}
              aria-label={t('common.search')}
            />
          </form>

          <div className={uiStyles.headerActions}>
            {systemStatus.mode === 'demo' && <Badge>{t('demo.badge')}</Badge>}
            <span className={uiStyles.shellHeaderDate}>{formatToday(t)}</span>
            <ThemeToggle iconClassName={uiStyles.headerIconBtn} />
            <NotificationBell iconClassName={uiStyles.headerIconBtn} />
            <span className={uiStyles.headerAvatar} aria-label={username}>
              {initials}
            </span>
          </div>
        </header>

        <main className={uiStyles.shellMain}>
          <div className="page-shell">
            {systemStatus.mode === 'demo' && (
              <DemoBanner version={systemStatus.version} />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
