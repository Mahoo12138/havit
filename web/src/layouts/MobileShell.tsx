import { useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconChevronLeft,
  IconHome,
  IconBox,
  IconMap2,
  IconPlus,
  IconX,
  IconLogout,
  IconInfoCircle,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import { RowBetween } from '../components/ui';
import { Alert } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
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
    { to: '/settings', label: t('nav.profile', { defaultValue: '我的' }), icon: IconUser },
  ];
  const pageTitle = getMobileTitle(path, t);
  const showBack = isMobileSubPage(path);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    window.location.href = '/login';
  }

  function handlePrimaryAction() {
    const event = new CustomEvent<{ path: string; handled: boolean }>(
      'havit:mobile-primary-action',
      { detail: { path, handled: false } },
    );
    window.dispatchEvent(event);
    if (!event.detail.handled) navigate({ to: '/capture' });
  }

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: getMobileBackFallback(path) });
  }

  return (
    <div className={s.shell}>
      {/* Top Bar */}
      <header className={s.topBar}>
        {showBack && (
          <button
            type="button"
            className={s.topBarIconBtn}
            onClick={handleBack}
            aria-label={t('common.back')}
          >
            <IconChevronLeft size={22} />
          </button>
        )}
        <h1 className={s.topBarTitle}>{pageTitle}</h1>
        <div className={s.topBarActions}>
          <button
            type="button"
            className={s.topBarIconBtn}
            onClick={() => navigate({ to: '/search' })}
            aria-label={t('common.search')}
          >
            <IconSearch size={20} />
          </button>
          <button
            type="button"
            className={s.topBarIconBtn}
            onClick={handlePrimaryAction}
            aria-label={t('nav.capture')}
          >
            <IconPlus size={21} />
          </button>
        </div>
        <button
          type="button"
          className={s.topBarAvatar}
          onClick={() => setDrawerOpen(true)}
          aria-label={t('common.toggleNav')}
        >
          {initials}
        </button>
      </header>

      {/* Main Content */}
      <ScrollArea className={s.content}>
        <main className={s.contentInner}>
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
      </ScrollArea>

      {/* Bottom Navigation */}
      <nav className={s.bottomNav}>
        {bottomItems.slice(0, 2).map((item) => {
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
          onClick={handlePrimaryAction}
          aria-label={t('nav.capture')}
        >
          <IconPlus size={22} />
        </button>
        <span className={s.bottomNavCenterGap} aria-hidden />
        {bottomItems.slice(2).map((item) => {
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

function getMobileTitle(path: string, t: ReturnType<typeof useTranslation>['t']): string {
  if (path === '/') return t('dashboard.title');
  if (path.startsWith('/assets')) return t('nav.assets');
  if (path.startsWith('/locations')) return t('locations.title');
  if (path.startsWith('/items/')) return t('items.title');
  if (path.startsWith('/supplies/')) return t('nav.supplies');
  if (path.startsWith('/virtual-assets')) return t('nav.virtualAssets');
  if (path.startsWith('/tags')) return t('tags.title');
  if (path.startsWith('/credentials')) return t('nav.credentials');
  if (path.startsWith('/abnormal')) return t('abnormal.title');
  if (path.startsWith('/loans')) return t('nav.loans');
  if (path.startsWith('/essentials')) return t('nav.essentials');
  if (path.startsWith('/supplies')) return t('nav.supplies');
  if (path.startsWith('/categories')) return t('nav.categories');
  if (path.startsWith('/operations')) return t('nav.operations');
  if (path.startsWith('/import')) return t('nav.import');
  if (path.startsWith('/qr-print')) return t('nav.qrPrint');
  if (path.startsWith('/location-scan')) return t('nav.locationScan');
  if (path.startsWith('/settings')) return t('nav.settings');
  if (path.startsWith('/search')) return t('search.title');
  if (path.startsWith('/capture')) return t('nav.capture');
  return 'Havit';
}

const MOBILE_TOP_LEVEL_PATHS = new Set([
  '/',
  '/assets',
  '/locations',
  '/settings',
  '/virtual-assets',
  '/tags',
  '/credentials',
  '/abnormal',
  '/loans',
  '/essentials',
  '/supplies',
  '/categories',
  '/operations',
]);

function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function isMobileSubPage(path: string): boolean {
  return !MOBILE_TOP_LEVEL_PATHS.has(normalizePath(path));
}

function getMobileBackFallback(path: string): '/' | '/assets' | '/locations' | '/settings' {
  if (path.startsWith('/items/')) return '/assets';
  if (path.startsWith('/locations') || path.startsWith('/qr-print') || path.startsWith('/location-scan')) {
    return '/locations';
  }
  if (path.startsWith('/settings')) return '/settings';
  return '/';
}
