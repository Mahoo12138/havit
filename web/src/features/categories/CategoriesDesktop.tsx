import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconEdit,
  IconLock,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  Stack,
  StackTight,
  uiStyles,
  useToast,
} from '../../components/ui';
import { Button } from '../../components/ui/button';
import { SelectField } from '../../components/ui/select-field';
import { TextField } from '../../components/ui/text-field';
import { categoriesApi, type Category } from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';

async function extractApiError(err: unknown, fallback: string): Promise<string> {
  const anyErr = err as { response?: Response; message?: string };
  if (anyErr?.response) {
    try {
      const body = (await anyErr.response.clone().json()) as {
        message?: string;
        error?: string;
      };
      if (body?.message) return body.message;
      if (body?.error) return body.error;
    } catch {
      /* ignore */
    }
  }
  return anyErr?.message ?? fallback;
}

interface CatFormState {
  name: string;
  icon: string;
  root_type: string;
}

export function CategoriesDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const catsQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const cats = catsQuery.data?.categories ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(q));
  }, [cats, search]);

  const stats = useMemo(() => {
    const total = cats.length;
    const physical = cats.filter((c) => c.root_type === 'physical').length;
    const virtual = cats.filter((c) => c.root_type === 'virtual').length;
    const custom = cats.filter((c) => !c.is_system).length;
    return { total, physical, virtual, custom };
  }, [cats]);

  const systemCats = useMemo(
    () => cats.filter((c) => c.is_system),
    [cats],
  );
  const customCats = useMemo(
    () => cats.filter((c) => !c.is_system),
    [cats],
  );

  const createMutation = useMutation({
    mutationFn: (body: { name: string; icon?: string; root_type: string }) =>
      categoriesApi.create(body),
    onSuccess: () => {
      toast.show(t('categories.created'));
      qc.invalidateQueries({ queryKey: ['categories'] });
      setCreateOpen(false);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('categories.createFailed', { error: msg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { id: string; name: string; icon: string; root_type: string }) =>
      categoriesApi.update(body.id, { name: body.name, icon: body.icon, root_type: body.root_type }),
    onSuccess: () => {
      toast.show(t('categories.updated'));
      qc.invalidateQueries({ queryKey: ['categories'] });
      setEditCat(null);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('categories.updateFailed', { error: msg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.show(t('categories.deleted'));
      qc.invalidateQueries({ queryKey: ['categories'] });
      setPendingDelete(null);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('categories.deleteFailed', { error: msg }));
    },
  });

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('categories.title')}</h2>
          <p className="page-kicker">{t('categories.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={15} />}
            onClick={() => setCreateOpen(true)}
            disabled={!isOnline}
            title={!isOnline ? t('categories.offlineDisabled') : undefined}
          >
            {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      <div className={uiStyles.tagsKpiGrid}>
        <KpiCard
          label={t('categories.kpiTotal')}
          value={stats.total}
          hint={t('categories.kpiTotalHint')}
        />
        <KpiCard
          label={t('categories.kpiPhysical')}
          value={stats.physical}
          hint={t('categories.kpiPhysicalHint')}
          accent
        />
        <KpiCard
          label={t('categories.kpiVirtual')}
          value={stats.virtual}
          hint={t('categories.kpiVirtualHint')}
        />
        <KpiCard
          label={t('categories.kpiCustom')}
          value={stats.custom}
          hint={t('categories.kpiCustomHint')}
        />
      </div>

      <div className={uiStyles.tagsLayout}>
        <section className={uiStyles.tagsListCard}>
          <div className={uiStyles.tagsListToolbar}>
            <div className={uiStyles.tagsSearchWrap}>
              <span className={uiStyles.tagsSearchIcon} aria-hidden>
                <IconSearch size={15} />
              </span>
              <input
                className={uiStyles.tagsSearchInput}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('categories.searchPlaceholder')}
                aria-label={t('categories.searchAria')}
              />
            </div>
          </div>

          <div className={uiStyles.tagsTableWrap}>
            <table className={uiStyles.tagsTable}>
              <thead>
                <tr>
                  <th className={uiStyles.tagsTableHead}>{t('categories.colName')}</th>
                  <th className={uiStyles.tagsTableHead}>{t('categories.colIcon')}</th>
                  <th className={uiStyles.tagsTableHead}>{t('categories.colRootType')}</th>
                  <th className={uiStyles.tagsTableHead}>{t('categories.colUsage')}</th>
                  <th className={uiStyles.tagsTableHead} style={{ textAlign: 'right' }}>
                    {t('categories.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {catsQuery.isPending ? (
                  <tr>
                    <td colSpan={5} className={uiStyles.tagsEmptyState}>
                      {t('categories.loading')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={uiStyles.tagsEmptyState}>
                      {cats.length === 0 ? t('categories.emptyAll') : t('categories.emptyFiltered')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.id} className={uiStyles.tagsTableRow}>
                      <td className={uiStyles.tagsTableCell}>
                        <div className={uiStyles.tagsTableNameCell}>
                          <span className={uiStyles.tagsName}>{cat.name}</span>
                          {cat.is_system ? (
                            <span className={uiStyles.badge} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                              <IconLock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                              {t('categories.systemBadge')}
                            </span>
                          ) : (
                            <span className={uiStyles.badge} style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                              {t('categories.customBadge')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        <code style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                          {cat.icon ?? '—'}
                        </code>
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        {cat.root_type === 'physical'
                          ? t('categories.rootTypePhysical')
                          : t('categories.rootTypeVirtual')}
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        <span
                          className={
                            cat.usage_count > 0
                              ? uiStyles.tagsUsageBadgeActive
                              : uiStyles.tagsUsageBadge
                          }
                        >
                          {t('categories.usageBadge', { count: cat.usage_count })}
                        </span>
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        <div className={uiStyles.tagsRowActions}>
                          <Button
                            variant="subtle"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => setEditCat(cat)}
                            disabled={!isOnline || cat.is_system}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="subtle"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => setPendingDelete(cat)}
                            disabled={!isOnline || cat.is_system}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={uiStyles.tagsRail}>
          <div className={uiStyles.tagsRailCard}>
            <h3 className={uiStyles.tagsRailTitle}>{t('categories.railSummary')}</h3>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('categories.kpiPhysical')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.physical}</span>
            </div>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('categories.kpiVirtual')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.virtual}</span>
            </div>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('categories.kpiCustom')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.custom}</span>
            </div>
          </div>

          <div className={uiStyles.tagsRailCard}>
            <h3 className={uiStyles.tagsRailTitle}>{t('categories.railSystem')}</h3>
            {systemCats.length === 0 ? (
              <div className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>—</div>
            ) : (
              systemCats.map((cat) => (
                <div key={cat.id} className={uiStyles.tagsRailItem}>
                  <span className={uiStyles.tagsRailItemName}>{cat.name}</span>
                  <span className={uiStyles.tagsRailItemMeta}>
                    {cat.root_type === 'physical' ? '🌍' : '☁️'}{' '}
                    {t('categories.usageBadge', { count: cat.usage_count })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={uiStyles.tagsRailCard}>
            <h3 className={uiStyles.tagsRailTitle}>{t('categories.railCustom')}</h3>
            {customCats.length === 0 ? (
              <div className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>—</div>
            ) : (
              customCats.map((cat) => (
                <div key={cat.id} className={uiStyles.tagsRailItem}>
                  <span className={uiStyles.tagsRailItemName}>{cat.name}</span>
                  <span className={uiStyles.tagsRailItemMeta}>
                    {cat.root_type === 'physical' ? '🌍' : '☁️'}{' '}
                    {t('categories.usageBadge', { count: cat.usage_count })}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <CatFormDialog
        open={createOpen}
        title={t('categories.dialogCreateTitle')}
        submitLabel={t('categories.dialogCreateSubmit')}
        initial={{ name: '', icon: '', root_type: 'physical' }}
        submitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name,
            icon: values.icon || undefined,
            root_type: values.root_type,
          })
        }
      />

      <CatFormDialog
        open={editCat !== null}
        title={t('categories.dialogEditTitle')}
        submitLabel={t('categories.dialogEditSubmit')}
        initial={{
          name: editCat?.name ?? '',
          icon: editCat?.icon ?? '',
          root_type: editCat?.root_type ?? 'physical',
        }}
        submitting={updateMutation.isPending}
        onClose={() => setEditCat(null)}
        onSubmit={(values) => {
          if (!editCat) return;
          updateMutation.mutate({
            id: editCat.id,
            name: values.name,
            icon: values.icon,
            root_type: values.root_type,
          });
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        title={t('categories.dialogDeleteTitle')}
        onClose={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <Stack>
            <p>
              {t('categories.deleteConfirm', { name: pendingDelete.name })}
            </p>
            {pendingDelete.is_system && (
              <div className={uiStyles.tagsDeleteWarn}>
                {t('categories.deleteSystemWarn')}
              </div>
            )}
            <div className={uiStyles.tagsDialogActions}>
              <Button variant="quiet" onClick={() => setPendingDelete(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending || pendingDelete.is_system}
              >
                {t('common.delete')}
              </Button>
            </div>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}

interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}

function KpiCard({ label, value, hint, accent }: KpiCardProps) {
  const valueClass = accent
    ? uiStyles.tagsKpiValueAccent
    : uiStyles.tagsKpiValue;
  return (
    <div className={uiStyles.tagsKpiCard}>
      <span className={uiStyles.tagsKpiLabel}>{label}</span>
      <span className={valueClass}>{value}</span>
      {hint && <span className={uiStyles.tagsKpiHint}>{hint}</span>}
    </div>
  );
}

interface CatFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: CatFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CatFormState) => void;
}

function CatFormDialog({
  open,
  title,
  submitLabel,
  initial,
  submitting,
  onClose,
  onSubmit,
}: CatFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [rootType, setRootType] = useState(initial.root_type);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setIcon(initial.icon);
      setRootType(initial.root_type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, icon, root_type: rootType });
  }

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextField
            label={t('categories.fieldName')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoFocus
            required
            placeholder={t('categories.fieldNamePlaceholder')}
          />
          <TextField
            label={t('categories.fieldIcon')}
            value={icon}
            onChange={(e) => setIcon(e.currentTarget.value)}
            placeholder={t('categories.fieldIconPlaceholder')}
          />
          <SelectField
            label={t('categories.fieldRootType')}
            value={rootType}
            onChange={(e) => setRootType(e.currentTarget.value)}
            options={[
              { value: 'physical', label: t('categories.rootTypePhysical') },
              { value: 'virtual', label: t('categories.rootTypeVirtual') },
            ]}
          />
          <div className={uiStyles.tagsDialogActions}>
            <Button type="button" variant="quiet" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || name.trim() === ''}
            >
              {submitLabel}
            </Button>
          </div>
        </Stack>
      </form>
    </Dialog>
  );
}
