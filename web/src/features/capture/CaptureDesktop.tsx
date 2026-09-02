import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  IconBarcode,
  IconCamera,
  IconCheck,
  IconChecklist,
  IconFileDescription,
  IconPackage,
  IconPhoto,
  IconReceipt,
  IconRefresh,
  IconShieldCheck,
  IconSparkles,
  IconUpload,
} from '@tabler/icons-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { LocationPickerField } from '../locations/LocationPickerField';
import { QrScanner } from '../qr/QrScanner';
import { FeatureHeader } from '../m2/components';
import { aiApi, barcodeApi, itemsApi, locationsApi } from '../../api/client';
import * as s from './CaptureDesktop.css';

type ResultType = 'barcode' | 'ai' | 'manual';
type BarcodeStatus = 'idle' | 'found' | 'fallback' | 'error';
type RecognitionFileStatus = 'recognizing' | 'recognized' | 'needs_review' | 'failed';
type RecognitionFile = {
  id: string;
  file: File;
  status: RecognitionFileStatus;
  draft?: {
    name?: string;
    category?: string;
    description?: string;
  };
};

const recognitionExamples = [
  { key: 'plate', icon: IconPhoto, tone: 'teal' },
  { key: 'package', icon: IconPackage, tone: 'amber' },
  { key: 'invoice', icon: IconReceipt, tone: 'blue' },
  { key: 'warranty', icon: IconShieldCheck, tone: 'violet' },
] as const;

const capabilityItems = [
  { key: 'auto', icon: IconSparkles },
  { key: 'extract', icon: IconFileDescription },
  { key: 'match', icon: IconChecklist },
  { key: 'dedupe', icon: IconShieldCheck },
] as const;

export function CaptureDesktop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftLocationId, setDraftLocationId] = useState('');
  const [recognitionFiles, setRecognitionFiles] = useState<RecognitionFile[]>([]);
  const [barcode, setBarcode] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState<BarcodeStatus>('idle');

  const locations = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  function fillEmptyDraftFields(data: any) {
    if (data?.draft?.name) setDraftName((current) => current || data.draft.name);
    if (data?.draft?.category) setDraftCategory((current) => current || data.draft.category);
    if (data?.draft?.description) setDraftDescription((current) => current || data.draft.description);
  }

  const barcodeMutation = useMutation({
    mutationFn: (code: string) => barcodeApi.lookup(code),
    onSuccess: (data) => {
      if (data.found) {
        fillEmptyDraftFields({ draft: data.draft });
        setBarcodeStatus('found');
      } else {
        setBarcodeStatus('fallback');
      }
    },
    onError: () => setBarcodeStatus('error'),
  });

  function queueFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const queued = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      status: 'recognizing' as const,
    }));
    setRecognitionFiles((current) => [...current, ...queued]);
    for (const queuedFile of queued) {
      recognizeQueuedFile(queuedFile.id, queuedFile.file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function recognizeQueuedFile(id: string, file: File) {
    try {
      const data = await aiApi.recognizePhotoDraft(file);
      const status: RecognitionFileStatus = data.fallback === 'manual' ? 'needs_review' : 'recognized';
      setRecognitionFiles((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, status, draft: data.draft }
            : entry,
        ),
      );
      fillEmptyDraftFields(data);
    } catch {
      setRecognitionFiles((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, status: 'failed' }
            : entry,
        ),
      );
    }
  }

  function removeRecognitionFile(id: string) {
    setRecognitionFiles((current) => current.filter((entry) => entry.id !== id));
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const item = await itemsApi.create({
        name: draftName,
        category: draftCategory || undefined,
        description: draftDescription || undefined,
        location_id: draftLocationId,
        type: 'durable',
      });

      for (const entry of recognitionFiles) {
        try {
          await aiApi.recognizePhoto(item.id, entry.file);
        } catch {
          await itemsApi.uploadPhoto(item.id, entry.file);
        }
      }

      return item;
    },
    onSuccess: () => {
      navigate({ to: '/assets' });
    },
  });

  const recognizing = recognitionFiles.some((entry) => entry.status === 'recognizing');
  const resultType: ResultType | null = barcodeStatus === 'found'
    ? 'barcode'
    : recognitionFiles.some((entry) => entry.status === 'recognized')
      ? 'ai'
      : recognitionFiles.some((entry) => entry.status === 'needs_review' || entry.status === 'failed')
        ? 'manual'
        : null;
  const sourceLabel = resultType
    ? resultType === 'barcode'
      ? t('capture.barcodeResult')
      : resultType === 'ai'
        ? t('capture.aiResult')
        : t('capture.manualResult')
    : recognizing
      ? t('capture.recognizing')
      : t('capture.waitingResult');
  const photoSummary = recognitionFiles.length > 0
    ? t('capture.photoCount', { count: recognitionFiles.length })
    : t('capture.noPhotoQueued');

  return (
    <div className={s.page}>
      <FeatureHeader title={t('capture.title')} description={t('capture.pageDescription')} />

      <div className={s.shell}>
        <section className={s.workbench} aria-labelledby="capture-workbench-title">
          <div className={s.panelHeader}>
            <div>
              <h2 id="capture-workbench-title" className={s.panelTitle}>
                {t('capture.workbenchTitle')}
              </h2>
              <p className={s.panelSub}>{t('capture.workbenchSubtitle')}</p>
            </div>
            <span className={s.iconBadge}><IconSparkles size={18} /></span>
          </div>

          <div className={s.uploadZone}>
            <input
              ref={fileInputRef}
              data-testid="capture-photo-input"
              className={s.hiddenInput}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => {
                queueFiles(e.target.files);
              }}
            />
            <span className={s.uploadIcon}><IconUpload size={30} /></span>
            <div className={s.uploadCopy}>
              <strong className={s.uploadHeading}>{t('capture.uploadTitle')}</strong>
              <span>{recognitionFiles.length > 0 ? photoSummary : t('capture.uploadHint')}</span>
            </div>
            <div className={s.uploadActions}>
              <Button
                leftSection={<IconCamera size={15} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={recognizing}
              >
                {recognizing ? t('capture.recognizing') : t('capture.recognize')}
              </Button>
              <Button
                variant="quiet"
                leftSection={<IconUpload size={15} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={recognizing}
              >
                {t('capture.uploadFile')}
              </Button>
            </div>
            {recognitionFiles.some((entry) => entry.status === 'failed') && (
              <InlineIssue message={t('capture.recognizeFailed')} />
            )}
            {recognitionFiles.some((entry) => entry.status === 'needs_review') && (
              <p className={s.inlineHint}>{t('capture.fallbackManual')}</p>
            )}
          </div>

          <section className={s.barcodePanel} aria-labelledby="capture-barcode-title">
            <div className={s.panelHeader}>
              <div>
                <h3 id="capture-barcode-title" className={s.sectionTitle}>{t('capture.barcodeTitle')}</h3>
                <p className={s.panelSub}>{t('capture.barcodeHint')}</p>
              </div>
              <span className={s.iconBadge}><IconBarcode size={18} /></span>
            </div>
            <div className={s.barcodeControls}>
              <TextField
                id="capture-barcode"
                label={t('capture.barcodeLabel')}
                placeholder={t('capture.barcodePlaceholder')}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <Button
                leftSection={<IconBarcode size={15} />}
                onClick={() => barcodeMutation.mutate(barcode.trim())}
                disabled={!barcode.trim() || barcodeMutation.isPending}
              >
                {barcodeMutation.isPending ? t('capture.querying') : t('capture.queryBarcode')}
              </Button>
            </div>
            <QrScanner
              busy={barcodeMutation.isPending}
              onDetected={(code) => {
                setBarcode(code);
                barcodeMutation.mutate(code);
              }}
            />
            {barcodeStatus === 'fallback' && (
              <p className={s.inlineHint}>{t('capture.barcodeFallback')}</p>
            )}
            {barcodeStatus === 'error' && (
              <InlineIssue message={t('capture.barcodeError')} />
            )}
          </section>

          <section className={s.filesPanel} aria-labelledby="capture-files-title">
            <div className={s.panelHeader}>
              <div>
                <h3 id="capture-files-title" className={s.sectionTitle}>{t('capture.filesTitle')}</h3>
                <p className={s.panelSub}>{t('capture.filesHint')}</p>
              </div>
              <Badge>{photoSummary}</Badge>
            </div>
            {recognitionFiles.length === 0 ? (
              <p className={s.emptyText}>{t('capture.filesEmpty')}</p>
            ) : (
              <div className={s.fileList}>
                {recognitionFiles.map((entry) => (
                  <div key={entry.id} className={s.fileRow}>
                    <span className={s.fileIcon}><IconPhoto size={18} /></span>
                    <div className={s.fileMeta}>
                      <strong className={s.fileName}>{entry.file.name}</strong>
                      <span className={s.fileSub}>
                        {entry.draft?.name || entry.draft?.category || t('capture.fileDraftPending')}
                      </span>
                    </div>
                    <Badge>{t(`capture.fileStatus.${entry.status}`)}</Badge>
                    <Button
                      variant="quiet"
                      onClick={() => removeRecognitionFile(entry.id)}
                      disabled={entry.status === 'recognizing'}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={s.examples} aria-labelledby="capture-examples-title">
            <h3 id="capture-examples-title" className={s.sectionTitle}>{t('capture.examplesTitle')}</h3>
            <div className={s.exampleGrid}>
              {recognitionExamples.map((example) => {
                const Icon = example.icon;
                return (
                  <div key={example.key} className={s.exampleCard}>
                    <span className={s.exampleMedia[example.tone]}>
                      <Icon size={21} />
                    </span>
                    <span>{t(`capture.example.${example.key}`)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={s.capabilities} aria-labelledby="capture-capabilities-title">
            <h3 id="capture-capabilities-title" className={s.sectionTitle}>{t('capture.capabilitiesTitle')}</h3>
            <div className={s.capabilityGrid}>
              {capabilityItems.map((capability) => {
                const Icon = capability.icon;
                return (
                  <span key={capability.key} className={s.capabilityChip}>
                    <Icon size={16} />
                    {t(`capture.capability.${capability.key}`)}
                  </span>
                );
              })}
            </div>
            <p className={s.inlineHint}>{t('capture.capabilitiesHint')}</p>
          </section>
        </section>

        <aside className={s.resultRail}>
          <section className={s.resultPanel} aria-labelledby="capture-result-title">
            <div className={s.panelHeader}>
              <div>
                <h2 id="capture-result-title" className={s.panelTitle}>
                  {t('capture.confirmAndSave')}
                </h2>
                <p className={s.panelSub}>{t('capture.resultSubtitle')}</p>
              </div>
              <Badge>{sourceLabel}</Badge>
            </div>

            <div className={s.confidenceRow}>
              <span>{t('capture.confidence')}</span>
              <strong className={s.confidenceValue}>{resultType === 'manual' ? t('capture.manualConfidence') : resultType === 'barcode' ? '100%' : resultType ? '95%' : '--'}</strong>
            </div>

            <div className={s.resultForm}>
              <TextField
                id="capture-name"
                label={t('capture.name')}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
              <LocationPickerField
                id="capture-location"
                label={t('assets.location')}
                tree={locations.data?.tree}
                placeholder={t('items.selectLocation')}
                required
                value={draftLocationId}
                onChange={setDraftLocationId}
                includeVirtualLocations={false}
              />
              <TextField
                id="capture-category"
                label={t('capture.category')}
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
              />
              <TextField
                id="capture-description"
                label={t('capture.description')}
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
              />
              <ResultMetaRow label={t('capture.source')} value={sourceLabel} />
              <ResultMetaRow
                label={t('capture.photo')}
                value={photoSummary}
              />
            </div>

            <div className={s.resultActions}>
              <Button
                variant="quiet"
                leftSection={<IconRefresh size={15} />}
                onClick={() => {
                  setDraftName('');
                  setDraftCategory('');
                  setDraftDescription('');
                  setDraftLocationId('');
                  setRecognitionFiles([]);
                  setBarcodeStatus('idle');
                }}
              >
                {t('capture.reset')}
              </Button>
              <Button
                leftSection={<IconCheck size={15} />}
                onClick={() => createMutation.mutate()}
                disabled={!draftName || !draftLocationId || createMutation.isPending}
              >
                {createMutation.isPending ? t('capture.saving') : t('capture.saveItem')}
              </Button>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}

function ResultMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.metaRow}>
      <span>{label}</span>
      <strong className={s.metaValue}>{value}</strong>
    </div>
  );
}

function InlineIssue({
  message,
}: {
  message: string;
}) {
  return (
    <div className={s.inlineIssue}>
      <span>{message}</span>
    </div>
  );
}
