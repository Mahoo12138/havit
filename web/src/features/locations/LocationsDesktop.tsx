import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import {
  IconChevronRight, IconEdit, IconMapPin, IconMapPlus, IconPackage,
  IconPhoto, IconPlus, IconPrinter, IconQrcode, IconTrash,
} from '@tabler/icons-react';
import {
  Button, Dialog, Row, ScrollArea, Stack, StackTight, TextField, uiStyles,
} from '../../components/ui';
import type { Location } from '../../api/client';
import {
  LOCATION_TYPES, allowedChildTypes, canNestUnder, getLocationTypeMeta, type LocationType,
} from '../../features/locations/types';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { LocationQrCode } from '../../features/qr/QrCode';
import {
  useLocationsData, breadcrumbOf, locationTypeLabel, locationTypeDesc, formatPrice,
  type LocationIndex,
} from './useLocationsData';

interface CreateDialogState { open: boolean; parent: Location | null }
interface EditDialogState { open: boolean; location: Location | null }

export function LocationsDesktop() {
  const { t, tree, index, allItems, itemCountByLocation, subtreeItemCount, physicalRoots, virtualRoots, createMutation, editMutation, deleteMutation, qrMutation } = useLocationsData();
  const isOnline = useNetworkStatus();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({ open: false, parent: null });
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, location: null });
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);
  const [qrViewLocation, setQrViewLocation] = useState<Location | null>(null);

  useEffect(() => {
    function handlePrimaryAction(event: Event) {
      const custom = event as CustomEvent<{ path: string; handled: boolean }>;
      if (!custom.detail?.path.startsWith('/locations')) return;
      custom.detail.handled = true;
      if (isOnline) setCreateDialog({ open: true, parent: null });
    }
    window.addEventListener('havit:mobile-primary-action', handlePrimaryAction);
    return () => window.removeEventListener('havit:mobile-primary-action', handlePrimaryAction);
  }, [isOnline]);

  useEffect(() => {
    if (!selectedId && index.roots.length > 0) {
      setSelectedId(index.roots[0].id);
      setExpanded(new Set(index.roots.map((r) => r.id)));
    }
  }, [index.roots, selectedId]);

  const selected = selectedId ? index.byId.get(selectedId) ?? null : null;
  const breadcrumb = selected ? breadcrumbOf(index, selected.id) : [];
  const directItems = selected ? allItems.filter((it) => it.location_id === selected.id) : [];

  function toggleExpand(id: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <Stack>
      <div className={`${uiStyles.pageHeader} ${uiStyles.mobileHidden}`}>
        <StackTight>
          <h2 className="page-heading">{t('locations.title')}</h2>
          <p className="page-kicker">{t('locations.description')}</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button variant="primary" leftSection={<IconPlus size={15} />} onClick={() => setCreateDialog({ open: true, parent: null })} disabled={!isOnline} title={!isOnline ? t('locations.offlineDisabled') : undefined}>
            {t('locations.addRoot')}
          </Button>
        </div>
      </div>

      <div className={uiStyles.locationLayout}>
        <aside className={uiStyles.locationTreePane}>
          <div className={uiStyles.locationTreeHead}>
            <span className={uiStyles.locationTreeHeadTitle}>{t('locations.tree')}</span>
            <span className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>{t('locations.nodeCount', { count: index.byId.size })}</span>
          </div>
          <ScrollArea className={uiStyles.locationTreeBody}>
            {tree.isPending ? <div className={uiStyles.reminderEmpty}>{t('locations.loading')}</div>
            : index.roots.length === 0 ? <div className={uiStyles.reminderEmpty}>{t('locations.noLocationsHint')}</div>
            : <>
                {physicalRoots.length > 0 && <TreeSection label={t('locations.physicalPositions')} nodes={physicalRoots} index={index} expanded={expanded} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleExpand} subtreeCount={subtreeItemCount} />}
                {virtualRoots.length > 0 && <TreeSection label={t('locations.virtualPositions')} nodes={virtualRoots} index={index} expanded={expanded} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleExpand} subtreeCount={subtreeItemCount} />}
              </>}
          </ScrollArea>
        </aside>

        <section className={uiStyles.locationDetailPane}>
          {!selected ? <DetailEmpty /> : (
            <LocationDetail
              location={selected} breadcrumb={breadcrumb}
              children={index.childrenMap.get(selected.id) ?? []}
              directItems={directItems}
              childrenTotalItems={subtreeItemCount(selected.id) - (itemCountByLocation.get(selected.id) ?? 0)}
              isOnline={isOnline}
              onAddChild={() => setCreateDialog({ open: true, parent: selected })}
              onEdit={() => setEditDialog({ open: true, location: selected })}
              onDelete={() => setPendingDelete(selected)}
              onGenerateQr={() => { if (selected.qr_code) { setQrViewLocation(selected); return; } qrMutation.mutate(selected.id, { onSuccess: (loc) => setQrViewLocation(loc) }); }}
              onSelectChild={setSelectedId} qrPending={qrMutation.isPending} subtreeCount={subtreeItemCount}
            />
          )}
        </section>
      </div>

      <CreateLocationDialog state={createDialog} onClose={() => setCreateDialog({ open: false, parent: null })} onSubmit={(p) => { createMutation.mutate(p, { onSuccess: (created) => { if (created.parent_id) setExpanded((prev) => new Set(prev).add(created.parent_id!)); setSelectedId(created.id); } }); }} pending={createMutation.isPending} isOnline={isOnline} />
      <EditLocationDialog state={editDialog} index={index} onClose={() => setEditDialog({ open: false, location: null })} onSubmit={(p) => editMutation.mutate(p)} pending={editMutation.isPending} isOnline={isOnline} />
      <LocationQrDialog location={qrViewLocation} onClose={() => setQrViewLocation(null)} />
      <ConfirmDeleteDialog target={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={(id) => { deleteMutation.mutate(id, { onSuccess: () => { if (selectedId === id) { const pid = index.parentMap.get(id); setSelectedId(pid ?? null); } } }); }} pending={deleteMutation.isPending} />
    </Stack>
  );
}

/* ── Tree components ── */

function TreeSection({ label, nodes, index, expanded, selectedId, onSelect, onToggle, subtreeCount }: { label: string; nodes: Location[]; index: LocationIndex; expanded: Set<string>; selectedId: string | null; onSelect: (id: string) => void; onToggle: (id: string) => void; subtreeCount: (id: string) => number }) {
  return (
    <div className={uiStyles.locationTreeGroup}>
      <div className={uiStyles.locationTreeGroupLabel}>{label}</div>
      {nodes.map((node) => <TreeNode key={node.id} node={node} depth={0} index={index} expanded={expanded} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} subtreeCount={subtreeCount} />)}
    </div>
  );
}

function TreeNode({ node, depth, index, expanded, selectedId, onSelect, onToggle, subtreeCount }: { node: Location; depth: number; index: LocationIndex; expanded: Set<string>; selectedId: string | null; onSelect: (id: string) => void; onToggle: (id: string) => void; subtreeCount: (id: string) => number }) {
  const meta = getLocationTypeMeta(node.type);
  const Icon = meta.icon;
  const kids = index.childrenMap.get(node.id) ?? [];
  const isExpanded = expanded.has(node.id);
  const count = subtreeCount(node.id);
  return (
    <div>
      <div className={uiStyles.locationTreeRow} data-active={selectedId === node.id} onClick={() => onSelect(node.id)} style={{ paddingLeft: `calc(${depth * 14}px + 0.5rem)` }} role="button" tabIndex={0}>
        <span className={uiStyles.locationTreeRowChevron} data-expanded={isExpanded} data-empty={kids.length === 0} onClick={(e) => { e.stopPropagation(); if (kids.length > 0) onToggle(node.id); }}><IconChevronRight size={13} /></span>
        <Icon size={15} style={{ color: 'currentColor', opacity: 0.85 }} />
        <span className={uiStyles.locationTreeRowName}>{node.name}</span>
        {count > 0 && <span className={uiStyles.locationTreeRowCount}>{count}</span>}
      </div>
      {isExpanded && kids.map((k) => <TreeNode key={k.id} node={k} depth={depth + 1} index={index} expanded={expanded} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} subtreeCount={subtreeCount} />)}
    </div>
  );
}

/* ── Detail components ── */

function DetailEmpty() {
  const { t } = useTranslation();
  return (
    <div className={uiStyles.detailEmpty}>
      <span className={uiStyles.detailEmptyIcon}><IconMapPin size={22} /></span>
      <strong style={{ color: 'var(--havit-ink)' }}>{t('locations.selectToStart')}</strong>
      <span>{t('locations.addFirstChild')}</span>
    </div>
  );
}

function LocationDetail({ location, breadcrumb, children, directItems, childrenTotalItems, isOnline, onAddChild, onEdit, onDelete, onGenerateQr, onSelectChild, qrPending, subtreeCount }: { location: Location; breadcrumb: Location[]; children: Location[]; directItems: any[]; childrenTotalItems: number; isOnline: boolean; onAddChild: () => void; onEdit: () => void; onDelete: () => void; onGenerateQr: () => void; onSelectChild: (id: string) => void; qrPending: boolean; subtreeCount: (id: string) => number }) {
  const { t } = useTranslation();
  const meta = getLocationTypeMeta(location.type);
  const Icon = meta.icon;
  const canHaveChildren = allowedChildTypes(location.type).length > 0;
  return (
    <>
      <header className={uiStyles.locationDetailHead}>
        <Breadcrumb items={breadcrumb} />
        <div className={uiStyles.detailToolbar}>
          {canHaveChildren && <Button variant="quiet" leftSection={<IconMapPlus size={15} />} onClick={onAddChild} disabled={!isOnline}>{t('locations.addChild')}</Button>}
          <Button variant="quiet" leftSection={<IconQrcode size={15} />} onClick={onGenerateQr} disabled={!isOnline || qrPending} title={location.qr_code ? t('locations.hasQR') : t('locations.generateQR')}>{location.qr_code ? t('locations.viewQR') : qrPending ? t('locations.generating') : t('locations.qrCode')}</Button>
          <Button variant="quiet" leftSection={<IconEdit size={15} />} onClick={onEdit} disabled={!isOnline}>{t('locations.edit')}</Button>
          <Button variant="subtle" leftSection={<IconTrash size={15} />} onClick={onDelete} disabled={!isOnline}>{t('locations.delete')}</Button>
        </div>
      </header>
      <div className={uiStyles.locationHero}>
        <span className={uiStyles.locationHeroIcon[meta.tone]}><Icon size={28} /></span>
        <div className={uiStyles.locationHeroMeta}>
          <span className={uiStyles.locationHeroName}>{location.name}</span>
          <Row>
            <span className={uiStyles.typeBadge[meta.tone]}><Icon size={11} />{locationTypeLabel(location.type, t)}</span>
            {location.qr_code && <span className={uiStyles.qrChip}><IconQrcode size={13} />{location.qr_code}</span>}
            {location.is_private && <span className={uiStyles.tagChipWarning}>{t('locations.privateOnly')}</span>}
          </Row>
          <span className={uiStyles.locationHeroSub}>{locationTypeDesc(location.type, t)}</span>
        </div>
      </div>
      <div className={uiStyles.metaGrid}>
        <MetaChip label={t('locations.directItems')} value={directItems.length} />
        <MetaChip label={t('locations.childCount')} value={children.length} />
        <MetaChip label={t('locations.subtreeTotal')} value={subtreeCount(location.id)} />
      </div>
      {children.length > 0 && (
        <div className={uiStyles.detailBody}>
          <div className={uiStyles.subsection}><span className={uiStyles.subsectionTitle}>{t('locations.children')} ({children.length})</span></div>
          <div className={uiStyles.childrenStrip}>
            {children.map((c) => { const cm = getLocationTypeMeta(c.type); const CIcon = cm.icon; const cCount = subtreeCount(c.id); return (
              <Button variant="subtle" key={c.id} className={uiStyles.childChip} onClick={() => onSelectChild(c.id)}>
                <span className={uiStyles.typeBadge[cm.tone]} style={{ padding: '2px 6px' }}><CIcon size={12} /></span>
                <span className={uiStyles.childChipName}>{c.name}</span>
                {cCount > 0 && <span className={uiStyles.childChipCount}>{cCount}</span>}
              </Button>
            ); })}
          </div>
        </div>
      )}
      <div className={uiStyles.detailBody}>
        <div className={uiStyles.subsection}>
          <span className={uiStyles.subsectionTitle}>{t('locations.directItems')}</span>
          {childrenTotalItems > 0 && <span className={uiStyles.muted} style={{ fontSize: '0.78rem' }}>{t('locations.childrenHaveItems', { count: childrenTotalItems })}</span>}
        </div>
        {directItems.length === 0 ? (
          <div className={uiStyles.detailEmpty} style={{ paddingTop: 'var(--havit-space-3)' }}><span className={uiStyles.detailEmptyIcon}><IconPackage size={20} /></span><span>{t('locations.noItems')}</span></div>
        ) : (
          <div className={uiStyles.detailItemList}>
            {directItems.map((it: any) => (
              <Link key={it.id} to="/items/$itemId" params={{ itemId: it.id }} className={uiStyles.detailItemRow}>
                <span className={uiStyles.recentThumb}><IconPhoto size={18} /></span>
                <div className={uiStyles.recentMeta}><span className={uiStyles.recentName}>{it.name}</span><span className={uiStyles.recentSub}>{it.category ?? t('locations.uncategorized')} · {t(`status.${it.status}`, it.status)}</span></div>
                {it.tags?.length > 0 && <div className={uiStyles.recentTags}>{it.tags.slice(0, 2).map((tag: any) => <span key={tag.id} className={uiStyles.tagChipNeutral}>{tag.name}</span>)}</div>}
                <span className={uiStyles.detailItemPrice}>{it.purchase_price ? formatPrice(it.purchase_price, t) : '—'}</span>
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
      {items.map((it, idx) => { const last = idx === items.length - 1; return (
        <span key={it.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span className={uiStyles.breadcrumbItem} data-current={last}>{it.name}</span>
          {!last && <span className={uiStyles.breadcrumbSep}>/</span>}
        </span>
      ); })}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: number }) {
  return <div className={uiStyles.metaChip}><span className={uiStyles.metaChipLabel}>{label}</span><span className={uiStyles.metaChipValue}>{value}</span></div>;
}

/* ── Dialogs ── */

function CreateLocationDialog({ state, onClose, onSubmit, pending, isOnline }: { state: CreateDialogState; onClose: () => void; onSubmit: (p: { name: string; parent_id?: string; type: LocationType; is_private: boolean }) => void; pending: boolean; isOnline: boolean }) {
  const { t } = useTranslation();
  const allowed = allowedChildTypes(state.parent?.type ?? null);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(allowed[0] ?? 'room');
  const [isPrivate, setIsPrivate] = useState(false);
  useEffect(() => { if (state.open) { setName(''); setType(allowed[0] ?? 'room'); setIsPrivate(false); } }, [state.open, state.parent?.id]);
  const title = state.parent ? t('locations.addChildTo', { name: state.parent.name }) : t('locations.addRoot');
  return (
    <Dialog open={state.open} onClose={onClose} title={title}>
      <Stack>
        <TypeChoiceGrid value={type} onChange={setType} parentType={state.parent?.type ?? null} />
        <TextField label={t('locations.name')} required value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('locations.namePlaceholder')} />
        <SwitchRow label={t('locations.privatePosition')} hint={t('locations.privateHint')} checked={isPrivate} onChange={setIsPrivate} />
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onClose}>{t('locations.cancel')}</Button>
          <Button disabled={!name.trim() || !isOnline || pending} onClick={() => { if (name.trim()) onSubmit({ name: name.trim(), parent_id: state.parent?.id, type, is_private: isPrivate }); }}>{pending ? t('locations.saving') : t('locations.save')}</Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function EditLocationDialog({ state, index, onClose, onSubmit, pending, isOnline }: { state: EditDialogState; index: LocationIndex; onClose: () => void; onSubmit: (p: { id: string; name: string; type: LocationType }) => void; pending: boolean; isOnline: boolean }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('room');
  useEffect(() => { if (state.open && state.location) { setName(state.location.name); setType((state.location.type as LocationType) ?? 'room'); } }, [state.open, state.location]);
  if (!state.location) return null;
  const parentId = index.parentMap.get(state.location.id);
  const parentType = parentId ? index.byId.get(parentId)?.type ?? null : null;
  return (
    <Dialog open={state.open} onClose={onClose} title={t('locations.editTitle', { name: state.location.name })}>
      <Stack>
        <TypeChoiceGrid value={type} onChange={setType} parentType={parentType} />
        <TextField label={t('locations.name')} required value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onClose}>{t('locations.cancel')}</Button>
          <Button disabled={!name.trim() || !isOnline || pending} onClick={() => { if (state.location && name.trim()) onSubmit({ id: state.location.id, name: name.trim(), type }); }}>{pending ? t('locations.saving') : t('locations.save')}</Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function TypeChoiceGrid({ value, onChange, parentType }: { value: LocationType; onChange: (t: LocationType) => void; parentType: string | null }) {
  const { t } = useTranslation();
  return (
    <div>
      <span className={uiStyles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>{t('locations.type')}</span>
      <div className={uiStyles.typeChoiceGrid}>
        {LOCATION_TYPES.map((lt) => { const Icon = lt.icon; const disabled = parentType !== null && !canNestUnder(parentType, lt.value); const active = value === lt.value; return (
          <Button variant="subtle" key={lt.value} className={uiStyles.typeChoiceCard} data-active={active} disabled={disabled} onClick={() => onChange(lt.value)} title={disabled ? t('locations.cannotNest', { parent: locationTypeLabel(getLocationTypeMeta(parentType ?? '').value, t), child: locationTypeLabel(lt.value, t) }) : undefined}>
            <span className={uiStyles.typeChoiceIcon}><Icon size={16} /></span>
            <span className={uiStyles.typeChoiceBody}><span className={uiStyles.typeChoiceLabel}>{locationTypeLabel(lt.value, t)}</span><span className={uiStyles.typeChoiceDesc}>{locationTypeDesc(lt.value, t)}</span></span>
          </Button>
        ); })}
      </div>
    </div>
  );
}

function SwitchRow({ label, hint, checked, onChange }: { label: string; hint?: ReactNode; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className={uiStyles.switchRow}>
      <StackTight><span className={uiStyles.label}>{label}</span>{hint && <span className={uiStyles.help}>{hint}</span>}</StackTight>
      <span role="switch" aria-checked={checked} tabIndex={0} className={uiStyles.switchTrack} data-checked={checked} onClick={() => onChange(!checked)} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}><span className={uiStyles.switchThumb} /></span>
    </div>
  );
}

function ConfirmDeleteDialog({ target, onCancel, onConfirm, pending }: { target: Location | null; onCancel: () => void; onConfirm: (id: string) => void; pending: boolean }) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!target} onClose={onCancel} title={target ? t('locations.confirmDeleteTitle', { name: target.name }) : t('locations.deleteLocation')}>
      <Stack>
        <p style={{ margin: 0, lineHeight: 1.55 }}>{t('locations.deleteWarning')}</p>
        <div className={uiStyles.formActions}>
          <Button variant="quiet" onClick={onCancel}>{t('locations.cancel')}</Button>
          <Button disabled={!target || pending} onClick={() => target && onConfirm(target.id)}>{pending ? t('locations.deleting') : t('locations.confirmDelete')}</Button>
        </div>
      </Stack>
    </Dialog>
  );
}

function LocationQrDialog({ location, onClose }: { location: Location | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!location?.qr_code} onClose={onClose} title={location ? t('locations.qrDialogTitle', { name: location.name }) : t('locations.qrCode')}>
      {location?.qr_code && (
        <Stack>
          <div style={{ display: 'flex', justifyContent: 'center' }}><LocationQrCode code={location.qr_code} size={180} alt={location.name} /></div>
          <span className={uiStyles.qrChip} style={{ alignSelf: 'center' }}><IconQrcode size={13} />{location.qr_code}</span>
          <p className={uiStyles.muted} style={{ margin: 0, textAlign: 'center' }}>{t('locations.qrDialogHint')}</p>
          <div className={uiStyles.formActions}>
            <Button variant="quiet" onClick={onClose}>{t('locations.close')}</Button>
            <Link to="/qr-print"><Button variant="quiet" leftSection={<IconPrinter size={15} />}>{t('locations.printLabel')}</Button></Link>
          </div>
        </Stack>
      )}
    </Dialog>
  );
}
