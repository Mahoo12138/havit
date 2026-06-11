import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconPhotoPlus, IconPlus, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  RowBetween,
  SelectField,
  Spinner,
  Stack,
  StackTight,
  StatusBadge,
  Tabs,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import {
  itemsApi,
  itemsExtendedApi,
  loansApi,
  virtualAssetsApi,
  locationsApi,
  tagsApi,
  type Attachment,
  type Location,
  type Tag,
} from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetail,
});

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
  const [activeTab, setActiveTab] = useState('info');

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

  const detailTabs = [
    { key: 'info', label: t('itemDetail.basicInfo') },
    { key: 'warranty', label: t('itemDetail.warranty') },
    { key: 'loans', label: t('itemDetail.loans') },
    { key: 'consumable', label: t('itemDetail.consumable') },
    { key: 'virtual', label: t('itemDetail.virtual') },
    { key: 'events', label: t('itemDetail.events') },
  ];

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
    onError: (e: Error) => toast.show(t('items.statusUpdateFailed', { error: e.message })),
  });
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => itemsApi.uploadPhoto(itemId, file),
    onSuccess: () => {
      toast.show(t('items.photoUploaded'));
      qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] });
    },
    onError: (e: Error) => toast.show(t('items.photoUploadFailed', { error: e.message })),
  });
  const replaceTags = useMutation({
    mutationFn: (tagIds: string[]) => itemsApi.replaceTags(itemId, tagIds),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.show(t('items.tagsUpdated'));
    },
    onError: (e: Error) => toast.show(t('items.tagsUpdateFailed', { error: e.message })),
  });
  const createTag = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (tag) => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      addTag(tag);
      setTagName('');
    },
    onError: (e: Error) => toast.show(t('items.tagCreateFailed', { error: e.message })),
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
  const primaryPhoto = photos[0];
  const currentTags = it.tags ?? [];
  const currentTagIDs = currentTags.map((tag) => tag.id);
  const availableTags = tags.data?.tags.filter(
    (tag) => !currentTagIDs.includes(tag.id),
  ) ?? [];
  const tagOptions = availableTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));
  const photoStatus = attachments.isError
    ? t('items.photoReadFailed')
    : photos.length > 0
      ? t('items.photoCount', { count: photos.length })
      : t('items.noPhotos');

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      toast.show(t('items.selectImageFile'));
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

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{it.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status={it.status} />
            <span className="page-kicker">{it.type}</span>
          </div>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="quiet"
            onClick={() => archive.mutate()}
            disabled={!isOnline}
            title={!isOnline ? t('items.cannotArchiveOffline') : undefined}
          >
            {t('items.archive')}
          </Button>
        </div>
      </div>

      <Card className="surface-card">
        <div className={uiStyles.photoPanel}>
          <div className={uiStyles.photoPreview}>
            {primaryPhoto ? (
              <PhotoPreviewImage
                key={primaryPhoto.id}
                itemName={it.name}
                photo={primaryPhoto}
              />
            ) : (
              <div className={uiStyles.photoEmpty}>
                <strong>{t('items.noPhotoYet')}</strong>
                <br />
                {t('items.uploadPhotoHint')}
              </div>
            )}
          </div>

          <Stack>
            <RowBetween>
              <StackTight>
                <h3 className={uiStyles.heading}>{t('items.photos')}</h3>
                <span className={uiStyles.muted}>{photoStatus}</span>
              </StackTight>
              <Button
                leftSection={<IconPhotoPlus size={16} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline || uploadPhoto.isPending}
                title={!isOnline ? t('items.cannotUploadOffline') : undefined}
              >
                {uploadPhoto.isPending ? t('items.uploading') : t('common.upload')}
              </Button>
            </RowBetween>

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

            <div className={uiStyles.photoList}>
              {photos.map((photo) => (
                <PhotoListItem key={photo.id} itemName={it.name} photo={photo} />
              ))}
              {photos.length === 0 && !attachments.isLoading && !attachments.isError && (
                <span className={uiStyles.muted}>{t('items.noPhotoAttachments')}</span>
              )}
            </div>
          </Stack>
        </div>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={detailTabs} />

      {activeTab === 'info' && (
        <Card className="surface-card">
          <div className="detail-grid">
            <DetailRow label={t('items.type')}>{it.type}</DetailRow>
            <DetailRow label={t('items.status')}>
              <StackTight>
                <Badge>{it.status}</Badge>
                <SelectField
                  label={t('items.switchStatus')}
                  options={statusOptions}
                  value={it.status}
                  disabled={!isOnline || updateStatus.isPending}
                  onChange={(e) => updateStatus.mutate(e.currentTarget.value)}
                />
              </StackTight>
            </DetailRow>
            <DetailRow label={t('items.location')}>{locationPath ?? t('common.notSet')}</DetailRow>
            <DetailRow label={t('items.tags')}>
              <StackTight>
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
                <div className={uiStyles.tagEditor}>
                  <SelectField
                    label={t('items.selectTag')}
                    options={tagOptions}
                    placeholder={tags.isLoading ? t('items.tagsLoading') : t('items.selectTagPlaceholder')}
                    value={selectedTagID}
                    disabled={!isOnline || replaceTags.isPending || tagOptions.length === 0}
                    onChange={(e) => {
                      const tagID = e.currentTarget.value;
                      const tag = tags.data?.tags.find((candidate) => candidate.id === tagID);
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
                      disabled={!isOnline || !tagName.trim() || createTag.isPending}
                      onClick={() => createTag.mutate(tagName)}
                    >
                      {t('items.createTag')}
                    </Button>
                  </div>
                </div>
              </StackTight>
            </DetailRow>
            <DetailRow label={t('items.category')}>{it.category ?? t('common.notSet')}</DetailRow>
            <DetailRow label={t('items.purchasePrice')}>
              {it.purchase_price != null
                ? `${it.purchase_price} ${it.purchase_currency ?? ''}`
                : t('common.notSet')}
            </DetailRow>
            <DetailRow label={t('items.serialNumber')}>{it.serial_number ?? t('common.notSet')}</DetailRow>
            <DetailRow label={t('items.description')}>{it.description ?? t('common.notSet')}</DetailRow>
            <DetailRow label="Created">
              {new Date(it.created_at * 1000).toLocaleString()}
            </DetailRow>
          </div>
        </Card>
      )}

      {activeTab === 'warranty' && <WarrantyTab item={it} />}
      {activeTab === 'loans' && <LoansTab itemId={itemId} />}
      {activeTab === 'consumable' && <ConsumableTab itemId={itemId} item={it} />}
      {activeTab === 'virtual' && <VirtualTab itemId={itemId} />}
      {activeTab === 'events' && <EventsTab itemId={itemId} />}
    </Stack>
  );
}

function WarrantyTab({ item }: { item: any }) {
  const { t } = useTranslation();
  return (
    <Card className="surface-card">
      <div className="detail-grid">
        <DetailRow label={t('itemDetail.warrantyExpiry')}>
          {item.warranty_expires_at
            ? new Date(item.warranty_expires_at * 1000).toLocaleDateString()
            : t('common.notSet')}
        </DetailRow>
        <DetailRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</DetailRow>
      </div>
    </Card>
  );
}

function LoansTab({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId, 'loans'],
    queryFn: () => loansApi.listForItem(itemId),
  });
  const loans = data?.loans ?? [];

  if (isLoading) return <Spinner />;
  return (
    <Card className="surface-card">
      {loans.length === 0 ? (
        <span className={uiStyles.muted}>{t('itemDetail.noLoans')}</span>
      ) : (
        <div className={uiStyles.cardGrid}>
          {loans.map((loan) => (
            <Card className="surface-card" key={loan.id}>
              <Stack>
                <h3 className={uiStyles.heading}>{loan.borrower_name}</h3>
                <Badge>{loan.status}</Badge>
                {loan.borrower_contact && (
                  <span className={uiStyles.muted}>{t('itemDetail.contactInfo')}{loan.borrower_contact}</span>
                )}
                <span className={uiStyles.muted}>
                  {t('itemDetail.loanDate')}{new Date(loan.loaned_at * 1000).toLocaleDateString()}
                </span>
                {loan.due_at && (
                  <span className={uiStyles.muted}>
                    {t('itemDetail.expectedReturn')}{new Date(loan.due_at * 1000).toLocaleDateString()}
                  </span>
                )}
              </Stack>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

function ConsumableTab({ itemId, item }: { itemId: string; item: any }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOneMutation = useMutation({
    mutationFn: () => itemsExtendedApi.useOne(itemId),
    onSuccess: () => {
      qc.setQueryData(['item', itemId], (old: any) => ({
        ...old,
        current_stock: (old?.current_stock ?? 0) - 1,
      }));
    },
  });

  return (
    <Card className="surface-card">
      <div className="detail-grid">
        <DetailRow label={t('itemDetail.currentStock')}>
          <strong className={uiStyles.statValue}>{item.current_stock ?? '—'}</strong>
        </DetailRow>
        <DetailRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</DetailRow>
        <DetailRow label={t('itemDetail.lifespanDays')}>{item.lifespan_days ?? '—'}</DetailRow>
      </div>
      {item.type === 'consumable_b' && (
        <Button
          onClick={() => useOneMutation.mutate()}
          disabled={useOneMutation.isPending}
          style={{ marginTop: '1rem' }}
        >
          {t('itemDetail.useOne')}
        </Button>
      )}
    </Card>
  );
}

function VirtualTab({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data: credData, isLoading: credLoading } = useQuery({
    queryKey: ['item', itemId, 'credentials'],
    queryFn: () => virtualAssetsApi.listCredentials(itemId),
  });
  const { data: addonData } = useQuery({
    queryKey: ['item', itemId, 'addons'],
    queryFn: () => virtualAssetsApi.listAddons(itemId),
  });

  if (credLoading) return <Spinner />;
  const credentials = credData?.credentials ?? [];
  const addons = addonData?.addons ?? [];

  return (
    <Stack>
      <Card className="surface-card">
        <h3 className={uiStyles.heading}>{t('itemDetail.platformCredentials')}</h3>
        {credentials.length === 0 ? (
          <span className={uiStyles.muted}>{t('itemDetail.noCredentials')}</span>
        ) : (
          <div className={uiStyles.cardGrid}>
            {credentials.map((c) => (
              <Card className="surface-card" key={c.id}>
                <Stack>
                  <h4 className={uiStyles.heading}>{c.platform}</h4>
                  {c.account && <span className={uiStyles.muted}>{t('itemDetail.accountLabel')}{c.account}</span>}
                  {c.order_id && <span className={uiStyles.muted}>{t('itemDetail.orderLabel')}{c.order_id}</span>}
                </Stack>
              </Card>
            ))}
          </div>
        )}
      </Card>
      {addons.length > 0 && (
        <Card className="surface-card">
          <h3 className={uiStyles.heading}>{t('itemDetail.addonPurchases')}</h3>
          <div className={uiStyles.cardGrid}>
            {addons.map((a) => (
              <Card className="surface-card" key={a.id}>
                <Stack>
                  <h4 className={uiStyles.heading}>{a.name}</h4>
                  <span className={uiStyles.muted}>
                    {a.price != null ? `${a.price} ${a.currency ?? ''}` : ''}
                  </span>
                </Stack>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </Stack>
  );
}

function EventsTab({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId, 'events'],
    queryFn: () => itemsExtendedApi.listEvents(itemId),
  });

  if (isLoading) return <Spinner />;
  const events = data?.events ?? [];

  return (
    <Card className="surface-card">
      {events.length === 0 ? (
        <span className={uiStyles.muted}>{t('itemDetail.noEvents')}</span>
      ) : (
        <div className={uiStyles.cardGrid}>
          {events.map((ev) => (
            <Card className="surface-card" key={ev.id}>
              <Stack>
                <h4 className={uiStyles.heading}>{ev.event_type}</h4>
                <span className={uiStyles.muted}>
                  {new Date(ev.created_at * 1000).toLocaleString()}
                </span>
                {ev.payload && (
                  <span className={uiStyles.muted}>{ev.payload}</span>
                )}
              </Stack>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

function PhotoPreviewImage({
  itemName,
  photo,
}: {
  itemName: string;
  photo: Attachment;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={uiStyles.photoEmpty}>
        <strong>Photo unavailable</strong>
        <br />
        {photo.filename}
      </div>
    );
  }

  return (
    <img
      className={uiStyles.photoImage}
      src={photo.url}
      alt={`${itemName} photo`}
      onError={() => setFailed(true)}
    />
  );
}

function PhotoListItem({
  itemName,
  photo,
}: {
  itemName: string;
  photo: Attachment;
}) {
  return (
    <a className={uiStyles.photoListItem} href={photo.url} target="_blank" rel="noreferrer">
      <img className={uiStyles.photoThumb} src={photo.url} alt={`${itemName} thumbnail`} />
      <StackTight className={uiStyles.photoMeta}>
        <span className={uiStyles.photoFilename}>{photo.filename}</span>
        <span className={uiStyles.muted}>
          {formatBytes(photo.size)}
          {photo.content_type ? ` · ${photo.content_type}` : ''}
        </span>
      </StackTight>
    </a>
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className={uiStyles.muted}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
