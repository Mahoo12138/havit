import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  RowBetween,
  SelectField,
  Stack,
  StackTight,
  TextareaField,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { itemsApi, locationsApi, type Location } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/items/')({
  component: ItemsPage,
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

const itemTypeOptions = [
  { value: 'durable', label: '耐用品' },
  { value: 'consumable_a', label: '消耗品 A（高频流动）' },
  { value: 'consumable_b', label: '消耗品 B（低频长周期）' },
  { value: 'edc', label: 'EDC（随身物品）' },
  { value: 'virtual', label: '虚拟资产（买断）' },
];

function ItemsPage() {
  const [q, setQ] = useState('');
  const [opened, setOpened] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();

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
      toast.show('物品已创建');
      qc.invalidateQueries({ queryKey: ['items'] });
      setForm({
        name: '',
        type: 'durable',
        category: '',
        description: '',
        location_id: '',
      });
      setOpened(false);
    },
    onError: (e: Error) => toast.show(`创建失败：${e.message}`),
  });

  return (
    <Stack>
      <RowBetween>
        <StackTight>
          <h2 className="page-heading">物品</h2>
          <p className="page-kicker">
            记录耐用品、消耗品、EDC 和买断制虚拟资产。
          </p>
        </StackTight>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setOpened(true)}
          disabled={!isOnline}
          title={!isOnline ? '离线模式下无法录入' : undefined}
        >
          新增
        </Button>
      </RowBetween>

      <label className={uiStyles.field}>
        <span className={uiStyles.label}>搜索</span>
        <span className={uiStyles.searchControl}>
          <IconSearch
            size={16}
            className={uiStyles.searchIcon}
          />
          <input
            className={[uiStyles.input, uiStyles.searchInput].join(' ')}
            placeholder="搜索物品（>=3 个字符）"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
          />
        </span>
      </label>

      <Card className="surface-card table-card" padded={false}>
        <div className={uiStyles.tableWrap}>
          <table className={uiStyles.table}>
            <thead>
              <tr>
                <th className={uiStyles.th}>名称</th>
                <th className={uiStyles.th}>类型</th>
                <th className={uiStyles.th}>状态</th>
                <th className={uiStyles.th}>分类</th>
              </tr>
            </thead>
            <tbody>
              {items.data?.items.map((it) => (
                <tr key={it.id}>
                  <td className={uiStyles.td}>
                    <Link to="/items/$itemId" params={{ itemId: it.id }}>
                      {it.name}
                    </Link>
                  </td>
                  <td className={uiStyles.td}>{it.type}</td>
                  <td className={uiStyles.td}>
                    <Badge>{it.status}</Badge>
                  </td>
                  <td className={uiStyles.td}>{it.category ?? '未填写'}</td>
                </tr>
              ))}
              {items.data && items.data.items.length === 0 && (
                <tr>
                  <td className={uiStyles.td} colSpan={4}>
                    <div className="empty-state">
                      暂无物品。先新增一件常用设备，或从 CSV / JSON 批量导入。
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        title="新增物品"
      >
        <Stack>
          <TextField
            label="名称"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <SelectField
            label="类型"
            options={itemTypeOptions}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.currentTarget.value })}
          />
          <TextField
            label="分类"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.currentTarget.value })
            }
          />
          <SelectField
            label="位置"
            options={locOptions}
            placeholder="未选择"
            required
            value={form.location_id}
            onChange={(e) =>
              setForm({ ...form, location_id: e.currentTarget.value })
            }
          />
          <TextareaField
            label="备注"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.currentTarget.value })
            }
          />
          <RowBetween>
            <Button variant="quiet" onClick={() => setOpened(false)}>
              取消
            </Button>
            <Button
              disabled={!form.name || !form.location_id || !isOnline || create.isPending}
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
