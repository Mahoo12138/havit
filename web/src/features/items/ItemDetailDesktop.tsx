import { useState, type ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconAlertTriangle, IconArchive, IconCalendar, IconClipboardList, IconDownload,
  IconHistory, IconKey, IconMapPin, IconPackage, IconPhotoPlus, IconPlus,
  IconShieldCheck, IconShoppingCart, IconTag, IconTrash, IconX,
} from '@tabler/icons-react';
import {
  Stack,
  StackTight, uiStyles,
} from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
import { ScrollArea } from '../../components/ui/scroll-area';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { TextField } from '../../components/ui/text-field';
import {
  containerApi, itemsApi, suppliesExtendedApi, loansApi, virtualAssetsApi,
  type Attachment, type Item,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { useItemDetailData, formatDate, formatDateTime, formatPrice } from './useItemDetailData';

export function ItemDetailDesktop({ itemId }: { itemId: string }) {
  const d = useItemDetailData(itemId);
  const { t, item, locs, tags, locationPath, photos, photoIdx, currentPhoto, setSelectedPhotoIdx, currentTags, currentTagIDs, availableTags, tagOptions, statusOptions, fileInputRef, handlePhotoPick, addTag, removeTag, archive, updateStatus, uploadPhoto, replaceTags, createTag } = d;
  const isOnline = useNetworkStatus();
  const [tagName, setTagName] = useState('');
  const [selectedTagID, setSelectedTagID] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  if (item.isLoading) return <Spinner />;
  if (item.error || !item.data) return <p className={uiStyles.errorText}>{t('errors.not_found')}</p>;

  const it = item.data!;
  const typeLabel = t(`items.${it.type}`, it.type);
  const isConsumable = it.type === 'predictive_supplies' || it.type === 'tracked_spares';
  const isVirtual = it.type === 'virtual';

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{it.name}</h2>
          <div className={uiStyles.itemSpecBadges}>
            <StatusBadge status={it.status} />
            <span className={uiStyles.itemSpecType}>{typeLabel}</span>
            {it.category && <span className={uiStyles.itemSpecCategory}>{it.category}</span>}
          </div>
        </StackTight>
        <div className={uiStyles.pageActions}>
          {it.status === 'stolen' && <Button leftSection={<IconDownload size={16} />} variant="subtle" onClick={() => { suppliesExtendedApi.claimPdf(itemId).then((blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${it.name}-insurance-claim.pdf`; a.click(); URL.revokeObjectURL(url); }); }}>{t('items.downloadClaim')}</Button>}
          <Button leftSection={<IconArchive size={16} />} variant="quiet" onClick={() => archive.mutate()} disabled={!isOnline || archive.isPending} title={!isOnline ? t('items.cannotArchiveOffline') : undefined}>{t('items.archive')}</Button>
        </div>
      </div>

      <Card className="surface-card">
        <div className={uiStyles.itemHero}>
          <div className={uiStyles.itemGallery}>
            <div className={uiStyles.itemMainPhoto}>
              {currentPhoto ? <HeroPhoto key={currentPhoto.id} itemName={it.name} photo={currentPhoto} /> : <div className={uiStyles.itemPhotoEmpty}><strong>{t('items.noPhotoYet')}</strong><span>{t('items.uploadPhotoHint')}</span></div>}
              {photos.length > 0 && <span className={uiStyles.itemPhotoCount}>{photoIdx + 1} / {photos.length}</span>}
            </div>
            <div className={uiStyles.itemThumbStrip}>
              {photos.map((photo, idx) => <Button variant="subtle" key={photo.id} className={uiStyles.itemThumb} data-active={idx === photoIdx || undefined} onClick={() => setSelectedPhotoIdx(idx)} aria-label={photo.filename}><img className={uiStyles.itemThumbImg} src={photo.url} alt={photo.filename} /></Button>)}
              <Button variant="subtle" className={uiStyles.itemThumbAdd} disabled={!isOnline || uploadPhoto.isPending} onClick={() => fileInputRef.current?.click()} aria-label={t('common.upload', { defaultValue: 'Upload' })} title={!isOnline ? t('items.cannotUploadOffline') : undefined}>{uploadPhoto.isPending ? <Spinner /> : <IconPhotoPlus size={20} />}</Button>
            </div>
            <input ref={fileInputRef} className={uiStyles.hiddenFileInput} type="file" accept="image/*" onChange={(e) => { handlePhotoPick(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
          </div>
          <div className={uiStyles.itemSpec}>
            <div className={uiStyles.itemSpecGrid}>
              <SpecCell label={t('items.location')}>{locationPath ?? t('common.notSet')}</SpecCell>
              <SpecCell label={t('items.purchasePrice')}>{formatPrice(it.purchase_price, it.purchase_currency, t)}</SpecCell>
              <SpecCell label={t('items.serialNumber')}>{it.serial_number ?? t('common.notSet')}</SpecCell>
              <SpecCell label={t('itemDetail.purchasedAt')}>{formatDate(it.purchase_date) ?? t('common.notSet')}</SpecCell>
              <SpecCell label={t('itemDetail.warrantyExpiry')}>{formatDate(it.warranty_expires_at) ?? t('common.notSet')}</SpecCell>
              <SpecCell label={t('itemDetail.warrantyContact')}>{it.warranty_contact ?? t('common.notSet')}</SpecCell>
            </div>
            {it.description && <p className={uiStyles.itemNote}>{it.description}</p>}
          </div>
        </div>
      </Card>

      <div className={uiStyles.itemDashboard}>
        <div className={uiStyles.itemMain}>
          <div className={uiStyles.itemSectionGrid}>
            <WarrantySection item={it} />
            {isConsumable && <ConsumableSection itemId={itemId} item={it} />}
            {isVirtual && <VirtualSection itemId={itemId} />}
          </div>
          <LoansSection itemId={itemId} />
          <MetadataSection itemId={itemId} item={it} />
          <ContentsSection itemId={itemId} />
          <EventsSection itemId={itemId} />
        </div>

        <div className={uiStyles.itemRail}>
          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconMapPin size={14} /></span>{t('itemDetail.statusAndLocation')}</h3></header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.itemRailField}><span className={uiStyles.itemRailFieldLabel}>{t('items.location')}</span><div className={uiStyles.itemRailLocation}><IconMapPin size={14} /><span>{locationPath ?? t('common.notSet')}</span></div></div>
              <SelectField label={t('items.switchStatus')} options={statusOptions} value={it.status} disabled={!isOnline || updateStatus.isPending} onChange={(e) => updateStatus.mutate(e.currentTarget.value)} />
            </div>
          </section>

          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}>
              <h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconTag size={14} /></span>{t('items.tags')}</h3>
              <Button variant="subtle" leftSection={<IconPlus size={14} />} disabled={!isOnline} onClick={() => setTagDialogOpen(true)}>{t('common.add')}</Button>
            </header>
            <div className={uiStyles.itemSectionBody}>
              <div className={uiStyles.tagList}>
                {currentTags.map((tag: any) => <span className={uiStyles.tagChip} key={tag.id}>{tag.name}<Button variant="subtle" className={uiStyles.tagRemove} onClick={() => removeTag(tag.id)} disabled={!isOnline || replaceTags.isPending} title={t('items.removeTag')}><IconX size={13} /></Button></span>)}
                {currentTags.length === 0 && <span className={uiStyles.muted}>{t('items.noTags')}</span>}
              </div>
            </div>
          </section>

          <Dialog open={tagDialogOpen} title={t('items.manageTags')} onClose={() => setTagDialogOpen(false)}>
            <Stack>
              <div className={uiStyles.tagList}>
                {currentTags.map((tag: any) => <span className={uiStyles.tagChip} key={tag.id}>{tag.name}<Button variant="subtle" className={uiStyles.tagRemove} onClick={() => removeTag(tag.id)} disabled={!isOnline || replaceTags.isPending} title={t('items.removeTag')}><IconX size={13} /></Button></span>)}
                {currentTags.length === 0 && <span className={uiStyles.muted}>{t('items.noTags')}</span>}
              </div>
              {tagOptions.length > 0 && <SelectField label={t('items.selectTag')} options={tagOptions} placeholder={tags.isLoading ? t('items.tagsLoading') : t('items.selectTagPlaceholder')} value={selectedTagID} disabled={!isOnline || replaceTags.isPending} onChange={(e) => { const tagID = e.currentTarget.value; const tag = tags.data?.tags.find((c: any) => c.id === tagID); if (tag) addTag(tag); setSelectedTagID(''); }} />}
              <div className={uiStyles.inlineForm}>
                <TextField label={t('items.newTag')} value={tagName} onChange={(e) => setTagName(e.currentTarget.value)} disabled={!isOnline || createTag.isPending} />
                <Button leftSection={<IconPlus size={15} />} disabled={!isOnline || !tagName.trim() || createTag.isPending} onClick={() => { createTag.mutate(tagName, { onSuccess: (tag) => { addTag(tag); setTagName(''); } }); }}>{t('items.createTag')}</Button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="quiet" onClick={() => setTagDialogOpen(false)}>{t('common.close')}</Button></div>
            </Stack>
          </Dialog>

          <section className={uiStyles.itemSection}>
            <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconCalendar size={14} /></span>{t('itemDetail.timestamps')}</h3></header>
            <div className={uiStyles.itemSectionBody}><div className={uiStyles.itemKvList}><KvRow label={t('itemDetail.createdAt')}>{formatDateTime(it.created_at)}</KvRow><KvRow label={t('itemDetail.updatedAt')}>{formatDateTime(it.updated_at)}</KvRow></div></div>
          </section>
        </div>
      </div>
    </Stack>
  );
}

/* ── Sub-components ── */

function SpecCell({ label, children }: { label: string; children: ReactNode }) {
  return <div className={uiStyles.itemSpecCell}><span className={uiStyles.itemSpecCellLabel}>{label}</span><span className={uiStyles.itemSpecCellValue}>{children}</span></div>;
}

function KvRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className={uiStyles.itemKvRow}><span className={uiStyles.itemKvLabel}>{label}</span><span className={uiStyles.itemKvValue}>{children}</span></div>;
}

function HeroPhoto({ itemName, photo }: { itemName: string; photo: Attachment }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={uiStyles.itemPhotoEmpty}><strong>{t('items.photoReadFailed')}</strong><span>{photo.filename}</span></div>;
  return <img className={uiStyles.itemMainPhotoImg} src={photo.url} alt={`${itemName} photo`} onError={() => setFailed(true)} />;
}

function WarrantySection({ item }: { item: Item }) {
  const { t } = useTranslation();
  const expiresAt = item.warranty_expires_at;
  const now = Date.now() / 1000;
  const daysLeft = expiresAt != null ? Math.floor((expiresAt - now) / 86400) : null;
  const state = daysLeft == null ? null : daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'active';
  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconShieldCheck size={14} /></span>{t('itemDetail.warranty')}</h3>
        {state === 'active' && <Badge>{t('itemDetail.warrantyActive')}</Badge>}
        {state === 'expiring' && <span className={uiStyles.itemStockLow}><IconAlertTriangle size={12} />{t('itemDetail.warrantyExpiring')}</span>}
      </header>
      <div className={uiStyles.itemSectionBody}>
        {expiresAt ? <div className={uiStyles.itemKvList}><KvRow label={t('itemDetail.warrantyExpiry')}>{formatDate(expiresAt)}</KvRow>{daysLeft != null && <KvRow label={t('itemDetail.daysLeft')}>{daysLeft >= 0 ? t('itemDetail.daysCount', { count: daysLeft }) : t('itemDetail.warrantyExpired')}</KvRow>}<KvRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</KvRow></div> : <div className={uiStyles.itemSectionEmpty}>{t('itemDetail.noWarranty')}</div>}
      </div>
    </section>
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
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}>
        <h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconShoppingCart size={14} /></span>{t('itemDetail.consumable')}</h3>
        {low && <span className={uiStyles.itemStockLow}><IconAlertTriangle size={12} />{t('itemDetail.belowThreshold')}</span>}
      </header>
      <div className={uiStyles.itemSectionBody}>
        <div className={uiStyles.itemStockHero}><span className={uiStyles.itemStockValue}>{stock}</span><span className={uiStyles.itemStockUnit}>{t('common.pieces')}</span></div>
        <div className={uiStyles.itemKvList}><KvRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</KvRow><KvRow label={t('itemDetail.lifespanDays')}>{item.lifespan_days ?? '—'}</KvRow></div>
        {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOneMutation.mutate()} disabled={useOneMutation.isPending || stock <= 0}>{t('itemDetail.useOne')}</Button>}
      </div>
    </section>
  );
}

function VirtualSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const addons = useQuery({ queryKey: ['item', itemId, 'addons'], queryFn: () => virtualAssetsApi.listAddons(itemId) });
  const credentials = creds.data?.credentials ?? [];
  const addonList = addons.data?.addons ?? [];
  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconKey size={14} /></span>{t('itemDetail.platformCredentials')}</h3></header>
      <div className={uiStyles.itemSectionBody}>
        {creds.isLoading ? <Spinner /> : credentials.length === 0 ? <div className={uiStyles.itemSectionEmpty}>{t('itemDetail.noCredentials')}</div> : credentials.map((c: any) => <div className={uiStyles.itemCredentialCard} key={c.id}><span className={uiStyles.itemCredentialTitle}>{c.platform}</span>{c.account && <span className={uiStyles.itemCredentialMeta}>{t('itemDetail.accountLabel')}: {c.account}</span>}{c.order_id && <span className={uiStyles.itemCredentialMeta}>{t('itemDetail.orderLabel')}: {c.order_id}</span>}</div>)}
        {addonList.length > 0 && <><div className={uiStyles.itemRailDivider} /><span className={uiStyles.itemSectionHint}>{t('itemDetail.addonPurchases')}</span><div className={uiStyles.itemKvList}>{addonList.map((a: any) => <div className={uiStyles.itemAddonRow} key={a.id}><span className={uiStyles.itemAddonName}>{a.name}</span><span className={uiStyles.itemAddonPrice}>{a.price != null ? `${a.price} ${a.currency ?? ''}`.trim() : ''}</span></div>)}</div></>}
      </div>
    </section>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconClipboardList size={14} /></span>{t('itemDetail.loans')}</h3>{loans.length > 0 && <span className={uiStyles.itemSectionHint}>{loans.length} {t('common.items')}</span>}</header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? <Spinner /> : loans.length === 0 ? <div className={uiStyles.itemSectionEmpty}>{t('itemDetail.noLoans')}</div> : loans.map((loan: any) => <div className={uiStyles.itemLoanCard} key={loan.id}><div className={uiStyles.itemLoanHead}><span className={uiStyles.itemLoanName}>{loan.borrower_name}</span><Badge>{t(`status.${loan.status}`, loan.status)}</Badge></div>{loan.borrower_contact && <span className={uiStyles.itemLoanMeta}>{t('itemDetail.contactInfo')}: {loan.borrower_contact}</span>}<span className={uiStyles.itemLoanMeta}>{t('itemDetail.loanDate')}: {formatDate(loan.loaned_at)}{loan.due_at && ` · ${t('itemDetail.expectedReturn')}: ${formatDate(loan.due_at)}`}</span></div>)}
      </div>
    </section>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconHistory size={14} /></span>{t('itemDetail.events')}</h3></header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? <Spinner /> : events.length === 0 ? <div className={uiStyles.itemSectionEmpty}>{t('itemDetail.noEvents')}</div> : <div className={uiStyles.itemTimeline}>{events.map((ev: any) => <div className={uiStyles.itemTimelineRow} key={ev.id}><span className={uiStyles.itemTimelineTitle}>{t(`events.${ev.event_type}`, ev.event_type)}</span><span className={uiStyles.itemTimelineMeta}>{formatDateTime(ev.created_at)}</span>{ev.payload && <code className={uiStyles.itemTimelinePayload}>{ev.payload}</code>}</div>)}</div>}
      </div>
    </section>
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
  const updateMutation = useMutation({ mutationFn: (next: Record<string, string>) => itemsApi.update(itemId, { metadata: next }), onSuccess: (next) => { qc.setQueryData(['item', itemId], next); qc.invalidateQueries({ queryKey: ['items'] }); } });

  function openAdd() { setEditOriginalKey(null); setFormKey(''); setFormVal(''); setDialogOpen(true); }
  function openEdit(key: string, value: string) { setEditOriginalKey(key); setFormKey(key); setFormVal(value); setDialogOpen(true); }
  function handleSave() { const k = formKey.trim(); const v = formVal.trim(); if (!k) return; const next: Record<string, string> = {}; for (const [ek, ev] of entries) { if (editOriginalKey !== null && ek === editOriginalKey) continue; next[ek] = ev; } next[k] = v; updateMutation.mutate(next); setDialogOpen(false); }
  function handleRemove(key: string) { const next = { ...meta }; delete next[key]; updateMutation.mutate(next); }

  return (
    <>
      <section className={uiStyles.itemSection}>
        <header className={uiStyles.itemSectionHead}>
          <h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconTag size={14} /></span>{t('itemDetail.customMetadata')}</h3>
          {entries.length > 0 && <span className={uiStyles.itemSectionHint}>{entries.length} {t('common.items')}</span>}
          <Button variant="subtle" leftSection={<IconPlus size={14} />} disabled={!isOnline} onClick={openAdd}>{t('common.add')}</Button>
        </header>
        <div className={uiStyles.itemSectionBody}>
          {entries.length > 0 ? <div className={uiStyles.itemKvList}>{entries.map(([key, value]) => <div className={uiStyles.itemKvRow} key={key}><span className={uiStyles.itemKvLabel}>{key}</span><span className={uiStyles.itemKvValue} style={{ cursor: 'pointer' }} onClick={() => openEdit(key, value)} title={t('common.edit')}>{value}</span><Button variant="subtle" onClick={() => handleRemove(key)} disabled={!isOnline || updateMutation.isPending} title={t('common.delete')}><IconTrash size={14} /></Button></div>)}</div> : <div className={uiStyles.itemSectionEmpty}>{t('itemDetail.noMetadata')}</div>}
        </div>
      </section>
      <Dialog open={dialogOpen} title={editOriginalKey !== null ? t('itemDetail.editMetadata') : t('itemDetail.addMetadata')} onClose={() => setDialogOpen(false)}>
        <Stack>
          <TextField label={t('itemDetail.metadataKey')} value={formKey} onChange={(e) => setFormKey(e.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} autoFocus />
          <TextField label={t('itemDetail.metadataValue')} value={formVal} onChange={(e) => setFormVal(e.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="quiet" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button disabled={!isOnline || !formKey.trim() || updateMutation.isPending} onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </Stack>
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
    <section className={uiStyles.itemSection}>
      <header className={uiStyles.itemSectionHead}><h3 className={uiStyles.itemSectionTitle}><span className={uiStyles.itemSectionTitleIcon}><IconPackage size={14} /></span>{t('itemDetail.contents')}</h3></header>
      <div className={uiStyles.itemSectionBody}>
        {isLoading ? <Spinner /> : <ScrollArea className={uiStyles.tableWrap}><table className={uiStyles.table}><thead><tr><th className={uiStyles.th}>{t('common.name')}</th><th className={uiStyles.th}>{t('items.status')}</th><th className={uiStyles.th} /></tr></thead><tbody>{contents.map((child: any) => <tr className={uiStyles.tableRow} key={child.id}><td className={uiStyles.td}>{child.name}</td><td className={uiStyles.td}><StatusBadge status={child.status} /></td><td className={uiStyles.td}><Button variant="quiet" leftSection={<IconX size={13} />} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(child.id)}>{t('itemDetail.removeFromContainer')}</Button></td></tr>)}</tbody></table></ScrollArea>}
      </div>
    </section>
  );
}
