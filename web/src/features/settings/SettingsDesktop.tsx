import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconUserPlus, IconLock, IconKey, IconCopy, IconShieldOff, IconUser } from '@tabler/icons-react';
import { useDevice } from '../../lib/device';
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
} from '../../components/ui';
import { DataCard, FeatureHeader } from '../m2/components';
import {
  authApi,
  usersApi,
  systemConfigsApi,
  preferencesApi,
  apiTokensApi,
  type User,
  type SystemConfig,
  type UserPreferences,
  type APIToken,
  type APITokenCreated,
} from '../../api/client';

export function SettingsDesktop() {
  const { t } = useTranslation();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
  });

  const isOwner = me?.role === 'owner';

  const tabs = [
    { key: 'preferences', label: t('settings.tabs.preferences') },
    { key: 'api-tokens', label: t('settings.tabs.apiTokens') },
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
      {activeTab === 'api-tokens' && <APITokensTab />}
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
// API Tokens tab
// ---------------------------------------------------------------------------

function APITokensTab() {
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
      const expiresAt = newExpiry === '0' ? undefined : Math.floor(Date.now() / 1000) + Number(newExpiry);
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
    navigator.clipboard.writeText(text);
    toast.show(t('settings.tokens.copied'));
  }

  function formatTime(ts?: number) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString();
  }

  function isExpired(token: APIToken) {
    return token.expires_at ? token.expires_at < Math.floor(Date.now() / 1000) : false;
  }

  return (
    <>
      <DataCard
        title={t('settings.tokens.title')}
        meta={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="quiet"
              leftSection={<IconShieldOff size={14} />}
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
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
        {isLoading ? (
          <Spinner />
        ) : tokens.length === 0 ? (
          <p className={uiStyles.muted}>{t('settings.tokens.empty')}</p>
        ) : (
          <ScrollArea className={uiStyles.tableWrap}>
            <table className={uiStyles.table}>
              <thead>
                <tr>
                  <th className={uiStyles.th}>{t('settings.tokens.name')}</th>
                  <th className={uiStyles.th}>{t('settings.tokens.status')}</th>
                  <th className={uiStyles.th}>{t('settings.tokens.createdAt')}</th>
                  <th className={uiStyles.th}>{t('settings.tokens.lastUsed')}</th>
                  <th className={uiStyles.th}>{t('settings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr className={uiStyles.tableRow} key={token.id}>
                    <td className={uiStyles.td}>
                      <strong>{token.name}</strong>
                    </td>
                    <td className={uiStyles.td}>
                      {isExpired(token) ? (
                        <Badge>{t('settings.tokens.expired')}</Badge>
                      ) : token.expires_at ? (
                        <Badge>{t('settings.tokens.expiresAt', { date: formatTime(token.expires_at) })}</Badge>
                      ) : (
                        <Badge>{t('settings.tokens.noExpiry')}</Badge>
                      )}
                    </td>
                    <td className={uiStyles.td}>{formatTime(token.created_at)}</td>
                    <td className={uiStyles.td}>{formatTime(token.last_used_at)}</td>
                    <td className={uiStyles.td}>
                      <Button
                        variant="quiet"
                        leftSection={<IconTrash size={14} />}
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(token.id)}
                      >
                        {t('settings.tokens.revoke')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </DataCard>

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('settings.tokens.create')}
      >
        <Stack>
          <TextField
            label={t('settings.tokens.name')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('settings.tokens.namePlaceholder')}
          />
          <SelectField
            label={t('settings.tokens.expiry')}
            value={newExpiry}
            onChange={(e) => setNewExpiry(e.currentTarget.value)}
            options={[
              { value: '0', label: t('settings.tokens.never') },
              { value: '2592000', label: t('settings.tokens.days30') },
              { value: '7776000', label: t('settings.tokens.days90') },
              { value: '31536000', label: t('settings.tokens.year1') },
            ]}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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

      {/* Token reveal dialog (shown once after creation) */}
      <Dialog
        open={!!createdToken}
        onClose={() => setCreatedToken(null)}
        title={t('settings.tokens.createdTitle')}
      >
        <Stack>
          <p className={uiStyles.muted}>{t('settings.tokens.createdHint')}</p>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: 'var(--color-bg-secondary, #f5f5f5)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              userSelect: 'all',
            }}
          >
            {createdToken?.plain_token}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
    </>
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
    mutationFn: async () => {
      const entries = Object.entries(drafts);
      await Promise.all(entries.map(([key, value]) => systemConfigsApi.update(key, value)));
    },
    onSuccess: () => {
      toast.show(t('settings.configSaved'));
      setDrafts({});
      refetch();
    },
    onError: () => toast.show(t('settings.configSaveFailed')),
  });

  const hasChanges = Object.keys(drafts).length > 0;

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
      {hasChanges && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      )}
    </Stack>
  );
}

function MemberCard({
  user, isCurrentUser, onToggleRole, onDelete, pending, t,
}: {
  user: User;
  isCurrentUser: boolean;
  onToggleRole: () => void;
  onDelete: () => void;
  pending: boolean;
  t: (key: string) => string;
}) {
  const initials = user.username.slice(0, 1).toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem', borderRadius: 'var(--havit-radius-3)',
      border: '1px solid var(--havit-line)', background: 'var(--havit-panel)',
    }}>
      <span style={{
        width: '2.25rem', height: '2.25rem', borderRadius: '999px',
        display: 'grid', placeItems: 'center', flex: '0 0 auto',
        background: isCurrentUser
          ? 'linear-gradient(135deg, var(--havit-accent), var(--havit-accent-hover))'
          : 'var(--havit-bg-soft)',
        color: isCurrentUser ? '#fff' : 'var(--havit-muted)',
        fontSize: '0.85rem', fontWeight: 700,
      }}>
        {isCurrentUser ? initials : <IconUser size={18} />}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--havit-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username}
          </span>
          {isCurrentUser && <span style={{ fontSize: '0.72rem', color: 'var(--havit-muted)' }}>({t('settings.you')})</span>}
        </div>
        <Badge>{user.role}</Badge>
      </div>
      {!isCurrentUser && (
        <div style={{ display: 'flex', gap: '0.25rem', flex: '0 0 auto' }}>
          <Button variant="quiet" onClick={onToggleRole} disabled={pending}>
            {user.role === 'owner' ? t('settings.demoteToMember') : t('settings.promoteToOwner')}
          </Button>
          <Button variant="quiet" onClick={onDelete} disabled={pending}>
            <IconTrash size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members tab (owner-only)
// ---------------------------------------------------------------------------

function UserManagement({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const device = useDevice();
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
        ) : device === 'mobile' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map((user) => (
              <MemberCard
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                onToggleRole={() =>
                  roleMutation.mutate({
                    id: user.id,
                    role: user.role === 'owner' ? 'member' : 'owner',
                  })
                }
                onDelete={() => deleteMutation.mutate(user.id)}
                pending={roleMutation.isPending || deleteMutation.isPending}
                t={t}
              />
            ))}
          </div>
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
