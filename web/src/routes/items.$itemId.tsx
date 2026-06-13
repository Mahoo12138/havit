import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconAlertTriangle,
  IconArchive,
  IconCalendar,
  IconClipboardList,
  IconDownload,
  IconHistory,
  IconKey,
  IconMapPin,
  IconPackage,
  IconPhotoPlus,
  IconPlus,
  IconShieldCheck,
  IconShoppingCart,
  IconTag,
  IconX,
} from '@tabler/icons-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  SelectField,
  Spinner,
  Stack,
  StackTight,
  StatusBadge,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import {
  containerApi,
  itemsApi,
  itemsExtendedApi,
  loansApi,
  virtualAssetsApi,
  locationsApi,
  tagsApi,
  type Attachment,
  type Item,
  type Location,
  type Tag,
} from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetail,
});

type TFunc = ReturnType<typeof useTranslation>['t'];

function ItemDetail() {
  const { t } = useTranslation();
  const { itemId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagName, setTagName] = useState('');
  const [selectedTagID, setSelectedTagID] = useState('');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const item = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.get(itemId),
  });
  const attachments = useQuery({
    queryKey: ['item', itemId, 'attachments'],
    queryFn: () => itemsApi.attachments(itemId),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const tags = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const archive = useMutation({
    mutationFn: () => itemsApi.archive(itemId),
    onSuccess: () => {
      toast.show(t('items.archived'));
      qc.invalidateQueries({ queryKey: ['items'] });
      nav({ to: '/items' });
    },
  });
  const updateStatus = useMutation({
    mutationFn: (status: string) => itemsApi.update(itemId, { status }),
    onSuccess: (next) => {
      toast.show(t('items.statusUpdated'));
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (e: Error) =>
      toast.show(t('items.statusUpdateFailed', { error: e.message })),
  });
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => itemsApi.uploadPhoto(itemId, file),
    onSuccess: () => {
      toast.show(t('items.photoUploaded'));
      qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] });
    },
    onError: (e: Error) =>
      toast.show(t('items.photoUploadFailed', { error: e.message })),
  });
  const replaceTags = useMutation({
    mutationFn: (tagIds: string[]) => itemsApi.replaceTags(itemId, tagIds),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.show(t('items.tagsUpdated'));
    },
    onError: (e: Error) =>
      toast.show(t('items.tagUpdateFailed', { error: e.message })),
  });
  const createTag = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (tag) => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      addTag(tag);
      setTagName('');
    },
    onError: (e: Error) =>
      toast.show(t('items.tagCreateFailed', { error: e.message })),
  });

  if (item.isLoading) return <Spinner />;
  if (item.error || !item.data) {
    return <p className={uiStyles.errorText}>{t('errors.not_found')}</p>;
  }

  const it = item.data;
  const locationPath = findLocationPath(locs.data?.tree, it.location_id);
  const photos = (attachments.data?.attachments ?? []).filter(
    (att) => att.type === 'photo',
  );
  const photoIdx = Math.min(selectedPhotoIdx, Math.max(photos.length - 1, 0));
  const currentPhoto = photos[photoIdx];
  const currentTags = it.tags ?? [];
  const currentTagIDs = currentTags.map((tag) => tag.id);
  const availableTags =
    tags.data?.tags.filter((tag) => !currentTagIDs.includes(tag.id)) ?? [];
  const tagOptions = availableTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));

  const statusOptions = [
    { value: 'in_stock', label: t('status.in_stock') },
    { value: 'borrowed', label: t('status.borrowed') },
    { value: 'idle', label: t('status.idle') },
    { value: 'for_sale', label: t('status.for_sale') },
    { value: 'sold', label: t('status.sold') },
    { value: 'given_away', label: t('status.given_away') },
    { value: 'damaged', label: t('status.damaged') },
    { value: 'lost', label: t('status.lost') },
    { value: 'stolen', label: t('status.stolen') },
  ];

  const isConsumable = it.type === 'consumable_a' || it.type === 'consumable_b';
  const isVirtual = it.type === 'virtual';

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      toast.show(t('items.selectImage'));
      return;
    }
    uploadPhoto.mutate(file);
  }

  function addTag(tag: Tag) {
    if (currentTagIDs.includes(tag.id)) return;
    replaceTags.mutate([...currentTagIDs, tag.id]);
  }

  function removeTag(tagID: string) {
    replaceTags.mutate(currentTagIDs.filter((id) => id !== tagID));
  }

  const typeLabel = t(`items.${it.type}`, it.type);

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{it.name}</h2>
          <div className={uiStyles.itemSpecBadges}>
            <StatusBadge status={it.status} />
            <span className={uiStyles.itemSpecType}>{typeLabel}</span>
            {it.category && (
              <span className={uiStyles.itemSpecCategory}>{it.category}</span>
            )}
          </div>
        </StackTight>
        <div className={uiStyles.pageActions}>
          {it.status === 'stolen' && (
            <Button
              leftSection={<IconDownload size={16} />}
              variant="subtle"
              onClick={() => {
                itemsExtendedApi.claimPdf(itemId).then((blob) => {
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
            leftSection={<IconArchive size={16} />}
            variant="quiet"
            onClick={() => archive.mutate()}
            disabled={!isOnline || archive.isPending}
            title={!isOnline ? t('items.cannotArchiveOffline') : undefined}
          >
            {t('items.archive')}
          </Button>
        </div>
      </div>

      <Card className="surface-card">
        <div className={uiStyles.itemHero}>
          <div className={uiStyles.itemGallery}>
            <div className={uiStyles.itemMainPhoto}>
              {currentPhoto ? (
                <HeroPhoto
                  key={currentPhoto.id}
                  itemName={it.name}
                  photo={currentPhoto}
                />
              ) : (
                <div className={uiStyles.itemPhotoEmpty}>
                  <strong>{t('items.noPhotoYet')}</strong>
                  <span>{t('items.uploadPhotoHint')}</span>
                </div>
              )}
              {photos.length > 0 && (
                <span className={uiStyles.itemPhotoCount}>
                  {photoIdx + 1} / {photos.length}
                </span>
              )}
            </div>
            <div className={uiStyles.itemThumbStrip}>
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  className={uiStyles.itemThumb}
                  data-active={idx === photoIdx || undefined}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  aria-label={photo.filename}
                >
                  <img
                    className={uiStyles.itemThumbImg}
                    src={photo.url}
                    alt={photo.filename}
                  />
                </button>
              ))}
              <button
                type="button"
                className={uiStyles.itemThumbAdd}
                disabled={!isOnline || uploadPhoto.isPending}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('common.upload', { defaultValue: 'Upload' })}
                title={
                  !isOnline ? t('items.cannotUploadOffline') : undefined
                }
              >
                {uploadPhoto.isPending ? (
                  <Spinner />
                ) : (
                  <IconPhotoPlus size={20} />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              className={uiStyles.hiddenFileInput}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handlePhotoPick(e.currentTarget.files?.[0]);
                e.currentTarget.value = '';
              }}
            />
          </div>

          <div className={uiStyles.itemSpec}>
            <div className={uiStyles.itemSpecGrid}>
              <SpecCell label={t('items.location')}>
                {locationPath ?? t('common.notSet')}
              </SpecCell>
              <SpecCell label={t('items.purchasePrice')}>
                {formatPrice(it.purchase_price, it.purchase_currency, t)}
              </SpecCell>
              <SpecCell label={t('items.serialNumber')}>
                {it.serial_number ?? t('common.notSet')}
              </SpecCell>
              <SpecCell label={t('itemDetail.purchasedAt')}>
                {formatDate(it.purchase_date) ?? t('common.notSet')}
              </SpecCell>
              <SpecCell label={t('itemDetail.warrantyExpiry')}>
                {formatDate(it.warranty_expires_at) ?? t('common.notSet')}
              </SpecCell>
              <SpecCell label={t('itemDetail.warrantyContact')}>
                {it.warranty_contact ?? t('common.notSet')}
              </SpecCell>
            </div>
            {it.description && (
              <p className={uiStyles.itemNote}>{it.description}</p>
            )}
          </div>
        </div>
      </Card>

      <div className={uiStyles.itemDashboard}>
        <div className={uiStyles.itemMain}>
          <div className={uiStyles.itemSectionGrid}>
            <WarrantySection item={it} />
            {isConsumable && (
              <ConsumableSection itemId={itemId} item={it} />
            )}
            {isVirtual && <VirtualSection itemId={itemId} />}
          </div>

          <LoansSection itemId={itemId} />
          <ContentsSection itemId={itemId} />
          <EventsSection itemId={itemId} />
        </div>

        <div className={uiStyles.itemRail}>
          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}>
              <h3 className={uiStyles.itemSectionTitle}>
                <span className={uiStyles.itemSectionTitleIcon}>
                  <IconMapPin size={14} />
                </span>
                {t('itemDetail.statusAndLocation')}
              </h3>
            </header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.itemRailField}>
                <span className={uiStyles.itemRailFieldLabel}>
                  {t('items.location')}
                </span>
                <div className={uiStyles.itemRailLocation}>
                  <IconMapPin size={14} />
                  <span>{locationPath ?? t('common.notSet')}</span>
                </div>
              </div>
              <SelectField
                label={t('items.switchStatus')}
                options={statusOptions}
                value={it.status}
                disabled={!isOnline || updateStatus.isPending}
                onChange={(e) => updateStatus.mutate(e.currentTarget.value)}
              />
            </div>
          </section>

          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}>
              <h3 className={uiStyles.itemSectionTitle}>
                <span className={uiStyles.itemSectionTitleIcon}>
                  <IconTag size={14} />
                </span>
                {t('items.tags')}
              </h3>
            </header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.tagList}>
                {currentTags.map((tag) => (
                  <span className={uiStyles.tagChip} key={tag.id}>
                    {tag.name}
                    <button
                      className={uiStyles.tagRemove}
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      disabled={!isOnline || replaceTags.isPending}
                      title={t('items.removeTag')}
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
                {currentTags.length === 0 && (
                  <span className={uiStyles.muted}>{t('items.noTags')}</span>
                )}
              </div>
              <SelectField
                label={t('items.selectTag')}
                options={tagOptions}
                placeholder={
                  tags.isLoading
                    ? t('items.tagsLoading')
                    : t('items.selectTagPlaceholder')
                }
                value={selectedTagID}
                disabled={
                  !isOnline || replaceTags.isPending || tagOptions.length === 0
                }
                onChange={(e) => {
                  const tagID = e.currentTarget.value;
                  const tag = tags.data?.tags.find(
                    (candidate) => candidate.id === tagID,
                  );
                  if (tag) addTag(tag);
                  setSelectedTagID('');
                }}
              />
              <div className={uiStyles.inlineForm}>
                <TextField
                  label={t('items.newTag')}
                  value={tagName}
                  onChange={(e) => setTagName(e.currentTarget.value)}
                  disabled={!isOnline || createTag.isPending}
                />
                <Button
                  leftSection={<IconPlus size={15} />}
                  disabled={
                    !isOnline || !tagName.trim() || createTag.isPending
                  }
                  onClick={() => createTag.mutate(tagName)}
                >
                  {t('items.createTag')}
                </Button>
              </div>
            </div>
          </section>

          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}>
              <h3 className={uiStyles.itemSectionTitle}>
                <span className={uiStyles.itemSectionTitleIcon}>
                  <IconCalendar size={14} />
                </span>
                {t('itemDetail.timestamps')}
              </h3>
            </header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.itemKvList}>
                <KvRow label={t('itemDetail.createdAt')}>
                  {formatDateTime(it.created_at)}
                </KvRow>
                <KvRow label={t('itemDetail.updatedAt')}>
                  {formatDateTime(it.updated_at)}
                </KvRow>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Stack>
  );
}

function SpecCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={uiStyles.itemSpecCell}>
      <span className={uiStyles.itemSpecCellLabel}>{label}</span>
      <span className={uiStyles.itemSpecCellValue}>{children}</span>
    </div>
  );
}

function KvRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={uiStyles.itemKvRow}>
      <span className={uiStyles.itemKvLabel}>{label}</span>
      <span className={uiStyles.itemKvValue}>{children}</span>
    </div>
  );
}

function WarrantySection({ item }: { item: Item }) {
  const { t } = useTranslation();
  const expiresAt = item.warranty_expires_at;
  const now = Date.now() / 1000;
  const daysLeft =
    expiresAt != null ? Math.floor((expiresAt - now) / 86400) : null;
  const state =
    daysLeft == null
      ? null
      : daysLeft < 0
        ? 'expired'
        : daysLeft <= 30
          ? 'expiring'
          : 'active';

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconShieldCheck size={14} />
          </span>
          {t('itemDetail.warranty')}
        </h3>
        {state === 'active' && <Badge>{t('itemDetail.warrantyActive')}</Badge>}
        {state === 'expiring' && (
          <span className={uiStyles.itemStockLow}>
            <IconAlertTriangle size={12} />
            {t('itemDetail.warrantyExpiring')}
          </span>
        )}
      </header>
      <div className={uiStyles.itemSectionBody}>
        {expiresAt ? (
          <div className={uiStyles.itemKvList}>
            <KvRow label={t('itemDetail.warrantyExpiry')}>
              {formatDate(expiresAt)}
            </KvRow>
            {daysLeft != null && (
              <KvRow label={t('itemDetail.daysLeft')}>
                {daysLeft >= 0
                  ? t('itemDetail.daysCount', { count: daysLeft })
                  : t('itemDetail.warrantyExpired')}
              </KvRow>
            )}
            <KvRow label={t('itemDetail.warrantyContact')}>
              {item.warranty_contact ?? t('common.notSet')}
            </KvRow>
          </div>
        ) : (
          <div className={uiStyles.itemSectionEmpty}>
            {t('itemDetail.noWarranty')}
          </div>
        )}
      </div>
    </section>
  );
}

function ConsumableSection({
  itemId,
  item,
}: {
  itemId: string;
  item: Item;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOneMutation = useMutation({
    mutationFn: () => itemsExtendedApi.useOne(itemId),
    onSuccess: (next) => qc.setQueryData(['item', itemId], next),
  });

  const stock = item.current_stock ?? 0;
  const min = item.min_stock_threshold ?? 0;
  const low = min > 0 && stock <= min;

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconShoppingCart size={14} />
          </span>
          {t('itemDetail.consumable')}
        </h3>
        {low && (
          <span className={uiStyles.itemStockLow}>
            <IconAlertTriangle size={12} />
            {t('itemDetail.belowThreshold')}
          </span>
        )}
      </header>
      <div className={uiStyles.itemSectionBody}>
        <div className={uiStyles.itemStockHero}>
          <span className={uiStyles.itemStockValue}>{stock}</span>
          <span className={uiStyles.itemStockUnit}>{t('common.pieces')}</span>
        </div>
        <div className={uiStyles.itemKvList}>
          <KvRow label={t('itemDetail.minStock')}>
            {item.min_stock_threshold ?? '—'}
          </KvRow>
          <KvRow label={t('itemDetail.lifespanDays')}>
            {item.lifespan_days ?? '—'}
          </KvRow>
        </div>
        {item.type === 'consumable_b' && (
          <Button
            leftSection={<IconShoppingCart size={15} />}
            onClick={() => useOneMutation.mutate()}
            disabled={useOneMutation.isPending || stock <= 0}
          >
            {t('itemDetail.useOne')}
          </Button>
        )}
      </div>
    </section>
  );
}

function VirtualSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const creds = useQuery({
    queryKey: ['item', itemId, 'credentials'],
    queryFn: () => virtualAssetsApi.listCredentials(itemId),
  });
  const addons = useQuery({
    queryKey: ['item', itemId, 'addons'],
    queryFn: () => virtualAssetsApi.listAddons(itemId),
  });

  const credentials = creds.data?.credentials ?? [];
  const addonList = addons.data?.addons ?? [];

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconKey size={14} />
          </span>
          {t('itemDetail.platformCredentials')}
        </h3>
      </header>
      <div className={uiStyles.itemSectionBody}>
        {creds.isLoading ? (
          <Spinner />
        ) : credentials.length === 0 ? (
          <div className={uiStyles.itemSectionEmpty}>
            {t('itemDetail.noCredentials')}
          </div>
        ) : (
          credentials.map((c) => (
            <div className={uiStyles.itemCredentialCard} key={c.id}>
              <span className={uiStyles.itemCredentialTitle}>
                {c.platform}
              </span>
              {c.account && (
                <span className={uiStyles.itemCredentialMeta}>
                  {t('itemDetail.accountLabel')}: {c.account}
                </span>
              )}
              {c.order_id && (
                <span className={uiStyles.itemCredentialMeta}>
                  {t('itemDetail.orderLabel')}: {c.order_id}
                </span>
              )}
            </div>
          ))
        )}
        {addonList.length > 0 && (
          <>
            <div className={uiStyles.itemRailDivider} />
            <span className={uiStyles.itemSectionHint}>
              {t('itemDetail.addonPurchases')}
            </span>
            <div className={uiStyles.itemKvList}>
              {addonList.map((a) => (
                <div className={uiStyles.itemAddonRow} key={a.id}>
                  <span className={uiStyles.itemAddonName}>{a.name}</span>
                  <span className={uiStyles.itemAddonPrice}>
                    {a.price != null
                      ? `${a.price} ${a.currency ?? ''}`.trim()
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId, 'loans'],
    queryFn: () => loansApi.listForItem(itemId),
  });
  const loans = data?.loans ?? [];

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconClipboardList size={14} />
          </span>
          {t('itemDetail.loans')}
        </h3>
        {loans.length > 0 && (
          <span className={uiStyles.itemSectionHint}>
            {loans.length} {t('common.items')}
          </span>
        )}
      </header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? (
          <Spinner />
        ) : loans.length === 0 ? (
          <div className={uiStyles.itemSectionEmpty}>
            {t('itemDetail.noLoans')}
          </div>
        ) : (
          loans.map((loan) => (
            <div className={uiStyles.itemLoanCard} key={loan.id}>
              <div className={uiStyles.itemLoanHead}>
                <span className={uiStyles.itemLoanName}>
                  {loan.borrower_name}
                </span>
                <Badge>{t(`status.${loan.status}`, loan.status)}</Badge>
              </div>
              {loan.borrower_contact && (
                <span className={uiStyles.itemLoanMeta}>
                  {t('itemDetail.contactInfo')}: {loan.borrower_contact}
                </span>
              )}
              <span className={uiStyles.itemLoanMeta}>
                {t('itemDetail.loanDate')}: {formatDate(loan.loaned_at)}
                {loan.due_at &&
                  ` · ${t('itemDetail.expectedReturn')}: ${formatDate(loan.due_at)}`}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId, 'events'],
    queryFn: () => itemsExtendedApi.listEvents(itemId),
  });
  const events = data?.events ?? [];

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconHistory size={14} />
          </span>
          {t('itemDetail.events')}
        </h3>
      </header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <div className={uiStyles.itemSectionEmpty}>
            {t('itemDetail.noEvents')}
          </div>
        ) : (
          <div className={uiStyles.itemTimeline}>
            {events.map((ev) => (
              <div className={uiStyles.itemTimelineRow} key={ev.id}>
                <span className={uiStyles.itemTimelineTitle}>
                  {t(`events.${ev.event_type}`, ev.event_type)}
                </span>
                <span className={uiStyles.itemTimelineMeta}>
                  {formatDateTime(ev.created_at)}
                </span>
                {ev.payload && (
                  <code className={uiStyles.itemTimelinePayload}>
                    {ev.payload}
                  </code>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ContentsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId, 'contents'],
    queryFn: () => containerApi.listContents(itemId),
  });

  const removeMutation = useMutation({
    mutationFn: (childId: string) => containerApi.remove(itemId, childId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['item', itemId, 'contents'] }),
  });

  const contents = data?.items ?? [];
  if (!isLoading && contents.length === 0) return null;

  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}>
          <span className={uiStyles.itemSectionTitleIcon}>
            <IconPackage size={14} />
          </span>
          {t('itemDetail.contents')}
        </h3>
      </header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className={uiStyles.tableWrap}>
            <table className={uiStyles.table}>
              <thead>
                <tr>
                  <th className={uiStyles.th}>{t('common.name')}</th>
                  <th className={uiStyles.th}>{t('items.status')}</th>
                  <th className={uiStyles.th} />
                </tr>
              </thead>
              <tbody>
                {contents.map((child) => (
                  <tr className={uiStyles.tableRow} key={child.id}>
                    <td className={uiStyles.td}>{child.name}</td>
                    <td className={uiStyles.td}>
                      <StatusBadge status={child.status} />
                    </td>
                    <td className={uiStyles.td}>
                      <Button
                        variant="quiet"
                        leftSection={<IconX size={13} />}
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(child.id)}
                      >
                        {t('itemDetail.removeFromContainer')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroPhoto({
  itemName,
  photo,
}: {
  itemName: string;
  photo: Attachment;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={uiStyles.itemPhotoEmpty}>
        <strong>{t('items.photoReadFailed')}</strong>
        <span>{photo.filename}</span>
      </div>
    );
  }
  return (
    <img
      className={uiStyles.itemMainPhotoImg}
      src={photo.url}
      alt={`${itemName} photo`}
      onError={() => setFailed(true)}
    />
  );
}

function findLocationPath(
  nodes: Location[] | undefined,
  locationId: string | undefined,
  prefix = '',
): string | undefined {
  if (!nodes || !locationId) return undefined;
  for (const node of nodes) {
    const path = prefix ? `${prefix} → ${node.name}` : node.name;
    if (node.id === locationId) return path;
    const child = findLocationPath(node.children, locationId, path);
    if (child) return child;
  }
  return undefined;
}

function formatDate(unix: number | undefined): string | undefined {
  if (!unix) return undefined;
  return new Date(unix * 1000).toLocaleDateString();
}

function formatDateTime(unix: number | undefined): string {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString();
}

function formatPrice(
  price: number | undefined,
  currency: string | undefined,
  t: TFunc,
): string {
  if (price == null) return t('common.notSet');
  return `${price.toLocaleString()} ${currency ?? ''}`.trim();
}
