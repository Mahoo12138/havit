import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconChevronRight,
  IconDots,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Stack } from '../../components/ui';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { locationsApi, type Item, type Location } from '../../api/client';
import { canonicalTag, formatDateTime } from './shared';
import * as s from './EssentialsDesktop.css';

// Dynamic nodes carry no foreign-key relationship to item statuses, so
// "mounted" is derived: the item physically sits at the node, or its
// canonicalised status tag matches the node's name.
function nodeTagCodes(nodeName: string): string[] {
  if (nodeName === '@随身' || nodeName === '@随身携带') return ['carry'];
  if (nodeName === '@通勤包') return ['travel_bag'];
  return [];
}

function mountedItems(items: Item[], node: Location): Item[] {
  const codes = nodeTagCodes(node.name);
  return items.filter((item) => {
    if (item.location_id === node.id) return true;
    const tag = canonicalTag(item.current_status_tag);
    return tag != null && codes.includes(tag);
  });
}

function normalizeNodeName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function DynamicNodes({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [dialogMode, setDialogMode] = useState<'create' | 'rename' | null>(null);
  const [editingNode, setEditingNode] = useState<Location | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: locData, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const nodes = useMemo(() => {
    const walk = (list: Location[] | undefined, out: Location[]): Location[] => {
      for (const node of list ?? []) {
        if (node.type === 'virtual') out.push(node);
        walk(node.children, out);
      }
      return out;
    };
    return walk(locData?.tree, []);
  }, [locData?.tree]);

  const invalidateLocations = () =>
    queryClient.invalidateQueries({ queryKey: ['locations'] });

  const createNode = useMutation({
    mutationFn: (name: string) => locationsApi.create({ name, type: 'virtual' }),
    onSuccess: () => {
      toast.show(t('essentials.nodeCreated'));
      setDialogMode(null);
      setNodeName('');
      invalidateLocations();
    },
    onError: (error: Error) => toast.show(t('essentials.nodeOpFailed', { error: error.message })),
  });

  const renameNode = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      locationsApi.update(id, { name }),
    onSuccess: () => {
      toast.show(t('essentials.nodeRenamed'));
      setDialogMode(null);
      setEditingNode(null);
      invalidateLocations();
    },
    onError: (error: Error) => toast.show(t('essentials.nodeOpFailed', { error: error.message })),
  });

  const deleteNode = useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      toast.show(t('essentials.nodeDeleted'));
      invalidateLocations();
    },
    onError: (error: Error) => {
      const message = /not empty/i.test(error.message)
        ? t('essentials.nodeInUse')
        : error.message;
      toast.show(t('essentials.nodeOpFailed', { error: message }));
    },
  });

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function submitDialog() {
    const name = normalizeNodeName(nodeName);
    if (!name) return;
    if (dialogMode === 'create') {
      createNode.mutate(name);
    } else if (dialogMode === 'rename' && editingNode) {
      renameNode.mutate({ id: editingNode.id, name });
    }
  }

  return (
    <Card className={s.ledgerCard} padded={false}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <span className={s.hintText}>{t('essentials.dynamicNodesHint')}</span>
        </div>
        <div className={s.toolbarRight}>
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={() => {
              setNodeName('');
              setDialogMode('create');
            }}
          >
            {t('essentials.newNode')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={s.empty}>…</div>
      ) : (
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.tableHead}>{t('essentials.nodeName')}</th>
                <th className={s.tableHead}>{t('essentials.mountedItems')}</th>
                <th className={s.tableHead}>{t('essentials.createdAt')}</th>
                <th className={s.tableHead}>{t('essentials.action')}</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => {
                const mounted = mountedItems(items, node);
                const isExpanded = expanded.has(node.id);
                return (
                  <NodeRow
                    key={node.id}
                    node={node}
                    mounted={mounted}
                    expanded={isExpanded}
                    onToggle={() => toggleExpanded(node.id)}
                    onRename={() => {
                      setEditingNode(node);
                      setNodeName(node.name);
                      setDialogMode('rename');
                    }}
                    onDelete={() => {
                      if (window.confirm(t('essentials.deleteNodeConfirm', { name: node.name }))) {
                        deleteNode.mutate(node.id);
                      }
                    }}
                    busy={deleteNode.isPending}
                    t={t}
                  />                );
              })}
              {nodes.length === 0 && (
                <tr>
                  <td className={s.tableCell} colSpan={4}>
                    <div className={s.empty}>{t('essentials.nodesEmpty')}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={dialogMode != null}
        onClose={() => setDialogMode(null)}
        title={dialogMode === 'create' ? t('essentials.newNode') : t('essentials.renameNode')}
      >
        <Stack>
          <TextField
            label={t('essentials.nodeName')}
            required
            value={nodeName}
            placeholder="@出差中"
            onChange={(event) => setNodeName(event.currentTarget.value)}
          />
          <div className={s.formActions}>
            <Button variant="outline" onClick={() => setDialogMode(null)}>{t('common.cancel')}</Button>
            <Button
              disabled={!normalizeNodeName(nodeName) || createNode.isPending || renameNode.isPending}
              onClick={submitDialog}
            >
              {createNode.isPending || renameNode.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Card>
  );
}

function NodeRow({ node, mounted, expanded, onToggle, onRename, onDelete, busy, t }: {
  node: Location;
  mounted: Item[];
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  busy: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <>
      <tr className={s.tableRow}>
        <td className={s.tableCell}>
          <button type="button" className={s.nodeToggle} onClick={onToggle} aria-expanded={expanded}>
            <IconChevronRight
              size={14}
              className={s.nodeToggleIcon}
              data-expanded={expanded || undefined}
            />
            <span className={s.itemName}>{node.name}</span>
          </button>
        </td>
        <td className={`${s.tableCell} ${s.muted}`}>{t('essentials.mountedCount', { count: mounted.length })}</td>
        <td className={`${s.tableCell} ${s.muted}`}>{formatDateTime(node.created_at)}</td>
        <td className={s.tableCell}>
          <div className={s.actionGroup}>
            <NodeActionMenu onRename={onRename} onDelete={onDelete} busy={busy} />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className={s.tableRow}>
          <td className={s.tableCell} colSpan={4}>
            <div className={s.mountedPanel}>
              {mounted.length === 0 ? (
                <span className={s.muted}>{t('essentials.noMountedItems')}</span>
              ) : (
                mounted.map((item) => (
                  <span className={s.itemChip} key={item.id}>{item.name}</span>
                ))
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function NodeActionMenu({ onRename, onDelete, busy }: {
  onRename: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={s.iconMenuButton} aria-label={t('essentials.action')}>
        <IconDots size={14} />
      </PopoverTrigger>
      <PopoverContent className={s.actionMenu} align="end" sideOffset={6}>
        <button
          type="button"
          className={s.actionItem}
          onClick={() => {
            onRename();
            setOpen(false);
          }}
        >
          <IconPencil size={14} />
          <span>{t('essentials.renameNode')}</span>
        </button>
        <button
          type="button"
          className={s.actionItem}
          onClick={() => {
            onDelete();
            setOpen(false);
          }}
          disabled={busy}
        >
          <IconTrash size={14} />
          <span>{t('common.delete')}</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
