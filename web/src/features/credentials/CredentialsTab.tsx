import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconCopy, IconEye, IconEyeOff, IconKey, IconPlus } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
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
import { DataCard, MetricStrip } from '../m2/components';
import { formatPrice } from '../assets/useAssetsData';
import { CredentialFormDialog } from './CredentialFormDialog';

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

  const { data, isLoading } = useQuery({
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
      <MetricStrip
        metrics={[
          { label: t('credentials.credentialRecords'), value: credentials.length },
          {
            label: t('credentials.hasLicenseKey'),
            value: credentials.filter((c) => c.license_key).length,
          },
          { label: t('credentials.linkedItems'), value: itemCount },
        ]}
      />
      {isLoading ? (
        <Spinner />
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
          <div className={uiStyles.cardGrid}>
            {visible.map((credential) => (
              <Card className="surface-card" key={credential.id}>
                <Stack>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconKey size={15} />
                    <h3 className={uiStyles.heading} style={{ margin: 0 }}>
                      <Link to="/items/$itemId" params={{ itemId: credential.item_id }}>
                        {credential.item_name}
                      </Link>
                    </h3>
                    <Badge variant="outline" style={{ marginLeft: 'auto' }}>
                      {credential.platform}
                    </Badge>
                  </div>
                  {credential.account && (
                    <span className={uiStyles.muted}>
                      {t('credentials.account')}
                      {'：'}
                      {credential.account}
                    </span>
                  )}
                  {credential.order_id && (
                    <span className={uiStyles.muted}>
                      {t('credentials.orderId')}
                      {'：'}
                      {credential.order_id}
                    </span>
                  )}
                  {credential.price != null && (
                    <span className={uiStyles.muted}>
                      {t('credentials.price')}
                      {'：'}
                      {formatPrice(credential.price, credential.currency)}
                    </span>
                  )}
                  {credential.license_key && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={uiStyles.muted} style={{ wordBreak: 'break-all' }}>
                        {t('credentials.licenseKey')}
                        {'：'}
                        {revealed[credential.id] ? credential.license_key : '••••••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('credentials.toggleLicenseKey')}
                        onClick={() => setRevealed((prev) => ({ ...prev, [credential.id]: !prev[credential.id] }))}
                      >
                        {revealed[credential.id] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('credentials.copyLicenseKey')}
                        onClick={() => copyLicenseKey(credential)}
                      >
                        <IconCopy size={14} />
                      </Button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="subtle" size="sm" onClick={() => setEditing(credential)}>
                      {t('common.edit')}
                    </Button>
                    <Button variant="subtle" size="sm" onClick={() => setDeleting(credential)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                </Stack>
              </Card>
            ))}
          </div>
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
