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
  gap: '1.15rem',
});

export const stackTight = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const stackLoose = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.6rem',
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

export const pageHeader = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '1rem',
  alignItems: 'end',
  paddingTop: '0.1rem',
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
      alignItems: 'stretch',
    },
  },
});

export const pageActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.6rem',
  '@media': {
    '(max-width: 40em)': {
      justifyContent: 'stretch',
    },
  },
});

export const toolbar = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 28rem) minmax(0, 1fr)',
  gap: '1rem',
  alignItems: 'end',
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const card = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: '12px',
  background: `color-mix(in srgb, ${themeVars.panel} 98%, transparent)`,
  boxShadow: themeVars.shadow,
});

export const cardPadded = style([
  card,
  {
    padding: '1.35rem',
  },
]);

export const button = style({
  display: 'inline-flex',
  minHeight: '2.4rem',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.45rem',
  border: '1px solid transparent',
  borderRadius: '9px',
  padding: '0.52rem 0.9rem',
  font: 'inherit',
  fontWeight: 680,
  cursor: 'pointer',
  transition:
    'background-color 180ms ease, border-color 180ms ease, color 180ms ease, opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease',
  selectors: {
    '&:hover:not(:disabled)': {
      transform: 'translateY(-1px)',
    },
    '&:active:not(:disabled)': {
      transform: 'translateY(0) scale(0.99)',
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
      background:
        `linear-gradient(180deg, color-mix(in srgb, ${themeVars.accent} 92%, white), ${themeVars.accent})`,
      color: themeVars.onAccent,
      boxShadow: '0 8px 18px rgba(18, 108, 96, 0.18)',
      selectors: {
        '&:hover:not(:disabled)': {
          boxShadow: '0 10px 22px rgba(18, 108, 96, 0.22)',
        },
      },
    },
  ],
  subtle: [
    button,
    {
      background: 'transparent',
      color: themeVars.accent,
      selectors: {
        '&:hover:not(:disabled)': {
          background: `color-mix(in srgb, ${themeVars.accentSoft} 70%, transparent)`,
        },
      },
    },
  ],
  quiet: [
    button,
    {
      borderColor: themeVars.line,
      background: `color-mix(in srgb, ${themeVars.panel} 94%, ${themeVars.bgSoft})`,
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
          background: `color-mix(in srgb, ${themeVars.accentSoft} 42%, ${themeVars.panel})`,
        },
      },
    },
  ],
});

export const iconButton = style([
  buttonVariant.subtle,
  {
    width: '2.35rem',
    minWidth: '2.35rem',
    padding: 0,
  },
]);

export const field = style({
  display: 'grid',
  gap: '0.4rem',
});

export const label = style({
  color: themeVars.muted,
  fontSize: '0.77rem',
  fontWeight: 720,
  letterSpacing: '0.01em',
});

export const input = style({
  width: '100%',
  minHeight: '2.5rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '9px',
  background: `color-mix(in srgb, ${themeVars.panel} 88%, ${themeVars.bgSoft})`,
  color: themeVars.text,
  font: 'inherit',
  padding: '0.62rem 0.78rem',
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  selectors: {
    '&::placeholder': {
      color: `color-mix(in srgb, ${themeVars.muted} 72%, transparent)`,
    },
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      background: themeVars.panel,
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

export const selectIcon = style({
  color: themeVars.muted,
  display: 'inline-flex',
});

export const selectPopup = style({
  zIndex: 80,
  maxHeight: '18rem',
  minWidth: 'var(--anchor-width)',
  overflowY: 'auto',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '11px',
  background: `color-mix(in srgb, ${themeVars.panel} 98%, ${themeVars.bgSoft})`,
  boxShadow: '0 18px 42px rgba(30, 48, 42, 0.14)',
  padding: '0.32rem',
});

export const selectPositioner = style({
  zIndex: 90,
});

export const selectItem = style({
  borderRadius: '8px',
  cursor: 'pointer',
  padding: '0.58rem 0.68rem',
  selectors: {
    '&[data-highlighted]': {
      background: `color-mix(in srgb, ${themeVars.accentSoft} 82%, ${themeVars.panel})`,
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
  borderRadius: '12px',
  padding: '0.95rem 1rem',
  background: `linear-gradient(180deg, color-mix(in srgb, ${themeVars.accentSoft} 76%, ${themeVars.panel}), ${themeVars.accentSoft})`,
  color: themeVars.text,
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid color-mix(in srgb, ${themeVars.warningText} 18%, transparent)`,
  borderRadius: '6px',
  background: `color-mix(in srgb, ${themeVars.warningSoft} 88%, ${themeVars.panel})`,
  color: themeVars.warningText,
  fontSize: '0.71rem',
  fontWeight: 720,
  letterSpacing: '0.01em',
  padding: '0.18rem 0.44rem',
});

export const shell = style({
  minHeight: '100dvh',
});

export const shellHeader = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  height: '66px',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 90%, transparent)`,
  padding: '0 1.2rem',
  backdropFilter: 'blur(18px)',
});

export const shellBrandMeta = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
  lineHeight: 1.2,
});

export const shellBody = style({
  display: 'grid',
  gridTemplateColumns: '228px minmax(0, 1fr)',
  minHeight: 'calc(100dvh - 66px)',
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const shellNav = style({
  borderRight: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 70%, transparent)`,
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
  fontSize: '0.7rem',
  fontWeight: 720,
  letterSpacing: '0.06em',
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
  borderRadius: '9px',
  color: themeVars.text,
  padding: '0.68rem 0.76rem',
  textDecoration: 'none',
  transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
  selectors: {
    '&:hover': {
      background: `color-mix(in srgb, ${themeVars.accentSoft} 54%, transparent)`,
      textDecoration: 'none',
      transform: 'translateX(1px)',
    },
    '&[data-active="true"]': {
      background: `color-mix(in srgb, ${themeVars.accentSoft} 78%, ${themeVars.panel})`,
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
  borderRadius: '12px',
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  color: themeVars.text,
  padding: '0.8rem 0.9rem',
});

export const grid3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
  gap: '0.9rem',
});

export const featureGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
  gap: '0.9rem',
});

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
  gap: '0.9rem',
});

export const twoColumn = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '0.9rem',
  alignItems: 'start',
  '@media': {
    '(max-width: 58em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const iconTile = style({
  display: 'inline-grid',
  width: '2.1rem',
  height: '2.1rem',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '9px',
  background: `color-mix(in srgb, ${themeVars.accentSoft} 62%, ${themeVars.panel})`,
  color: themeVars.accent,
});

export const previewImage = style({
  width: '100%',
  aspectRatio: '16 / 10',
  borderRadius: '10px',
  objectFit: 'cover',
  background: themeVars.bgSoft,
});

export const qrMock = style({
  display: 'grid',
  aspectRatio: '1',
  minHeight: '9rem',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  background:
    `linear-gradient(90deg, ${themeVars.text} 12px, transparent 12px) 0 0 / 26px 26px, ` +
    `linear-gradient(${themeVars.text} 12px, transparent 12px) 0 0 / 26px 26px, ` +
    themeVars.panel,
  color: themeVars.panel,
  fontWeight: 780,
  textShadow: `0 1px 2px ${themeVars.text}`,
});

export const dashboardStats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.9rem',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
    },
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const dashboardSummary = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(18rem, 1fr) minmax(0, 1.4fr)',
  gap: '1rem',
  alignItems: 'stretch',
  '@media': {
    '(max-width: 58em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const heroPanel = style([
  cardPadded,
  {
    display: 'flex',
    minHeight: '9.75rem',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
]);

export const statValue = style({
  color: themeVars.text,
  fontSize: '2.15rem',
  fontWeight: 760,
  lineHeight: 1,
});

export const tableWrap = style({
  overflowX: 'auto',
});

export const tableRow = style({
  transition: 'background-color 140ms ease',
  selectors: {
    '&:hover': {
      background: `color-mix(in srgb, ${themeVars.accentSoft} 24%, transparent)`,
    },
  },
});

export const table = style({
  width: '100%',
  minWidth: '40rem',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const th = style({
  borderBottom: `1px solid ${themeVars.line}`,
  color: themeVars.muted,
  fontSize: '0.73rem',
  fontWeight: 720,
  letterSpacing: '0.035em',
  padding: '0.76rem 0.9rem',
  textAlign: 'left',
  background: `color-mix(in srgb, ${themeVars.bgSoft} 74%, ${themeVars.panel})`,
});

export const td = style({
  borderBottom: `1px solid ${themeVars.line}`,
  padding: '0.86rem 0.9rem',
});

export const dialogBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(16, 24, 21, 0.46)',
  backdropFilter: 'blur(3px)',
  padding: '1rem',
});

export const dialogViewport = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  '@media': {
    '(max-width: 48em)': {
      alignItems: 'start',
      padding: '4.5rem 0.75rem 1rem',
    },
  },
});

export const dialog = style({
  width: 'min(100%, 34rem)',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '14px',
  background: themeVars.panel,
  boxShadow: '0 24px 70px rgba(30, 48, 42, 0.18)',
  color: themeVars.text,
  padding: '1.2rem',
  '@media': {
    '(max-width: 48em)': {
      maxHeight: 'calc(100dvh - 5.5rem)',
      overflowY: 'auto',
      padding: '1rem',
    },
  },
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
  gap: '1.1rem',
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
  borderRadius: '12px',
  background:
    `linear-gradient(180deg, color-mix(in srgb, ${themeVars.panel} 92%, ${themeVars.bgSoft}), ${themeVars.bgSoft})`,
  '@media': {
    '(max-width: 48em)': {
      minHeight: '13rem',
    },
  },
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
  borderRadius: '10px',
  background: `color-mix(in srgb, ${themeVars.panel} 92%, transparent)`,
  color: themeVars.text,
  padding: '0.45rem',
  textDecoration: 'none',
  transition: 'border-color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 34%, ${themeVars.line})`,
      background: `color-mix(in srgb, ${themeVars.accentSoft} 34%, ${themeVars.panel})`,
      textDecoration: 'none',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const photoThumb = style({
  width: '3rem',
  height: '3rem',
  borderRadius: '8px',
  objectFit: 'cover',
  background: themeVars.bgSoft,
});

export const photoMeta = style({
  minWidth: 0,
});

export const photoFilename = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const hiddenFileInput = style({
  display: 'none',
});

export const tagList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.45rem',
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '999px',
  background: `color-mix(in srgb, ${themeVars.accentSoft} 48%, ${themeVars.panel})`,
  color: themeVars.text,
  fontSize: '0.82rem',
  fontWeight: 700,
  padding: '0.28rem 0.42rem 0.28rem 0.65rem',
});

export const tagRemove = style({
  display: 'inline-grid',
  width: '1.25rem',
  height: '1.25rem',
  placeItems: 'center',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  padding: 0,
  selectors: {
    '&:hover:not(:disabled)': {
      background: `color-mix(in srgb, ${themeVars.accent} 12%, transparent)`,
      color: themeVars.accent,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.45,
    },
  },
});

export const tagEditor = style({
  display: 'grid',
  gap: '0.7rem',
  marginTop: '0.45rem',
});

export const inlineForm = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0.65rem',
  alignItems: 'end',
  '@media': {
    '(max-width: 38em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const bannerOffset = style({
  marginBottom: '1rem',
});

export const formActions = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  paddingTop: '0.1rem',
  '@media': {
    '(max-width: 32em)': {
      justifyContent: 'stretch',
    },
  },
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
