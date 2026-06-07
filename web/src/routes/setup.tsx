import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { authApi, setToken } from '../api/client';

export const Route = createFileRoute('/setup')({
  component: SetupPage,
});

function SetupPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const setup = useMutation({
    mutationFn: () => authApi.setup({ username, password }),
    onSuccess: (data) => {
      setToken(data.token);
      notifications.show({ color: 'green', message: '初始化完成' });
      nav({ to: '/' });
    },
    onError: (e: Error) =>
      notifications.show({ color: 'red', message: `初始化失败：${e.message}` }),
  });

  const passwordMismatch = confirm !== '' && password !== confirm;
  const canSubmit = username.length >= 2 && password.length >= 6 && !passwordMismatch;

  return (
    <Center mih="100vh">
      <Card withBorder shadow="sm" p="xl" w={420}>
        <Stack>
          <Title order={3} ta="center">
            初始化 Havit
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            欢迎首次部署。请创建 Owner 账户，之后即可登录使用。
          </Text>

          <Alert color="blue" icon={<IconShieldCheck />}>
            第一个账户自动获得 Owner 角色，可管理系统配置。
          </Alert>

          <TextInput
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="密码 (≥6 位)"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="确认密码"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            error={passwordMismatch ? '两次输入不一致' : null}
            required
          />
          <Button
            loading={setup.isPending}
            disabled={!canSubmit}
            onClick={() => setup.mutate()}
          >
            创建账户并登录
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
