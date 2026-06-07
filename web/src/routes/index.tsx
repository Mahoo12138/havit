import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { itemsApi, locationsApi } from '../api/client';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function countLocations(nodes: Array<{ children?: Array<unknown> }> | undefined): number {
  if (!nodes) return 0;
  let n = 0;
  for (const node of nodes) {
    n += 1;
    n += countLocations((node as { children?: Array<{ children?: Array<unknown> }> }).children);
  }
  return n;
}

function Dashboard() {
  const items = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  return (
    <Stack>
      <Title order={2}>仪表盘</Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder>
          <Group justify="space-between">
            <Text c="dimmed">物品总数</Text>
            <Text fw={700} size="xl">
              {items.data?.items.length ?? '—'}
            </Text>
          </Group>
        </Card>
        <Card withBorder>
          <Group justify="space-between">
            <Text c="dimmed">位置节点</Text>
            <Text fw={700} size="xl">
              {locs.data ? countLocations(locs.data.tree) : '—'}
            </Text>
          </Group>
        </Card>
        <Card withBorder>
          <Group justify="space-between">
            <Text c="dimmed">在库物品</Text>
            <Text fw={700} size="xl">
              {items.data?.items.filter((i) => i.status === 'in_stock').length ?? '—'}
            </Text>
          </Group>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
