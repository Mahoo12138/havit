import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const BP_MOBILE = 768;
const BP_TABLET = 1024;

function getDevice(): DeviceType {
  const w = window.innerWidth;
  if (w < BP_MOBILE) return 'mobile';
  if (w < BP_TABLET) return 'tablet';
  return 'desktop';
}

const mobileMq = window.matchMedia(`(max-width: ${BP_MOBILE - 1}px)`);
const tabletMq = window.matchMedia(
  `(min-width: ${BP_MOBILE}px) and (max-width: ${BP_TABLET - 1}px)`,
);

function subscribe(cb: () => void) {
  mobileMq.addEventListener('change', cb);
  tabletMq.addEventListener('change', cb);
  return () => {
    mobileMq.removeEventListener('change', cb);
    tabletMq.removeEventListener('change', cb);
  };
}

const DeviceContext = createContext<DeviceType>('desktop');

export function DeviceProvider({ children }: { children: ReactNode }) {
  const device = useSyncExternalStore(subscribe, getDevice, (): DeviceType => 'desktop');
  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceType {
  return useContext(DeviceContext);
}

export function useIsMobile(): boolean {
  return useDevice() === 'mobile';
}

export function useIsTablet(): boolean {
  return useDevice() === 'tablet';
}
