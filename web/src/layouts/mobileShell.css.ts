import { style } from '@vanilla-extract/css';
import { themeVars } from '../styles/theme.css';

export const shell = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100dvh',
  background: themeVars.bg,
});

export const topBar = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '3.25rem',
  padding: `max(0.35rem, env(safe-area-inset-top)) ${themeVars.space4} 0.45rem`,
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

export const topBarTitle = style({
  flex: 1,
  minWidth: 0,
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.2rem',
  fontWeight: 750,
  lineHeight: 1.15,
  letterSpacing: '-0.015em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const topBarActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  flex: '0 0 auto',
});

export const topBarIconBtn = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'inline-grid',
  placeItems: 'center',
  border: 0,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.ink,
  cursor: 'pointer',
  selectors: {
    '&:active': {
      background: themeVars.lineSoft,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const topBarAvatar = style({
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  display: 'inline-grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: '#ffffff',
  fontSize: '0.8rem',
  fontWeight: 700,
  flex: '0 0 auto',
  cursor: 'pointer',
  border: 0,
  padding: 0,
});

export const content = style({
  flex: 1,
  minWidth: 0,
  padding: `0 ${themeVars.space4}`,
  paddingBottom: '4.5rem',
});

export const bottomNav = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 20,
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  alignItems: 'center',
  minHeight: '3.75rem',
  borderTop: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
});

export const bottomNavItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  minWidth: 0,
  minHeight: '3.45rem',
  padding: `${themeVars.space1} 0`,
  color: themeVars.muted,
  textDecoration: 'none',
  fontSize: '0.65rem',
  fontWeight: 500,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'color 160ms ease',
  selectors: {
    '&[data-active="true"]': {
      color: themeVars.accent,
      fontWeight: 600,
    },
    '&:hover': {
      textDecoration: 'none',
    },
  },
});

export const fabBtn = style({
  position: 'absolute',
  left: '50%',
  top: '-1.25rem',
  transform: 'translateX(-50%)',
  width: '3.15rem',
  height: '3.15rem',
  borderRadius: '999px',
  display: 'grid',
  placeItems: 'center',
  background: '#1f2937',
  color: '#ffffff',
  border: 0,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
  cursor: 'pointer',
  transition: 'transform 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': { background: '#111827' },
    '&:active': { transform: 'translateX(-50%) scale(0.96)' },
  },
});

export const bottomNavCenterGap = style({
  minHeight: '3.45rem',
});

/* Drawer */
export const drawerScrim = style({
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(2px)',
});

export const drawer = style({
  position: 'fixed',
  inset: '0 auto 0 0',
  width: '17rem',
  zIndex: 50,
  background: themeVars.sidebarBg,
  color: themeVars.sidebarText,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 18px 48px rgba(0, 0, 0, 0.4)',
});

export const drawerHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.sidebarLine}`,
});

export const drawerBrandMark = style({
  display: 'grid',
  width: '2rem',
  height: '2rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: '#ffffff',
  fontSize: '0.95rem',
  fontWeight: 800,
});

export const drawerBrandText = style({
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: '#f1f5f9',
});

export const drawerCloseBtn = style({
  marginLeft: 'auto',
  width: '2rem',
  height: '2rem',
  display: 'inline-grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  borderRadius: themeVars.radius2,
  color: themeVars.sidebarMuted,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: themeVars.sidebarHover,
      color: '#fff',
    },
  },
});

export const drawerScroll = style({
  padding: `${themeVars.space3} ${themeVars.space2}`,
});

/* Reuse sidebar nav styles for drawer */
export const drawerNavGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const drawerNavDivider = style({
  height: '1px',
  background: themeVars.sidebarLine,
  margin: `${themeVars.space3} ${themeVars.space2}`,
});

export const drawerNavSectionLabel = style({
  color: themeVars.sidebarMuted,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: `${themeVars.space3} ${themeVars.space3} ${themeVars.space2}`,
});

export const drawerNavLink = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  color: themeVars.sidebarText,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 500,
  transition: 'color 160ms ease',
  selectors: {
    '&:hover': {
      color: '#f1f5f9',
      textDecoration: 'none',
    },
    '&[data-active="true"]': {
      color: themeVars.sidebarActiveText,
      fontWeight: 600,
    },
  },
});

export const drawerNavLinkIcon = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  placeItems: 'center',
  color: 'currentColor',
});

export const drawerFooter = style({
  borderTop: `1px solid ${themeVars.sidebarLine}`,
  padding: themeVars.space3,
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const drawerUserAvatar = style({
  width: '2.15rem',
  height: '2.15rem',
  borderRadius: '999px',
  display: 'inline-grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 700,
  flex: '0 0 auto',
});

export const drawerUserMeta = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const drawerUserName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#f1f5f9',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const drawerUserVersion = style({
  fontSize: '0.74rem',
  color: themeVars.sidebarMuted,
});

export const drawerLogoutBtn = style({
  marginLeft: 'auto',
  display: 'inline-grid',
  width: '2rem',
  height: '2rem',
  placeItems: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.sidebarMuted,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      color: '#f87171',
      background: themeVars.sidebarHover,
    },
  },
});
