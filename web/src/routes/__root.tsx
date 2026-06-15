import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { type QueryClient, useQuery } from '@tanstack/react-query';
import {
  IconBarcode,
  IconBell,
  IconBox,
  IconBriefcase,
  IconClipboardList,
  IconCloudDownload,
  IconDatabaseExport,
  IconFileImport,
  IconHistory,
  IconHome,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLogout,
  IconMap2,
  IconMenu2,
  IconPrinter,
  IconQrcode,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconShoppingBag,
  IconTags,
  IconWorld,
  IconX,
} from '@tabler/icons-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  RowBetween,
  ScrollArea,
  uiStyles,
} from '../components/ui';
import {
  authApi,
  clearToken,
  getToken,
  systemApi,
  type SystemStatus,
} from '../api/client';

interface RouterContext {
  queryClient: QueryClient;
}

const PUBLIC_PATHS = new Set(['/login', '/setup']);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.fetchQuery({
      queryKey: ['system', 'status'],
      queryFn: () => systemApi.status(),
      staleTime: Infinity,
    });

    if (
      status.mode === 'release' &&
      status.needs_setup &&
      location.pathname !== '/setup'
    ) {
      throw redirect({ to: '/setup' });
    }

    if (!status.needs_setup && location.pathname === '/setup') {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }

    const isPublic = PUBLIC_PATHS.has(location.pathname);
    if (!isPublic && !getToken()) {
      throw redirect({ to: '/login', search: { redirect: location.pathname } });
    }

    return { systemStatus: status };
  },
});

function RootLayout() {
  const { t } = useTranslation();
  const { systemStatus } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthShell = PUBLIC_PATHS.has(path);
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: !isAuthShell,
    retry: false,
    staleTime: 60_000,
  });

  if (isAuthShell) {
    return <Outlet />;
  }

  const navSections = [
    {
      label: t('navSection.overview'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: IconLayoutDashboard },
        { to: '/search', label: t('nav.search'), icon: IconSearch },
      ],
    },
    {
      label: t('navSection.assets'),
      items: [
        { to: '/assets', label: t('nav.assets'), icon: IconBox },
        { to: '/virtual-assets', label: t('nav.virtualAssets'), icon: IconCloudDownload },
        { to: '/locations', label: t('nav.locations'), icon: IconMap2 },
        { to: '/tags', label: t('nav.tags'), icon: IconTags },
        { to: '/consumables', label: t('nav.consumables'), icon: IconShoppingBag },
        { to: '/edc', label: t('nav.edc'), icon: IconBriefcase },
        { to: '/credentials', label: t('nav.credentials'), icon: IconReceipt },
      ],
    },
    {
      label: t('navSection.flow'),
      items: [
        { to: '/loans', label: t('nav.loans'), icon: IconClipboardList },
        { to: '/lifecycle', label: t('nav.lifecycle'), icon: IconHistory },
      ],
    },
    {
      label: t('navSection.maintenance'),
      items: [
        { to: '/capture', label: t('nav.capture'), icon: IconBarcode },
        { to: '/import', label: t('nav.import'), icon: IconFileImport },
        { to: '/qr-print', label: t('nav.qrPrint'), icon: IconPrinter },
        { to: '/location-scan', label: t('nav.locationScan'), icon: IconQrcode },
        { to: '/operations', label: t('nav.operations'), icon: IconDatabaseExport },
        { to: '/settings', label: t('nav.settings'), icon: IconSettings },
      ],
    },
  ];

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
          <button
            type="button"
            className={uiStyles.sidebarBrandClose}
            aria-label={t('common.close')}
            onClick={() => setOpened(false)}
          >
            <IconX size={16} />
          </button>
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
          <LanguageSwitcher />
          <div className={uiStyles.sidebarUser}>
            <span className={uiStyles.sidebarUserAvatar}>{initials}</span>
            <div className={uiStyles.sidebarUserMeta}>
              <span className={uiStyles.sidebarUserName}>{username}</span>
              <span className={uiStyles.sidebarUserMetaSub}>
                v{systemStatus.version}
              </span>
            </div>
            <button
              type="button"
              className={uiStyles.sidebarLogout}
              aria-label={t('auth.logout')}
              onClick={handleLogout}
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className={uiStyles.shellMainArea}>
        <header className={uiStyles.shellHeader}>
          <button
            type="button"
            className={uiStyles.burger}
            aria-label={t('common.toggleNav')}
            aria-expanded={opened}
            onClick={() => setOpened((value) => !value)}
          >
            <IconMenu2 size={18} />
          </button>

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
            <button type="button" className={uiStyles.headerIconBtn} aria-label={t('common.notifications')}>
              <IconBell size={18} />
              <span className={uiStyles.headerIconDot} aria-hidden />
            </button>
            <span className={uiStyles.headerAvatar} aria-label={username}>
              {initials}
            </span>
          </div>
        </header>

        <main className={uiStyles.shellMain}>
          <div className="page-shell">
            {systemStatus.mode === 'demo' && (
              <DemoBanner status={systemStatus} />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function DemoBanner({ status }: { status: SystemStatus }) {
  const { t } = useTranslation();
  return (
    <div className={uiStyles.bannerOffset}>
      <Alert icon={<IconInfoCircle size={18} />}>
        <RowBetween>
          <strong>{t('demo.mode')}</strong>
          <span>{t('demo.version')} {status.version}</span>
        </RowBetween>
        <div>{t('demo.description')}</div>
      </Alert>
    </div>
  );
}

function formatToday(t: ReturnType<typeof useTranslation>['t']) {
  const now = new Date();
  const weekdayKeys = [
    'date.weekday_sun', 'date.weekday_mon', 'date.weekday_tue',
    'date.weekday_wed', 'date.weekday_thu', 'date.weekday_fri',
    'date.weekday_sat',
  ] as const;
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${t(weekdayKeys[now.getDay()])} · ${m}/${d}`;
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
  ];

  return (
    <div style={{ padding: '0.5rem 0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--sidebar-muted, #7b8497)', fontSize: '0.75rem' }}>
        <IconWorld size={14} />
        <span>{t('settings.language')}</span>
      </div>
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          width: '100%',
          marginTop: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: 'var(--sidebar-panel, #212a3d)',
          color: 'var(--sidebar-text, #cbd2dc)',
          border: '1px solid var(--sidebar-line, rgba(255,255,255,0.06))',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
