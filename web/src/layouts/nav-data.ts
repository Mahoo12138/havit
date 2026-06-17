import type { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconBarcode,
  IconBox,
  IconBriefcase,
  IconCategory2,
  IconClipboardList,
  IconDatabaseExport,
  IconFileImport,
  IconLayoutDashboard,
  IconMap2,
  IconPackage,
  IconPrinter,
  IconQrcode,
  IconReceipt,
  IconSettings,
  IconStack2,
  IconTags,
} from '@tabler/icons-react';

type TFn = ReturnType<typeof useTranslation>['t'];
type TablerIcon = typeof IconBox;

export interface NavItem {
  to: string;
  label: string;
  icon: TablerIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function getNavSections(t: TFn): NavSection[] {
  return [
    {
      label: t('navSection.inventory'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: IconLayoutDashboard },
        { to: '/assets', label: t('nav.assets'), icon: IconBox },
        { to: '/virtual-assets', label: t('nav.virtualAssets'), icon: IconPackage },
        { to: '/locations', label: t('nav.locations'), icon: IconMap2 },
        { to: '/essentials', label: t('nav.essentials'), icon: IconBriefcase },
        { to: '/supplies', label: t('nav.supplies'), icon: IconStack2 },
      ],
    },
    {
      label: t('navSection.lifecycle'),
      items: [
        { to: '/loans', label: t('nav.loans'), icon: IconClipboardList },
        { to: '/credentials', label: t('nav.credentials'), icon: IconReceipt },
        { to: '/abnormal', label: t('nav.abnormal'), icon: IconArchive },
      ],
    },
    {
      label: t('navSection.tools'),
      items: [
        { to: '/capture', label: t('nav.capture'), icon: IconBarcode },
        { to: '/import', label: t('nav.import'), icon: IconFileImport },
        { to: '/qr-print', label: t('nav.qrPrint'), icon: IconPrinter },
        { to: '/location-scan', label: t('nav.locationScan'), icon: IconQrcode },
      ],
    },
    {
      label: t('navSection.config'),
      items: [
        { to: '/categories', label: t('nav.categories'), icon: IconCategory2 },
        { to: '/tags', label: t('nav.tags'), icon: IconTags },
        { to: '/operations', label: t('nav.operations'), icon: IconDatabaseExport },
        { to: '/settings', label: t('nav.settings'), icon: IconSettings },
      ],
    },
  ];
}

export function formatToday(t: TFn): string {
  const now = new Date();
  const weekdayKeys = [
    'date.weekday_sun', 'date.weekday_mon', 'date.weekday_tue',
    'date.weekday_wed', 'date.weekday_thu', 'date.weekday_fri',
    'date.weekday_sat',
  ] as const;
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${t(weekdayKeys[now.getDay()])} · ${m}/${d}`;
}
