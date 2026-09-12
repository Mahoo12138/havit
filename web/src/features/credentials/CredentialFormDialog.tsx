import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { SelectField } from '../../components/ui/select-field';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import {
  virtualAssetsApi,
  virtualCredentialsApi,
  type Item,
  type VirtualCredential,
  type VirtualCredentialInput,
} from '../../api/client';
import { toUnixSeconds } from './shared';

// Shared create/edit dialog for virtual credentials. Pass `credential` to edit
// an existing record; pass `itemId` to pin the owning virtual item (item
// detail page), otherwise `virtualItems` powers the picker (credentials page).
export function CredentialFormDialog({
  open,
  onClose,
  credential,
  itemId,
  virtualItems = [],
}: {
  open: boolean;
  onClose: () => void;
  credential?: VirtualCredential;
  itemId?: string;
  virtualItems?: Item[];
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState('');
  const [platform, setPlatform] = useState('');
  const [account, setAccount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [purchasedAt, setPurchasedAt] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CNY');

  useEffect(() => {
    if (!open) return;
    setSelectedItemId(itemId ?? '');
    setPlatform(credential?.platform ?? '');
    setAccount(credential?.account ?? '');
    setOrderId(credential?.order_id ?? '');
    // Editing never round-trips the stored secret: empty means "keep as is".
    setLicenseKey('');
    setPurchasedAt(credential?.purchased_at ? new Date(credential.purchased_at * 1000).toISOString().split('T')[0] : '');
    setPrice(credential?.price != null ? String(credential.price) : '');
    setCurrency(credential?.currency ?? 'CNY');
  }, [open, credential, itemId]);

  const mutation = useMutation({
    mutationFn: (payload: VirtualCredentialInput) =>
      credential
        ? virtualCredentialsApi.update(credential.id, payload)
        : virtualAssetsApi.createCredential(selectedItemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
      toast.show(credential ? t('credentials.credentialUpdated') : t('credentials.credentialCreated'));
      onClose();
    },
    onError: (error: Error) => toast.show(t('credentials.credentialSaveFailed', { error: error.message })),
  });

  const targetItemId = itemId ?? selectedItemId;
  const canSubmit = platform.trim() !== '' && targetItemId !== '' && !mutation.isPending;

  const submit = () => {
    const payload: VirtualCredentialInput = {
      platform: platform.trim(),
      account: account.trim() || undefined,
      order_id: orderId.trim() || undefined,
      // Empty input never touches the stored secret (create: no secret,
      // edit: backend keeps the existing one when the field is omitted).
      license_key: licenseKey.trim() || undefined,
      purchased_at: toUnixSeconds(purchasedAt),
      price: price !== '' ? Number(price) : undefined,
      currency: currency.trim() || undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} title={credential ? t('credentials.editCredential') : t('credentials.addCredential')} onClose={onClose}>
      <Stack>
        {!itemId && (
          <SelectField
            label={t('credentials.virtualItem')}
            options={virtualItems.map((item) => ({ value: item.id, label: item.name }))}
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.currentTarget.value)}
            placeholder={t('credentials.selectVirtualItem')}
            required
          />
        )}
        <TextField
          label={t('credentials.platform')}
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          required
        />
        <TextField label={t('credentials.account')} value={account} onChange={(e) => setAccount(e.target.value)} />
        <TextField label={t('credentials.orderId')} value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <TextField
          label={t('credentials.licenseKey')}
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder={credential ? t('credentials.licenseKeyKeepHint') : t('credentials.licenseKeyPlaceholder')}
        />
        <DatePickerField label={t('credentials.purchasedAt')} value={purchasedAt} onChange={setPurchasedAt} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <TextField label={t('credentials.price')} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <TextField label={t('credentials.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={!canSubmit}>
          {credential ? t('common.save') : t('credentials.addCredential')}
        </Button>
      </Stack>
    </Dialog>
  );
}
