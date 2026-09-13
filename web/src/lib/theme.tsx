import { type ReactNode, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconMoon, IconSun } from '@tabler/icons-react';

import { getToken, preferencesApi } from '../api/client';
import { Button } from '../components/ui/button';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-color-scheme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

/** Applies the server-side theme preference once it loads (cross-device sync). */
export function ThemePreferenceSync() {
  const { setTheme } = useTheme();
  const applied = useRef(false);
  const { data } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
    enabled: Boolean(getToken()),
    staleTime: 30_000,
  });

  useEffect(() => {
    // Sync only on first load; later cache updates would echo against local
    // toggles (and across tabs via storage events) and flip-flop the theme.
    if (!applied.current && data?.theme) {
      applied.current = true;
      setTheme(data.theme);
    }
  }, [data?.theme, setTheme]);

  return null;
}

export function ThemeToggle({ iconClassName }: { iconClassName?: string }) {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('settings.lightMode') : t('settings.darkMode');

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    preferencesApi
      .update({ theme: next })
      .then((saved) => queryClient.setQueryData(['preferences'], saved))
      .catch(() => {
        /* keep the local choice when the sync fails */
      });
  }

  return (
    <Button
      variant="subtle"
      className={iconClassName}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </Button>
  );
}
