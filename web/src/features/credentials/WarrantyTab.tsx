import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconShieldCheck } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
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
import { MetricStrip } from '../m2/components';
import { fromUnixSeconds, toUnixSeconds, warrantyBadgeVariant, warrantyDaysLeft, type WarrantyFilter } from './shared';

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

export function WarrantyTab({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<WarrantyFilter>('');
  const [editing, setEditing] = useState<Item | null>(null);

  const expired = items.filter((item) => statusOf(item) === 'expired').length;
  const expiring = items.filter((item) => statusOf(item) === 'expiring').length;

  const visible = useMemo(
    () => (filter ? items.filter((item) => statusOf(item) === filter) : items),
    [items, filter]
  );

  return (
    <>
      <MetricStrip
        metrics={[
          { label: t('credentials.warrantyCount'), value: items.length },
          { label: t('credentials.expiringSoon'), value: expiring },
          { label: t('credentials.expired'), value: expired },
        ]}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
      <div className={uiStyles.cardGrid}>
        {visible.map((item) => {
          const status = statusOf(item);
          const daysLeft = warrantyDaysLeft(item.warranty_expires_at);
          return (
            <Card className="surface-card" key={item.id}>
              <Stack>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconShieldCheck size={15} />
                  <h3 className={uiStyles.heading} style={{ margin: 0 }}>
                    <Link to="/items/$itemId" params={{ itemId: item.id }}>
                      {item.name}
                    </Link>
                  </h3>
                  <Badge variant={warrantyBadgeVariant(status)} style={{ marginLeft: 'auto' }}>
                    {t(`credentials.warrantyStatus.${status}`)}
                  </Badge>
                </div>
                <span className={uiStyles.muted}>
                  {t('credentials.expiresAt')}
                  {'：'}
                  {item.warranty_expires_at ? formatDate(item.warranty_expires_at) : '—'}
                  {daysLeft != null &&
                    (status === 'expired' ? ` · ${t('credentials.expiredDays', { days: -daysLeft })}` : ` · ${t('credentials.daysRemaining', { days: daysLeft })}`)}
                </span>
                {item.serial_number && (
                  <span className={uiStyles.muted}>
                    {t('credentials.serialNumber')}
                    {'：'}
                    {item.serial_number}
                  </span>
                )}
                {item.warranty_contact && (
                  <span className={uiStyles.muted}>
                    {t('credentials.contactInfo')}
                    {'：'}
                    {item.warranty_contact}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button variant="subtle" size="sm" onClick={() => setEditing(item)}>
                    {t('credentials.editWarranty')}
                  </Button>
                </div>
              </Stack>
            </Card>
          );
        })}
      </div>
      {editing && <WarrantyEditDialog item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
