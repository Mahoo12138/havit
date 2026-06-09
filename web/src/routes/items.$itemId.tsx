import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconPhotoPlus, IconPlus, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  RowBetween,
  SelectField,
  Stack,
  StackTight,
  TextField,
  uiStyles,
  useToast,
} from '../components/ui';
import {
  itemsApi,
  locationsApi,
  tagsApi,
  type Attachment,
  type Location,
  type Tag,
} from '../api/client';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetail,
});

const statusOptions = [
  { value: 'in_stock', label: '在库' },
  { value: 'borrowed', label: '借出' },
  { value: 'idle', label: '闲置' },
  { value: 'for_sale', label: '计划出售' },
  { value: 'sold', label: '已售出' },
  { value: 'given_away', label: '已赠出' },
  { value: 'damaged', label: '已报废' },
  { value: 'lost', label: '已丢失' },
  { value: 'stolen', label: '被盗' },
];

function ItemDetail() {
  const { itemId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const isOnline = useNetworkStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagName, setTagName] = useState('');
  const [selectedTagID, setSelectedTagID] = useState('');

  const item = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.get(itemId),
  });
  const attachments = useQuery({
    queryKey: ['item', itemId, 'attachments'],
    queryFn: () => itemsApi.attachments(itemId),
  });
  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const tags = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });

  const archive = useMutation({
    mutationFn: () => itemsApi.archive(itemId),
    onSuccess: () => {
      toast.show('已归档');
      qc.invalidateQueries({ queryKey: ['items'] });
      nav({ to: '/items' });
    },
  });
  const updateStatus = useMutation({
    mutationFn: (status: string) => itemsApi.update(itemId, { status }),
    onSuccess: (next) => {
      toast.show('状态已更新');
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (e: Error) => toast.show(`状态更新失败：${e.message}`),
  });
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => itemsApi.uploadPhoto(itemId, file),
    onSuccess: () => {
      toast.show('照片已上传');
      qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] });
    },
    onError: (e: Error) => toast.show(`照片上传失败：${e.message}`),
  });
  const replaceTags = useMutation({
    mutationFn: (tagIds: string[]) => itemsApi.replaceTags(itemId, tagIds),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
      toast.show('标签已更新');
    },
    onError: (e: Error) => toast.show(`标签更新失败：${e.message}`),
  });
  const createTag = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (tag) => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      addTag(tag);
      setTagName('');
    },
    onError: (e: Error) => toast.show(`标签创建失败：${e.message}`),
  });

  if (item.isLoading) return <p>加载中...</p>;
  if (item.error || !item.data) {
    return <p className={uiStyles.errorText}>未找到</p>;
  }

  const it = item.data;
  const locationPath = findLocationPath(locs.data?.tree, it.location_id);
  const photos = (attachments.data?.attachments ?? []).filter(
    (att) => att.type === 'photo',
  );
  const primaryPhoto = photos[0];
  const currentTags = it.tags ?? [];
  const currentTagIDs = currentTags.map((tag) => tag.id);
  const availableTags = tags.data?.tags.filter(
    (tag) => !currentTagIDs.includes(tag.id),
  ) ?? [];
  const tagOptions = availableTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));
  const photoStatus = attachments.isError
    ? '照片读取失败'
    : photos.length > 0
      ? `${photos.length} 张已上传`
      : '还没有照片';

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      toast.show('请选择图片文件');
      return;
    }
    uploadPhoto.mutate(file);
  }

  function addTag(tag: Tag) {
    if (currentTagIDs.includes(tag.id)) return;
    replaceTags.mutate([...currentTagIDs, tag.id]);
  }

  function removeTag(tagID: string) {
    replaceTags.mutate(currentTagIDs.filter((id) => id !== tagID));
  }

  return (
    <Stack>
      <div className={uiStyles.pageHeader}>
        <StackTight>
          <h2 className="page-heading">{it.name}</h2>
          <p className="page-kicker">查看这件物品的基础台账信息。</p>
        </StackTight>
        <div className={uiStyles.pageActions}>
          <Button
            variant="quiet"
            onClick={() => archive.mutate()}
            disabled={!isOnline}
            title={!isOnline ? '离线模式下无法归档' : undefined}
          >
            归档
          </Button>
        </div>
      </div>

      <Card className="surface-card">
        <div className={uiStyles.photoPanel}>
          <div className={uiStyles.photoPreview}>
            {primaryPhoto ? (
              <PhotoPreviewImage
                key={primaryPhoto.id}
                itemName={it.name}
                photo={primaryPhoto}
              />
            ) : (
              <div className={uiStyles.photoEmpty}>
                <strong>暂无照片</strong>
                <br />
                上传一张照片作为这件物品的视觉存证。
              </div>
            )}
          </div>

          <Stack>
            <RowBetween>
              <StackTight>
                <h3 className={uiStyles.heading}>照片</h3>
                <span className={uiStyles.muted}>{photoStatus}</span>
              </StackTight>
              <Button
                leftSection={<IconPhotoPlus size={16} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline || uploadPhoto.isPending}
                title={!isOnline ? '离线模式下无法上传照片' : undefined}
              >
                {uploadPhoto.isPending ? '上传中...' : '上传'}
              </Button>
            </RowBetween>

            <input
              ref={fileInputRef}
              className={uiStyles.hiddenFileInput}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handlePhotoPick(e.currentTarget.files?.[0]);
                e.currentTarget.value = '';
              }}
            />

            <div className={uiStyles.photoList}>
              {photos.map((photo) => (
                <PhotoListItem key={photo.id} itemName={it.name} photo={photo} />
              ))}
              {photos.length === 0 && !attachments.isLoading && !attachments.isError && (
                <span className={uiStyles.muted}>暂无照片附件</span>
              )}
              {attachments.isLoading && (
                <span className={uiStyles.muted}>照片加载中...</span>
              )}
              {attachments.isError && (
                <span className={uiStyles.errorText}>照片列表读取失败</span>
              )}
            </div>
          </Stack>
        </div>
      </Card>

      <Card className="surface-card">
        <div className="detail-grid">
          <DetailRow label="类型">{it.type}</DetailRow>
          <DetailRow label="状态">
            <StackTight>
              <Badge>{it.status}</Badge>
              <SelectField
                label="切换状态"
                options={statusOptions}
                value={it.status}
                disabled={!isOnline || updateStatus.isPending}
                onChange={(e) => updateStatus.mutate(e.currentTarget.value)}
              />
            </StackTight>
          </DetailRow>
          <DetailRow label="位置">{locationPath ?? '未填写'}</DetailRow>
          <DetailRow label="标签">
            <StackTight>
              <div className={uiStyles.tagList}>
                {currentTags.map((tag) => (
                  <span className={uiStyles.tagChip} key={tag.id}>
                    {tag.name}
                    <button
                      className={uiStyles.tagRemove}
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      disabled={!isOnline || replaceTags.isPending}
                      title="移除标签"
                    >
                      <IconX size={13} />
                    </button>
                  </span>
                ))}
                {currentTags.length === 0 && (
                  <span className={uiStyles.muted}>未添加标签</span>
                )}
              </div>
              <div className={uiStyles.tagEditor}>
                <SelectField
                  label="添加已有标签"
                  options={tagOptions}
                  placeholder={tags.isLoading ? '标签加载中' : '选择标签'}
                  value={selectedTagID}
                  disabled={!isOnline || replaceTags.isPending || tagOptions.length === 0}
                  onChange={(e) => {
                    const tagID = e.currentTarget.value;
                    const tag = tags.data?.tags.find((candidate) => candidate.id === tagID);
                    if (tag) addTag(tag);
                    setSelectedTagID('');
                  }}
                />
                <div className={uiStyles.inlineForm}>
                  <TextField
                    label="新标签"
                    value={tagName}
                    onChange={(e) => setTagName(e.currentTarget.value)}
                    disabled={!isOnline || createTag.isPending}
                  />
                  <Button
                    leftSection={<IconPlus size={15} />}
                    disabled={!isOnline || !tagName.trim() || createTag.isPending}
                    onClick={() => createTag.mutate(tagName)}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </StackTight>
          </DetailRow>
          <DetailRow label="分类">{it.category ?? '未填写'}</DetailRow>
          <DetailRow label="购入价">
            {it.purchase_price != null
              ? `${it.purchase_price} ${it.purchase_currency ?? ''}`
              : '未填写'}
          </DetailRow>
          <DetailRow label="序列号">{it.serial_number ?? '未填写'}</DetailRow>
          <DetailRow label="备注">{it.description ?? '未填写'}</DetailRow>
          <DetailRow label="创建">
            {new Date(it.created_at * 1000).toLocaleString()}
          </DetailRow>
        </div>
      </Card>
    </Stack>
  );
}

function PhotoPreviewImage({
  itemName,
  photo,
}: {
  itemName: string;
  photo: Attachment;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={uiStyles.photoEmpty}>
        <strong>照片无法显示</strong>
        <br />
        {photo.filename}
      </div>
    );
  }

  return (
    <img
      className={uiStyles.photoImage}
      src={photo.url}
      alt={`${itemName} 的照片`}
      onError={() => setFailed(true)}
    />
  );
}

function PhotoListItem({
  itemName,
  photo,
}: {
  itemName: string;
  photo: Attachment;
}) {
  return (
    <a className={uiStyles.photoListItem} href={photo.url} target="_blank" rel="noreferrer">
      <img className={uiStyles.photoThumb} src={photo.url} alt={`${itemName} 缩略图`} />
      <StackTight className={uiStyles.photoMeta}>
        <span className={uiStyles.photoFilename}>{photo.filename}</span>
        <span className={uiStyles.muted}>
          {formatBytes(photo.size)}
          {photo.content_type ? ` · ${photo.content_type}` : ''}
        </span>
      </StackTight>
    </a>
  );
}

function findLocationPath(
  nodes: Location[] | undefined,
  locationId: string | undefined,
  prefix = '',
): string | undefined {
  if (!nodes || !locationId) return undefined;
  for (const node of nodes) {
    const path = prefix ? `${prefix} → ${node.name}` : node.name;
    if (node.id === locationId) return path;
    const child = findLocationPath(node.children, locationId, path);
    if (child) return child;
  }
  return undefined;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className={uiStyles.muted}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
