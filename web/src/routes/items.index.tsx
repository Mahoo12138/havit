import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  Dialog,
  SelectField,
  Stack,
  ScrollArea,
  StackTight,
  TextareaField,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { itemsApi, locationsApi, tagsApi, type Location } from '../api/client';
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

function ItemsPage() {
  const { t } = useTranslation();
  const itemTypeOptions = [
    { value: 'durable', label: t('items.durable') },
    { value: 'edc', label: t('nav.edc') },
    { value: 'virtual', label: t('items.virtual_asset') },
  ];
  const [q, setQ] = useState('');
  const [tagID, setTagID] = useState('');
  const [opened, setOpened] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();

  const items = useQuery({
    queryKey: ['items', q, tagID],
    queryFn: () => itemsApi.list({
      ...(q ? { q } : {}),
      ...(tagID ? { tag: tagID } : {}),
    }),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const tags = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });
  const locOptions = flatten(locs.data?.tree);
  const tagOptions = (tags.data?.tags ?? []).map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));

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
      toast.show(t('items.created'));
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
    onError: (e: Error) => toast.show(t('items.createFailed', { error: e.message })),
  });

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('items.title')}</h2>
          <p className="page-kicker">
            {t('items.description')}
          </p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setOpened(true)}
            disabled={!isOnline}
            title={!isOnline ? t('items.offlineWarning') : undefined}
          >
            {t('items.create')}
          </Button>
        </div>
      </div>

      <div className={uiStyles.toolbar}>
        <label className={uiStyles.field}>
          <span className={uiStyles.label}>{t('common.search')}</span>
          <span className={uiStyles.searchControl}>
            <IconSearch
              size={16}
              className={uiStyles.searchIcon}
            />
            <input
              className={[uiStyles.input, uiStyles.searchInput].join(' ')}
              placeholder={t('search.placeholder')}
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
            />
          </span>
        </label>
        <SelectField
          label={t('common.filter')}
          options={tagOptions}
          placeholder={t('common.all')}
          value={tagID}
          onChange={(e) => setTagID(e.currentTarget.value)}
        />
      </div>

      <Card className="surface-card table-card" padded={false}>
        <ScrollArea className={uiStyles.tableWrap}>
          <table className={uiStyles.table}>
            <thead>
              <tr>
                <th className={uiStyles.th}>{t('items.name')}</th>
                <th className={uiStyles.th}>{t('items.type')}</th>
                <th className={uiStyles.th}>{t('items.status')}</th>
                <th className={uiStyles.th}>{t('items.category')}</th>
                <th className={uiStyles.th}>{t('items.tags')}</th>
              </tr>
            </thead>
            <tbody>
              {items.data?.items.map((it) => (
                <tr className={uiStyles.tableRow} key={it.id}>
                  <td className={uiStyles.td}>
                    <Link to="/items/$itemId" params={{ itemId: it.id }}>
                      {it.name}
                    </Link>
                  </td>
                  <td className={uiStyles.td}>{t(`itemType.${it.type}`, it.type)}</td>
                  <td className={uiStyles.td}>
                    <Badge>{t(`status.${it.status}`, it.status)}</Badge>
                  </td>
                  <td className={uiStyles.td}>{it.category ?? t('common.notSet')}</td>
                  <td className={uiStyles.td}>
                    {it.tags && it.tags.length > 0 ? (
                      <div className={uiStyles.tagList}>
                        {it.tags.map((tag) => (
                          <span className={uiStyles.tagChip} key={tag.id}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={uiStyles.muted}>{t('items.noTags')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.data && items.data.items.length === 0 && (
                <tr>
                  <td className={uiStyles.td} colSpan={5}>
                    <div className="empty-state">
                      {t('items.noItemsHint')}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </Card>

      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        title={t('items.create')}
      >
        <Stack>
          <TextField
            label={t('items.name')}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <SelectField
            label={t('items.type')}
            options={itemTypeOptions}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.currentTarget.value })}
          />
          <TextField
            label={t('items.category')}
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.currentTarget.value })
            }
          />
          <SelectField
            label={t('items.location')}
            options={locOptions}
            placeholder={t('items.selectLocation')}
            required
            value={form.location_id}
            onChange={(e) =>
              setForm({ ...form, location_id: e.currentTarget.value })
            }
          />
          <TextareaField
            label={t('items.description')}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.currentTarget.value })
            }
          />
          <div className={uiStyles.formActions}>
            <Button variant="quiet" onClick={() => setOpened(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!form.name || !form.location_id || !isOnline || create.isPending}
              title={!isOnline ? t('items.offlineWarning') : undefined}
              onClick={() => create.mutate()}
            >
              {create.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </Stack>
  );
}
