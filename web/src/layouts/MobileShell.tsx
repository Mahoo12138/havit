import { useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconHome,
  IconBox,
  IconMap2,
  IconPlus,
  IconSettings,
  IconMenu2,
  IconX,
  IconLogout,
  IconInfoCircle,
} from '@tabler/icons-react';
import { ScrollArea, RowBetween, Alert } from '../components/ui';
import { authApi, clearToken, type SystemStatus } from '../api/client';
import { getNavSections } from './nav-data';
import * as s from './mobileShell.css';

interface ShellProps {
  systemStatus: SystemStatus;
}

export function MobileShell({ systemStatus }: ShellProps) {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 60_000,
  });

  const username = me.data?.username ?? t('common.user');
  const initials = username.slice(0, 1).toUpperCase();
  const navSections = getNavSections(t);

  const bottomItems = [
    { to: '/', label: t('nav.dashboard'), icon: IconHome },
    { to: '/assets', label: t('nav.assets'), icon: IconBox },
    { to: '/locations', label: t('nav.locations'), icon: IconMap2 },
    { to: '/settings', label: t('nav.settings'), icon: IconSettings },
  ];

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
    <div className={s.shell}>
      {/* Top Bar */}
      <header className={s.topBar}>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center' }}
          aria-label={t('common.toggleNav')}
        >
          <IconMenu2 size={20} />
        </button>
        <input
          className={s.topBarSearch}
          type="search"
          placeholder={t('search.placeholder')}
          aria-label={t('common.search')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) navigate({ to: '/search', search: { q } as never });
            }
          }}
        />
        <span className={s.topBarAvatar} aria-label={username}>
          {initials}
        </span>
      </header>

      {/* Main Content */}
      <main className={s.content}>
        <div className="page-shell">
          {systemStatus.mode === 'demo' && (
            <div style={{ marginBottom: '0.75rem' }}>
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

      {/* Bottom Navigation */}
      <nav className={s.bottomNav}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = item.to === '/' ? path === '/' : path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={s.bottomNavItem}
              data-active={active}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* FAB */}
        <button
          type="button"
          className={s.fabBtn}
          onClick={() => navigate({ to: '/capture' })}
          aria-label={t('nav.capture')}
        >
          <IconPlus size={22} />
        </button>
      </nav>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            className={s.drawerScrim}
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className={s.drawer}>
            <div className={s.drawerHeader}>
              <span className={s.drawerBrandMark}>
                <IconHome size={17} />
              </span>
              <span className={s.drawerBrandText}>Havit</span>
              <button
                type="button"
                className={s.drawerCloseBtn}
                onClick={() => setDrawerOpen(false)}
                aria-label={t('common.close')}
              >
                <IconX size={16} />
              </button>
            </div>

            <ScrollArea className={s.drawerScroll}>
              {navSections.map((section, sectionIdx) => (
                <div key={section.label}>
                  {sectionIdx > 0 && (
                    <div className={s.drawerNavDivider} aria-hidden />
                  )}
                  <div className={s.drawerNavSectionLabel}>{section.label}</div>
                  <div className={s.drawerNavGroup}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        item.to === '/' ? path === '/' : path.startsWith(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={s.drawerNavLink}
                          data-active={active}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <span className={s.drawerNavLinkIcon}>
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

            <div className={s.drawerFooter}>
              <span className={s.drawerUserAvatar}>{initials}</span>
              <div className={s.drawerUserMeta}>
                <span className={s.drawerUserName}>{username}</span>
                <span className={s.drawerUserVersion}>
                  v{systemStatus.version}
                </span>
              </div>
              <button
                type="button"
                className={s.drawerLogoutBtn}
                onClick={handleLogout}
                aria-label={t('auth.logout')}
              >
                <IconLogout size={16} />
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
