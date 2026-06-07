import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconChevronRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { locationsApi, type Location } from '../api/client';

export const Route = createFileRoute('/locations/')({
  component: LocationsPage,
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

function LocationsPage() {
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ name: '', parent_id: '' });

  const tree = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const create = useMutation({
    mutationFn: () =>
      locationsApi.create({
        name: form.name,
        parent_id: form.parent_id || undefined,
      }),
    onSuccess: () => {
      notifications.show({ message: '位置已创建', color: 'green' });
      qc.invalidateQueries({ queryKey: ['locations'] });
      setForm({ name: '', parent_id: '' });
      close();
    },
    onError: (e: Error) =>
      notifications.show({ message: `创建失败：${e.message}`, color: 'red' }),
  });

  const del = useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      notifications.show({ message: '已删除', color: 'gray' });
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) =>
      notifications.show({ message: `删除失败：${e.message}`, color: 'red' }),
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>位置</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          新增
        </Button>
      </Group>

      <Card withBorder>
        {tree.data && tree.data.tree.length > 0 ? (
          <TreeView nodes={tree.data.tree} onDelete={(id) => del.mutate(id)} />
        ) : (
          <Text c="dimmed" ta="center">
            还没有位置节点。先创建"家"或"客厅"试试。
          </Text>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="新增位置" centered>
        <Stack>
          <TextInput
            label="名称"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <Select
            label="父节点（可选）"
            data={flatten(tree.data?.tree)}
            value={form.parent_id}
            onChange={(v) => setForm({ ...form, parent_id: v ?? '' })}
            searchable
            clearable
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

function TreeView({
  nodes,
  depth = 0,
  onDelete,
}: {
  nodes: Location[];
  depth?: number;
  onDelete: (id: string) => void;
}) {
  return (
    <Stack gap={4}>
      {nodes.map((n) => (
        <div key={n.id}>
          <Group
            gap="xs"
            style={{ paddingLeft: depth * 20 }}
            justify="space-between"
            wrap="nowrap"
          >
            <Group gap={4}>
              <IconChevronRight size={14} />
              <Text>{n.name}</Text>
              <Text c="dimmed" size="xs">
                ({n.type})
              </Text>
            </Group>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => onDelete(n.id)}
              title="删除"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
          {n.children && n.children.length > 0 && (
            <TreeView nodes={n.children} depth={depth + 1} onDelete={onDelete} />
          )}
        </div>
      ))}
    </Stack>
  );
}
