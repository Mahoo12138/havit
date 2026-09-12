import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconClockExclamation, IconShieldCheck, IconShieldX } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
import { DatePickerField } from '../../components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { itemsApi, type Item } from '../../api/client';
import { formatDate, getWarrantyStatus } from '../assets/useAssetsData';
import { CredentialMetrics } from './CredentialMetrics';
import { fromUnixSeconds, toUnixSeconds, warrantyDaysLeft, type WarrantyFilter } from './shared';
import * as s from './credentials.css';

function InlineSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? '')}
      items={[{ value: null, label: placeholder }, ...options]}
    >
      <SelectTrigger size="sm" className={uiStyles.loanFilterSelect} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function WarrantyEditDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [expiresAt, setExpiresAt] = useState(fromUnixSeconds(item.warranty_expires_at));
  const [serialNumber, setSerialNumber] = useState(item.serial_number ?? '');
  const [contact, setContact] = useState(item.warranty_contact ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      itemsApi.update(item.id, {
        warranty_expires_at: toUnixSeconds(expiresAt),
        serial_number: serialNumber.trim() || undefined,
        warranty_contact: contact.trim() || undefined,
      }),
    onSuccess: () => {
      // Updating the expiry date also rebuilds the 30d/7d warranty reminders
      // server-side; invalidating items refreshes both the page and badges.
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
      toast.show(t('credentials.warrantyUpdated'));
      onClose();
    },
    onError: (error: Error) => toast.show(t('credentials.warrantyUpdateFailed', { error: error.message })),
  });

  return (
    <Dialog open title={t('credentials.editWarranty')} onClose={onClose}>
      <Stack>
        <p style={{ color: 'var(--havit-muted)', fontSize: '0.85rem', margin: 0 }}>{item.name}</p>
        <DatePickerField
          label={t('credentials.warrantyExpiry')}
          value={expiresAt}
          onChange={setExpiresAt}
          placeholder={t('credentials.warrantyExpiryPlaceholder')}
        />
        <TextField
          label={t('credentials.serialNumber')}
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
        <TextField
          label={t('credentials.contactInfo')}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {t('common.save')}
        </Button>
      </Stack>
    </Dialog>
  );
}

function statusOf(item: Item) {
  return getWarrantyStatus(item);
}

// Items on this page always carry a warranty date; 'none' only guards the type.
type WarrantyTone = 'active' | 'expiring' | 'expired';

function toneOf(item: Item): WarrantyTone {
  const status = statusOf(item);
  return status === 'none' ? 'active' : status;
}

export function WarrantyTab({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<WarrantyFilter>('');
  const [editing, setEditing] = useState<Item | null>(null);

  const active = items.filter((item) => statusOf(item) === 'active').length;
  const expired = items.filter((item) => statusOf(item) === 'expired').length;
  const expiring = items.filter((item) => statusOf(item) === 'expiring').length;

  const visible = useMemo(
    () => (filter ? items.filter((item) => statusOf(item) === filter) : items),
    [items, filter]
  );

  return (
    <>
      <CredentialMetrics
        metrics={[
          { icon: IconShieldCheck, label: t('credentials.warrantyCount'), value: active, tone: 'success' },
          { icon: IconClockExclamation, label: t('credentials.expiringSoon'), value: expiring, tone: 'warning' },
          { icon: IconShieldX, label: t('credentials.expired'), value: expired, tone: 'danger' },
        ]}
      />
      <div className={s.toolbar}>
        <span className={s.toolbarCount}>{t('credentials.totalItems', { count: visible.length })}</span>
        <InlineSelect
          value={filter}
          placeholder={t('credentials.filterAllWarranty')}
          onChange={(next) => setFilter(next as WarrantyFilter)}
          options={[
            { value: 'expiring', label: t('credentials.filterExpiring') },
            { value: 'expired', label: t('credentials.filterExpired') },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <div className={s.emptyNote}>{t('credentials.noFilterResult')}</div>
      ) : (
        <div className={uiStyles.cardGrid}>
          {visible.map((item) => (
            <WarrantyCard key={item.id} item={item} onEdit={() => setEditing(item)} />
          ))}
        </div>
      )}
      {editing && <WarrantyEditDialog item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function WarrantyCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const { t } = useTranslation();
  const tone = toneOf(item);
  const daysLeft = warrantyDaysLeft(item.warranty_expires_at);

  return (
    <Card className="surface-card">
      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <span className={s.statusTile[tone]}>
            <IconShieldCheck size={16} />
          </span>
          <div className={s.cardHeadMeta}>
            <h3 className={s.cardTitle}>
              <Link to="/items/$itemId" params={{ itemId: item.id }}>
                {item.name}
              </Link>
            </h3>
          </div>
          <span className={s.statusChip[tone]}>{t(`credentials.warrantyStatus.${tone}`)}</span>
        </div>

        {daysLeft != null && (
          <div className={s.daysHero}>
            <strong className={s.daysValue[tone]}>{Math.abs(daysLeft)}</strong>
            <span className={s.daysLabel}>
              {tone === 'expired' ? t('credentials.daysSinceExpiry') : t('credentials.daysUntilExpiry')}
            </span>
            <span className={s.daysDate}>{formatDate(item.warranty_expires_at)}</span>
          </div>
        )}

        {(item.serial_number || item.warranty_contact) && (
          <dl className={s.kvList}>
            {item.serial_number && (
              <div className={s.kvRow}>
                <dt className={s.kvLabel}>{t('credentials.serialNumber')}</dt>
                <dd className={`${s.kvValue} ${s.mono}`}>{item.serial_number}</dd>
              </div>
            )}
            {item.warranty_contact && (
              <div className={s.kvRow}>
                <dt className={s.kvLabel}>{t('credentials.contactInfo')}</dt>
                <dd className={s.kvValue}>{item.warranty_contact}</dd>
              </div>
            )}
          </dl>
        )}

        <div className={s.cardFoot}>
          <Button variant="subtle" size="sm" onClick={onEdit}>
            {t('credentials.editWarranty')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
