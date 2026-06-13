import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconUserPlus } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  Spinner,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { DataCard, FeatureHeader } from '../features/m2/components';
import { authApi, usersApi, type User } from '../api/client';

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

  return (
    <Stack>
      <FeatureHeader
        title={t('settings.title')}
        description={t('settings.description')}
        meta="owner only"
      />

      {isOwner ? (
        <UserManagement currentUserId={me?.id ?? ''} />
      ) : (
        <Alert>{t('settings.ownerOnly')}</Alert>
      )}
    </Stack>
  );
}

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
          <div className={uiStyles.tableWrap}>
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
          </div>
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
