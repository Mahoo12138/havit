import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { IconInfoCircle } from '@tabler/icons-react';
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
import { authApi, setToken } from '../api/client';

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
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
    onError: () => toast.show('用户名或密码错误'),
  });

  return (
    <main className={`${uiStyles.center} auth-screen`}>
      <Card className="auth-card">
        <Stack>
          <StackTight className={uiStyles.textCenter}>
            <h1 className={`${uiStyles.heading} page-heading`}>登录 Havit</h1>
            <p className={`${uiStyles.muted} page-kicker`}>
              个人与家庭的全资产台账
            </p>
          </StackTight>

          {isDemo && (
            <Alert icon={<IconInfoCircle size={18} />}>
              当前为演示模式，已为你预填测试账号。
            </Alert>
          )}

          <TextField
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <TextField
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <Button
            disabled={!username || !password || login.isPending}
            onClick={() => login.mutate()}
          >
            {login.isPending ? '登录中...' : '登录'}
          </Button>
        </Stack>
      </Card>
    </main>
  );
}
