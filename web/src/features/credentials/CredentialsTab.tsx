import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconCopy, IconEye, IconEyeOff, IconKey, IconLicense, IconPackages, IconPlus } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { useToast } from '../../components/ui/use-toast';
import {
  virtualCredentialsApi,
  type Item,
  type VirtualCredentialWithItem,
} from '../../api/client';
import { DataCard } from '../m2/components';
import { formatDate, formatPrice } from '../assets/useAssetsData';
import { CredentialFormDialog } from './CredentialFormDialog';
import { CredentialMetrics } from './CredentialMetrics';
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

export function CredentialsTab({ virtualItems }: { virtualItems: Item[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filterPlatform, setFilterPlatform] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VirtualCredentialWithItem | null>(null);
  const [deleting, setDeleting] = useState<VirtualCredentialWithItem | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['virtual-credentials'],
    queryFn: () => virtualCredentialsApi.list(),
  });
  const credentials = data?.credentials ?? [];

  const deleteMutation = useMutation({
    mutationFn: (credentialId: string) => virtualCredentialsApi.remove(credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
      toast.show(t('credentials.credentialDeleted'));
      setDeleting(null);
    },
    onError: (error: Error) => toast.show(t('credentials.credentialDeleteFailed', { error: error.message })),
  });

  const platforms = useMemo(
    () => Array.from(new Set(credentials.map((credential) => credential.platform))).sort(),
    [credentials]
  );
  const visible = useMemo(
    () => (filterPlatform ? credentials.filter((c) => c.platform === filterPlatform) : credentials),
    [credentials, filterPlatform]
  );
  const itemCount = useMemo(() => new Set(credentials.map((c) => c.item_id)).size, [credentials]);

  const copyLicenseKey = async (credential: VirtualCredentialWithItem) => {
    if (!credential.license_key) return;
    try {
      await navigator.clipboard.writeText(credential.license_key);
      toast.show(t('credentials.licenseKeyCopied'));
    } catch {
      toast.show(t('credentials.licenseKeyCopyFailed'));
    }
  };

  return (
    <>
      <CredentialMetrics
        metrics={[
          { icon: IconKey, label: t('credentials.credentialRecords'), value: credentials.length, tone: 'accent' },
          {
            icon: IconLicense,
            label: t('credentials.hasLicenseKey'),
            value: credentials.filter((c) => c.license_key).length,
            tone: 'info',
          },
          { icon: IconPackages, label: t('credentials.linkedItems'), value: itemCount, tone: 'success' },
        ]}
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <DataCard title={t('credentials.virtualCredentialList')}>
          <div className={s.emptyNote}>{t('credentials.loadFailed')}</div>
        </DataCard>
      ) : credentials.length === 0 ? (
        <DataCard title={t('credentials.virtualCredentialList')}>
          <EmptyCredentials virtualItems={virtualItems} onAdd={() => setFormOpen(true)} />
        </DataCard>
      ) : (
        <DataCard
          title={t('credentials.virtualCredentialList')}
          meta={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <InlineSelect
                value={filterPlatform}
                placeholder={t('credentials.filterAllPlatforms')}
                onChange={setFilterPlatform}
                options={platforms.map((platform) => ({ value: platform, label: platform }))}
              />
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <IconPlus size={14} /> {t('credentials.addCredential')}
              </Button>
            </div>
          }
        >
          {visible.length === 0 ? (
            <div className={s.emptyNote}>{t('credentials.noFilterResult')}</div>
          ) : (
            <div className={uiStyles.cardGrid}>
              {visible.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  revealed={!!revealed[credential.id]}
                  onToggleReveal={() =>
                    setRevealed((prev) => ({ ...prev, [credential.id]: !prev[credential.id] }))
                  }
                  onCopy={() => copyLicenseKey(credential)}
                  onEdit={() => setEditing(credential)}
                  onDelete={() => setDeleting(credential)}
                />
              ))}
            </div>
          )}
        </DataCard>
      )}

      {formOpen && (
        <CredentialFormDialog open onClose={() => setFormOpen(false)} virtualItems={virtualItems} />
      )}
      {editing && (
        <CredentialFormDialog
          open
          credential={editing}
          itemId={editing.item_id}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Dialog open title={t('credentials.deleteCredential')} onClose={() => setDeleting(null)}>
          <Stack>
            <p style={{ color: 'var(--havit-muted)', fontSize: '0.85rem', margin: 0 }}>
              {t('credentials.deleteCredentialConfirm', { platform: deleting.platform, item: deleting.item_name })}
            </p>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleting.id)}
              disabled={deleteMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </Stack>
        </Dialog>
      )}
    </>
  );
}

function CredentialCard({
  credential,
  revealed,
  onToggleReveal,
  onCopy,
  onEdit,
  onDelete,
}: {
  credential: VirtualCredentialWithItem;
  revealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (credential.order_id) rows.push({ label: t('credentials.orderId'), value: credential.order_id, mono: true });
  if (credential.price != null)
    rows.push({ label: t('credentials.price'), value: formatPrice(credential.price, credential.currency) });
  if (credential.purchased_at)
    rows.push({ label: t('credentials.purchasedAt'), value: formatDate(credential.purchased_at) });

  return (
    <Card className="surface-card">
      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <span className={s.statusTile.credential}>
            <IconKey size={16} />
          </span>
          <div className={s.cardHeadMeta}>
            <h3 className={s.cardTitle}>
              <Link to="/items/$itemId" params={{ itemId: credential.item_id }}>
                {credential.item_name}
              </Link>
            </h3>
            {credential.account && <span className={s.cardSub}>{credential.account}</span>}
          </div>
          <span className={s.statusChip.platform}>{credential.platform}</span>
        </div>

        {rows.length > 0 && (
          <dl className={s.kvList}>
            {rows.map((row) => (
              <div className={s.kvRow} key={row.label}>
                <dt className={s.kvLabel}>{row.label}</dt>
                <dd className={row.mono ? `${s.kvValue} ${s.mono}` : s.kvValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {credential.license_key && (
          <div className={s.licenseBox}>
            <span className={s.licenseValue}>{revealed ? credential.license_key : '••••••••••••'}</span>
            <button
              type="button"
              className={s.licenseAction}
              aria-label={t('credentials.toggleLicenseKey')}
              title={t('credentials.toggleLicenseKey')}
              onClick={onToggleReveal}
            >
              {revealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
            <button
              type="button"
              className={s.licenseAction}
              aria-label={t('credentials.copyLicenseKey')}
              title={t('credentials.copyLicenseKey')}
              onClick={onCopy}
            >
              <IconCopy size={14} />
            </button>
          </div>
        )}

        <div className={s.cardFoot}>
          <Button variant="subtle" size="sm" onClick={onEdit}>
            {t('common.edit')}
          </Button>
          <Button variant="subtle" size="sm" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EmptyCredentials({
  virtualItems,
  onAdd,
}: {
  virtualItems: Item[];
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem', padding: '2rem 0' }}>
      <IconKey size={28} />
      <p style={{ color: 'var(--havit-muted)', margin: 0 }}>{t('credentials.noVirtual')}</p>
      {virtualItems.length > 0 ? (
        <Button size="sm" onClick={onAdd}>
          <IconPlus size={14} /> {t('credentials.addCredential')}
        </Button>
      ) : (
        <p style={{ color: 'var(--havit-muted)', fontSize: '0.85rem', margin: 0 }}>
          {t('credentials.needVirtualItemFirst')}
        </p>
      )}
    </div>
  );
}
