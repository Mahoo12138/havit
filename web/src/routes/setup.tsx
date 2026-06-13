import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { authApi } from '../api/client';

export const Route = createFileRoute('/setup')({
  component: SetupPage,
});

function SetupPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const setup = useMutation({
    mutationFn: () => authApi.setup({ username, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'status'] });
      toast.show(t('auth.setupSuccess'));
      nav({ to: '/login', search: { redirect: undefined } });
    },
    onError: (e: Error) => toast.show(t('auth.setupFailed', { error: e.message })),
  });

  const passwordMismatch = confirm !== '' && password !== confirm;
  const canSubmit =
    username.length >= 2 && password.length >= 6 && !passwordMismatch;

  return (
    <main className={`${uiStyles.center} auth-screen`}>
      <Card className="auth-card">
        <Stack>
          <StackTight className={uiStyles.textCenter}>
            <h1 className={`${uiStyles.heading} page-heading`}>{t('auth.setupTitle')}</h1>
            <p className={uiStyles.muted}>
              {t('auth.setupWelcome')}
            </p>
          </StackTight>

          <Alert icon={<IconShieldCheck size={18} />}>
            {t('auth.setupOwnerHint')}
          </Alert>

          <TextField
            label={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <TextField
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <TextField
            label={t('auth.confirmPassword')}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            error={passwordMismatch ? t('auth.passwordMismatch') : null}
            required
          />
          <Button
            disabled={!canSubmit || setup.isPending}
            onClick={() => setup.mutate()}
          >
            {setup.isPending ? t('auth.creating') : t('auth.setupButton')}
          </Button>
        </Stack>
      </Card>
    </main>
  );
}
