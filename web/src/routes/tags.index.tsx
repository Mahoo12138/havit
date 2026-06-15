import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import { tagsApi, type Tag } from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/tags/')({
  component: TagsPage,
});

const COLOR_PRESETS = [
  '#0d9488',
  '#2563eb',
  '#7c3aed',
  '#ef4444',
  '#f97316',
  '#16a34a',
  '#d97706',
  '#0891b2',
  '#db2777',
  '#6b7280',
];

const DEFAULT_SWATCH = '#94a3b8';

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

function formatRelative(ts: number | undefined, t: (k: string, o?: any) => string): string {
  if (!ts) return t('tags.recentNever');
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - ts);
  if (diff < 60) return t('tags.justNow');
  if (diff < 3600) return t('tags.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('tags.hoursAgo', { count: Math.floor(diff / 3600) });
  if (diff < 86400 * 30) return t('tags.daysAgo', { count: Math.floor(diff / 86400) });
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface TagFormState {
  name: string;
  color: string;
}

function TagsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const tags = tagsQuery.data?.tags ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tg) => tg.name.toLowerCase().includes(q));
  }, [tags, search]);

  const stats = useMemo(() => {
    const total = tags.length;
    const inUse = tags.filter((tg) => (tg.usage_count ?? 0) > 0).length;
    const unused = total - inUse;
    const rate = total > 0 ? Math.round((inUse / total) * 100) : 0;
    return { total, inUse, unused, rate };
  }, [tags]);

  const recent = useMemo(() => {
    return [...tags]
      .filter((tg) => tg.created_at)
      .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
      .slice(0, 5);
  }, [tags]);

  const mostUsed = useMemo(() => {
    return [...tags]
      .filter((tg) => (tg.usage_count ?? 0) > 0)
      .sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
      .slice(0, 3);
  }, [tags]);

  const createMutation = useMutation({
    mutationFn: (body: { name: string; color?: string }) => tagsApi.create(body),
    onSuccess: () => {
      toast.show(t('tags.created'));
      qc.invalidateQueries({ queryKey: ['tags'] });
      setCreateOpen(false);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('tags.createFailed', { error: msg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { id: string; name: string; color: string }) =>
      tagsApi.update(body.id, { name: body.name, color: body.color }),
    onSuccess: () => {
      toast.show(t('tags.updated'));
      qc.invalidateQueries({ queryKey: ['tags'] });
      setEditTag(null);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('tags.updateFailed', { error: msg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagsApi.remove(id),
    onSuccess: () => {
      toast.show(t('tags.deleted'));
      qc.invalidateQueries({ queryKey: ['tags'] });
      setPendingDelete(null);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('tags.deleteFailed', { error: msg }));
    },
  });

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{t('tags.title')}</h2>
          <p className="page-kicker">{t('tags.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="primary"
            leftSection={<IconPlus size={15} />}
            onClick={() => setCreateOpen(true)}
            disabled={!isOnline}
            title={!isOnline ? t('tags.offlineDisabled') : undefined}
          >
            {t('tags.addTag')}
          </Button>
        </div>
      </div>

      <div className={uiStyles.tagsKpiGrid}>
        <KpiCard
          label={t('tags.kpiTotal')}
          value={stats.total}
          hint={t('tags.kpiTotalHint')}
        />
        <KpiCard
          label={t('tags.kpiInUse')}
          value={stats.inUse}
          hint={t('tags.kpiInUseHint')}
          accent
        />
        <KpiCard
          label={t('tags.kpiUnused')}
          value={stats.unused}
          hint={t('tags.kpiUnusedHint')}
          warn={stats.unused > 0}
        />
        <KpiCard
          label={t('tags.kpiUsageRate')}
          value={`${stats.rate}%`}
          hint={t('tags.kpiUsageRateHint')}
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
                placeholder={t('tags.searchPlaceholder')}
                aria-label={t('tags.searchAria')}
              />
            </div>
          </div>

          <div className={uiStyles.tagsTableWrap}>
            <table className={uiStyles.tagsTable}>
              <thead>
                <tr>
                  <th className={uiStyles.tagsTableHead}>{t('tags.colName')}</th>
                  <th className={uiStyles.tagsTableHead}>{t('tags.colUsage')}</th>
                  <th className={uiStyles.tagsTableHead}>{t('tags.colCreated')}</th>
                  <th className={uiStyles.tagsTableHead} style={{ textAlign: 'right' }}>
                    {t('tags.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tagsQuery.isPending ? (
                  <tr>
                    <td colSpan={4} className={uiStyles.tagsEmptyState}>
                      {t('tags.loading')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={uiStyles.tagsEmptyState}>
                      {tags.length === 0 ? t('tags.emptyAll') : t('tags.emptyFiltered')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((tg) => (
                    <tr key={tg.id} className={uiStyles.tagsTableRow}>
                      <td className={uiStyles.tagsTableCell}>
                        <div className={uiStyles.tagsTableNameCell}>
                          <span
                            className={uiStyles.tagsColorSwatch}
                            style={{ background: tg.color ?? DEFAULT_SWATCH }}
                            aria-hidden
                          />
                          <span className={uiStyles.tagsName}>{tg.name}</span>
                        </div>
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        <span
                          className={
                            (tg.usage_count ?? 0) > 0
                              ? uiStyles.tagsUsageBadgeActive
                              : uiStyles.tagsUsageBadge
                          }
                        >
                          {t('tags.usageBadge', { count: tg.usage_count ?? 0 })}
                        </span>
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        {formatRelative(tg.created_at, t)}
                      </td>
                      <td className={uiStyles.tagsTableCell}>
                        <div className={uiStyles.tagsRowActions}>
                          <Button
                            variant="subtle"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => setEditTag(tg)}
                            disabled={!isOnline}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="subtle"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => setPendingDelete(tg)}
                            disabled={!isOnline}
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
            <h3 className={uiStyles.tagsRailTitle}>{t('tags.railSummary')}</h3>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('tags.kpiInUse')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.inUse}</span>
            </div>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('tags.kpiUnused')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.unused}</span>
            </div>
            <div className={uiStyles.tagsMiniKpi}>
              <span className={uiStyles.tagsMiniKpiLabel}>{t('tags.kpiUsageRate')}</span>
              <span className={uiStyles.tagsMiniKpiValue}>{stats.rate}%</span>
            </div>
          </div>

          <div className={uiStyles.tagsRailCard}>
            <h3 className={uiStyles.tagsRailTitle}>{t('tags.railRecent')}</h3>
            {recent.length === 0 ? (
              <div className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>
                {t('tags.railRecentEmpty')}
              </div>
            ) : (
              recent.map((tg) => (
                <div key={tg.id} className={uiStyles.tagsRailItem}>
                  <span
                    className={uiStyles.tagsColorSwatch}
                    style={{ background: tg.color ?? DEFAULT_SWATCH }}
                    aria-hidden
                  />
                  <span className={uiStyles.tagsRailItemName}>{tg.name}</span>
                  <span className={uiStyles.tagsRailItemMeta}>
                    {formatRelative(tg.created_at, t)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={uiStyles.tagsRailCard}>
            <h3 className={uiStyles.tagsRailTitle}>{t('tags.railMostUsed')}</h3>
            {mostUsed.length === 0 ? (
              <div className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>
                {t('tags.railMostUsedEmpty')}
              </div>
            ) : (
              mostUsed.map((tg) => (
                <div key={tg.id} className={uiStyles.tagsRailItem}>
                  <span
                    className={uiStyles.tagsColorSwatch}
                    style={{ background: tg.color ?? DEFAULT_SWATCH }}
                    aria-hidden
                  />
                  <span className={uiStyles.tagsRailItemName}>{tg.name}</span>
                  <span className={uiStyles.tagsRailItemMeta}>
                    {t('tags.usageBadge', { count: tg.usage_count ?? 0 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <TagFormDialog
        open={createOpen}
        title={t('tags.dialogCreateTitle')}
        submitLabel={t('tags.dialogCreateSubmit')}
        initial={{ name: '', color: COLOR_PRESETS[0] }}
        submitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) =>
          createMutation.mutate({ name: values.name, color: values.color || undefined })
        }
      />

      <TagFormDialog
        open={editTag !== null}
        title={t('tags.dialogEditTitle')}
        submitLabel={t('tags.dialogEditSubmit')}
        initial={{ name: editTag?.name ?? '', color: editTag?.color ?? '' }}
        submitting={updateMutation.isPending}
        onClose={() => setEditTag(null)}
        onSubmit={(values) => {
          if (!editTag) return;
          updateMutation.mutate({
            id: editTag.id,
            name: values.name,
            color: values.color,
          });
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        title={t('tags.dialogDeleteTitle')}
        onClose={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <Stack>
            <p>
              {t('tags.deleteConfirm', { name: pendingDelete.name })}
            </p>
            {(pendingDelete.usage_count ?? 0) > 0 && (
              <div className={uiStyles.tagsDeleteWarn}>
                {t('tags.deleteInUseWarn', {
                  count: pendingDelete.usage_count ?? 0,
                })}
              </div>
            )}
            <div className={uiStyles.tagsDialogActions}>
              <Button variant="quiet" onClick={() => setPendingDelete(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
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
  warn?: boolean;
}

function KpiCard({ label, value, hint, accent, warn }: KpiCardProps) {
  const valueClass = accent
    ? uiStyles.tagsKpiValueAccent
    : warn
    ? uiStyles.tagsKpiValueWarn
    : uiStyles.tagsKpiValue;
  return (
    <div className={uiStyles.tagsKpiCard}>
      <span className={uiStyles.tagsKpiLabel}>{label}</span>
      <span className={valueClass}>{value}</span>
      {hint && <span className={uiStyles.tagsKpiHint}>{hint}</span>}
    </div>
  );
}

interface TagFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: TagFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: TagFormState) => void;
}

function TagFormDialog({
  open,
  title,
  submitLabel,
  initial,
  submitting,
  onClose,
  onSubmit,
}: TagFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);

  // Reset on each open
  useEffect(() => {
    if (open) {
      setName(initial.name);
      setColor(initial.color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, color });
  }

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextField
            label={t('tags.fieldName')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoFocus
            required
            placeholder={t('tags.fieldNamePlaceholder')}
          />
          <div>
            <label className={uiStyles.label}>{t('tags.fieldColor')}</label>
            <div className={uiStyles.tagsColorPalette}>
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={uiStyles.tagsPaletteSwatch}
                  style={{ background: preset }}
                  data-selected={color === preset}
                  onClick={() => setColor(preset)}
                  aria-label={preset}
                />
              ))}
              <input
                type="text"
                className={uiStyles.tagsHexInput}
                value={color}
                onChange={(e) => setColor(e.currentTarget.value)}
                placeholder="#RRGGBB"
                aria-label={t('tags.fieldColorHex')}
              />
            </div>
          </div>
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
