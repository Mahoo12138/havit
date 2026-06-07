import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { itemsApi, locationsApi, type Location } from '../api/client';

export const Route = createFileRoute('/items/')({
  component: ItemsPage,
});

function flatten(nodes: Location[] | undefined, prefix = ''): Array<{ value: string; label: string }> {
  if (!nodes) return [];
  const out: Array<{ value: string; label: string }> = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} → ${n.name}` : n.name;
    out.push({ value: n.id, label });
    out.push(...flatten(n.children, label));
  }
  return out;
}

const statusColor: Record<string, string> = {
  in_stock: 'green',
  borrowed: 'yellow',
  idle: 'gray',
  lost: 'red',
  stolen: 'red',
  archived: 'gray',
  sold: 'blue',
};

function ItemsPage() {
  const [q, setQ] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: ['items', q],
    queryFn: () => itemsApi.list(q ? { q } : {}),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const locOptions = flatten(locs.data?.tree);

  const [form, setForm] = useState({
    name: '',
    type: 'durable',
    category: '',
    description: '',
    location_id: '',
  });

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: form.name,
        type: form.type,
        category: form.category || undefined,
        description: form.description || undefined,
        location_id: form.location_id || undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: '物品已创建', color: 'green' });
      qc.invalidateQueries({ queryKey: ['items'] });
      setForm({ name: '', type: 'durable', category: '', description: '', location_id: '' });
      close();
    },
    onError: (e: Error) =>
      notifications.show({ message: `创建失败：${e.message}`, color: 'red' }),
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>物品</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          新增
        </Button>
      </Group>

      <TextInput
        placeholder="搜索物品（≥3 个字符）"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
      />

      <Card withBorder p={0}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>名称</Table.Th>
              <Table.Th>类型</Table.Th>
              <Table.Th>状态</Table.Th>
              <Table.Th>分类</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.data?.items.map((it) => (
              <Table.Tr key={it.id}>
                <Table.Td>
                  <Link to="/items/$itemId" params={{ itemId: it.id }}>
                    {it.name}
                  </Link>
                </Table.Td>
                <Table.Td>{it.type}</Table.Td>
                <Table.Td>
                  <Badge color={statusColor[it.status] ?? 'gray'} variant="light">
                    {it.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{it.category ?? '—'}</Table.Td>
              </Table.Tr>
            ))}
            {items.data && items.data.items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} ta="center" c="dimmed">
                  暂无物品
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal opened={opened} onClose={close} title="新增物品" centered>
        <Stack>
          <TextInput
            label="名称"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <Select
            label="类型"
            data={[
              { value: 'durable', label: '耐用品' },
              { value: 'consumable_a', label: '消耗品 A（高频流动）' },
              { value: 'consumable_b', label: '消耗品 B（低频长周期）' },
              { value: 'edc', label: 'EDC（随身物品）' },
              { value: 'virtual', label: '虚拟资产（买断）' },
            ]}
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v ?? 'durable' })}
          />
          <TextInput
            label="分类"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.currentTarget.value })}
          />
          <Select
            label="位置"
            data={locOptions}
            value={form.location_id}
            onChange={(v) => setForm({ ...form, location_id: v ?? '' })}
            searchable
            clearable
          />
          <Textarea
            label="备注"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              取消
            </Button>
            <Button
              loading={create.isPending}
              disabled={!form.name}
              onClick={() => create.mutate()}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
