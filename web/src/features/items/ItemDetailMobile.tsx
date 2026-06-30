import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconArchive,
  IconBell,
  IconCalendar,
  IconChevronRight,
  IconClipboardList,
  IconDots,
  IconEdit,
  IconHistory,
  IconKey,
  IconMapPin,
  IconPackage,
  IconPhotoPlus,
  IconQrcode,
  IconRoute,
  IconShieldCheck,
  IconShoppingCart,
} from '@tabler/icons-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import {
  loansApi,
  suppliesExtendedApi,
  virtualAssetsApi,
  type Item,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { formatDate, formatDateTime, formatPrice, useItemDetailData } from './useItemDetailData';
import * as s from './itemDetailMobile.css';

export function ItemDetailMobile({ itemId }: { itemId: string }) {
  const d = useItemDetailData(itemId);
  const {
    t,
    item,
    locationPath,
    photos,
    photoIdx,
    currentPhoto,
    setSelectedPhotoIdx,
    currentTags,
    statusOptions,
    fileInputRef,
    handlePhotoPick,
    archive,
    updateStatus,
    uploadPhoto,
  } = d;
  const isOnline = useNetworkStatus();

  if (item.isLoading) return <div className={s.page}><Spinner /></div>;
  if (item.error || !item.data) return <div className={s.page}><p>{t('errors.not_found')}</p></div>;

  const data = item.data;
  const typeLabel = t(`items.${data.type}`, data.type);
  const isConsumable = data.type === 'predictive_supplies' || data.type === 'tracked_spares';
  const isVirtual = data.type === 'virtual';
  const warranty = getWarrantyView(data, t);

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.mobileTopActions}>
          <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} className={s.heroAction}><IconEdit size={17} /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={t('itemDetail.more')} className={s.heroAction}><IconDots size={17} /></Button>
        </div>
        <div className={s.photoFrame} data-empty={!currentPhoto || undefined}>
          {currentPhoto ? <img className={s.heroPhoto} src={currentPhoto.url} alt={currentPhoto.filename} /> : <PhotoEmpty />}
          {photos.length > 0 && <span className={s.photoCount}>{photoIdx + 1}/{photos.length}</span>}
        </div>
        <div className={s.thumbStrip}>
          {photos.map((photo, idx) => (
            <button key={photo.id} type="button" className={s.thumbButton} data-active={idx === photoIdx || undefined} onClick={() => setSelectedPhotoIdx(idx)} aria-label={photo.filename}>
              <img className={s.thumbImg} src={photo.url} alt="" />
            </button>
          ))}
          {isOnline && (
            <button type="button" className={s.thumbAdd} onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending} aria-label={t('common.upload')}>
              {uploadPhoto.isPending ? <Spinner /> : <IconPhotoPlus size={18} />}
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden className={s.hiddenInput} onChange={(event) => { handlePhotoPick(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />

        <div className={s.summary}>
          <h1 className={s.title}>{data.name}</h1>
          <div className={s.badgeRow}>
            <StatusBadge status={data.status} />
            <span className={s.typeBadge}>{typeLabel}</span>
            {data.category && <span className={s.categoryBadge}>{data.category}</span>}
          </div>
          <div className={s.tagRow}>
            {currentTags.map((tag: any) => <span className={s.tagChip} key={tag.id}>#{tag.name}</span>)}
            {currentTags.length === 0 && <span className={s.mutedText}>{t('items.noTags')}</span>}
          </div>

          <div className={s.specList}>
            <SpecRow label={t('items.status')}><StatusBadge status={data.status} /></SpecRow>
            <SpecRow label={t('itemDetail.currentLocation')}>{locationPath ?? t('common.notSet')}</SpecRow>
            <SpecRow label={t('itemDetail.qrCode')}><span className={s.qrChip}>{data.id.slice(0, 8).toUpperCase()}<IconQrcode size={14} /></span></SpecRow>
            <SpecRow label={t('itemDetail.purchasedAt')}>{formatDate(data.purchase_date) ?? t('common.notSet')}</SpecRow>
            <SpecRow label={t('items.purchasePrice')}>{formatPrice(data.purchase_price, data.purchase_currency, t)}</SpecRow>
            <SpecRow label={t('itemDetail.warrantyExpiry')}>{warranty.summary}</SpecRow>
          </div>
        </div>
      </section>

      <section className={s.actionList}>
        <ActionRow icon={<IconRoute size={16} />} label={t('itemDetail.locationPath')} value={locationPath} />
        <ActionRow icon={<IconShieldCheck size={16} />} label={t('itemDetail.warranty')} value={warranty.summary} />
        <ActionRow icon={<IconHistory size={16} />} label={t('itemDetail.events')} />
        <ActionRow icon={<IconClipboardList size={16} />} label={t('itemDetail.loans')} />
        <ActionRow icon={<IconBell size={16} />} label={t('itemDetail.tasks')} value="2" />
        <ActionRow icon={<IconPackage size={16} />} label={t('itemDetail.relatedAssets')} value="1" />
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconMapPin size={15} />{t('itemDetail.statusAndLocation')}</h2></div>
        <div className={s.sectionBody}>
          <SelectField label={t('items.switchStatus')} options={statusOptions} value={data.status} disabled={!isOnline || updateStatus.isPending} onChange={(event) => updateStatus.mutate(event.currentTarget.value)} />
        </div>
      </section>

      <WarrantySection item={data} />
      {isConsumable && <ConsumableSection itemId={itemId} item={data} />}
      {isVirtual && <VirtualSection itemId={itemId} />}
      <LoansSection itemId={itemId} />
      <EventsSection itemId={itemId} />

      <section className={s.section}>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconCalendar size={15} />{t('itemDetail.timestamps')}</h2></div>
        <div className={s.sectionBody}>
          <SpecRow label={t('itemDetail.createdAt')}>{formatDateTime(data.created_at)}</SpecRow>
          <SpecRow label={t('itemDetail.updatedAt')}>{formatDateTime(data.updated_at)}</SpecRow>
        </div>
      </section>

      <div className={s.bottomBar}>
        <Button variant="quiet" leftSection={<IconMapPin size={15} />}>{t('itemDetail.moveLocation')}</Button>
        <Button>{t('common.edit')}</Button>
        <Button variant="quiet" size="icon-sm" aria-label={t('itemDetail.more')} onClick={() => archive.mutate()} disabled={!isOnline || archive.isPending}><IconArchive size={16} /></Button>
      </div>
    </div>
  );
}

function PhotoEmpty() {
  const { t } = useTranslation();
  return (
    <div className={s.photoEmpty}>
      <IconPackage size={34} />
      <span>{t('items.noPhotoYet')}</span>
    </div>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.specRow}>
      <span className={s.specLabel}>{label}</span>
      <span className={s.specValue}>{children}</span>
    </div>
  );
}

function ActionRow({ icon, label, value }: { icon: ReactNode; label: string; value?: ReactNode }) {
  return (
    <button type="button" className={s.actionRow}>
      <span className={s.actionIcon}>{icon}</span>
      <span className={s.actionLabel}>{label}</span>
      {value && <span className={s.actionValue}>{value}</span>}
      <IconChevronRight size={15} className={s.chevron} />
    </button>
  );
}

function WarrantySection({ item }: { item: Item }) {
  const { t } = useTranslation();
  const warranty = getWarrantyView(item, t);
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}><IconShieldCheck size={15} />{t('itemDetail.warranty')}</h2>
        {warranty.tone === 'danger' && <span className={s.warningText}><IconAlertTriangle size={12} />{t('itemDetail.warrantyExpired')}</span>}
      </div>
      <div className={s.sectionBody}>
        <SpecRow label={t('itemDetail.warrantyExpiry')}>{warranty.expiresAt ? formatDate(warranty.expiresAt) : t('common.notSet')}</SpecRow>
        <SpecRow label={t('itemDetail.daysLeft')}>{warranty.summary}</SpecRow>
        <SpecRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</SpecRow>
      </div>
    </section>
  );
}

function ConsumableSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOne = useMutation({ mutationFn: () => suppliesExtendedApi.useOne(itemId), onSuccess: (next) => qc.setQueryData(['item', itemId], next) });
  return (
    <section className={s.section}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconShoppingCart size={15} />{t('itemDetail.consumable')}</h2></div>
      <div className={s.sectionBody}>
        <SpecRow label={t('itemDetail.currentStock')}>{item.current_stock ?? 0} {t('common.pieces')}</SpecRow>
        <SpecRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</SpecRow>
        {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOne.mutate()} disabled={useOne.isPending || (item.current_stock ?? 0) <= 0}>{t('itemDetail.useOne')}</Button>}
      </div>
    </section>
  );
}

function VirtualSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const credentials = creds.data?.credentials ?? [];
  return (
    <section className={s.section}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconKey size={15} />{t('itemDetail.platformCredentials')}</h2></div>
      <div className={s.sectionBody}>
        {creds.isLoading ? <Spinner /> : credentials.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noCredentials')}</div> : credentials.map((credential: any) => (
          <div key={credential.id} className={s.compactCard}>
            <span className={s.compactTitle}>{credential.platform}</span>
            {credential.account && <span className={s.compactSub}>{t('itemDetail.accountLabel')}: {credential.account}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <section className={s.section}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconClipboardList size={15} />{t('itemDetail.loans')}</h2>{loans.length > 0 && <Badge>{loans.length}</Badge>}</div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : loans.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noLoans')}</div> : loans.map((loan: any) => (
          <div key={loan.id} className={s.compactCard}>
            <span className={s.compactTitle}>{loan.borrower_name}</span>
            <span className={s.compactSub}>{formatDate(loan.loaned_at)}{loan.due_at ? ` / ${formatDate(loan.due_at)}` : ''}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <section className={s.section}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconHistory size={15} />{t('itemDetail.events')}</h2></div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : events.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noEvents')}</div> : events.slice(0, 4).map((event: any) => (
          <div key={event.id} className={s.timelineRow}>
            <span className={s.timelineTitle}>{String(t(`events.${event.event_type}`, event.event_type))}</span>
            <span className={s.timelineMeta}>{formatDateTime(event.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getWarrantyView(item: Item, t: (key: string, params?: any) => string) {
  if (!item.warranty_expires_at) return { expiresAt: undefined, summary: t('itemDetail.noWarranty'), tone: 'neutral' as const };
  const daysLeft = Math.floor((item.warranty_expires_at - Date.now() / 1000) / 86400);
  if (daysLeft < 0) return { expiresAt: item.warranty_expires_at, summary: t('itemDetail.warrantyExpired'), tone: 'danger' as const };
  return { expiresAt: item.warranty_expires_at, summary: t('itemDetail.daysCount', { count: daysLeft }), tone: daysLeft <= 30 ? 'warning' as const : 'success' as const };
}
