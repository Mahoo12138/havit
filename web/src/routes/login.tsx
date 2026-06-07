import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
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
  const isDemo = systemStatus.mode === 'demo';

  const [username, setUsername] = useState(isDemo ? 'admin@havit.local' : '');
  const [password, setPassword] = useState(isDemo ? 'havit-demo' : '');

  const login = useMutation({
    mutationFn: () => authApi.login({ username, password }),
    onSuccess: (data) => {
      setToken(data.token);
      nav({ to: redirect ?? '/' });
    },
    onError: () =>
      notifications.show({ color: 'red', message: '用户名或密码错误' }),
  });

  return (
    <Center mih="100vh">
      <Card withBorder shadow="sm" p="xl" w={380}>
        <Stack>
          <Title order={3} ta="center">
            登录 Havit
          </Title>

          {isDemo && (
            <Alert color="yellow" icon={<IconInfoCircle />}>
              当前为演示模式，已为你预填测试账号。
            </Alert>
          )}

          <TextInput
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <Button
            loading={login.isPending}
            disabled={!username || !password}
            onClick={() => login.mutate()}
          >
            登录
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
