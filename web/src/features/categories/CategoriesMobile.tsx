import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SelectField } from '../../components/ui/select-field';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { categoriesApi, type Category } from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import {
  CategoryGlyph,
  DeleteDialog,
  extractApiError,
  rootTypeLabel,
} from './CategoriesDesktop';
import * as s from './categoriesPage.css';

type RootFilter = 'physical' | 'virtual' | 'all';

interface FormState {
  name: string;
  icon: string;
  root_type: string;
}

export function CategoriesMobile() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState<RootFilter>('physical');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
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
    const physical = cats.filter((cat) => cat.root_type === 'physical').length;
    const virtual = cats.filter((cat) => cat.root_type === 'virtual').length;
    return { total: cats.length, physical, virtual };
  }, [cats]);

  const createMutation = useMutation({
    mutationFn: (body: { name: string; icon?: string; root_type: string }) =>
      categoriesApi.create(body),
    onSuccess: () => {
      toast.show(t('categories.created'));
      qc.invalidateQueries({ queryKey: ['categories'] });
      setFormMode(null);
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
      setFormMode(null);
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

  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/categories')) return;
      custom.detail.handled = true;
      if (isOnline) {
        setEditCat(null);
        setFormMode('create');
      }
    }

    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
  }, [isOnline]);

  return (
    <div className={s.mobilePage}>
      <div className={s.kpiGrid}>
        <MobileStat
          label={t('categories.kpiTotal')}
          value={stats.total}
          hint={t('categories.kpiTotalHint')}
          category={{ icon: 'folder', root_type: 'physical' }}
        />
        <MobileStat
          label={t('categories.kpiPhysical')}
          value={stats.physical}
          hint={t('categories.kpiPhysicalHint')}
          category={{ icon: 'sofa', root_type: 'physical' }}
        />
        <MobileStat
          label={t('categories.kpiVirtual')}
          value={stats.virtual}
          hint={t('categories.kpiVirtualHint')}
          category={{ icon: 'code', root_type: 'virtual' }}
        />
      </div>

      <CategoryTabs value={rootFilter} onChange={setRootFilter} />

      <div className={s.mobileFilterBar}>
        <div className={s.searchWrap}>
          <IconSearch className={s.searchIcon} size={16} />
          <Input
            className={s.searchInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder={t('categories.searchPlaceholder')}
            aria-label={t('categories.searchAria')}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="icon"
          onClick={() => {
            setEditCat(null);
            setFormMode('create');
          }}
          disabled={!isOnline}
          aria-label={t('categories.addCategory')}
        >
          <IconPlus size={18} />
        </Button>
      </div>

      <div className={s.resultMeta}>
        {t('categories.resultSummary', {
          count: visibleCats.length,
          total: cats.length,
          linked: cats.reduce((sum, cat) => sum + cat.usage_count, 0),
        })}
      </div>

      {catsQuery.isPending ? (
        <div className={s.empty}>{t('categories.loading')}</div>
      ) : visibleCats.length === 0 ? (
        <div className={s.empty}>
          {cats.length === 0 ? t('categories.emptyAll') : t('categories.emptyFiltered')}
        </div>
      ) : (
        <div className={s.mobileList}>
          {visibleCats.map((cat, index) => (
            <div key={cat.id} className={s.mobileRow}>
              <CategoryGlyph category={cat} tone={index % 2 === 0 ? 'green' : 'teal'} />
              <div className={s.nameMeta}>
                <span className={s.name}>{cat.name}</span>
                <span className={s.sub}>
                  {rootTypeLabel(cat.root_type, t)} · {cat.icon || t('categories.defaultIcon')}
                </span>
              </div>
              <div className={s.mobileRowActions}>
                <span className={s.mobileCount}>{cat.usage_count}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditCat(cat);
                    setFormMode('edit');
                  }}
                  disabled={!isOnline}
                  aria-label={t('common.edit')}
                >
                  <IconEdit size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(cat)}
                  disabled={!isOnline}
                  aria-label={t('common.delete')}
                >
                  <IconTrash size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formMode && (
        <CategoryFormOverlay
          title={formMode === 'create' ? t('categories.dialogCreateTitle') : t('categories.dialogEditTitle')}
          submitLabel={formMode === 'create' ? t('categories.dialogCreateSubmit') : t('categories.dialogEditSubmit')}
          initial={{
            name: editCat?.name ?? '',
            icon: editCat?.icon ?? '',
            root_type: editCat?.root_type ?? (rootFilter === 'virtual' ? 'virtual' : 'physical'),
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setFormMode(null);
            setEditCat(null);
          }}
          onSubmit={(values) => {
            if (formMode === 'create') {
              createMutation.mutate({
                name: values.name,
                icon: values.icon || undefined,
                root_type: values.root_type,
              });
              return;
            }
            if (!editCat) return;
            updateMutation.mutate({
              id: editCat.id,
              name: values.name,
              icon: values.icon,
              root_type: values.root_type,
            });
          }}
        />
      )}

      <DeleteDialog
        category={pendingDelete}
        submitting={deleteMutation.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}

function MobileStat({
  label,
  value,
  hint,
  category,
}: {
  label: string;
  value: number;
  hint: string;
  category: Pick<Category, 'icon' | 'root_type'>;
}) {
  return (
    <div className={s.kpiCard}>
      <CategoryGlyph category={category} tone="blue" />
      <span className={s.kpiMeta}>
        <span className={s.kpiLabel}>{label}</span>
        <span className={s.kpiValue}>{value}</span>
        <span className={s.kpiHint}>{hint}</span>
      </span>
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
    <div className={s.mobileTabs} role="tablist" aria-label={t('categories.rootFilter')}>
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

function CategoryFormOverlay({
  title,
  submitLabel,
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial: FormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: FormState) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [rootType, setRootType] = useState(initial.root_type);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, icon: icon.trim(), root_type: rootType });
  }

  return (
    <div className={s.mobileOverlay}>
      <div className={s.overlayHeader}>
        <h3 className={s.overlayTitle}>{title}</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t('common.close')}>
          <IconX size={18} />
        </Button>
      </div>
      <form className={s.overlayBody} onSubmit={handleSubmit}>
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
        <div className={s.overlayActions}>
          <Button type="button" variant="quiet" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || name.trim() === ''}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
