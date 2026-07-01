import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconDotsCircleHorizontal,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { Input } from '../../components/ui/input';
import { SelectField } from '../../components/ui/select-field';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { AssetIcon } from '../../lib/asset-icons/AssetIcon';
import { defaultAssetIconId } from '../../lib/asset-icons/catalog';
import { IconPickerField } from '../../lib/asset-icons/IconPickerField';
import { categoriesApi, type Category } from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import * as s from './categoriesPage.css';

type RootFilter = 'all' | 'physical' | 'virtual';
type IconTone = keyof typeof s.iconTone;

export async function extractApiError(err: unknown, fallback: string): Promise<string> {
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

const TONES: IconTone[] = ['blue', 'green', 'orange', 'violet', 'teal'];

function toneFor(index: number): IconTone {
  return TONES[index % TONES.length];
}

export function CategoryGlyph({
  category,
  tone = 'green',
  size = 18,
}: {
  category: Pick<Category, 'icon' | 'root_type'>;
  tone?: IconTone;
  size?: number;
}) {
  return (
    <span className={`${s.iconTile} ${s.iconTone[tone]}`} aria-hidden>
      <AssetIcon
        id={category.icon}
        fallbackId={defaultAssetIconId(category.root_type)}
        rootType={category.root_type}
        size={size}
      />
    </span>
  );
}

export function CategoriesDesktop() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState<RootFilter>('physical');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const catsQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const cats = catsQuery.data?.categories ?? [];

  const visibleCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cats.filter((cat) => {
      if (rootFilter !== 'all' && cat.root_type !== rootFilter) return false;
      if (!q) return true;
      return cat.name.toLowerCase().includes(q);
    });
  }, [cats, rootFilter, search]);

  const stats = useMemo(() => {
    const physical = cats.filter((c) => c.root_type === 'physical').length;
    const virtual = cats.filter((c) => c.root_type === 'virtual').length;
    const linked = cats.reduce((sum, cat) => sum + cat.usage_count, 0);
    return { total: cats.length, physical, virtual, linked };
  }, [cats]);

  const kpiCards = useMemo(() => {
    const rootCats = rootFilter === 'all'
      ? cats
      : cats.filter((cat) => cat.root_type === rootFilter);
    const totalCategory: Pick<Category, 'icon' | 'root_type'> = {
      icon: 'category-2',
      root_type: rootFilter === 'virtual' ? 'virtual' : 'physical',
    };
    const top = [...rootCats]
      .sort((a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name))
      .slice(0, 4);
    return [
      {
        key: 'all',
        label: t('categories.kpiTotal'),
        value: rootCats.length,
        hint: t('categories.kpiTotalHint'),
        category: totalCategory,
        tone: 'blue' as IconTone,
      },
      ...top.map((cat, index) => ({
        key: cat.id,
        label: cat.name,
        value: cat.usage_count,
        hint: t('categories.usageBadge', { count: cat.usage_count }),
        category: cat,
        tone: toneFor(index + 1),
      })),
    ].slice(0, 5);
  }, [cats, rootFilter, t]);

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
      qc.invalidateQueries({ queryKey: ['items'] });
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
      qc.invalidateQueries({ queryKey: ['items'] });
      setPendingDelete(null);
    },
    onError: async (e) => {
      const msg = await extractApiError(e, (e as Error).message);
      toast.show(t('categories.deleteFailed', { error: msg }));
    },
  });

  return (
    <div className={s.page}>
      <header className={s.desktopHeader}>
        <div className={s.headerCopy}>
          <h2 className={s.title}>{t('categories.title')}</h2>
          <p className={s.description}>{t('categories.description')}</p>
        </div>
        <SearchBox value={search} onChange={setSearch} />
        <Button
          variant="primary"
          leftSection={<IconPlus size={15} />}
          onClick={() => setCreateOpen(true)}
          disabled={!isOnline}
          title={!isOnline ? t('categories.offlineDisabled') : undefined}
        >
          {t('categories.addCategory')}
        </Button>
      </header>

      <CategoryTabs value={rootFilter} onChange={setRootFilter} />

      <div className={s.kpiGrid}>
        {kpiCards.map(({ key, label, value, hint, category, tone }) => (
          <div key={key} className={s.kpiCard}>
            <CategoryGlyph category={category} tone={tone} />
            <span className={s.kpiMeta}>
              <span className={s.kpiLabel}>{label}</span>
              <span className={s.kpiValue}>{value}</span>
              <span className={s.kpiHint}>{hint}</span>
            </span>
          </div>
        ))}
      </div>

      <section className={s.panel}>
        <div className={s.toolbar}>
          <span className={s.resultMeta}>
            {t('categories.resultSummary', {
              count: visibleCats.length,
              total: cats.length,
              linked: stats.linked,
            })}
          </span>
          <span className={s.resultMeta}>
            {t('categories.rootSummary', {
              physical: stats.physical,
              virtual: stats.virtual,
            })}
          </span>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.tableHead}>{t('categories.colName')}</th>
                <th className={s.tableHead}>{t('categories.colRootType')}</th>
                <th className={s.tableHead}>{t('categories.colUsage')}</th>
                <th className={s.tableHead} style={{ textAlign: 'right' }}>
                  {t('categories.colActions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {catsQuery.isPending ? (
                <tr>
                  <td colSpan={4} className={s.empty}>
                    {t('categories.loading')}
                  </td>
                </tr>
              ) : visibleCats.length === 0 ? (
                <tr>
                  <td colSpan={4} className={s.empty}>
                    {cats.length === 0 ? t('categories.emptyAll') : t('categories.emptyFiltered')}
                  </td>
                </tr>
              ) : (
                visibleCats.map((cat, index) => (
                  <tr key={cat.id} className={s.tableRow}>
                    <td className={s.tableCell}>
                      <span className={s.nameCell}>
                        <CategoryGlyph category={cat} tone={toneFor(index)} />
                        <span className={s.nameMeta}>
                          <span className={s.name}>{cat.name}</span>
                          <span className={s.sub}>{cat.icon || t('categories.defaultIcon')}</span>
                        </span>
                      </span>
                    </td>
                    <td className={s.tableCell}>{rootTypeLabel(cat.root_type, t)}</td>
                    <td className={s.tableCell}>
                      <span className={s.usage}>
                        {t('categories.usageBadge', { count: cat.usage_count })}
                      </span>
                    </td>
                    <td className={s.tableCell}>
                      <div className={s.actions}>
                        <Button
                          variant="subtle"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => setEditCat(cat)}
                          disabled={!isOnline}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="subtle"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => setPendingDelete(cat)}
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

      <CatFormDialog
        open={createOpen}
        title={t('categories.dialogCreateTitle')}
        submitLabel={t('categories.dialogCreateSubmit')}
        initial={{ name: '', icon: '', root_type: rootFilter === 'virtual' ? 'virtual' : 'physical' }}
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

      <DeleteDialog
        category={pendingDelete}
        submitting={deleteMutation.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className={s.searchWrap}>
      <IconSearch className={s.searchIcon} size={16} />
      <Input
        className={s.searchInput}
        type="search"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={t('categories.searchPlaceholder')}
        aria-label={t('categories.searchAria')}
      />
    </div>
  );
}

function CategoryTabs({
  value,
  onChange,
}: {
  value: RootFilter;
  onChange: (value: RootFilter) => void;
}) {
  const { t } = useTranslation();
  const tabs: Array<{ value: RootFilter; label: string }> = [
    { value: 'physical', label: t('categories.rootTypePhysical') },
    { value: 'virtual', label: t('categories.rootTypeVirtual') },
    { value: 'all', label: t('categories.all') },
  ];
  return (
    <div className={s.tabs} role="tablist" aria-label={t('categories.rootFilter')}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={s.tab}
          data-active={value === tab.value || undefined}
          onClick={() => onChange(tab.value)}
          role="tab"
          aria-selected={value === tab.value}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function rootTypeLabel(rootType: string, t: ReturnType<typeof useTranslation>['t']): string {
  return rootType === 'virtual'
    ? t('categories.rootTypeVirtual')
    : t('categories.rootTypePhysical');
}

export function CatFormDialog({
  open,
  title,
  submitLabel,
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: CatFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CatFormState) => void;
}) {
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
  }, [initial.icon, initial.name, initial.root_type, open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, icon: icon.trim(), root_type: rootType });
  }

  return (
    <Dialog open={open} title={title} onClose={onClose} contentClassName={s.categoryDialog}>
      <form className={s.categoryForm} onSubmit={handleSubmit}>
        <Stack className={s.categoryFormStack}>
          <TextField
            label={t('categories.fieldName')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoFocus
            required
            placeholder={t('categories.fieldNamePlaceholder')}
          />
          <IconPickerField
            label={t('categories.fieldIcon')}
            value={icon}
            onChange={setIcon}
            rootType={rootType}
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
          <div className={s.overlayActions}>
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

export function DeleteDialog({
  category,
  submitting,
  onClose,
  onConfirm,
}: {
  category: Category | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={category !== null} title={t('categories.dialogDeleteTitle')} onClose={onClose}>
      {category && (
        <Stack>
          <p>{t('categories.deleteConfirm', { name: category.name })}</p>
          <div className={s.overlayActions}>
            <Button variant="quiet" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => onConfirm(category.id)} disabled={submitting}>
              {t('common.delete')}
            </Button>
          </div>
        </Stack>
      )}
    </Dialog>
  );
}

export function MobileMoreIcon() {
  return <IconDotsCircleHorizontal size={18} />;
}
