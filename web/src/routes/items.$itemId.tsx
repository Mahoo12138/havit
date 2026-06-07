import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { itemsApi } from '../api/client';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetail,
});

function ItemDetail() {
  const { itemId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const item = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.get(itemId),
  });

  const archive = useMutation({
    mutationFn: () => itemsApi.archive(itemId),
    onSuccess: () => {
      notifications.show({ message: '已归档', color: 'gray' });
      qc.invalidateQueries({ queryKey: ['items'] });
      nav({ to: '/items' });
    },
  });

  if (item.isLoading) return <Text>加载中…</Text>;
  if (item.error || !item.data) return <Text c="red">未找到</Text>;

  const it = item.data;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{it.name}</Title>
        <Group>
          <Button color="red" variant="light" onClick={() => archive.mutate()}>
            归档
          </Button>
        </Group>
      </Group>

      <Card withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text c="dimmed">类型</Text>
            <Text>{it.type}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">状态</Text>
            <Badge>{it.status}</Badge>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">分类</Text>
            <Text>{it.category ?? '—'}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">购入价</Text>
            <Text>
              {it.purchase_price != null
                ? `${it.purchase_price} ${it.purchase_currency ?? ''}`
                : '—'}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">序列号</Text>
            <Text>{it.serial_number ?? '—'}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">备注</Text>
            <Text>{it.description ?? '—'}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">创建</Text>
            <Text>{new Date(it.created_at * 1000).toLocaleString()}</Text>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
