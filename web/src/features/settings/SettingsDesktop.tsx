import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBell,
  IconChevronRight,
  IconCircleCheck,
  IconCopy,
  IconDatabase,
  IconEye,
  IconEyeOff,
  IconHomeCog,
  IconInfoCircle,
  IconKey,
  IconLoader2,
  IconLock,
  IconPalette,
  IconRobot,
  IconShieldOff,
  IconTrash,
  IconUser,
  IconUserCog,
  IconUserPlus,
  IconUsers,
  IconWebhook,
} from '@tabler/icons-react';
import { Stack } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import {
  apiTokensApi,
  authApi,
  preferencesApi,
  systemConfigsApi,
  usersApi,
  type APIToken,
  type APITokenCreated,
  type SystemConfig,
  type User,
  type UserPreferences,
} from '../../api/client';
import * as s from './settingsPage.css';

type SettingsTab = 'preferences' | 'api-tokens' | 'system' | 'members';
type SettingsPanel =
  | 'display'
  | 'behavior'
  | 'notifications'
  | 'tokens'
  | 'ai'
  | 'notify'
  | 'infra'
  | 'members';
type Tone = keyof typeof s.rowTone;
type SettingIcon = typeof IconBell;
type AutoSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type SettingsSearch = {
  tab?: string;
  panel?: string;
};

export type SettingsSearchChange = (
  next: { tab?: SettingsTab; panel?: SettingsPanel },
  options?: { replace?: boolean },
) => void;

type SettingsPageProps = {
  search: SettingsSearch;
  onSearchChange: SettingsSearchChange;
};

type PanelDefinition = {
  key: SettingsPanel;
  tab: SettingsTab;
  section: 'personal' | 'security' | 'system' | 'members';
  titleKey: string;
  descriptionKey: string;
  icon: SettingIcon;
  tone: Tone;
  ownerOnly?: boolean;
};

const PANEL_DEFS: PanelDefinition[] = [
  {
    key: 'display',
    tab: 'preferences',
    section: 'personal',
    titleKey: 'settings.prefs.display',
    descriptionKey: 'settings.summaries.display',
    icon: IconPalette,
    tone: 'blue',
  },
  {
    key: 'behavior',
    tab: 'preferences',
    section: 'personal',
    titleKey: 'settings.prefs.behavior',
    descriptionKey: 'settings.summaries.behavior',
    icon: IconHomeCog,
    tone: 'green',
  },
  {
    key: 'notifications',
    tab: 'preferences',
    section: 'personal',
    titleKey: 'settings.prefs.notifications',
    descriptionKey: 'settings.summaries.notifications',
    icon: IconWebhook,
    tone: 'violet',
  },
  {
    key: 'tokens',
    tab: 'api-tokens',
    section: 'security',
    titleKey: 'settings.tokens.title',
    descriptionKey: 'settings.summaries.tokensEmpty',
    icon: IconKey,
    tone: 'orange',
  },
  {
    key: 'ai',
    tab: 'system',
    section: 'system',
    titleKey: 'settings.system.aiSection',
    descriptionKey: 'settings.summaries.systemAi',
    icon: IconRobot,
    tone: 'violet',
    ownerOnly: true,
  },
  {
    key: 'notify',
    tab: 'system',
    section: 'system',
    titleKey: 'settings.system.notifySection',
    descriptionKey: 'settings.summaries.systemNotify',
    icon: IconWebhook,
    tone: 'green',
    ownerOnly: true,
  },
  {
    key: 'infra',
    tab: 'system',
    section: 'system',
    titleKey: 'settings.system.infraSection',
    descriptionKey: 'settings.summaries.systemInfra',
    icon: IconDatabase,
    tone: 'blue',
    ownerOnly: true,
  },
  {
    key: 'members',
    tab: 'members',
    section: 'members',
    titleKey: 'settings.users',
    descriptionKey: 'settings.summaries.memberRoles',
    icon: IconUsers,
    tone: 'blue',
    ownerOnly: true,
  },
];

const TAB_ORDER: SettingsTab[] = ['preferences', 'api-tokens', 'system', 'members'];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatTime(ts?: number) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function isSettingsTab(value?: string): value is SettingsTab {
  return value === 'preferences' || value === 'api-tokens' || value === 'system' || value === 'members';
}

function getPanels(isOwner: boolean) {
  return PANEL_DEFS.filter((panel) => !panel.ownerOnly || isOwner);
}

function firstPanelForTab(panels: PanelDefinition[], tab: SettingsTab) {
  return panels.find((panel) => panel.tab === tab);
}

function resolveSettingsState(search: SettingsSearch, isOwner: boolean) {
  const panels = getPanels(isOwner);
  const requestedPanel = panels.find((panel) => panel.key === search.panel);
  const requestedTab = isSettingsTab(search.tab) ? search.tab : undefined;
  const tabFromSearch =
    requestedTab && panels.some((panel) => panel.tab === requestedTab) ? requestedTab : undefined;
  const activeTab = requestedPanel?.tab ?? tabFromSearch ?? 'preferences';
  const activePanel = requestedPanel ?? firstPanelForTab(panels, activeTab) ?? panels[0];

  return { panels, activeTab, activePanel };
}

function useDebouncedAutoSave<T extends Record<string, unknown>>({
  changes,
  save,
  onError,
}: {
  changes: T;
  save: (changes: T) => Promise<void>;
  onError: () => void;
}) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const latestChanges = useRef(changes);
  const saveRef = useRef(save);

  useEffect(() => {
    latestChanges.current = changes;
  }, [changes]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const saveNow = useCallback(
    async (payload: T) => {
      if (!hasKeys(payload)) return;
      setStatus('saving');
      try {
        await saveRef.current(payload);
        setStatus('saved');
      } catch {
        setStatus('error');
        onError();
      }
    },
    [onError],
  );

  useEffect(() => {
    if (!hasKeys(changes)) return undefined;
    setStatus('dirty');
    const timeout = window.setTimeout(() => {
      void saveNow(changes);
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [changes, saveNow]);

  useEffect(
    () => () => {
      if (hasKeys(latestChanges.current)) {
        void saveRef.current(latestChanges.current);
      }
    },
    [],
  );

  return status;
}

function SettingsHeader() {
  const { t } = useTranslation();

  return (
    <header className={s.header}>
      <div className={s.headerCopy}>
        <h1 className={s.title}>{t('settings.centerTitle')}</h1>
        <p className={s.subtitle}>{t('settings.centerDescription')}</p>
      </div>
      <div className={s.headerIcons} aria-hidden>
        <span className={s.headerIcon}>
          <IconBell size={18} />
          <span className={s.notificationDot} />
        </span>
        <span className={s.headerIcon}>
          <IconInfoCircle size={18} />
        </span>
      </div>
    </header>
  );
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{title}</h2>
      <div className={s.sectionCard}>{children}</div>
    </section>
  );
}

function PanelListItem({
  panel,
  active,
  onSelect,
}: {
  panel: PanelDefinition;
  active?: boolean;
  onSelect: (panel: PanelDefinition) => void;
}) {
  const { t } = useTranslation();
  const Icon = panel.icon;

  return (
    <button
      type="button"
      className={cx(s.panelNavItem, active && s.panelNavItemActive)}
      onClick={() => onSelect(panel)}
      aria-current={active ? 'page' : undefined}
    >
      <span className={cx(s.rowIcon, s.rowTone[panel.tone])} aria-hidden>
        <Icon size={18} />
      </span>
      <span className={s.panelNavText}>
        <span className={s.rowTitle}>{t(panel.titleKey)}</span>
        <span className={s.rowDescription}>{t(panel.descriptionKey)}</span>
      </span>
      <IconChevronRight className={s.chevron} size={16} aria-hidden />
    </button>
  );
}

function EntityRow({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: SettingIcon;
  tone: Tone;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={s.row}>
      <span className={cx(s.rowIcon, s.rowTone[tone])} aria-hidden>
        <Icon size={18} />
      </span>
      <div className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        {description && <span className={s.rowDescription}>{description}</span>}
      </div>
      <div className={s.rowControl}>{children}</div>
      <IconChevronRight className={s.chevron} size={16} aria-hidden />
    </div>
  );
}

function AutoSaveIndicator({ status }: { status?: AutoSaveStatus }) {
  const { t } = useTranslation();

  if (!status || status === 'idle') return null;

  const icon =
    status === 'saving' || status === 'dirty' ? (
      <IconLoader2 size={14} />
    ) : status === 'error' ? (
      <IconAlertCircle size={14} />
    ) : (
      <IconCircleCheck size={14} />
    );

  return (
    <span className={cx(s.autoSave, status === 'error' && s.autoSaveError)}>
      {icon}
      {t(`settings.autosave.${status}`)}
    </span>
  );
}

function DetailShell({
  panel,
  status,
  children,
  actions,
}: {
  panel: PanelDefinition;
  status?: AutoSaveStatus;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const Icon = panel.icon;

  return (
    <section className={s.detailPanel}>
      <div className={s.detailHeader}>
        <span className={cx(s.rowIcon, s.rowTone[panel.tone])} aria-hidden>
          <Icon size={18} />
        </span>
        <div className={s.headerCopy}>
          <h2 className={s.detailTitle}>{t(panel.titleKey)}</h2>
          <p className={s.detailDescription}>{t(panel.descriptionKey)}</p>
        </div>
        <div className={s.detailMeta}>
          <AutoSaveIndicator status={status} />
          {actions}
        </div>
      </div>
      <div className={s.detailBody}>{children}</div>
    </section>
  );
}

function SettingsPageContent({ mobile = false, search, onSearchChange }: SettingsPageProps & { mobile?: boolean }) {
  const { t } = useTranslation();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
  });

  const isOwner = me?.role === 'owner';
  const { panels, activeTab, activePanel } = resolveSettingsState(search, isOwner);
  const tabs = TAB_ORDER.filter((tab) => panels.some((panel) => panel.tab === tab)).map((tab) => ({
    key: tab,
    label: t(`settings.tabs.${tab === 'api-tokens' ? 'apiTokens' : tab}`),
  }));

  function selectTab(nextTab: string) {
    if (!isSettingsTab(nextTab)) return;
    const nextPanel = firstPanelForTab(panels, nextTab);
    onSearchChange({ tab: nextTab, panel: nextPanel?.key });
  }

  function selectPanel(panel: PanelDefinition) {
    onSearchChange({ tab: panel.tab, panel: panel.key });
  }

  if (mobile) {
    return (
      <MobileSettingsPage
        panels={panels}
        activePanel={search.panel ? activePanel : undefined}
        currentUserId={me?.id ?? ''}
        onSelectPanel={selectPanel}
        onBack={() =>
          activePanel && onSearchChange({ tab: activePanel.tab, panel: undefined }, { replace: true })
        }
      />
    );
  }

  const tabPanels = panels.filter((panel) => panel.tab === activeTab);

  return (
    <div className={s.page}>
      <SettingsHeader />
      <div className={s.tabsWrap}>
        <TabsNav value={activeTab} onChange={selectTab} tabs={tabs} />
      </div>

      <div className={s.twoColumn}>
        <aside className={s.panelRail} aria-label={t('settings.sections.currentTab')}>
          {tabPanels.map((panel) => (
            <PanelListItem
              key={panel.key}
              panel={panel}
              active={panel.key === activePanel?.key}
              onSelect={selectPanel}
            />
          ))}
        </aside>
        <main className={s.detailColumn}>
          {activePanel && <PanelDetail panel={activePanel} currentUserId={me?.id ?? ''} />}
        </main>
      </div>
    </div>
  );
}

export function SettingsDesktop(props: SettingsPageProps) {
  return <SettingsPageContent {...props} />;
}

export { SettingsPageContent };

function MobileSettingsPage({
  panels,
  activePanel,
  currentUserId,
  onSelectPanel,
  onBack,
}: {
  panels: PanelDefinition[];
  activePanel?: PanelDefinition;
  currentUserId: string;
  onSelectPanel: (panel: PanelDefinition) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  if (activePanel) {
    return (
      <div className={s.pageMobile}>
        <div className={s.mobileDetailTop}>
          <Button variant="quiet" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            {t('settings.backToSettings')}
          </Button>
        </div>
        <PanelDetail panel={activePanel} currentUserId={currentUserId} />
      </div>
    );
  }

  const sections: PanelDefinition['section'][] = ['personal', 'security', 'system', 'members'];

  return (
    <div className={s.pageMobile}>
      <SettingsHeader />
      <div className={s.content}>
        {sections.map((section) => {
          const sectionPanels = panels.filter((panel) => panel.section === section);
          if (sectionPanels.length === 0) return null;
          return (
            <SettingSection key={section} title={t(`settings.sections.${section}`)}>
              {sectionPanels.map((panel) => (
                <PanelListItem key={panel.key} panel={panel} onSelect={onSelectPanel} />
              ))}
            </SettingSection>
          );
        })}
      </div>
    </div>
  );
}

function PanelDetail({
  panel,
  currentUserId,
}: {
  panel: PanelDefinition;
  currentUserId: string;
}) {
  switch (panel.key) {
    case 'display':
    case 'behavior':
    case 'notifications':
      return <PreferencesPanel panel={panel} />;
    case 'tokens':
      return <APITokensPanel panel={panel} />;
    case 'ai':
    case 'notify':
    case 'infra':
      return <SystemConfigPanel panel={panel} />;
    case 'members':
      return <MembersPanel panel={panel} currentUserId={currentUserId} />;
  }
}

function preferencePanelKeys(panel: SettingsPanel): Array<keyof UserPreferences> {
  if (panel === 'display') return ['theme', 'date_format', 'default_currency'];
  if (panel === 'behavior') {
    return ['home_view', 'scan_behavior', 'default_visibility', 'show_archived_in_search'];
  }
  return ['personal_bark_key', 'personal_ntfy_topic'];
}

function PreferencesPanel({ panel }: { panel: PanelDefinition }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Partial<UserPreferences>>({});
  const keys = useMemo(() => preferencePanelKeys(panel.key), [panel.key]);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
  });

  const merged = prefs ? ({ ...prefs, ...draft } as UserPreferences) : undefined;
  const changes = useMemo(() => {
    if (!prefs) return {};
    return keys.reduce<Partial<UserPreferences>>((acc, key) => {
      if (draft[key] !== undefined && draft[key] !== prefs[key]) {
        acc[key] = draft[key] as never;
      }
      return acc;
    }, {});
  }, [draft, keys, prefs]);

  const save = useCallback(
    async (payload: Partial<UserPreferences>) => {
      const saved = await preferencesApi.update(payload);
      queryClient.setQueryData(['preferences'], saved);
      setDraft((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(payload) as Array<keyof UserPreferences>) {
          if (next[key] === payload[key]) delete next[key];
        }
        return next;
      });
    },
    [queryClient],
  );

  const status = useDebouncedAutoSave({
    changes,
    save,
    onError: () => toast.show(t('settings.autosave.failed')),
  });

  function field<K extends keyof UserPreferences>(key: K) {
    return {
      value: String(merged?.[key] ?? ''),
      onChange: (event: { currentTarget: { value: string } }) =>
        setDraft((prev) => ({
          ...prev,
          [key]: event.currentTarget.value as UserPreferences[K],
        })),
    };
  }

  if (isLoading || !prefs || !merged) {
    return (
      <DetailShell panel={panel}>
        <Spinner />
      </DetailShell>
    );
  }

  return (
    <DetailShell panel={panel} status={status}>
      <div className={s.detailCard}>
        {panel.key === 'display' && (
          <div className={s.formGrid}>
            <SelectField
              label={t('settings.prefs.theme')}
              options={[
                { value: 'system', label: t('settings.prefs.themeSystem') },
                { value: 'light', label: t('settings.prefs.themeLight') },
                { value: 'dark', label: t('settings.prefs.themeDark') },
              ]}
              {...field('theme')}
            />
            <SelectField
              label={t('settings.prefs.dateFormat')}
              options={[
                { value: 'relative', label: t('settings.prefs.dateRelative') },
                { value: 'absolute', label: t('settings.prefs.dateAbsolute') },
              ]}
              {...field('date_format')}
            />
            <TextField label={t('settings.prefs.currency')} {...field('default_currency')} />
          </div>
        )}

        {panel.key === 'behavior' && (
          <div className={s.formGrid}>
            <SelectField
              label={t('settings.prefs.homeView')}
              options={[
                { value: 'spaces', label: t('settings.prefs.homeSpaces') },
                { value: 'essentials', label: t('settings.prefs.homeEssentials') },
                { value: 'restock', label: t('settings.prefs.homeRestock') },
              ]}
              {...field('home_view')}
            />
            <SelectField
              label={t('settings.prefs.scanBehavior')}
              options={[
                { value: 'confirm', label: t('settings.prefs.scanConfirm') },
                { value: 'silent', label: t('settings.prefs.scanSilent') },
              ]}
              {...field('scan_behavior')}
            />
            <SelectField
              label={t('settings.prefs.defaultVisibility')}
              options={[
                { value: 'shared', label: t('settings.prefs.visibilityShared') },
                { value: 'private', label: t('settings.prefs.visibilityPrivate') },
              ]}
              {...field('default_visibility')}
            />
            <SelectField
              label={t('settings.prefs.showArchived')}
              options={[
                { value: 'false', label: t('common.no') },
                { value: 'true', label: t('common.yes') },
              ]}
              value={merged.show_archived_in_search ? 'true' : 'false'}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  show_archived_in_search: event.currentTarget.value === 'true',
                }))
              }
            />
          </div>
        )}

        {panel.key === 'notifications' && (
          <div className={s.formGrid}>
            <TextField
              label={t('settings.prefs.barkKey')}
              placeholder={t('settings.prefs.barkKeyHint')}
              {...field('personal_bark_key')}
            />
            <TextField
              label={t('settings.prefs.ntfyTopic')}
              placeholder={t('settings.prefs.ntfyTopicHint')}
              {...field('personal_ntfy_topic')}
            />
          </div>
        )}
      </div>
    </DetailShell>
  );
}

function APITokensPanel({ panel }: { panel: PanelDefinition }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExpiry, setNewExpiry] = useState('0');
  const [createdToken, setCreatedToken] = useState<APITokenCreated | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: () => apiTokensApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const expiresAt =
        newExpiry === '0' ? undefined : Math.floor(Date.now() / 1000) + Number(newExpiry);
      return apiTokensApi.create({ name: newName, expires_at: expiresAt });
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setCreateOpen(false);
      setNewName('');
      setNewExpiry('0');
      setCreatedToken(token);
    },
    onError: () => toast.show(t('settings.tokens.createFailed')),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiTokensApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      toast.show(t('settings.tokens.revoked'));
    },
    onError: () => toast.show(t('settings.tokens.revokeFailed')),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => apiTokensApi.revokeAllSessions(),
    onSuccess: () => toast.show(t('settings.tokens.allSessionsRevoked')),
    onError: () => toast.show(t('settings.tokens.revokeFailed')),
  });

  const tokens: APIToken[] = data?.tokens ?? [];

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    toast.show(t('settings.tokens.copied'));
  }

  function isExpired(token: APIToken) {
    return token.expires_at ? token.expires_at < Math.floor(Date.now() / 1000) : false;
  }

  function statusBadge(token: APIToken) {
    if (isExpired(token)) return <Badge>{t('settings.tokens.expired')}</Badge>;
    if (token.expires_at) {
      return <Badge>{t('settings.tokens.expiresAt', { date: formatTime(token.expires_at) })}</Badge>;
    }
    return <Badge>{t('settings.tokens.noExpiry')}</Badge>;
  }

  return (
    <DetailShell
      panel={panel}
      actions={
        <div className={s.actionRow}>
          <Button
            variant="quiet"
            leftSection={<IconShieldOff size={14} />}
            disabled={revokeAllMutation.isPending}
            onClick={() => revokeAllMutation.mutate()}
          >
            {t('settings.tokens.revokeAllSessions')}
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconKey size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            {t('settings.tokens.create')}
          </Button>
        </div>
      }
    >
      <div className={s.sectionCard}>
        {isLoading ? (
          <div className={s.empty}>
            <Spinner />
          </div>
        ) : tokens.length === 0 ? (
          <div className={s.empty}>{t('settings.tokens.empty')}</div>
        ) : (
          tokens.map((token) => (
            <EntityRow
              key={token.id}
              icon={IconUserCog}
              tone="neutral"
              title={token.name}
              description={
                <>
                  {t('settings.tokens.createdAt')}: {formatTime(token.created_at)} ·{' '}
                  {t('settings.tokens.lastUsed')}: {formatTime(token.last_used_at)}
                </>
              }
            >
              <div className={s.actionRow}>
                {statusBadge(token)}
                <Button
                  variant="quiet"
                  leftSection={<IconTrash size={14} />}
                  disabled={revokeMutation.isPending}
                  onClick={() => revokeMutation.mutate(token.id)}
                >
                  {t('settings.tokens.revoke')}
                </Button>
              </div>
            </EntityRow>
          ))
        )}
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title={t('settings.tokens.create')}>
        <Stack>
          <TextField
            label={t('settings.tokens.name')}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t('settings.tokens.namePlaceholder')}
          />
          <SelectField
            label={t('settings.tokens.expiry')}
            value={newExpiry}
            onChange={(event) => setNewExpiry(event.currentTarget.value)}
            options={[
              { value: '0', label: t('settings.tokens.never') },
              { value: '2592000', label: t('settings.tokens.days30') },
              { value: '7776000', label: t('settings.tokens.days90') },
              { value: '31536000', label: t('settings.tokens.year1') },
            ]}
          />
          <div className={s.dialogActions}>
            <Button variant="subtle" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={!newName || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {t('settings.tokens.create')}
            </Button>
          </div>
        </Stack>
      </Dialog>

      <Dialog
        open={!!createdToken}
        onClose={() => setCreatedToken(null)}
        title={t('settings.tokens.createdTitle')}
      >
        <Stack>
          <p className={s.rowDescription}>{t('settings.tokens.createdHint')}</p>
          <div className={s.tokenSecret}>{createdToken?.plain_token}</div>
          <div className={s.dialogActions}>
            <Button
              variant="primary"
              leftSection={<IconCopy size={14} />}
              onClick={() => copyToClipboard(createdToken?.plain_token ?? '')}
            >
              {t('settings.tokens.copy')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </DetailShell>
  );
}

function configPanelFilter(panel: SettingsPanel, configs: SystemConfig[]) {
  if (panel === 'ai') return configs.filter((config) => config.key.startsWith('ai.'));
  if (panel === 'notify') return configs.filter((config) => config.key.startsWith('notify.'));
  return configs.filter((config) => config.key.startsWith('storage.') || config.key.startsWith('auth.'));
}

function SystemConfigPanel({ panel }: { panel: PanelDefinition }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => systemConfigsApi.list(),
  });

  const configs = useMemo(
    () => configPanelFilter(panel.key, data?.configs ?? []),
    [data?.configs, panel.key],
  );

  const changes = useMemo(
    () =>
      configs.reduce<Record<string, string>>((acc, config) => {
        const draft = drafts[config.key];
        if (draft !== undefined && draft !== config.value) acc[config.key] = draft;
        return acc;
      }, {}),
    [configs, drafts],
  );

  const save = useCallback(
    async (payload: Record<string, string>) => {
      const updated = await Promise.all(
        Object.entries(payload).map(([key, value]) => systemConfigsApi.update(key, value)),
      );
      queryClient.setQueryData<{ configs: SystemConfig[] }>(['system-configs'], (old) => {
        if (!old) return old;
        return {
          configs: old.configs.map((config) => {
            const next = updated.find((item) => item.key === config.key);
            return next ?? config;
          }),
        };
      });
      setDrafts((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(payload)) {
          if (next[key] === value) delete next[key];
        }
        return next;
      });
    },
    [queryClient],
  );

  const status = useDebouncedAutoSave({
    changes,
    save,
    onError: () => toast.show(t('settings.autosave.failed')),
  });

  if (isLoading || !data) {
    return (
      <DetailShell panel={panel}>
        <Spinner />
      </DetailShell>
    );
  }

  return (
    <DetailShell panel={panel} status={status}>
      <div className={s.detailCard}>
        <div className={s.configList}>
          {configs.map((config) => {
            const isSensitive = config.type === 'sensitive';
            const isLocked = !config.can_edit;
            const isRevealed = !!revealed[config.key];
            const label = t(`settings.system.keys.${config.key}`, { defaultValue: config.key });
            const value = drafts[config.key] ?? config.value;

            return (
              <div className={s.configField} key={config.key}>
                <div className={s.configFieldText}>
                  <span className={s.rowTitle}>{label}</span>
                  <span className={s.rowDescription}>
                    {config.description || config.key}
                    {isLocked && (
                      <>
                        {' '}
                        <span className={s.inlineMeta}>
                          <IconLock size={12} />
                          {t('settings.envLocked')}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className={s.configFieldControl}>
                  {config.type === 'bool' || config.type === 'enum' ? (
                    <SelectField
                      label={label}
                      disabled={isLocked}
                      options={
                        config.type === 'bool'
                          ? [
                              { value: 'true', label: t('common.yes') },
                              { value: 'false', label: t('common.no') },
                            ]
                          : (config.options ?? []).map((option) => ({ value: option, label: option }))
                      }
                      value={value}
                      onChange={(event) =>
                        setDrafts((prev) => ({ ...prev, [config.key]: event.currentTarget.value }))
                      }
                    />
                  ) : (
                    <TextField
                      label={label}
                      disabled={isLocked}
                      type={isSensitive && !isRevealed ? 'password' : 'text'}
                      value={value}
                      onChange={(event) =>
                        setDrafts((prev) => ({ ...prev, [config.key]: event.target.value }))
                      }
                    />
                  )}
                  {isSensitive && !isLocked && (
                    <Button
                      variant="quiet"
                      leftSection={isRevealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                      onClick={() =>
                        setRevealed((prev) => ({ ...prev, [config.key]: !prev[config.key] }))
                      }
                    >
                      {isRevealed ? t('settings.system.hide') : t('settings.system.reveal')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DetailShell>
  );
}

function MemberRow({
  user,
  isCurrentUser,
  pending,
  onToggleRole,
  onDelete,
}: {
  user: User;
  isCurrentUser: boolean;
  pending: boolean;
  onToggleRole: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const initials = user.username.slice(0, 1).toUpperCase();

  return (
    <div className={s.row}>
      <span className={isCurrentUser ? s.memberAvatarCurrent : s.memberAvatar} aria-hidden>
        {isCurrentUser ? initials : <IconUser size={18} />}
      </span>
      <div className={s.rowText}>
        <span className={s.rowTitle}>{user.username}</span>
        <span className={s.rowDescription}>
          {isCurrentUser ? t('settings.you') : t('settings.summaries.memberRoles')}
        </span>
      </div>
      <div className={s.rowControl}>
        <div className={s.actionRow}>
          <Badge>{user.role}</Badge>
          {!isCurrentUser && (
            <>
              <Button variant="quiet" disabled={pending} onClick={onToggleRole}>
                {user.role === 'owner' ? t('settings.demoteToMember') : t('settings.promoteToOwner')}
              </Button>
              <Button
                variant="quiet"
                leftSection={<IconTrash size={14} />}
                disabled={pending}
                onClick={onDelete}
              >
                {t('common.delete')}
              </Button>
            </>
          )}
        </div>
      </div>
      <IconChevronRight className={s.chevron} size={16} aria-hidden />
    </div>
  );
}

function MembersPanel({
  panel,
  currentUserId,
}: {
  panel: PanelDefinition;
  currentUserId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({ username: newUsername, password: newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false);
      setNewUsername('');
      setNewPassword('');
      toast.show(t('settings.userCreated'));
    },
    onError: () => toast.show(t('settings.userCreateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.show(t('settings.userDeleted'));
    },
    onError: () => toast.show(t('settings.userDeleteFailed')),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.show(t('settings.roleUpdated'));
    },
    onError: () => toast.show(t('settings.roleUpdateFailed')),
  });

  const users: User[] = data?.users ?? [];
  const pending = roleMutation.isPending || deleteMutation.isPending;

  return (
    <DetailShell
      panel={panel}
      actions={
        <Button
          variant="subtle"
          leftSection={<IconUserPlus size={14} />}
          onClick={() => setAddOpen(true)}
        >
          {t('settings.addMember')}
        </Button>
      }
    >
      <div className={s.sectionCard}>
        {isLoading ? (
          <div className={s.empty}>
            <Spinner />
          </div>
        ) : (
          users.map((user) => (
            <MemberRow
              key={user.id}
              user={user}
              isCurrentUser={user.id === currentUserId}
              pending={pending}
              onToggleRole={() =>
                roleMutation.mutate({
                  id: user.id,
                  role: user.role === 'owner' ? 'member' : 'owner',
                })
              }
              onDelete={() => deleteMutation.mutate(user.id)}
            />
          ))
        )}
      </div>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title={t('settings.addMember')}>
        <Stack>
          <TextField
            label={t('settings.username')}
            value={newUsername}
            onChange={(event) => setNewUsername(event.target.value)}
          />
          <TextField
            label={t('settings.password')}
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <div className={s.dialogActions}>
            <Button variant="subtle" onClick={() => setAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={!newUsername || !newPassword || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {t('settings.createUser')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </DetailShell>
  );
}
