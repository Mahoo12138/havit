import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
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
import { authApi, setToken } from '../api/client';

export const Route = createFileRoute('/setup')({
  component: SetupPage,
});

function SetupPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const setup = useMutation({
    mutationFn: () => authApi.setup({ username, password }),
    onSuccess: (data) => {
      setToken(data.token);
      toast.show('初始化完成');
      nav({ to: '/' });
    },
    onError: (e: Error) => toast.show(`初始化失败：${e.message}`),
  });

  const passwordMismatch = confirm !== '' && password !== confirm;
  const canSubmit =
    username.length >= 2 && password.length >= 6 && !passwordMismatch;

  return (
    <main className={`${uiStyles.center} auth-screen`}>
      <Card className="auth-card">
        <Stack>
          <StackTight className={uiStyles.textCenter}>
            <h1 className={`${uiStyles.heading} page-heading`}>初始化 Havit</h1>
            <p className={uiStyles.muted}>
              欢迎首次部署。请创建 Owner 账户，之后即可登录使用。
            </p>
          </StackTight>

          <Alert icon={<IconShieldCheck size={18} />}>
            第一个账户自动获得 Owner 角色，可管理系统配置。
          </Alert>

          <TextField
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <TextField
            label="密码 (>=6 位)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <TextField
            label="确认密码"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            error={passwordMismatch ? '两次输入不一致' : null}
            required
          />
          <Button
            disabled={!canSubmit || setup.isPending}
            onClick={() => setup.mutate()}
          >
            {setup.isPending ? '创建中...' : '创建账户并登录'}
          </Button>
        </Stack>
      </Card>
    </main>
  );
}
