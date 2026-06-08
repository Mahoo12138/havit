import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const center = style({
  display: 'grid',
  minHeight: '100dvh',
  placeItems: 'center',
});

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.1rem',
});

export const stackTight = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
});

export const rowBetween = style([
  row,
  {
    justifyContent: 'space-between',
  },
]);

export const card = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  background: `color-mix(in srgb, ${themeVars.panel} 96%, transparent)`,
  boxShadow: themeVars.shadow,
});

export const cardPadded = style([
  card,
  {
    padding: '1.5rem',
  },
]);

export const button = style({
  display: 'inline-flex',
  minHeight: '2.45rem',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.45rem',
  border: '1px solid transparent',
  borderRadius: '7px',
  padding: '0.52rem 0.95rem',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  transition:
    'background-color 180ms ease, border-color 180ms ease, color 180ms ease, opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease',
  selectors: {
    '&:hover:not(:disabled)': {
      transform: 'translateY(-1px)',
    },
    '&:active:not(:disabled)': {
      transform: 'translateY(0)',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.55,
    },
  },
});

export const buttonVariant = styleVariants({
  primary: [
    button,
    {
      background: `linear-gradient(180deg, color-mix(in srgb, ${themeVars.accent} 94%, white), ${themeVars.accent})`,
      color: themeVars.onAccent,
      boxShadow: '0 10px 22px rgba(15, 111, 100, 0.2)',
    },
  ],
  subtle: [
    button,
    {
      background: 'transparent',
      color: themeVars.accent,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.accentSoft,
        },
      },
    },
  ],
  quiet: [
    button,
    {
      borderColor: themeVars.line,
      background: themeVars.panel,
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
          background: `color-mix(in srgb, ${themeVars.accentSoft} 38%, ${themeVars.panel})`,
        },
      },
    },
  ],
});

export const field = style({
  display: 'grid',
  gap: '0.4rem',
});

export const label = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 760,
  letterSpacing: '0.02em',
});

export const input = style({
  width: '100%',
  minHeight: '2.55rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '7px',
  background: `color-mix(in srgb, ${themeVars.panel} 92%, ${themeVars.bgSoft})`,
  color: themeVars.text,
  font: 'inherit',
  padding: '0.64rem 0.8rem',
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  selectors: {
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const selectTrigger = style([
  input,
  {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    textAlign: 'left',
  },
]);

export const selectPopup = style({
  zIndex: 80,
  maxHeight: '18rem',
  minWidth: 'var(--anchor-width)',
  overflowY: 'auto',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '9px',
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  padding: '0.35rem',
});

export const selectPositioner = style({
  zIndex: 90,
});

export const selectItem = style({
  borderRadius: '6px',
  cursor: 'pointer',
  padding: '0.6rem 0.7rem',
  selectors: {
    '&[data-highlighted]': {
      background: themeVars.accentSoft,
      color: themeVars.accent,
    },
    '&[data-selected]': {
      fontWeight: 700,
    },
  },
});

export const textarea = style([
  input,
  {
    minHeight: '5.5rem',
    resize: 'vertical',
  },
]);

export const help = style({
  color: themeVars.muted,
  fontSize: '0.86rem',
});

export const errorText = style({
  color: themeVars.danger,
  fontSize: '0.86rem',
});

export const heading = style({
  margin: 0,
  color: themeVars.text,
  letterSpacing: 0,
});

export const muted = style({
  color: themeVars.muted,
});

export const alert = style({
  display: 'flex',
  gap: '0.7rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  padding: '0.95rem 1rem',
  background: `linear-gradient(180deg, color-mix(in srgb, ${themeVars.accentSoft} 76%, ${themeVars.panel}), ${themeVars.accentSoft})`,
  color: themeVars.text,
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '5px',
  background: themeVars.warningSoft,
  color: themeVars.warningText,
  fontSize: '0.72rem',
  fontWeight: 750,
  letterSpacing: '0.02em',
  padding: '0.22rem 0.48rem',
});

export const shell = style({
  minHeight: '100dvh',
});

export const shellHeader = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  height: '68px',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 88%, transparent)`,
  padding: '0 1.15rem',
  backdropFilter: 'blur(18px)',
});

export const shellBrandMeta = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
  lineHeight: 1.2,
});

export const shellBody = style({
  display: 'grid',
  gridTemplateColumns: '236px minmax(0, 1fr)',
  minHeight: 'calc(100dvh - 68px)',
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const shellNav = style({
  borderRight: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 76%, transparent)`,
  padding: '0.9rem',
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const shellNavOpen = style({
  '@media': {
    '(max-width: 48em)': {
      display: 'block',
      borderBottom: `1px solid ${themeVars.line}`,
      borderRight: 0,
    },
  },
});

export const navSectionLabel = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  fontWeight: 760,
  letterSpacing: '0.08em',
  padding: '0.35rem 0.75rem 0.65rem',
});

export const shellMain = style({
  minWidth: 0,
  padding: '0 1.15rem',
});

export const burger = style([
  buttonVariant.subtle,
  {
    width: '2.25rem',
    padding: 0,
    '@media': {
      '(min-width: 48.01em)': {
        display: 'none',
      },
    },
  },
]);

export const navLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  borderRadius: '7px',
  color: themeVars.text,
  padding: '0.72rem 0.78rem',
  textDecoration: 'none',
  transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
  selectors: {
    '&:hover': {
      background: `color-mix(in srgb, ${themeVars.accentSoft} 58%, transparent)`,
      textDecoration: 'none',
      transform: 'translateX(1px)',
    },
    '&[data-active="true"]': {
      background: themeVars.accentSoft,
      color: themeVars.accent,
      fontWeight: 650,
    },
  },
});

export const toastViewport = style({
  position: 'fixed',
  right: '1rem',
  bottom: '1rem',
  zIndex: 100,
  display: 'grid',
  gap: '0.65rem',
  width: 'min(24rem, calc(100vw - 2rem))',
});

export const toast = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  color: themeVars.text,
  padding: '0.8rem 0.9rem',
});

export const grid3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '1rem',
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const statValue = style({
  color: themeVars.text,
  fontSize: '2rem',
  fontWeight: 780,
  lineHeight: 1,
});

export const tableWrap = style({
  overflowX: 'auto',
});

export const table = style({
  width: '100%',
  minWidth: '40rem',
  borderCollapse: 'collapse',
});

export const th = style({
  borderBottom: `1px solid ${themeVars.line}`,
  color: themeVars.muted,
  fontSize: '0.76rem',
  fontWeight: 760,
  letterSpacing: '0.04em',
  padding: '0.78rem 0.85rem',
  textAlign: 'left',
});

export const td = style({
  borderBottom: `1px solid ${themeVars.line}`,
  padding: '0.88rem 0.85rem',
});

export const dialogBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(17, 24, 22, 0.42)',
  padding: '1rem',
});

export const dialogViewport = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
});

export const dialog = style({
  width: 'min(100%, 34rem)',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '12px',
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  color: themeVars.text,
  padding: '1.25rem',
});

export const dialogBody = style({
  marginTop: '1rem',
});

export const code = style({
  borderRadius: '6px',
  background: `color-mix(in srgb, ${themeVars.accentSoft} 65%, transparent)`,
  color: themeVars.text,
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  fontSize: '0.88em',
  padding: '0.08rem 0.28rem',
});

export const textCenter = style({
  textAlign: 'center',
});

export const photoPanel = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(14rem, 0.9fr) minmax(0, 1.1fr)',
  gap: '1rem',
  alignItems: 'stretch',
  '@media': {
    '(max-width: 56em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const photoPreview = style({
  display: 'grid',
  minHeight: '18rem',
  overflow: 'hidden',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  background: `linear-gradient(180deg, color-mix(in srgb, ${themeVars.panel} 92%, ${themeVars.bgSoft}), ${themeVars.bgSoft})`,
});

export const photoImage = style({
  width: '100%',
  height: '100%',
  maxHeight: '28rem',
  objectFit: 'contain',
});

export const photoEmpty = style({
  maxWidth: '22rem',
  padding: '2rem',
  color: themeVars.muted,
  lineHeight: 1.7,
  textAlign: 'center',
});

export const photoList = style({
  display: 'grid',
  gap: '0.65rem',
});

export const photoListItem = style({
  display: 'grid',
  gridTemplateColumns: '3rem minmax(0, 1fr)',
  gap: '0.7rem',
  alignItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '8px',
  background: `color-mix(in srgb, ${themeVars.panel} 92%, transparent)`,
  padding: '0.45rem',
});

export const photoThumb = style({
  width: '3rem',
  height: '3rem',
  borderRadius: '6px',
  objectFit: 'cover',
  background: themeVars.bgSoft,
});

export const hiddenFileInput = style({
  display: 'none',
});

export const bannerOffset = style({
  marginBottom: '1rem',
});

export const searchControl = style({
  position: 'relative',
});

export const searchIcon = style({
  left: 12,
  position: 'absolute',
  top: 13,
});

export const searchInput = style({
  paddingLeft: '2.25rem',
});
