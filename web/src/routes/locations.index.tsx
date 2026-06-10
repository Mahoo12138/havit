import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconChevronRight,
  IconEdit,
  IconMapPin,
  IconMapPlus,
  IconPackage,
  IconPhoto,
  IconPlus,
  IconQrcode,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  Dialog,
  Row,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { itemsApi, locationsApi, type Item, type Location } from '../api/client';
import {
  LOCATION_TYPES,
  allowedChildTypes,
  canNestUnder,
  getLocationTypeMeta,
  type LocationType,
} from '../features/locations/types';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/locations/')({
  component: LocationsPage,
});

interface LocationIndex {
  byId: Map<string, Location>;
  parentMap: Map<string, string>;
  childrenMap: Map<string, Location[]>;
  roots: Location[];
}

function buildIndex(tree: Location[] | undefined): LocationIndex {
  const byId = new Map<string, Location>();
  const parentMap = new Map<string, string>();
  const childrenMap = new Map<string, Location[]>();

  function walk(nodes: Location[]) {
    for (const n of nodes) {
      byId.set(n.id, n);
      const kids = n.children ?? [];
      childrenMap.set(n.id, kids);
      for (const k of kids) {
        parentMap.set(k.id, n.id);
      }
      walk(kids);
    }
  }
  if (tree) walk(tree);

  return { byId, parentMap, childrenMap, roots: tree ?? [] };
}

function breadcrumbOf(index: LocationIndex, id: string | null): Location[] {
  if (!id) return [];
  const chain: Location[] = [];
  let cur: string | undefined = id;
  while (cur) {
    const node = index.byId.get(cur);
    if (!node) break;
    chain.unshift(node);
    cur = index.parentMap.get(cur);
  }
  return chain;
}

function collectSubtreeIds(index: LocationIndex, id: string): string[] {
  const out: string[] = [id];
  for (const k of index.childrenMap.get(id) ?? []) {
    out.push(...collectSubtreeIds(index, k.id));
  }
  return out;
}

function formatPrice(value: number): string {
  if (value >= 10000) return `¥${(value / 10000).toFixed(1)}万`;
  return `¥${value.toLocaleString('zh-CN')}`;
}

interface CreateDialogState {
  open: boolean;
  parent: Location | null;
}

interface EditDialogState {
  open: boolean;
  location: Location | null;
}

function LocationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    open: false,
    parent: null,
  });
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    location: null,
  });
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);

  const tree = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const items = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });

  const index = useMemo(() => buildIndex(tree.data?.tree), [tree.data]);

  useEffect(() => {
    if (!selectedId && index.roots.length > 0) {
      setSelectedId(index.roots[0].id);
      setExpanded(new Set(index.roots.map((r) => r.id)));
    }
  }, [index.roots, selectedId]);

  const physicalRoots = index.roots.filter((r) => r.type !== 'virtual');
  const virtualRoots = index.roots.filter((r) => r.type === 'virtual');
  const selected = selectedId ? index.byId.get(selectedId) ?? null : null;
  const breadcrumb = selected ? breadcrumbOf(index, selected.id) : [];

  const allItems = items.data?.items ?? [];
  const itemCountByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of allItems) {
      if (!it.location_id) continue;
      map.set(it.location_id, (map.get(it.location_id) ?? 0) + 1);
    }
    return map;
  }, [allItems]);

  function subtreeItemCount(id: string): number {
    const ids = collectSubtreeIds(index, id);
    let n = 0;
    for (const sid of ids) {
      n += itemCountByLocation.get(sid) ?? 0;
    }
    return n;
  }

  const directItems = useMemo(() => {
    if (!selected) return [];
    return allItems.filter((it) => it.location_id === selected.id);
  }, [allItems, selected]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const createMutation = useMutation({
    mutationFn: (body: {
      name: string;
      parent_id?: string;
      type: LocationType;
      is_private: boolean;
    }) =>
      locationsApi.create({
        name: body.name,
        parent_id: body.parent_id,
        type: body.type,
        is_private: body.is_private,
      }),
    onSuccess: (created) => {
      toast.show('位置已创建');
      qc.invalidateQueries({ queryKey: ['locations'] });
      setCreateDialog({ open: false, parent: null });
      if (created.parent_id) {
        setExpanded((prev) => new Set(prev).add(created.parent_id!));
      }
      setSelectedId(created.id);
    },
    onError: (e: Error) => toast.show(`创建失败：${e.message}`),
  });

  const editMutation = useMutation({
    mutationFn: (body: { id: string; name: string; type: LocationType }) =>
      locationsApi.update(body.id, { name: body.name, type: body.type }),
    onSuccess: () => {
      toast.show('已更新');
      qc.invalidateQueries({ queryKey: ['locations'] });
      setEditDialog({ open: false, location: null });
    },
    onError: (e: Error) => toast.show(`更新失败：${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: (_data, id) => {
      toast.show('已删除');
      qc.invalidateQueries({ queryKey: ['locations'] });
      setPendingDelete(null);
      if (selectedId === id) {
        const parentId = index.parentMap.get(id);
        setSelectedId(parentId ?? null);
      }
    },
    onError: (e: Error) => toast.show(`删除失败：${e.message}`),
  });

  const qrMutation = useMutation({
    mutationFn: (id: string) => locationsApi.generateQRCode(id),
    onSuccess: () => {
      toast.show('已生成二维码');
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(`生成失败：${e.message}`),
  });

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">位置管理</h2>
          <p className="page-kicker">
            房产 → 房间 → 家具 → 容器，按物理层级管理藏品归处。虚拟节点用于描述动态位置。
          </p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={15} />}
            onClick={() => setCreateDialog({ open: true, parent: null })}
            disabled={!isOnline}
            title={!isOnline ? '离线模式下无法新增位置' : undefined}
          >
            添加根位置
          </Button>
        </div>
      </div>

      <div className={uiStyles.locationLayout}>
        <aside className={uiStyles.locationTreePane}>
          <div className={uiStyles.locationTreeHead}>
            <span className={uiStyles.locationTreeHeadTitle}>位置树</span>
            <span className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>
              共 {index.byId.size} 个节点
            </span>
          </div>
          <div className={uiStyles.locationTreeBody}>
            {tree.isPending ? (
              <div className={uiStyles.reminderEmpty}>加载中…</div>
            ) : index.roots.length === 0 ? (
              <div className={uiStyles.reminderEmpty}>
                还没有位置节点，先创建一个吧。
              </div>
            ) : (
              <>
                {physicalRoots.length > 0 && (
                  <TreeSection
                    label="实物位置"
                    nodes={physicalRoots}
                    index={index}
                    expanded={expanded}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggle={toggleExpand}
                    subtreeCount={subtreeItemCount}
                  />
                )}
                {virtualRoots.length > 0 && (
                  <TreeSection
                    label="虚拟位置"
                    nodes={virtualRoots}
                    index={index}
                    expanded={expanded}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggle={toggleExpand}
                    subtreeCount={subtreeItemCount}
                  />
                )}
              </>
            )}
          </div>
        </aside>

        <section className={uiStyles.locationDetailPane}>
          {!selected ? (
            <DetailEmpty />
          ) : (
            <LocationDetail
              location={selected}
              breadcrumb={breadcrumb}
              children={index.childrenMap.get(selected.id) ?? []}
              directItems={directItems}
              childrenTotalItems={subtreeItemCount(selected.id) - (itemCountByLocation.get(selected.id) ?? 0)}
              isOnline={isOnline}
              onAddChild={() =>
                setCreateDialog({ open: true, parent: selected })
              }
              onEdit={() =>
                setEditDialog({ open: true, location: selected })
              }
              onDelete={() => setPendingDelete(selected)}
              onGenerateQr={() => qrMutation.mutate(selected.id)}
              onSelectChild={setSelectedId}
              qrPending={qrMutation.isPending}
              subtreeCount={subtreeItemCount}
            />
          )}
        </section>
      </div>

      <CreateLocationDialog
        state={createDialog}
        onClose={() => setCreateDialog({ open: false, parent: null })}
        onSubmit={(payload) => createMutation.mutate(payload)}
        pending={createMutation.isPending}
        isOnline={isOnline}
      />

      <EditLocationDialog
        state={editDialog}
        index={index}
        onClose={() => setEditDialog({ open: false, location: null })}
        onSubmit={(payload) => editMutation.mutate(payload)}
        pending={editMutation.isPending}
        isOnline={isOnline}
      />

      <ConfirmDeleteDialog
        target={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
        pending={deleteMutation.isPending}
      />
    </Stack>
  );
}

function TreeSection({
  label,
  nodes,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
  subtreeCount,
}: {
  label: string;
  nodes: Location[];
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  subtreeCount: (id: string) => number;
}) {
  return (
    <div className={uiStyles.locationTreeGroup}>
      <div className={uiStyles.locationTreeGroupLabel}>{label}</div>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          index={index}
          expanded={expanded}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
          subtreeCount={subtreeCount}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  index,
  expanded,
  selectedId,
  onSelect,
  onToggle,
  subtreeCount,
}: {
  node: Location;
  depth: number;
  index: LocationIndex;
  expanded: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  subtreeCount: (id: string) => number;
}) {
  const meta = getLocationTypeMeta(node.type);
  const Icon = meta.icon;
  const kids = index.childrenMap.get(node.id) ?? [];
  const isExpanded = expanded.has(node.id);
  const count = subtreeCount(node.id);

  return (
    <div>
      <div
        className={uiStyles.locationTreeRow}
        data-active={selectedId === node.id}
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: `calc(${depth * 14}px + 0.5rem)` }}
        role="button"
        tabIndex={0}
      >
        <span
          className={uiStyles.locationTreeRowChevron}
          data-expanded={isExpanded}
          data-empty={kids.length === 0}
          onClick={(e) => {
            e.stopPropagation();
            if (kids.length > 0) onToggle(node.id);
          }}
        >
          <IconChevronRight size={13} />
        </span>
        <Icon size={15} style={{ color: 'currentColor', opacity: 0.85 }} />
        <span className={uiStyles.locationTreeRowName}>{node.name}</span>
        {count > 0 && (
          <span className={uiStyles.locationTreeRowCount}>{count}</span>
        )}
      </div>
      {isExpanded &&
        kids.map((k) => (
          <TreeNode
            key={k.id}
            node={k}
            depth={depth + 1}
            index={index}
            expanded={expanded}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggle={onToggle}
            subtreeCount={subtreeCount}
          />
        ))}
    </div>
  );
}

function DetailEmpty() {
  return (
    <div className={uiStyles.detailEmpty}>
      <span className={uiStyles.detailEmptyIcon}>
        <IconMapPin size={22} />
      </span>
      <strong style={{ color: 'var(--havit-ink)' }}>选择左侧的一个位置开始</strong>
      <span>或者点击「添加根位置」来创建第一个节点。</span>
    </div>
  );
}

function LocationDetail({
  location,
  breadcrumb,
  children,
  directItems,
  childrenTotalItems,
  isOnline,
  onAddChild,
  onEdit,
  onDelete,
  onGenerateQr,
  onSelectChild,
  qrPending,
  subtreeCount,
}: {
  location: Location;
  breadcrumb: Location[];
  children: Location[];
  directItems: Item[];
  childrenTotalItems: number;
  isOnline: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateQr: () => void;
  onSelectChild: (id: string) => void;
  qrPending: boolean;
  subtreeCount: (id: string) => number;
}) {
  const meta = getLocationTypeMeta(location.type);
  const Icon = meta.icon;
  const canHaveChildren = allowedChildTypes(location.type).length > 0;

  return (
    <>
      <header className={uiStyles.locationDetailHead}>
        <Breadcrumb items={breadcrumb} />
        <div className={uiStyles.detailToolbar}>
          {canHaveChildren && (
            <Button
              variant="quiet"
              leftSection={<IconMapPlus size={15} />}
              onClick={onAddChild}
              disabled={!isOnline}
            >
              添加子位置
            </Button>
          )}
          <Button
            variant="quiet"
            leftSection={<IconQrcode size={15} />}
            onClick={onGenerateQr}
            disabled={!isOnline || qrPending}
            title={location.qr_code ? '已有二维码' : '生成二维码'}
          >
            {location.qr_code ? '查看二维码' : qrPending ? '生成中…' : '二维码'}
          </Button>
          <Button
            variant="quiet"
            leftSection={<IconEdit size={15} />}
            onClick={onEdit}
            disabled={!isOnline}
          >
            编辑
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconTrash size={15} />}
            onClick={onDelete}
            disabled={!isOnline}
          >
            删除
          </Button>
        </div>
      </header>

      <div className={uiStyles.locationHero}>
        <span className={uiStyles.locationHeroIcon[meta.tone]}>
          <Icon size={28} />
        </span>
        <div className={uiStyles.locationHeroMeta}>
          <span className={uiStyles.locationHeroName}>{location.name}</span>
          <Row>
            <span className={uiStyles.typeBadge[meta.tone]}>
              <Icon size={11} />
              {meta.label}
            </span>
            {location.qr_code && (
              <span className={uiStyles.qrChip}>
                <IconQrcode size={13} />
                {location.qr_code}
              </span>
            )}
            {location.is_private && (
              <span className={uiStyles.tagChipWarning}>仅自己可见</span>
            )}
          </Row>
          <span className={uiStyles.locationHeroSub}>{meta.desc}</span>
        </div>
      </div>

      <div className={uiStyles.metaGrid}>
        <MetaChip label="本节点物品" value={directItems.length} />
        <MetaChip label="子节点" value={children.length} />
        <MetaChip label="子树共计" value={subtreeCount(location.id)} />
      </div>

      {children.length > 0 && (
        <div className={uiStyles.detailBody}>
          <div className={uiStyles.subsection}>
            <span className={uiStyles.subsectionTitle}>子位置 ({children.length})</span>
          </div>
          <div className={uiStyles.childrenStrip}>
            {children.map((c) => {
              const cm = getLocationTypeMeta(c.type);
              const CIcon = cm.icon;
              const cCount = subtreeCount(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={uiStyles.childChip}
                  onClick={() => onSelectChild(c.id)}
                >
                  <span className={uiStyles.typeBadge[cm.tone]} style={{ padding: '2px 6px' }}>
                    <CIcon size={12} />
                  </span>
                  <span className={uiStyles.childChipName}>{c.name}</span>
                  {cCount > 0 && (
                    <span className={uiStyles.childChipCount}>{cCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={uiStyles.detailBody}>
        <div className={uiStyles.subsection}>
          <span className={uiStyles.subsectionTitle}>本节点物品</span>
          {childrenTotalItems > 0 && (
            <span className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>
              子位置还有 {childrenTotalItems} 件
            </span>
          )}
        </div>
        {directItems.length === 0 ? (
          <div className={uiStyles.detailEmpty} style={{ paddingTop: 'var(--havit-space-3)' }}>
            <span className={uiStyles.detailEmptyIcon}>
              <IconPackage size={20} />
            </span>
            <span>这里还没有物品。</span>
          </div>
        ) : (
          <div className={uiStyles.detailItemList}>
            {directItems.map((it) => (
              <Link
                key={it.id}
                to="/items/$itemId"
                params={{ itemId: it.id }}
                className={uiStyles.detailItemRow}
              >
                <span className={uiStyles.recentThumb}>
                  <IconPhoto size={18} />
                </span>
                <div className={uiStyles.recentMeta}>
                  <span className={uiStyles.recentName}>{it.name}</span>
                  <span className={uiStyles.recentSub}>
                    {it.category ?? '未分类'} · {it.status}
                  </span>
                </div>
                {it.tags && it.tags.length > 0 && (
                  <div className={uiStyles.recentTags}>
                    {it.tags.slice(0, 2).map((t) => (
                      <span key={t.id} className={uiStyles.tagChipNeutral}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                <span className={uiStyles.detailItemPrice}>
                  {it.purchase_price ? formatPrice(it.purchase_price) : '—'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Breadcrumb({ items }: { items: Location[] }) {
  if (items.length === 0) return <span className={uiStyles.muted}>—</span>;
  return (
    <div className={uiStyles.breadcrumb}>
      {items.map((it, idx) => {
        const last = idx === items.length - 1;
        return (
          <span key={it.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className={uiStyles.breadcrumbItem} data-current={last}>
              {it.name}
            </span>
            {!last && <span className={uiStyles.breadcrumbSep}>/</span>}
          </span>
        );
      })}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: number }) {
  return (
    <div className={uiStyles.metaChip}>
      <span className={uiStyles.metaChipLabel}>{label}</span>
      <span className={uiStyles.metaChipValue}>{value}</span>
    </div>
  );
}

function CreateLocationDialog({
  state,
  onClose,
  onSubmit,
  pending,
  isOnline,
}: {
  state: CreateDialogState;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    parent_id?: string;
    type: LocationType;
    is_private: boolean;
  }) => void;
  pending: boolean;
  isOnline: boolean;
}) {
  const allowed = allowedChildTypes(state.parent?.type ?? null);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(allowed[0] ?? 'room');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (state.open) {
      setName('');
      setType(allowed[0] ?? 'room');
      setIsPrivate(false);
    }
  }, [state.open, state.parent?.id]);

  const title = state.parent
    ? `在「${state.parent.name}」下添加子位置`
    : '添加根位置';

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      parent_id: state.parent?.id,
      type,
      is_private: isPrivate,
    });
  }

  return (
    <Dialog open={state.open} onClose={onClose} title={title}>
      <Stack>
        <TypeChoiceGrid
          value={type}
          onChange={setType}
          parentType={state.parent?.type ?? null}
        />
        <TextField
          label="名称"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="例如：主卧 / 防潮箱 / 摄影包"
        />
        <SwitchRow
          label="私密位置"
          hint="仅自己可见，其他家庭成员不可访问。"
          checked={isPrivate}
          onChange={setIsPrivate}
        />
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={!name.trim() || !isOnline || pending}
            onClick={handleSubmit}
          >
            {pending ? '保存中…' : '保存'}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function EditLocationDialog({
  state,
  index,
  onClose,
  onSubmit,
  pending,
  isOnline,
}: {
  state: EditDialogState;
  index: LocationIndex;
  onClose: () => void;
  onSubmit: (payload: { id: string; name: string; type: LocationType }) => void;
  pending: boolean;
  isOnline: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('room');

  useEffect(() => {
    if (state.open && state.location) {
      setName(state.location.name);
      setType((state.location.type as LocationType) ?? 'room');
    }
  }, [state.open, state.location]);

  if (!state.location) return null;
  const parentId = index.parentMap.get(state.location.id);
  const parentType = parentId ? index.byId.get(parentId)?.type ?? null : null;

  function handleSubmit() {
    if (!state.location || !name.trim()) return;
    onSubmit({ id: state.location.id, name: name.trim(), type });
  }

  return (
    <Dialog open={state.open} onClose={onClose} title={`编辑「${state.location.name}」`}>
      <Stack>
        <TypeChoiceGrid value={type} onChange={setType} parentType={parentType} />
        <TextField
          label="名称"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={!name.trim() || !isOnline || pending}
            onClick={handleSubmit}
          >
            {pending ? '保存中…' : '保存'}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function TypeChoiceGrid({
  value,
  onChange,
  parentType,
}: {
  value: LocationType;
  onChange: (t: LocationType) => void;
  parentType: string | null;
}) {
  return (
    <div>
      <span className={uiStyles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
        类型
      </span>
      <div className={uiStyles.typeChoiceGrid}>
        {LOCATION_TYPES.map((t) => {
          const Icon = t.icon;
          const disabled = parentType !== null && !canNestUnder(parentType, t.value);
          const active = value === t.value;
          return (
            <button
              key={t.value}
              type="button"
              className={uiStyles.typeChoiceCard}
              data-active={active}
              disabled={disabled}
              onClick={() => onChange(t.value)}
              title={
                disabled
                  ? `不能在 ${getLocationTypeMeta(parentType ?? '').label} 下创建 ${t.label}`
                  : undefined
              }
            >
              <span className={uiStyles.typeChoiceIcon}>
                <Icon size={16} />
              </span>
              <span className={uiStyles.typeChoiceBody}>
                <span className={uiStyles.typeChoiceLabel}>{t.label}</span>
                <span className={uiStyles.typeChoiceDesc}>{t.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className={uiStyles.switchRow}>
      <StackTight>
        <span className={uiStyles.label}>{label}</span>
        {hint && <span className={uiStyles.help}>{hint}</span>}
      </StackTight>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        className={uiStyles.switchTrack}
        data-checked={checked}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span className={uiStyles.switchThumb} />
      </span>
    </div>
  );
}

function ConfirmDeleteDialog({
  target,
  onCancel,
  onConfirm,
  pending,
}: {
  target: Location | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
  pending: boolean;
}) {
  return (
    <Dialog
      open={!!target}
      onClose={onCancel}
      title={target ? `删除「${target.name}」？` : '删除位置'}
    >
      <Stack>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          位置下若有子节点或物品，删除会失败。请先清空或迁移它们。
        </p>
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onCancel}>
            取消
          </Button>
          <Button
            disabled={!target || pending}
            onClick={() => target && onConfirm(target.id)}
          >
            {pending ? '删除中…' : '确认删除'}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}
