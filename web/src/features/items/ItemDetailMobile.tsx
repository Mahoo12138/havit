import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconAlertTriangle, IconArchive, IconCalendar, IconClipboardList,
  IconHistory, IconKey, IconMapPin, IconPackage, IconPhotoPlus,
  IconShieldCheck, IconShoppingCart, IconTag, IconX,
} from '@tabler/icons-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import {
  containerApi, itemsApi, suppliesExtendedApi, loansApi, virtualAssetsApi,
  type Attachment, type Item,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { useItemDetailData, formatDate, formatDateTime, formatPrice } from './useItemDetailData';
import * as s from './itemDetailMobile.css';

export function ItemDetailMobile({ itemId }: { itemId: string }) {
  const d = useItemDetailData(itemId);
  const { t, item, it, locationPath, photos, photoIdx, currentPhoto, setSelectedPhotoIdx, currentTags, statusOptions, fileInputRef, handlePhotoPick, archive, updateStatus, uploadPhoto } = d;
  const isOnline = useNetworkStatus();

  if (item.isLoading) return <div className={s.page}><Spinner /></div>;
  if (item.error || !item.data) return <div className={s.page}><p>{t('errors.not_found')}</p></div>;

  const data = item.data!;
  const typeLabel = t(`items.${data.type}`, data.type);
  const isConsumable = data.type === 'predictive_supplies' || data.type === 'tracked_spares';
  const isVirtual = data.type === 'virtual';

  return (
    <div className={s.page}>
      {/* Photo gallery */}
      <div className={s.photoScroll}>
        {photos.length === 0 ? (
          <div className={s.photoSlide}>
            <div className={s.photoEmpty}>
              <IconPhotoPlus size={24} />
              <span>{t('items.noPhotoYet')}</span>
            </div>
          </div>
        ) : (
          photos.map((photo, idx) => (
            <div key={photo.id} className={s.photoWrap} onClick={() => setSelectedPhotoIdx(idx)}>
              <div className={s.photoSlide}>
                <img className={s.photoImg} src={photo.url} alt={photo.filename} />
              </div>
              {idx === photoIdx && photos.length > 1 && (
                <span className={s.photoCount}>{photoIdx + 1}/{photos.length}</span>
              )}
            </div>
          ))
        )}
        {isOnline && (
          <div className={s.photoSlide} onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={s.photoEmpty}>
              {uploadPhoto.isPending ? <Spinner /> : <IconPhotoPlus size={24} />}
              <span>{t('items.uploadPhotoHint')}</span>
            </div>
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handlePhotoPick(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />

      {/* Hero card */}
      <div className={s.heroCard}>
        <h2 className={s.heroName}>{data.name}</h2>
        <div className={s.heroBadges}>
          <StatusBadge status={data.status} />
          <span style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>{typeLabel}</span>
          {data.category && <span style={{ fontSize: '0.78rem', color: 'var(--havit-muted)' }}>· {data.category}</span>}
        </div>

        <div className={s.specGrid}>
          <div className={s.specItem}><span className={s.specLabel}>{t('items.location')}</span><span className={s.specValue}>{locationPath ?? t('common.notSet')}</span></div>
          <div className={s.specItem}><span className={s.specLabel}>{t('items.purchasePrice')}</span><span className={s.specValue}>{formatPrice(data.purchase_price, data.purchase_currency, t)}</span></div>
          <div className={s.specItem}><span className={s.specLabel}>{t('items.serialNumber')}</span><span className={s.specValue}>{data.serial_number ?? t('common.notSet')}</span></div>
          <div className={s.specItem}><span className={s.specLabel}>{t('itemDetail.purchasedAt')}</span><span className={s.specValue}>{formatDate(data.purchase_date) ?? t('common.notSet')}</span></div>
        </div>

        {data.description && <p className={s.description}>{data.description}</p>}

        <div className={s.actionBar}>
          {data.status === 'stolen' && <Button variant="subtle" onClick={() => { suppliesExtendedApi.claimPdf(itemId).then((blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${data.name}-insurance-claim.pdf`; a.click(); URL.revokeObjectURL(url); }); }}>{t('items.downloadClaim')}</Button>}
          <Button variant="quiet" leftSection={<IconArchive size={14} />} onClick={() => archive.mutate()} disabled={!isOnline || archive.isPending}>{t('items.archive')}</Button>
        </div>
      </div>

      {/* Status */}
      <div className={s.section}>
        <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconMapPin size={14} />{t('itemDetail.statusAndLocation')}</h3></div>
        <div className={s.statusWrap}>
          <SelectField label={t('items.switchStatus')} options={statusOptions} value={data.status} disabled={!isOnline || updateStatus.isPending} onChange={(e) => updateStatus.mutate(e.currentTarget.value)} />
        </div>
      </div>

      {/* Tags */}
      <div className={s.section}>
        <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconTag size={14} />{t('items.tags')}</h3></div>
        <div className={s.sectionBody}>
          {currentTags.length === 0 ? (
            <div className={s.sectionEmpty}>{t('items.noTags')}</div>
          ) : (
            <div className={s.tagList}>
              {currentTags.map((tag: any) => <span key={tag.id} className={s.tagChip}>{tag.name}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Warranty */}
      <WarrantySection item={data} />

      {/* Consumable */}
      {isConsumable && <ConsumableSection itemId={itemId} item={data} />}

      {/* Virtual */}
      {isVirtual && <VirtualSection itemId={itemId} />}

      {/* Loans */}
      <LoansSection itemId={itemId} />

      {/* Events */}
      <EventsSection itemId={itemId} />

      {/* Timestamps */}
      <div className={s.section}>
        <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconCalendar size={14} />{t('itemDetail.timestamps')}</h3></div>
        <div className={s.sectionBody}>
          <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.createdAt')}</span><span className={s.kvValue}>{formatDateTime(data.created_at)}</span></div>
          <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.updatedAt')}</span><span className={s.kvValue}>{formatDateTime(data.updated_at)}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function WarrantySection({ item }: { item: Item }) {
  const { t } = useTranslation();
  const expiresAt = item.warranty_expires_at;
  const now = Date.now() / 1000;
  const daysLeft = expiresAt != null ? Math.floor((expiresAt - now) / 86400) : null;
  const state = daysLeft == null ? null : daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'active';
  return (
    <div className={s.section}>
      <div className={s.sectionHead}>
        <h3 className={s.sectionTitle}><IconShieldCheck size={14} />{t('itemDetail.warranty')}</h3>
        {state === 'active' && <Badge>{t('itemDetail.warrantyActive')}</Badge>}
        {state === 'expiring' && <span style={{ fontSize: '0.72rem', color: 'var(--havit-warning)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><IconAlertTriangle size={12} />{t('itemDetail.warrantyExpiring')}</span>}
      </div>
      <div className={s.sectionBody}>
        {expiresAt ? (
          <>
            <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.warrantyExpiry')}</span><span className={s.kvValue}>{formatDate(expiresAt)}</span></div>
            {daysLeft != null && <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.daysLeft')}</span><span className={s.kvValue}>{daysLeft >= 0 ? t('itemDetail.daysCount', { count: daysLeft }) : t('itemDetail.warrantyExpired')}</span></div>}
            <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.warrantyContact')}</span><span className={s.kvValue}>{item.warranty_contact ?? t('common.notSet')}</span></div>
          </>
        ) : <div className={s.sectionEmpty}>{t('itemDetail.noWarranty')}</div>}
      </div>
    </div>
  );
}

function ConsumableSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOne = useMutation({ mutationFn: () => suppliesExtendedApi.useOne(itemId), onSuccess: (next) => qc.setQueryData(['item', itemId], next) });
  const stock = item.current_stock ?? 0;
  const min = item.min_stock_threshold ?? 0;
  const low = min > 0 && stock <= min;
  return (
    <div className={s.section}>
      <div className={s.sectionHead}>
        <h3 className={s.sectionTitle}><IconShoppingCart size={14} />{t('itemDetail.consumable')}</h3>
        {low && <span style={{ fontSize: '0.72rem', color: 'var(--havit-warning)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><IconAlertTriangle size={12} />{t('itemDetail.belowThreshold')}</span>}
      </div>
      <div className={s.sectionBody}>
        <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.currentStock')}</span><span className={s.kvValue}>{stock} {t('common.pieces')}</span></div>
        <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.minStock')}</span><span className={s.kvValue}>{item.min_stock_threshold ?? '—'}</span></div>
        <div className={s.kvRow}><span className={s.kvLabel}>{t('itemDetail.lifespanDays')}</span><span className={s.kvValue}>{item.lifespan_days ?? '—'}</span></div>
        {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOne.mutate()} disabled={useOne.isPending || stock <= 0} style={{ marginTop: '0.5rem' }}>{t('itemDetail.useOne')}</Button>}
      </div>
    </div>
  );
}

function VirtualSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const credentials = creds.data?.credentials ?? [];
  return (
    <div className={s.section}>
      <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconKey size={14} />{t('itemDetail.platformCredentials')}</h3></div>
      <div className={s.sectionBody}>
        {creds.isLoading ? <Spinner /> : credentials.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noCredentials')}</div> : credentials.map((c: any) => <div key={c.id} className={s.loanCard}><span className={s.loanName}>{c.platform}</span>{c.account && <span className={s.loanMeta}>{t('itemDetail.accountLabel')}: {c.account}</span>}</div>)}
      </div>
    </div>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <div className={s.section}>
      <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconClipboardList size={14} />{t('itemDetail.loans')}</h3>{loans.length > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--havit-muted)' }}>{loans.length}</span>}</div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : loans.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noLoans')}</div> : loans.map((loan: any) => <div key={loan.id} className={s.loanCard}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className={s.loanName}>{loan.borrower_name}</span><Badge>{t(`status.${loan.status}`, loan.status)}</Badge></div><span className={s.loanMeta}>{t('itemDetail.loanDate')}: {formatDate(loan.loaned_at)}{loan.due_at && ` · ${t('itemDetail.expectedReturn')}: ${formatDate(loan.due_at)}`}</span></div>)}
      </div>
    </div>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <div className={s.section}>
      <div className={s.sectionHead}><h3 className={s.sectionTitle}><IconHistory size={14} />{t('itemDetail.events')}</h3></div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : events.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noEvents')}</div> : events.map((ev: any) => <div key={ev.id} className={s.timelineRow}><span className={s.timelineTitle}>{t(`events.${ev.event_type}`, ev.event_type)}</span><span className={s.timelineMeta}>{formatDateTime(ev.created_at)}</span></div>)}
      </div>
    </div>
  );
}
