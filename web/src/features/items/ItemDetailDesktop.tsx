import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconArchive,
  IconAlertTriangle,
  IconBell,
  IconChevronRight,
  IconClipboardList,
  IconClock,
  IconCopy,
  IconDots,
  IconDownload,
  IconFileExport,
  IconHistory,
  IconHome,
  IconKey,
  IconMapPin,
  IconPackage,
  IconPhotoPlus,
  IconPlus,
  IconQrcode,
  IconReceipt,
  IconShieldCheck,
  IconShoppingCart,
  IconTag,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { TextField } from '../../components/ui/text-field';
import {
  containerApi,
  itemsApi,
  loansApi,
  suppliesExtendedApi,
  virtualAssetsApi,
  type Attachment,
  type Item,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { formatDate, formatDateTime, formatPrice, useItemDetailData } from './useItemDetailData';
import * as s from './ItemDetailDesktop.css';

export function ItemDetailDesktop({ itemId }: { itemId: string }) {
  const d = useItemDetailData(itemId);
  const {
    t,
    item,
    tags,
    locationPath,
    photos,
    photoIdx,
    currentPhoto,
    setSelectedPhotoIdx,
    currentTags,
    tagOptions,
    statusOptions,
    fileInputRef,
    handlePhotoPick,
    addTag,
    removeTag,
    archive,
    updateStatus,
    uploadPhoto,
    replaceTags,
    createTag,
  } = d;
  const isOnline = useNetworkStatus();
  const [tagName, setTagName] = useState('');
  const [selectedTagID, setSelectedTagID] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  if (item.isLoading) return <Spinner />;
  if (item.error || !item.data) return <p className={s.errorText}>{t('errors.not_found')}</p>;

  const it = item.data;
  const typeLabel = t(`items.${it.type}`, it.type);
  const isConsumable = it.type === 'predictive_supplies' || it.type === 'tracked_spares';
  const isVirtual = it.type === 'virtual';
  const warranty = getWarrantyView(it, t);

  function copyCurrentUrl() {
    void navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <div className={s.page}>
      <header className={s.topBar}>
        <nav className={s.breadcrumb} aria-label={String(t('common.breadcrumb'))}>
          <Link to="/assets">{t('assets.title')}</Link>
          <IconChevronRight size={13} />
          <span>{typeLabel}</span>
          {it.category && (
            <>
              <IconChevronRight size={13} />
              <span>{it.category}</span>
            </>
          )}
          <IconChevronRight size={13} />
          <span data-current>{it.name}</span>
        </nav>
        <div className={s.topActions}>
          <Button variant="outline" size="sm" leftSection={<IconCopy size={14} />} onClick={copyCurrentUrl}>
            {t('itemDetail.share')}
          </Button>
          <Button variant="outline" size="sm" leftSection={<IconFileExport size={14} />} onClick={() => window.print()}>
            {t('itemDetail.exportPdf')}
          </Button>
          {it.status === 'stolen' && (
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconDownload size={14} />}
              onClick={() => {
                void suppliesExtendedApi.claimPdf(itemId).then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${it.name}-insurance-claim.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }}
            >
              {t('items.downloadClaim')}
            </Button>
          )}
          <Button
            variant="quiet"
            size="sm"
            leftSection={<IconArchive size={14} />}
            onClick={() => archive.mutate()}
            disabled={!isOnline || archive.isPending}
            title={!isOnline ? t('items.cannotArchiveOffline') : undefined}
          >
            {t('items.archive')}
          </Button>
        </div>
      </header>

      <section className={s.heroCard}>
        <Gallery
          itemName={it.name}
          photos={photos}
          currentPhoto={currentPhoto}
          photoIdx={photoIdx}
          isOnline={isOnline}
          uploadPending={uploadPhoto.isPending}
          onPickPhoto={setSelectedPhotoIdx}
          onAddPhoto={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          className={s.hiddenInput}
          type="file"
          accept="image/*"
          onChange={(event) => {
            handlePhotoPick(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />

        <div className={s.heroInfo}>
          <div className={s.titleRow}>
            <div>
              <h1 className={s.title}>{it.name}</h1>
              <div className={s.badgeRow}>
                <StatusBadge status={it.status} />
                <span className={s.typeBadge}>{typeLabel}</span>
                {it.category && <span className={s.categoryBadge}>{it.category}</span>}
                <button type="button" className={s.iconBadge} onClick={() => setTagDialogOpen(true)} aria-label={t('items.manageTags')}>
                  <IconPlus size={13} />
                </button>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={t('itemDetail.more')}>
              <IconDots size={16} />
            </Button>
          </div>

          <div className={s.tagRow}>
            {currentTags.length === 0 ? (
              <span className={s.mutedText}>{t('items.noTags')}</span>
            ) : (
              currentTags.map((tag: any) => (
                <span className={s.tagChip} key={tag.id}>
                  #{tag.name}
                </span>
              ))
            )}
          </div>

          <div className={s.specGrid}>
            <SpecCell label={t('items.status')}>
              <StatusBadge status={it.status} />
            </SpecCell>
            <SpecCell label={t('itemDetail.currentLocation')}>{locationPath ?? t('common.notSet')}</SpecCell>
            <SpecCell label={t('items.serialNumber')}>{it.serial_number ?? t('common.notSet')}</SpecCell>
            <SpecCell label={t('items.purchasePrice')}>{formatPrice(it.purchase_price, it.purchase_currency, t)}</SpecCell>
            <SpecCell label={t('itemDetail.purchasedAt')}>{formatDate(it.purchase_date) ?? t('common.notSet')}</SpecCell>
            <SpecCell label={t('itemDetail.baseLocation')}>{it.home_base_location_id ? t('common.set') : t('common.notSet')}</SpecCell>
            <SpecCell label={t('itemDetail.qrCode')}>
      <InlineCode text={it.id.slice(0, 8).toUpperCase()} />
            </SpecCell>
            <SpecCell label={t('itemDetail.lastUpdated')}>{formatDateTime(it.updated_at)}</SpecCell>
            <SpecCell label={t('itemDetail.warrantyExpiry')} span>
              {warranty.expiresAt ? `${formatDate(warranty.expiresAt)} (${warranty.summary})` : t('itemDetail.noWarranty')}
            </SpecCell>
          </div>
        </div>

        <LocationRouteCard locationPath={locationPath} />
      </section>

      <main className={s.contentGrid}>
        <div className={s.leftColumn}>
          <WarrantyPanel item={it} />
          <EventsSection itemId={itemId} />
        </div>

        <div className={s.rightColumn}>
          <LoansSection itemId={itemId} />
          <TasksPanel item={it} />
          {isConsumable && <ConsumableSection itemId={itemId} item={it} />}
          {isVirtual && <VirtualSection itemId={itemId} />}
          <RelatedPanel itemId={itemId} />
          <MetadataSection itemId={itemId} item={it} />
          <ContentsSection itemId={itemId} />
          <StatusPanel statusOptions={statusOptions} status={it.status} isOnline={isOnline} pending={updateStatus.isPending} onChange={(status) => updateStatus.mutate(status)} locationPath={locationPath} />
          <TimelineMeta item={it} />
        </div>
      </main>

      <Dialog open={tagDialogOpen} title={t('items.manageTags')} onClose={() => setTagDialogOpen(false)}>
        <div className={s.dialogStack}>
          <div className={s.tagList}>
            {currentTags.map((tag: any) => (
              <span className={s.tagChip} key={tag.id}>
                {tag.name}
                <button
                  type="button"
                  className={s.tagRemove}
                  onClick={() => removeTag(tag.id)}
                  disabled={!isOnline || replaceTags.isPending}
                  title={t('items.removeTag')}
                >
                  <IconX size={12} />
                </button>
              </span>
            ))}
            {currentTags.length === 0 && <span className={s.mutedText}>{t('items.noTags')}</span>}
          </div>
          {tagOptions.length > 0 && (
            <SelectField
              label={t('items.selectTag')}
              options={tagOptions}
              placeholder={tags.isLoading ? t('items.tagsLoading') : t('items.selectTagPlaceholder')}
              value={selectedTagID}
              disabled={!isOnline || replaceTags.isPending}
              onChange={(event) => {
                const tagID = event.currentTarget.value;
                const tag = tags.data?.tags.find((candidate: any) => candidate.id === tagID);
                if (tag) addTag(tag);
                setSelectedTagID('');
              }}
            />
          )}
          <div className={s.inlineForm}>
            <TextField label={t('items.newTag')} value={tagName} onChange={(event) => setTagName(event.currentTarget.value)} disabled={!isOnline || createTag.isPending} />
            <Button
              leftSection={<IconPlus size={15} />}
              disabled={!isOnline || !tagName.trim() || createTag.isPending}
              onClick={() => {
                createTag.mutate(tagName, {
                  onSuccess: (tag) => {
                    addTag(tag);
                    setTagName('');
                  },
                });
              }}
            >
              {t('items.createTag')}
            </Button>
          </div>
          <div className={s.dialogActions}>
            <Button variant="quiet" onClick={() => setTagDialogOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function Gallery({ itemName, photos, currentPhoto, photoIdx, isOnline, uploadPending, onPickPhoto, onAddPhoto }: {
  itemName: string;
  photos: Attachment[];
  currentPhoto?: Attachment;
  photoIdx: number;
  isOnline: boolean;
  uploadPending: boolean;
  onPickPhoto: (idx: number) => void;
  onAddPhoto: () => void;
}) {
  return (
    <div className={s.gallery}>
      <div className={s.mainPhoto}>
        {currentPhoto ? <HeroPhoto itemName={itemName} photo={currentPhoto} /> : <PhotoEmpty />}
        {photos.length > 0 && <span className={s.photoCount}>{photoIdx + 1}/{photos.length}</span>}
      </div>
      <div className={s.thumbStrip}>
        {photos.map((photo, idx) => (
          <button key={photo.id} type="button" className={s.thumbButton} data-active={idx === photoIdx || undefined} onClick={() => onPickPhoto(idx)} aria-label={photo.filename}>
            <img src={photo.url} alt="" className={s.thumbImg} />
          </button>
        ))}
        <button type="button" className={s.thumbAdd} onClick={onAddPhoto} disabled={!isOnline || uploadPending} aria-label="upload">
          {uploadPending ? <Spinner /> : <IconPhotoPlus size={18} />}
        </button>
      </div>
    </div>
  );
}

function PhotoEmpty() {
  const { t } = useTranslation();
  return (
    <div className={s.photoEmpty}>
      <IconPackage size={42} />
      <strong>{t('items.noPhotoYet')}</strong>
      <span>{t('items.uploadPhotoHint')}</span>
    </div>
  );
}

function HeroPhoto({ itemName, photo }: { itemName: string; photo: Attachment }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={s.photoEmpty}>
        <IconPackage size={42} />
        <strong>{t('items.photoReadFailed')}</strong>
        <span>{photo.filename}</span>
      </div>
    );
  }
  return <img className={s.mainPhotoImg} src={photo.url} alt={`${itemName} photo`} onError={() => setFailed(true)} />;
}

function LocationRouteCard({ locationPath }: { locationPath?: string }) {
  const { t } = useTranslation();
  const nodes = splitPath(locationPath);
  return (
    <aside className={s.locationCard}>
      <div className={s.cardTitleRow}>
        <h2 className={s.cardTitle}>{t('itemDetail.locationPath')}</h2>
      </div>
      <div className={s.routeList}>
        {(nodes.length > 0 ? nodes : [t('common.notSet')]).map((node, index) => {
          const isCurrent = index === nodes.length - 1 && nodes.length > 0;
          return (
            <div className={s.routeItem} data-current={isCurrent || undefined} key={`${node}-${index}`}>
              <span className={s.routeIcon}>{index === 0 ? <IconHome size={14} /> : <IconMapPin size={14} />}</span>
              <span>{node}</span>
              {isCurrent && <span className={s.routeCode}>{t('common.current')}</span>}
            </div>
          );
        })}
      </div>
      <Link to="/locations" className={s.blockLink}>
        {t('itemDetail.viewItemsAtLocation')}
        <IconChevronRight size={14} />
      </Link>
    </aside>
  );
}

function WarrantyPanel({ item }: { item: Item }) {
  const { t } = useTranslation();
  const warranty = getWarrantyView(item, t);
  return (
    <SectionCard icon={<IconShieldCheck size={15} />} title={t('itemDetail.warranty')} action={<Button variant="ghost" size="sm">{t('common.edit')}</Button>}>
      <div className={s.documentStrip}>
        <div className={s.documentThumb}><IconReceipt size={20} /></div>
        <div className={s.documentThumb} data-card><IconKey size={20} /></div>
        <button type="button" className={s.documentAdd}><IconPlus size={16} />{t('common.add')}</button>
      </div>
      <div className={s.kvList}>
        <KvRow label={t('itemDetail.warrantyExpiry')}>{warranty.expiresAt ? formatDate(warranty.expiresAt) : t('common.notSet')}</KvRow>
        <KvRow label={t('itemDetail.daysLeft')}>{warranty.summary}</KvRow>
        <KvRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</KvRow>
        <KvRow label={t('items.serialNumber')}>
          <InlineCode text={item.serial_number ?? t('common.notSet')} />
        </KvRow>
      </div>
    </SectionCard>
  );
}

function TasksPanel({ item }: { item: Item }) {
  const { t } = useTranslation();
  const warranty = getWarrantyView(item, t);
  return (
    <SectionCard icon={<IconBell size={15} />} title={t('itemDetail.tasks')}>
      <div className={s.taskList}>
        <TaskRow title={t('itemDetail.warrantyReminder')} meta={warranty.expiresAt ? formatDate(warranty.expiresAt) : t('common.notSet')} tone={warranty.tone} />
        <TaskRow title={t('itemDetail.cleaningReminder')} meta={t('itemDetail.everySixMonths')} tone="info" />
      </div>
      <button type="button" className={s.blockLinkButton}>{t('itemDetail.viewAllTasks')}</button>
    </SectionCard>
  );
}

function TaskRow({ title, meta, tone }: { title: string; meta: string | undefined; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }) {
  return (
    <div className={s.taskRow}>
      <span className={s.taskIcon} data-tone={tone}><IconBell size={14} /></span>
      <div className={s.taskMeta}>
        <span className={s.taskTitle}>{title}</span>
        <span className={s.taskSub}>{meta}</span>
      </div>
      <span className={s.taskState}>{tone === 'danger' ? '!' : ''}</span>
    </div>
  );
}

function StatusPanel({ statusOptions, status, isOnline, pending, onChange, locationPath }: {
  statusOptions: Array<{ value: string; label: string }>;
  status: string;
  isOnline: boolean;
  pending: boolean;
  onChange: (status: string) => void;
  locationPath?: string;
}) {
  const { t } = useTranslation();
  return (
    <SectionCard icon={<IconMapPin size={15} />} title={t('itemDetail.statusAndLocation')}>
      <div className={s.kvList}>
        <KvRow label={t('items.location')}>{locationPath ?? t('common.notSet')}</KvRow>
      </div>
      <SelectField label={t('items.switchStatus')} options={statusOptions} value={status} disabled={!isOnline || pending} onChange={(event) => onChange(event.currentTarget.value)} />
    </SectionCard>
  );
}

function RelatedPanel({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'contents'], queryFn: () => containerApi.listContents(itemId) });
  const contents = data?.items ?? [];
  return (
    <SectionCard icon={<IconPackage size={15} />} title={t('itemDetail.relatedAssets')} action={<Button variant="ghost" size="sm" leftSection={<IconPlus size={14} />}>{t('common.add')}</Button>}>
      {isLoading ? <Spinner /> : contents.length === 0 ? (
        <div className={s.emptyState}>{t('itemDetail.noRelatedAssets')}</div>
      ) : (
        <div className={s.relatedList}>
          {contents.slice(0, 3).map((child: any) => (
            <Link key={child.id} to="/items/$itemId" params={{ itemId: child.id }} className={s.relatedRow}>
              <span className={s.relatedThumb}><IconPackage size={15} /></span>
              <span className={s.relatedMeta}>
                <span className={s.relatedName}>{child.name}</span>
                <span className={s.relatedSub}>{String(t(`status.${child.status}`, child.status))}</span>
              </span>
              <StatusBadge status={child.status} />
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function TimelineMeta({ item }: { item: Item }) {
  const { t } = useTranslation();
  return (
    <SectionCard icon={<IconClock size={15} />} title={t('itemDetail.timestamps')}>
      <div className={s.kvList}>
        <KvRow label={t('itemDetail.createdAt')}>{formatDateTime(item.created_at)}</KvRow>
        <KvRow label={t('itemDetail.updatedAt')}>{formatDateTime(item.updated_at)}</KvRow>
      </div>
    </SectionCard>
  );
}

function ConsumableSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOneMutation = useMutation({ mutationFn: () => suppliesExtendedApi.useOne(itemId), onSuccess: (next) => qc.setQueryData(['item', itemId], next) });
  const stock = item.current_stock ?? 0;
  const min = item.min_stock_threshold ?? 0;
  const low = min > 0 && stock <= min;
  return (
    <SectionCard icon={<IconShoppingCart size={15} />} title={t('itemDetail.consumable')} action={low ? <span className={s.warningText}><IconAlertTriangle size={12} />{t('itemDetail.belowThreshold')}</span> : undefined}>
      <div className={s.stockHero}>
        <span className={s.stockValue}>{stock}</span>
        <span>{t('common.pieces')}</span>
      </div>
      <div className={s.kvList}>
        <KvRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</KvRow>
        <KvRow label={t('itemDetail.lifespanDays')}>{item.lifespan_days ?? '—'}</KvRow>
      </div>
      {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOneMutation.mutate()} disabled={useOneMutation.isPending || stock <= 0}>{t('itemDetail.useOne')}</Button>}
    </SectionCard>
  );
}

function VirtualSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const addons = useQuery({ queryKey: ['item', itemId, 'addons'], queryFn: () => virtualAssetsApi.listAddons(itemId) });
  const credentials = creds.data?.credentials ?? [];
  const addonList = addons.data?.addons ?? [];
  return (
    <SectionCard icon={<IconKey size={15} />} title={t('itemDetail.platformCredentials')}>
      {creds.isLoading ? <Spinner /> : credentials.length === 0 ? (
        <div className={s.emptyState}>{t('itemDetail.noCredentials')}</div>
      ) : credentials.map((credential: any) => (
        <div className={s.compactCard} key={credential.id}>
          <span className={s.compactTitle}>{credential.platform}</span>
          {credential.account && <span className={s.compactSub}>{t('itemDetail.accountLabel')}: {credential.account}</span>}
          {credential.order_id && <span className={s.compactSub}>{t('itemDetail.orderLabel')}: {credential.order_id}</span>}
        </div>
      ))}
      {addonList.length > 0 && (
        <div className={s.kvList}>
          {addonList.map((addon: any) => (
            <KvRow label={addon.name} key={addon.id}>{addon.price != null ? `${addon.price} ${addon.currency ?? ''}`.trim() : t('common.notSet')}</KvRow>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <SectionCard icon={<IconClipboardList size={15} />} title={t('itemDetail.loans')} action={<Button variant="ghost" size="sm">{t('itemDetail.addLoan')}</Button>}>
      {isLoading ? <Spinner /> : loans.length === 0 ? (
        <div className={s.emptyState}>{t('itemDetail.noLoans')}</div>
      ) : loans.map((loan: any) => (
        <div className={s.loanRow} key={loan.id}>
          <span className={s.avatar}>{loan.borrower_name?.slice(0, 1) ?? '?'}</span>
          <div className={s.loanMeta}>
            <span className={s.compactTitle}>{loan.borrower_name}</span>
            <span className={s.compactSub}>{formatDate(loan.loaned_at)}{loan.due_at ? ` / ${formatDate(loan.due_at)}` : ''}</span>
          </div>
          <Badge>{String(t(`status.${loan.status}`, loan.status))}</Badge>
        </div>
      ))}
    </SectionCard>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <SectionCard icon={<IconHistory size={15} />} title={t('itemDetail.events')}>
      {isLoading ? <Spinner /> : events.length === 0 ? (
        <div className={s.emptyState}>{t('itemDetail.noEvents')}</div>
      ) : (
        <div className={s.timeline}>
          {events.slice(0, 5).map((event: any) => (
            <div className={s.timelineRow} key={event.id}>
              <span className={s.timelineIcon}><IconHistory size={13} /></span>
              <div className={s.timelineMeta}>
                <span className={s.compactTitle}>{String(t(`events.${event.event_type}`, event.event_type))}</span>
                <span className={s.compactSub}>{formatDateTime(event.created_at)}</span>
                {event.payload && <code className={s.payload}>{event.payload}</code>}
              </div>
            </div>
          ))}
        </div>
      )}
      {events.length > 5 && <button type="button" className={s.blockLinkButton}>{t('itemDetail.viewAllEvents')}</button>}
    </SectionCard>
  );
}

function MetadataSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formVal, setFormVal] = useState('');
  const [editOriginalKey, setEditOriginalKey] = useState<string | null>(null);
  const isOnline = useNetworkStatus();
  const meta = item.metadata ?? {};
  const entries = Object.entries(meta);
  const updateMutation = useMutation({
    mutationFn: (next: Record<string, string>) => itemsApi.update(itemId, { metadata: next }),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });

  function openAdd() {
    setEditOriginalKey(null);
    setFormKey('');
    setFormVal('');
    setDialogOpen(true);
  }

  function openEdit(key: string, value: string) {
    setEditOriginalKey(key);
    setFormKey(key);
    setFormVal(value);
    setDialogOpen(true);
  }

  function handleSave() {
    const key = formKey.trim();
    const value = formVal.trim();
    if (!key) return;
    const next: Record<string, string> = {};
    for (const [entryKey, entryValue] of entries) {
      if (editOriginalKey !== null && entryKey === editOriginalKey) continue;
      next[entryKey] = entryValue;
    }
    next[key] = value;
    updateMutation.mutate(next);
    setDialogOpen(false);
  }

  function handleRemove(key: string) {
    const next = { ...meta };
    delete next[key];
    updateMutation.mutate(next);
  }

  return (
    <>
      <SectionCard icon={<IconTag size={15} />} title={t('itemDetail.customMetadata')} action={<Button variant="ghost" size="sm" leftSection={<IconPlus size={14} />} disabled={!isOnline} onClick={openAdd}>{t('common.add')}</Button>}>
        {entries.length > 0 ? (
          <div className={s.kvList}>
            {entries.map(([key, value]) => (
              <div className={s.kvRow} key={key}>
                <span className={s.kvLabel}>{key}</span>
                <button type="button" className={s.kvValueButton} onClick={() => openEdit(key, value)}>{value}</button>
                <button type="button" className={s.iconOnly} onClick={() => handleRemove(key)} disabled={!isOnline || updateMutation.isPending} title={t('common.delete')}>
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : <div className={s.emptyState}>{t('itemDetail.noMetadata')}</div>}
      </SectionCard>
      <Dialog open={dialogOpen} title={editOriginalKey !== null ? t('itemDetail.editMetadata') : t('itemDetail.addMetadata')} onClose={() => setDialogOpen(false)}>
        <div className={s.dialogStack}>
          <TextField label={t('itemDetail.metadataKey')} value={formKey} onChange={(event) => setFormKey(event.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} autoFocus />
          <TextField label={t('itemDetail.metadataValue')} value={formVal} onChange={(event) => setFormVal(event.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} />
          <div className={s.dialogActions}>
            <Button variant="quiet" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button disabled={!isOnline || !formKey.trim() || updateMutation.isPending} onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function ContentsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'contents'], queryFn: () => containerApi.listContents(itemId) });
  const removeMutation = useMutation({ mutationFn: (childId: string) => containerApi.remove(itemId, childId), onSuccess: () => qc.invalidateQueries({ queryKey: ['item', itemId, 'contents'] }) });
  const contents = data?.items ?? [];
  if (!isLoading && contents.length === 0) return null;
  return (
    <SectionCard icon={<IconPackage size={15} />} title={t('itemDetail.contents')}>
      {isLoading ? <Spinner /> : contents.map((child: any) => (
        <div className={s.relatedRow} key={child.id}>
          <span className={s.relatedThumb}><IconPackage size={15} /></span>
          <span className={s.relatedMeta}>
            <span className={s.relatedName}>{child.name}</span>
            <span className={s.relatedSub}>{String(t(`status.${child.status}`, child.status))}</span>
          </span>
          <Button variant="quiet" size="sm" leftSection={<IconX size={13} />} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(child.id)}>{t('itemDetail.removeFromContainer')}</Button>
        </div>
      ))}
    </SectionCard>
  );
}

function SectionCard({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.sectionCard}>
      <header className={s.sectionHead}>
        <h2 className={s.sectionTitle}><span className={s.sectionIcon}>{icon}</span>{title}</h2>
        {action}
      </header>
      <div className={s.sectionBody}>{children}</div>
    </section>
  );
}

function SpecCell({ label, children, span }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div className={s.specCell} data-span={span || undefined}>
      <span className={s.specLabel}>{label}</span>
      <span className={s.specValue}>{children}</span>
    </div>
  );
}

function KvRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.kvRow}>
      <span className={s.kvLabel}>{label}</span>
      <span className={s.kvValue}>{children}</span>
    </div>
  );
}

function InlineCode({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <span className={s.inlineCode}>
      {text}
      <button type="button" className={s.copyButton} onClick={() => void navigator.clipboard?.writeText(text)} aria-label={t('common.copy')}>
        <IconCopy size={12} />
      </button>
      <IconQrcode size={14} />
    </span>
  );
}

function getWarrantyView(item: Item, t: (key: string, params?: any) => string): {
  expiresAt?: number;
  daysLeft: number | null;
  summary: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
} {
  if (!item.warranty_expires_at) return { daysLeft: null, summary: '—', tone: 'neutral' };
  const daysLeft = Math.floor((item.warranty_expires_at - Date.now() / 1000) / 86400);
  if (daysLeft < 0) return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.warrantyExpired'), tone: 'danger' };
  if (daysLeft <= 30) return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.daysCount', { count: daysLeft }), tone: 'warning' };
  return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.daysCount', { count: daysLeft }), tone: 'success' };
}

function splitPath(path?: string) {
  return path?.split('→').map((part) => part.trim()).filter(Boolean) ?? [];
}
