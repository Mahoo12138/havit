import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';
import {
  Stack,
  StackTight,
  uiStyles,
} from '../components/ui';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { TextField } from '../components/ui/text-field';
import { useToast } from '../components/ui/use-toast';
import { authApi, setToken } from '../api/client';

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { systemStatus } = Route.useRouteContext();
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const toast = useToast();
  const isDemo = systemStatus.mode === 'demo';

  const [username, setUsername] = useState(isDemo ? 'admin@havit.local' : '');
  const [password, setPassword] = useState(isDemo ? 'havit-demo' : '');

  const login = useMutation({
    mutationFn: () => authApi.login({ username, password }),
    onSuccess: (data) => {
      setToken(data.token);
      nav({ to: redirect ?? '/' });
    },
    onError: () => toast.show(t('auth.loginFailed')),
  });

  return (
    <main className={`${uiStyles.center} auth-screen`}>
      <Card className="auth-card" padded>
        <Stack>
          <StackTight className={uiStyles.textCenter}>
            <h1 className={`${uiStyles.heading} page-heading`}>{t('auth.login')} Havit</h1>
            <p className={`${uiStyles.muted} page-kicker`}>
              {t('auth.loginSubtitle')}
            </p>
          </StackTight>

          {isDemo && (
            <Alert icon={<IconInfoCircle size={18} />}>
              {t('auth.demoHint')}
            </Alert>
          )}

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
          <Button
            disabled={!username || !password || login.isPending}
            onClick={() => login.mutate()}
          >
            {login.isPending ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </Stack>
      </Card>
    </main>
  );
}
