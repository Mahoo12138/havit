import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconChevronRight, IconMapPin, IconMapPlus, IconPackage, IconPhoto,
  IconPlus, IconX,
} from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import type { Location } from '../../api/client';
import {
  allowedChildTypes, getLocationTypeMeta, LOCATION_TYPES, type LocationType,
} from '../../features/locations/types';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import {
  useLocationsData, breadcrumbOf, locationTypeLabel, formatPrice,
} from './useLocationsData';
import * as s from './locationsMobile.css';

export function LocationsMobile() {
  const data = useLocationsData();
  const { t, index, allItems, subtreeItemCount, createMutation } = data;
  const isOnline = useNetworkStatus();

  // Drill-down: current node ID (null = root level)
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const current = currentId ? index.byId.get(currentId) ?? null : null;
  const breadcrumb = breadcrumbOf(index, currentId);
  const children = current ? (index.childrenMap.get(current.id) ?? []) : index.roots;
  const directItems = current ? allItems.filter((it) => it.location_id === current.id) : [];

  function handleDrill(id: string) {
    setCurrentId(id);
  }

  function handleBreadcrumbClick(id: string | null) {
    setCurrentId(id);
  }

  return (
    <div className={s.page}>
      {/* Breadcrumb */}
      <div className={s.breadcrumb}>
        <span className={s.breadcrumbItem} data-current={!currentId} onClick={() => handleBreadcrumbClick(null)}>
          {t('locations.tree')}
        </span>
        {breadcrumb.map((node, idx) => {
          const last = idx === breadcrumb.length - 1;
          return (
            <span key={node.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className={s.breadcrumbSep}>/</span>
              <span className={s.breadcrumbItem} data-current={last} onClick={() => !last && handleBreadcrumbClick(node.id)}>
                {node.name}
              </span>
            </span>
          );
        })}
      </div>

      {/* Current node info card */}
      {current && (
        <CurrentNodeCard
          location={current}
          directCount={directItems.length}
          childCount={children.length}
          subtreeTotal={subtreeItemCount(current.id)}
          isOnline={isOnline}
          onAddChild={() => setShowCreate(true)}
          typeLabel={locationTypeLabel(current.type, t)}
          typeMeta={getLocationTypeMeta(current.type)}
        />
      )}

      {/* Children nodes */}
      {children.length > 0 && (
        <>
          <h3 className={s.sectionTitle}>
            {current ? t('locations.children') : t('locations.tree')} ({children.length})
          </h3>
          <div className={s.childList}>
            {children.map((child) => {
              const meta = getLocationTypeMeta(child.type);
              const ChildIcon = meta.icon;
              const count = subtreeItemCount(child.id);
              return (
                <div key={child.id} className={s.childRow} onClick={() => handleDrill(child.id)}>
                  <span className={s.childIcon} style={{ background: `${meta.tone === 'teal' ? 'var(--havit-accent-soft)' : meta.tone === 'violet' ? 'var(--havit-violet-soft)' : 'var(--havit-info-soft)'}`, color: `${meta.tone === 'teal' ? 'var(--havit-accent-ink)' : meta.tone === 'violet' ? 'var(--havit-violet)' : 'var(--havit-info)'}` }}>
                    <ChildIcon size={16} />
                  </span>
                  <div className={s.childMeta}>
                    <span className={s.childName}>{child.name}</span>
                    <span className={s.childSub}>
                      {locationTypeLabel(child.type, t)}
                      {count > 0 ? ` · ${count} ${t('common.items')}` : ''}
                    </span>
                  </div>
                  <IconChevronRight size={16} className={s.childChevron} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Direct items at this location */}
      {current && (
        <div className={s.sectionCard}>
          <div className={s.sectionHead}>
            <h3 className={s.sectionTitle}>{t('locations.directItems')}</h3>
          </div>
          {directItems.length === 0 ? (
            <div className={s.emptyState}>
              <IconPackage size={20} />
              <span>{t('locations.noItems')}</span>
            </div>
          ) : (
            directItems.map((it) => (
              <Link key={it.id} to="/items/$itemId" params={{ itemId: it.id }} className={s.itemRow}>
                <span className={s.itemThumb}><IconPhoto size={16} /></span>
                <div className={s.itemMeta}>
                  <span className={s.itemName}>{it.name}</span>
                  <span className={s.itemSub}>
                    {it.category ?? t('common.uncategorized')} · {t(`status.${it.status}`, it.status)}
                  </span>
                </div>
                <span className={s.itemPrice}>
                  {it.purchase_price ? formatPrice(it.purchase_price, t) : '—'}
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Empty state at root */}
      {!current && children.length === 0 && (
        <div className={s.emptyState}>
          <IconMapPin size={24} />
          <strong>{t('locations.noLocationsHint')}</strong>
          <span>{t('locations.addFirstChild')}</span>
        </div>
      )}

      {/* FAB */}
      <Button type="button" variant="ghost" size="icon" className={s.fab} onClick={() => setShowCreate(true)} disabled={!isOnline} aria-label={t('locations.addRoot')}>
        <IconPlus size={22} />
      </Button>

      {/* Create overlay */}
      {showCreate && (
        <CreateOverlay
          parent={current}
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) => {
            createMutation.mutate(payload, {
              onSuccess: (created) => { setCurrentId(created.id); },
            });
          }}
          pending={createMutation.isPending}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}

/* ── Sub-components ── */

function CurrentNodeCard({ location, directCount, childCount, subtreeTotal, isOnline, onAddChild, typeLabel, typeMeta }: {
  location: Location; directCount: number; childCount: number; subtreeTotal: number;
  isOnline: boolean; onAddChild: () => void; typeLabel: string; typeMeta: ReturnType<typeof getLocationTypeMeta>;
}) {
  const { t } = useTranslation();
  const Icon = typeMeta.icon;
  const canHaveChildren = allowedChildTypes(location.type).length > 0;
  const bgMap: Record<string, string> = { teal: 'var(--havit-accent-soft)', violet: 'var(--havit-violet-soft)', info: 'var(--havit-info-soft)', warning: 'var(--havit-warning-soft)' };
  const colorMap: Record<string, string> = { teal: 'var(--havit-accent-ink)', violet: 'var(--havit-violet)', info: 'var(--havit-info)', warning: 'var(--havit-warning)' };

  return (
    <div className={s.locCard}>
      <div className={s.locCardHeader}>
        <span className={s.locCardIcon} style={{ background: bgMap[typeMeta.tone] ?? bgMap.teal, color: colorMap[typeMeta.tone] ?? colorMap.teal }}>
          <Icon size={22} />
        </span>
        <div className={s.locCardMeta}>
          <span className={s.locCardName}>{location.name}</span>
          <span className={s.locCardSub}>{typeLabel}{location.qr_code ? ` · ${location.qr_code}` : ''}</span>
        </div>
      </div>
      <div className={s.locCardStats}>
        <div className={s.locCardStat}>
          <span className={s.locCardStatValue}>{directCount}</span>
          <span className={s.locCardStatLabel}>{t('locations.directItems')}</span>
        </div>
        <div className={s.locCardStat}>
          <span className={s.locCardStatValue}>{childCount}</span>
          <span className={s.locCardStatLabel}>{t('locations.childCount')}</span>
        </div>
        <div className={s.locCardStat}>
          <span className={s.locCardStatValue}>{subtreeTotal}</span>
          <span className={s.locCardStatLabel}>{t('locations.subtreeTotal')}</span>
        </div>
      </div>
      {canHaveChildren && (
        <div className={s.locCardActions}>
          <Button variant="quiet" leftSection={<IconMapPlus size={14} />} onClick={onAddChild} disabled={!isOnline}>
            {t('locations.addChild')}
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateOverlay({ parent, onClose, onSubmit, pending, isOnline }: {
  parent: Location | null; onClose: () => void;
  onSubmit: (p: { name: string; parent_id?: string; type: LocationType; is_private: boolean }) => void;
  pending: boolean; isOnline: boolean;
}) {
  const { t } = useTranslation();
  const allowed = allowedChildTypes(parent?.type ?? null);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(allowed[0] ?? 'room');
  const title = parent ? t('locations.addChildTo', { name: parent.name }) : t('locations.addRoot');

  return (
    <div className={s.overlay}>
      <div className={s.overlayHeader}>
        <h3 className={s.overlayTitle}>{title}</h3>
        <Button type="button" variant="ghost" size="icon" className={s.overlayClose} onClick={onClose}><IconX size={18} /></Button>
      </div>
      <div className={s.overlayBody}>
        <div>
          <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.82rem', fontWeight: 500 }}>{t('locations.type')}</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {allowed.map((allowedType) => {
              const lt = LOCATION_TYPES.find((l) => l.value === allowedType);
              if (!lt) return null;
              const active = type === lt.value;
              return (
                <Button
                  key={lt.value}
                  type="button"
                  variant="ghost"
                  onClick={() => setType(lt.value)}
                  style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--havit-radius-2)',
                    border: active ? '2px solid var(--havit-accent)' : '1px solid var(--havit-line)',
                    background: active ? 'var(--havit-accent-soft)' : 'var(--havit-bg-soft)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                    color: active ? 'var(--havit-accent-ink)' : 'var(--havit-text)',
                  }}
                >
                  {locationTypeLabel(lt.value, t)}
                </Button>
              );
            })}
          </div>
        </div>
        <TextField label={t('locations.name')} required value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('locations.namePlaceholder')} />
        <div className={s.overlayActions}>
          <Button variant="quiet" onClick={onClose}>{t('locations.cancel')}</Button>
          <Button disabled={!name.trim() || !isOnline || pending} onClick={() => { if (name.trim()) onSubmit({ name: name.trim(), parent_id: parent?.id, type, is_private: false }); }}>
            {pending ? t('locations.saving') : t('locations.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
