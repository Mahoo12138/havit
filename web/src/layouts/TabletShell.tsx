import { useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconHome, IconMenu2, IconSearch } from '@tabler/icons-react';
import {
  uiStyles,
} from '../components/ui';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { authApi, type SystemStatus } from '../api/client';
import { DemoBanner } from './DemoBanner';
import { getNavSections, formatToday } from './nav-data';
import { NotificationBell } from '../features/reminders/NotificationBell';
import { ThemeToggle } from '../lib/theme';
import { UserMenu } from './UserMenu';

interface ShellProps {
  systemStatus: SystemStatus;
}

export function TabletShell({ systemStatus }: ShellProps) {
  const { t } = useTranslation();
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

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get('q') ?? '').trim();
    if (!q) return;
    navigate({ to: '/search', search: { q } as never });
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
            <UserMenu
              username={username}
              nickname={me.data?.nickname}
              avatar={me.data?.avatar}
              version={systemStatus.version}
            />
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
