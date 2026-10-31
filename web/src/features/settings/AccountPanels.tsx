import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { HTTPError } from 'ky';
import { IconLock, IconPencil } from '@tabler/icons-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { TextField } from '../../components/ui/text-field';
import { TextareaField } from '../../components/ui/textarea-field';
import { useToast } from '../../components/ui/use-toast';
import { authApi, setToken, systemApi, type CurrentUser } from '../../api/client';
import * as s from './settingsPage.css';

const AVATAR_SIZE = 256;
const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;

async function apiErrorCode(error: unknown): Promise<string | undefined> {
  if (!(error instanceof HTTPError)) return undefined;
  try {
    const body = (await error.response.clone().json()) as { error?: string };
    return body.error;
  } catch {
    return undefined;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

// Center-crop to a square and downscale so the stored data URL stays small.
async function toAvatarDataURL(file: File): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unsupported');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  const scale = Math.max(AVATAR_SIZE / img.naturalWidth, AVATAR_SIZE / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  ctx.drawImage(img, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AccountPanel() {
  const { t } = useTranslation();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const displayName = me?.nickname?.trim() || me?.username || '—';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className={s.detailCard}>
      <div className={s.accountCard}>
        <div className={s.accountIdentity}>
          <span className={s.accountAvatar}>
            {me?.avatar ? (
              <img className={s.accountAvatarImage} src={me.avatar} alt="" />
            ) : (
              initials
            )}
          </span>
          <div className={s.accountInfo}>
            <div className={s.accountNameRow}>
              <span className={s.accountName}>{displayName}</span>
              <Badge>{me?.role ?? '—'}</Badge>
            </div>
            <span className={s.accountHandle}>{me?.username ?? '—'}</span>
            {me?.bio && <span className={s.accountBio}>{me.bio}</span>}
          </div>
        </div>

        <div className={s.accountActions}>
          <Button
            variant="quiet"
            leftSection={<IconPencil size={14} />}
            onClick={() => setProfileOpen(true)}
          >
            {t('settings.account.edit')}
          </Button>
          <Button
            variant="quiet"
            leftSection={<IconLock size={14} />}
            onClick={() => setPasswordOpen(true)}
          >
            {t('settings.account.changePassword')}
          </Button>
        </div>
      </div>

      {me && (
        <ProfileDialog open={profileOpen} me={me} onClose={() => setProfileOpen(false)} />
      )}
      <PasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function ProfileDialog({
  open,
  me,
  onClose,
}: {
  open: boolean;
  me: CurrentUser;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState(me.avatar ?? '');
  const [nickname, setNickname] = useState(me.nickname ?? '');
  const [email, setEmail] = useState(me.email ?? '');
  const [bio, setBio] = useState(me.bio ?? '');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAvatar(me.avatar ?? '');
    setNickname(me.nickname ?? '');
    setEmail(me.email ?? '');
    setBio(me.bio ?? '');
    setAvatarError(null);
    // Reset the draft each time the dialog opens, not on every refetch.
  }, [open]);

  const trimmedEmail = email.trim();
  const emailInvalid = trimmedEmail !== '' && !isEmailLike(trimmedEmail);
  const previewInitial = (nickname.trim() || me.username).slice(0, 1).toUpperCase();

  const mutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        nickname: nickname.trim(),
        email: trimmedEmail,
        bio: bio.trim(),
        avatar,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.show(t('settings.account.profileSaved'));
      onClose();
    },
    onError: () => toast.show(t('settings.account.profileSaveFailed')),
  });

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError(t('settings.account.avatarInvalid'));
      return;
    }
    if (file.size > AVATAR_MAX_SOURCE_BYTES) {
      setAvatarError(t('settings.account.avatarTooLarge'));
      return;
    }
    try {
      setAvatar(await toAvatarDataURL(file));
      setAvatarError(null);
    } catch {
      setAvatarError(t('settings.account.avatarInvalid'));
    }
  }

  return (
    <Dialog open={open} title={t('settings.account.dialogTitle')} onClose={onClose}>
      <div className={s.formStack}>
        <div className={s.avatarEditor}>
          <span className={s.avatarPreview}>
            {avatar ? (
              <img className={s.accountAvatarImage} src={avatar} alt="" />
            ) : (
              previewInitial
            )}
          </span>
          <div className={s.avatarActions}>
            <div className={s.avatarButtons}>
              <Button variant="quiet" size="xs" onClick={() => fileRef.current?.click()}>
                {t('settings.account.uploadAvatar')}
              </Button>
              {avatar && (
                <Button variant="quiet" size="xs" onClick={() => setAvatar('')}>
                  {t('settings.account.removeAvatar')}
                </Button>
              )}
            </div>
            <span className={s.avatarHint}>{t('settings.account.avatarHint')}</span>
            {avatarError && <span className={s.formError}>{avatarError}</span>}
          </div>
          <input
            ref={fileRef}
            className={s.hiddenInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
          />
        </div>

        <TextField label={t('settings.account.username')} value={me.username} disabled readOnly />
        <span className={s.formHint}>{t('settings.account.usernameHint')}</span>

        <TextField
          label={t('settings.account.nickname')}
          value={nickname}
          maxLength={40}
          onChange={(event) => setNickname(event.currentTarget.value)}
        />
        <span className={s.formHint}>{t('settings.account.nicknameHint')}</span>

        <TextField
          label={t('settings.account.email')}
          type="email"
          value={email}
          error={emailInvalid ? t('settings.account.emailInvalid') : null}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />

        <TextareaField
          label={t('settings.account.bio')}
          value={bio}
          rows={3}
          maxLength={200}
          onChange={(event) => setBio(event.currentTarget.value)}
        />
        <span className={s.formHint}>{t('settings.account.bioHint')}</span>

        <div className={s.dialogActions}>
          <Button variant="quiet" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={emailInvalid || mutation.isPending}
          >
            {t('settings.account.save')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: status } = useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => systemApi.status(),
  });
  const demo = status?.mode === 'demo';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentError, setCurrentError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentError(null);
  }, [open]);

  const tooShort = newPassword.length > 0 && newPassword.length < 6;
  const unchanged = newPassword.length > 0 && newPassword === currentPassword;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit =
    !demo &&
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    !unchanged &&
    confirmPassword === newPassword;

  const mutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.show(t('settings.account.passwordChanged'));
      onClose();
    },
    onError: async (error) => {
      if ((await apiErrorCode(error)) === 'invalid_current_password') {
        setCurrentError(t('settings.account.wrongCurrentPassword'));
        return;
      }
      toast.show(t('settings.account.passwordChangeFailed'));
    },
  });

  return (
    <Dialog open={open} title={t('settings.account.passwordDialogTitle')} onClose={onClose}>
      <div className={s.formStack}>
        {demo && <div className={s.formNotice}>{t('settings.account.demoDisabled')}</div>}

        <TextField
          label={t('settings.account.currentPassword')}
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          disabled={demo}
          error={currentError}
          onChange={(event) => {
            setCurrentPassword(event.currentTarget.value);
            setCurrentError(null);
          }}
        />
        <TextField
          label={t('settings.account.newPassword')}
          type="password"
          autoComplete="new-password"
          value={newPassword}
          disabled={demo}
          error={
            tooShort
              ? t('settings.account.passwordTooShort')
              : unchanged
                ? t('settings.account.passwordUnchanged')
                : null
          }
          onChange={(event) => setNewPassword(event.currentTarget.value)}
        />
        <TextField
          label={t('settings.account.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={demo}
          error={mismatch ? t('auth.passwordMismatch') : null}
          onChange={(event) => setConfirmPassword(event.currentTarget.value)}
        />
        <span className={s.formHint}>{t('settings.account.otherDevicesSignedOut')}</span>

        <div className={s.dialogActions}>
          <Button variant="quiet" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {t('settings.account.save')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
