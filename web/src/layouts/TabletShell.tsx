import { useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconBell,
  IconHome,
  IconInfoCircle,
  IconLogout,
  IconMenu2,
  IconSearch,
  IconWorld,
  IconX,
} from '@tabler/icons-react';
import {
  RowBetween,
  Alert,
  uiStyles,
} from '../components/ui';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { SelectField } from '../components/ui/select-field';
import { authApi, clearToken, type SystemStatus } from '../api/client';
import { getNavSections, formatToday } from './nav-data';

interface ShellProps {
  systemStatus: SystemStatus;
}

export function TabletShell({ systemStatus }: ShellProps) {
  const { t, i18n } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

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
    <div className={uiStyles.shell}>
      {opened && (
        <div
          className={uiStyles.shellNavScrim}
          onClick={() => setOpened(false)}
          aria-hidden
        />
      )}
      <nav
        className={[
          uiStyles.shellNav,
          opened ? uiStyles.shellNavOpen : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={uiStyles.sidebarBrand}>
          <span className={uiStyles.sidebarBrandMark}>
            <IconHome size={17} />
          </span>
          <span className={uiStyles.sidebarBrandText}>Havit</span>
          <Button
            variant="subtle"
            className={uiStyles.sidebarBrandClose}
            aria-label={t('common.close')}
            onClick={() => setOpened(false)}
          >
            <IconX size={16} />
          </Button>
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
                      onClick={() => setOpened(false)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--sidebar-muted, #7b8497)', fontSize: '0.75rem' }}>
              <IconWorld size={14} />
              <span>{t('settings.language')}</span>
            </div>
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
            aria-expanded={opened}
            onClick={() => setOpened((v) => !v)}
          >
            <IconMenu2 size={18} />
          </Button>

          <form className={uiStyles.headerSearchWrap} onSubmit={handleSearchSubmit} role="search">
            <span className={uiStyles.headerSearchIcon} aria-hidden>
              <IconSearch size={16} />
            </span>
            <input
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
            <Button variant="subtle" className={uiStyles.headerIconBtn} aria-label={t('common.notifications')}>
              <IconBell size={18} />
              <span className={uiStyles.headerIconDot} aria-hidden />
            </Button>
            <span className={uiStyles.headerAvatar} aria-label={username}>
              {initials}
            </span>
          </div>
        </header>

        <main className={uiStyles.shellMain}>
          <div className="page-shell">
            {systemStatus.mode === 'demo' && (
              <div className={uiStyles.bannerOffset}>
                <Alert icon={<IconInfoCircle size={18} />}>
                  <RowBetween>
                    <strong>{t('demo.mode')}</strong>
                    <span>{t('demo.version')} {systemStatus.version}</span>
                  </RowBetween>
                  <div>{t('demo.description')}</div>
                </Alert>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
