import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconUserPlus, IconLock } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Dialog,
  Spinner,
  ScrollArea,
  SelectField,
  Stack,
  StackTight,
  Tabs,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { DataCard, FeatureHeader } from '../features/m2/components';
import {
  authApi,
  usersApi,
  systemConfigsApi,
  preferencesApi,
  type User,
  type SystemConfig,
  type UserPreferences,
} from '../api/client';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
  });

  const isOwner = me?.role === 'owner';

  const tabs = [
    { key: 'preferences', label: t('settings.tabs.preferences') },
    ...(isOwner
      ? [
          { key: 'system', label: t('settings.tabs.system') },
          { key: 'members', label: t('settings.tabs.members') },
        ]
      : []),
  ];

  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <Stack>
      <FeatureHeader
        title={t('settings.title')}
        description={t('settings.description')}
      />
      <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === 'preferences' && <PreferencesTab />}
      {activeTab === 'system' && isOwner && <SystemConfigTab />}
      {activeTab === 'members' && isOwner && (
        <UserManagement currentUserId={me?.id ?? ''} />
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Preferences tab
// ---------------------------------------------------------------------------

function PreferencesTab() {
  const { t } = useTranslation();
  const toast = useToast();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<UserPreferences>) => preferencesApi.update(body),
    onSuccess: () => toast.show(t('settings.prefsSaved')),
    onError: () => toast.show(t('settings.prefsSaveFailed')),
  });

  const [local, setLocal] = useState<Partial<UserPreferences>>({});

  if (isLoading || !prefs) return <Spinner />;

  const merged: UserPreferences = { ...prefs, ...local };

  function field<K extends keyof UserPreferences>(key: K) {
    return {
      value: String(merged[key] ?? ''),
      onChange: (e: { currentTarget: { value: string } }) =>
        setLocal((prev) => ({ ...prev, [key]: e.currentTarget.value as UserPreferences[K] })),
    };
  }

  function save() {
    mutation.mutate(local);
    setLocal({});
  }

  return (
    <Stack>
      <DataCard title={t('settings.prefs.display')}>
        <Stack>
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
          <TextField
            label={t('settings.prefs.currency')}
            {...field('default_currency')}
          />
        </Stack>
      </DataCard>

      <DataCard title={t('settings.prefs.behavior')}>
        <Stack>
          <SelectField
            label={t('settings.prefs.homeView')}
            options={[
              { value: 'spaces', label: t('settings.prefs.homeSpaces') },
              { value: 'edc', label: t('settings.prefs.homeEdc') },
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
            onChange={(e) =>
              setLocal((prev) => ({
                ...prev,
                show_archived_in_search: e.currentTarget.value === 'true',
              }))
            }
          />
        </Stack>
      </DataCard>

      <DataCard title={t('settings.prefs.notifications')}>
        <Stack>
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
        </Stack>
      </DataCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="primary"
          disabled={Object.keys(local).length === 0 || mutation.isPending}
          onClick={save}
        >
          {t('common.save')}
        </Button>
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// System config tab (owner-only)
// ---------------------------------------------------------------------------

function SystemConfigTab() {
  const { t } = useTranslation();
  const toast = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => systemConfigsApi.list(),
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      systemConfigsApi.update(key, value),
    onSuccess: (_data, vars) => {
      toast.show(t('settings.configSaved'));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[vars.key];
        return next;
      });
      refetch();
    },
    onError: () => toast.show(t('settings.configSaveFailed')),
  });

  if (isLoading || !data) return <Spinner />;

  const configs = data.configs;

  function groupConfigs(prefix: string) {
    return configs.filter((c) => c.key.startsWith(prefix));
  }

  function renderConfigField(cfg: SystemConfig) {
    const isSensitive = cfg.type === 'sensitive';
    const isLocked = !cfg.can_edit;
    const isRevealed = revealed[cfg.key];
    const draftValue = drafts[cfg.key];
    const displayValue =
      draftValue !== undefined
        ? draftValue
        : isSensitive && !isRevealed
        ? cfg.value
        : cfg.value;

    const label = t(`settings.system.keys.${cfg.key}`, { defaultValue: cfg.key });

    return (
      <div key={cfg.key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          {cfg.type === 'bool' || cfg.type === 'enum' ? (
            <SelectField
              label={label}
              disabled={isLocked}
              options={
                cfg.type === 'bool'
                  ? [
                      { value: 'true', label: t('common.yes') },
                      { value: 'false', label: t('common.no') },
                    ]
                  : (cfg.options ?? []).map((o) => ({ value: o, label: o }))
              }
              value={draftValue ?? cfg.value}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [cfg.key]: e.currentTarget.value }))
              }
            />
          ) : (
            <TextField
              label={label}
              disabled={isLocked}
              type={isSensitive && !isRevealed ? 'password' : 'text'}
              value={displayValue}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [cfg.key]: e.target.value }))
              }
            />
          )}
          {isLocked && (
            <span className={uiStyles.muted} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <IconLock size={12} />
              {t('settings.envLocked')}
            </span>
          )}
        </div>
        {isSensitive && !isLocked && (
          <Button
            variant="quiet"
            onClick={() => setRevealed((prev) => ({ ...prev, [cfg.key]: !prev[cfg.key] }))}
          >
            {isRevealed ? t('settings.system.hide') : t('settings.system.reveal')}
          </Button>
        )}
        {!isLocked && (
          <Button
            variant="primary"
            disabled={draftValue === undefined || draftValue === cfg.value || saveMutation.isPending}
            onClick={() => saveMutation.mutate({ key: cfg.key, value: draftValue ?? cfg.value })}
          >
            {t('common.save')}
          </Button>
        )}
      </div>
    );
  }

  const infraKeys = configs.filter(
    (c) => c.key.startsWith('storage.') || c.key.startsWith('auth.')
  );

  return (
    <Stack>
      <DataCard title={t('settings.system.aiSection')}>
        <Stack>
          {groupConfigs('ai.').map(renderConfigField)}
        </Stack>
      </DataCard>

      <DataCard title={t('settings.system.notifySection')}>
        <Stack>
          {groupConfigs('notify.').map(renderConfigField)}
        </Stack>
      </DataCard>

      <DataCard title={t('settings.system.infraSection')}>
        <Stack>
          {infraKeys.map(renderConfigField)}
        </Stack>
      </DataCard>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Members tab (owner-only)
// ---------------------------------------------------------------------------

function UserManagement({ currentUserId }: { currentUserId: string }) {
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

  return (
    <>
      <DataCard
        title={t('settings.users')}
        meta={
          <Button variant="subtle" leftSection={<IconUserPlus size={14} />} onClick={() => setAddOpen(true)}>
            {t('settings.addMember')}
          </Button>
        }
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <ScrollArea className={uiStyles.tableWrap}>
            <table className={uiStyles.table}>
              <thead>
                <tr>
                  <th className={uiStyles.th}>{t('settings.username')}</th>
                  <th className={uiStyles.th}>{t('settings.role')}</th>
                  <th className={uiStyles.th}>{t('settings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr className={uiStyles.tableRow} key={user.id}>
                    <td className={uiStyles.td}>
                      <StackTight>
                        <strong>{user.username}</strong>
                        {user.id === currentUserId && (
                          <span className={uiStyles.muted}>({t('settings.you')})</span>
                        )}
                      </StackTight>
                    </td>
                    <td className={uiStyles.td}>
                      <Badge>{user.role}</Badge>
                    </td>
                    <td className={uiStyles.td}>
                      {user.id !== currentUserId && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="quiet"
                            onClick={() =>
                              roleMutation.mutate({
                                id: user.id,
                                role: user.role === 'owner' ? 'member' : 'owner',
                              })
                            }
                            disabled={roleMutation.isPending}
                          >
                            {user.role === 'owner' ? t('settings.demoteToMember') : t('settings.promoteToOwner')}
                          </Button>
                          <Button
                            variant="quiet"
                            leftSection={<IconTrash size={14} />}
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(user.id)}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </DataCard>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('settings.addMember')}
      >
        <Stack>
          <TextField
            label={t('settings.username')}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <TextField
            label={t('settings.password')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
    </>
  );
}
