import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconChevronRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import {
  Button,
  Card,
  Dialog,
  Row,
  RowBetween,
  SelectField,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { locationsApi, type Location } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/locations/')({
  component: LocationsPage,
});

function flatten(
  nodes: Location[] | undefined,
  prefix = '',
): Array<{ value: string; label: string }> {
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
  const toast = useToast();
  const [opened, setOpened] = useState(false);
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const isOnline = useNetworkStatus();

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
      toast.show('位置已创建');
      qc.invalidateQueries({ queryKey: ['locations'] });
      setForm({ name: '', parent_id: '' });
      setOpened(false);
    },
    onError: (e: Error) => toast.show(`创建失败：${e.message}`),
  });

  const del = useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      toast.show('已删除');
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(`删除失败：${e.message}`),
  });

  return (
    <Stack>
      <RowBetween>
        <StackTight>
          <h2 className="page-heading">位置</h2>
          <p className="page-kicker">
            用树形位置描述家、房间、柜子和收纳容器。
          </p>
        </StackTight>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setOpened(true)}
          disabled={!isOnline}
          title={!isOnline ? '离线模式下无法新增位置' : undefined}
        >
          新增
        </Button>
      </RowBetween>

      <Card className="surface-card">
        {tree.data && tree.data.tree.length > 0 ? (
          <TreeView
            nodes={tree.data.tree}
            onDelete={(id) => del.mutate(id)}
            isOnline={isOnline}
          />
        ) : (
          <div className="empty-state">
            还没有位置节点。先创建"家"或"客厅"试试。
          </div>
        )}
      </Card>

      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        title="新增位置"
      >
        <Stack>
          <TextField
            label="名称"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <SelectField
            label="父节点（可选）"
            options={flatten(tree.data?.tree)}
            placeholder="无父节点"
            value={form.parent_id}
            onChange={(e) =>
              setForm({ ...form, parent_id: e.currentTarget.value })
            }
          />
          <RowBetween>
            <Button variant="quiet" onClick={() => setOpened(false)}>
              取消
            </Button>
            <Button
              disabled={!form.name || !isOnline || create.isPending}
              title={!isOnline ? '离线模式下无法保存' : undefined}
              onClick={() => create.mutate()}
            >
              {create.isPending ? '保存中...' : '保存'}
            </Button>
          </RowBetween>
        </Stack>
      </Dialog>
    </Stack>
  );
}

function TreeView({
  nodes,
  depth = 0,
  onDelete,
  isOnline,
}: {
  nodes: Location[];
  depth?: number;
  onDelete: (id: string) => void;
  isOnline: boolean;
}) {
  return (
    <Stack>
      {nodes.map((n) => (
        <div key={n.id}>
          <RowBetween
            className="tree-row"
            style={{ paddingLeft: depth * 20 }}
          >
            <Row>
              <IconChevronRight size={14} />
              <span>{n.name}</span>
              <span className={uiStyles.muted}>({n.type})</span>
            </Row>
            <Button
              variant="subtle"
              onClick={() => onDelete(n.id)}
              disabled={!isOnline}
              title={isOnline ? '删除' : '离线模式下无法删除'}
            >
              <IconTrash size={14} />
            </Button>
          </RowBetween>
          {n.children && n.children.length > 0 && (
            <TreeView
              nodes={n.children}
              depth={depth + 1}
              onDelete={onDelete}
              isOnline={isOnline}
            />
          )}
        </div>
      ))}
    </Stack>
  );
}
