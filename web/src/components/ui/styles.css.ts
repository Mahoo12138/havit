import { style, styleVariants, keyframes } from '@vanilla-extract/css';

import { globalStyle } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const center = style({
  display: 'grid',
  minHeight: '100dvh',
  placeItems: 'center',
});

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const stackTight = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
});

export const stackLoose = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space6,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
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
  gap: themeVars.space5,
  alignItems: 'end',
  paddingTop: themeVars.space2,
  paddingBottom: themeVars.space3,
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
  gap: themeVars.space2,
  '@media': {
    '(max-width: 40em)': {
      justifyContent: 'stretch',
    },
  },
});

export const toolbar = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 28rem) minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'end',
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const card = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const cardPadded = style([
  card,
  {
    padding: themeVars.space5,
  },
]);

export const button = style({
  display: 'inline-flex',
  minHeight: '2.25rem',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  border: '1px solid transparent',
  borderRadius: themeVars.radius2,
  padding: `0 ${themeVars.space3}`,
  font: 'inherit',
  fontSize: '0.88rem',
  fontWeight: 600,
  letterSpacing: '-0.005em',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition:
    'background-color 180ms ease, border-color 180ms ease, color 180ms ease, opacity 180ms ease, box-shadow 180ms ease',
  selectors: {
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
});

export const buttonVariant = styleVariants({
  primary: [
    button,
    {
      background: themeVars.accent,
      color: themeVars.onAccent,
      borderColor: themeVars.accent,
      boxShadow: '0 1px 2px rgba(13, 148, 136, 0.18)',
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.accentHover,
          borderColor: themeVars.accentHover,
        },
      },
    },
  ],
  secondary: [
    button,
    {
      background: themeVars.secondaryBg,
      color: themeVars.secondaryText,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.line,
        },
      },
    },
  ],
  outline: [
    button,
    {
      borderColor: themeVars.line,
      background: themeVars.panel,
      color: themeVars.text,
      boxShadow: themeVars.shadowSoft,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.bgSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  subtle: [
    button,
    {
      background: 'transparent',
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.lineSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  ghost: [
    button,
    {
      background: 'transparent',
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.lineSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  destructive: [
    button,
    {
      background: themeVars.dangerBg,
      color: themeVars.onDanger,
      borderColor: themeVars.dangerBg,
      selectors: {
        '&:hover:not(:disabled)': {
          background: '#b91c1c',
          borderColor: '#b91c1c',
        },
      },
    },
  ],
  link: [
    button,
    {
      background: 'transparent',
      color: themeVars.accent,
      borderColor: 'transparent',
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      selectors: {
        '&:hover:not(:disabled)': {
          color: themeVars.accentHover,
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
          borderColor: `color-mix(in srgb, ${themeVars.accent} 30%, ${themeVars.line})`,
          color: themeVars.ink,
          background: themeVars.bgSoft,
        },
      },
    },
  ],
});

export const buttonSize = styleVariants({
  xs: { height: '1.5rem', gap: '0.25rem', padding: '0 0.5rem', fontSize: '0.75rem' },
  sm: { height: '2rem', gap: '0.25rem', padding: '0 0.625rem', fontSize: '0.8rem' },
  default: { height: '2.25rem', gap: '0.375rem', padding: '0 0.625rem', fontSize: '0.88rem' },
  lg: { height: '2.5rem', gap: '0.375rem', padding: '0 0.625rem' },
});

export const iconButtonSize = styleVariants({
  xs: { width: '1.5rem', height: '1.5rem', minWidth: '1.5rem', padding: 0 },
  sm: { width: '2rem', height: '2rem', minWidth: '2rem', padding: 0 },
  default: { width: '2.25rem', height: '2.25rem', minWidth: '2.25rem', padding: 0 },
  lg: { width: '2.5rem', height: '2.5rem', minWidth: '2.5rem', padding: 0 },
});

export const iconButton = style([
  buttonVariant.subtle,
  {
    width: '2.25rem',
    minWidth: '2.25rem',
    padding: 0,
    borderRadius: themeVars.radius2,
  },
]);

export const field = style({
  display: 'grid',
  gap: themeVars.space2,
});

export const label = style({
  color: themeVars.text,
  fontSize: '0.8rem',
  fontWeight: 600,
  letterSpacing: '-0.005em',
});

export const input = style({
  width: '100%',
  minHeight: '2.4rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.9rem',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  selectors: {
    '&::placeholder': {
      color: themeVars.muted,
    },
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 22%, ${themeVars.line})`,
    },
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
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    textAlign: 'left',
    userSelect: 'none',
    whiteSpace: 'nowrap',
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
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  padding: themeVars.space1,
});

export const selectPositioner = style({
  zIndex: 90,
});

export const selectItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  borderRadius: themeVars.radius1,
  cursor: 'pointer',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  fontSize: '0.875rem',
  transition: 'background-color 140ms ease, color 140ms ease',
  outline: 'none',
  selectors: {
    '&[data-highlighted]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
  },
});

export const selectItemIndicator = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  color: themeVars.accentInk,
});

export const selectItemText = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const selectScrollArrow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '1.5rem',
  cursor: 'default',
  color: themeVars.muted,
});

export const selectGroup = style({
  padding: themeVars.space1,
});

export const selectValue = style({
  display: 'flex',
  flex: 1,
  textAlign: 'left',
});

export const selectLabel = style({
  padding: `${themeVars.space1} ${themeVars.space2}`,
  fontSize: '0.75rem',
  color: themeVars.muted,
  fontWeight: 500,
});

export const selectSeparator = style({
  height: '1px',
  background: themeVars.line,
  margin: `${themeVars.space1} -${themeVars.space2}`,
});

export const selectTriggerShadcn = style({
  background: 'transparent',
  minHeight: 0,
  padding: `${themeVars.space2} ${themeVars.space2} ${themeVars.space2} 0.625rem`,
  width: 'fit-content',
  height: '2rem',
});

export const selectTriggerSize = styleVariants({
  default: {},
  sm: { height: '1.75rem', borderRadius: 6 },
});

export const selectChevron = style({
  color: themeVars.muted,
  flexShrink: 0,
  pointerEvents: 'none',
});

/* ---------- Card (shadcn-style) ---------- */

export const cardRoot = style({
  vars: {
    '--card-spacing': themeVars.space4,
  },
  background: themeVars.panel,
  borderRadius: themeVars.radius3,
  boxShadow: `0 0 0 1px ${themeVars.line}`,
  color: themeVars.text,
  display: 'flex',
  flexDirection: 'column',
  fontSize: '0.875rem',
  gap: 'var(--card-spacing)',
  overflow: 'hidden',
  padding: 'var(--card-spacing) 0',
  selectors: {
    '&:has([data-slot="card-footer"])': {
      paddingBottom: 0,
    },
    '&:has(> img:first-child)': {
      paddingTop: 0,
    },
  },
});

export const cardSizeSm = style({
  vars: {
    '--card-spacing': themeVars.space3,
  },
});

export const cardHeader = style({
  alignItems: 'start',
  display: 'grid',
  gap: '0.25rem',
  gridTemplateRows: 'auto auto',
  padding: `0 var(--card-spacing)`,
  selectors: {
    '&:has([data-slot="card-action"])': {
      gridTemplateColumns: '1fr auto',
    },
  },
});

export const cardTitle = style({
  color: themeVars.ink,
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: '1.375',
  selectors: {
    '[data-size="sm"] &': {
      fontSize: '0.8125rem',
    },
  },
});

export const cardDescription = style({
  color: themeVars.muted,
  fontSize: '0.8125rem',
});

export const cardAction = style({
  alignSelf: 'start',
  gridColumn: 2,
  gridRow: '1 / 3',
  justifySelf: 'end',
});

export const cardContent = style({
  padding: `0 var(--card-spacing)`,
});

export const cardFooter = style({
  alignItems: 'center',
  background: themeVars.bgSoft,
  borderBottomLeftRadius: themeVars.radius3,
  borderBottomRightRadius: themeVars.radius3,
  borderTop: `1px solid ${themeVars.line}`,
  display: 'flex',
  padding: 'var(--card-spacing)',
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
  fontSize: '0.85rem',
});

export const errorText = style({
  color: themeVars.danger,
  fontSize: '0.85rem',
});

export const heading = style({
  margin: 0,
  color: themeVars.ink,
  fontWeight: 700,
  letterSpacing: '-0.01em',
});

export const muted = style({
  color: themeVars.muted,
});

export const alert = style({
  display: 'flex',
  gap: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  padding: themeVars.space4,
  background: themeVars.bgSoft,
  color: themeVars.text,
});

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: themeVars.radius1,
  background: themeVars.warningSoft,
  color: themeVars.warningText,
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: `${themeVars.space1} ${themeVars.space2}`,
});

export const statusBadge = styleVariants({
  in_stock: { background: themeVars.successSoft, color: themeVars.success },
  borrowed: { background: themeVars.warningSoft, color: themeVars.warning },
  idle: { background: themeVars.lineSoft, color: themeVars.muted },
  for_sale: { background: themeVars.infoSoft, color: themeVars.info },
  sold: { background: themeVars.lineSoft, color: themeVars.muted },
  given_away: { background: themeVars.lineSoft, color: themeVars.muted },
  lost: { background: themeVars.dangerSoft, color: themeVars.danger },
  stolen: { background: themeVars.dangerSoft, color: themeVars.danger },
  unreturned: { background: themeVars.warningSoft, color: themeVars.warning },
  damaged: { background: themeVars.dangerSoft, color: themeVars.danger },
  archived: { background: themeVars.lineSoft, color: themeVars.muted },
});

const spinAnimation = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const spinner = style({
  display: 'inline-block',
  width: '1.2rem',
  height: '1.2rem',
  border: `2px solid ${themeVars.line}`,
  borderTopColor: themeVars.accent,
  borderRadius: '999px',
  animation: `${spinAnimation} 0.6s linear infinite`,
});

export const tabsList = style({
  display: 'flex',
  gap: themeVars.space1,
  borderBottom: `1px solid ${themeVars.line}`,
  marginBottom: themeVars.space4,
});

export const tab = style({
  padding: `${themeVars.space2} ${themeVars.space3}`,
  background: 'transparent',
  border: 0,
  borderBottom: '2px solid transparent',
  color: themeVars.muted,
  fontSize: '0.88rem',
  fontWeight: 500,
  cursor: 'pointer',
  marginBottom: '-1px',
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.text,
    },
    '&[data-selected]': {
      color: themeVars.accent,
      borderBottomColor: themeVars.accent,
      fontWeight: 600,
    },
  },
});

export const shell = style({
  minHeight: '100dvh',
  display: 'grid',
  gridTemplateColumns: `${themeVars.shellNavW} minmax(0, 1fr)`,
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const shellMainArea = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  background: themeVars.bg,
});

export const shellHeader = style({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  height: themeVars.shellHeaderH,
  alignItems: 'center',
  gap: themeVars.space4,
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  padding: `0 ${themeVars.space5}`,
});

export const headerSearchWrap = style({
  flex: '1 1 auto',
  maxWidth: '40rem',
  position: 'relative',
});

export const headerSearchIcon = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const headerSearchInput = style({
  width: '100%',
  height: '2.25rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.88rem',
  padding: `0 ${themeVars.space3} 0 2.25rem`,
  outline: 'none',
  transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&::placeholder': {
      color: themeVars.muted,
    },
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      background: themeVars.panel,
    },
  },
});

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  marginLeft: 'auto',
});

export const headerIconBtn = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  border: '1px solid transparent',
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  position: 'relative',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const headerIconDot = style({
  position: 'absolute',
  top: 8,
  right: 8,
  width: 7,
  height: 7,
  borderRadius: '999px',
  background: themeVars.danger,
  border: `2px solid ${themeVars.panel}`,
});

export const headerAvatar = style({
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: '999px',
  display: 'inline-grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: themeVars.onAccent,
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
});

export const shellBrandMeta = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
  lineHeight: 1.2,
});

export const shellHeaderRule = style({
  display: 'inline-block',
  width: '1px',
  height: '1.4rem',
  background: themeVars.line,
  margin: `0 ${themeVars.space2}`,
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const shellHeaderDate = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const shellBody = style({
  display: 'block',
});

export const shellNav = style({
  position: 'sticky',
  top: 0,
  height: '100dvh',
  background: themeVars.sidebarBg,
  color: themeVars.sidebarText,
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    '(max-width: 48em)': {
      position: 'fixed',
      inset: '0 auto 0 0',
      width: themeVars.shellNavW,
      zIndex: 50,
      transform: 'translateX(-100%)',
      transition: 'transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1)',
    },
  },
});

export const shellNavOpen = style({
  '@media': {
    '(max-width: 48em)': {
      transform: 'translateX(0)',
      boxShadow: '0 18px 48px rgba(0, 0, 0, 0.4)',
    },
  },
});

export const shellNavScrim = style({
  display: 'none',
  '@media': {
    '(max-width: 48em)': {
      display: 'block',
      position: 'fixed',
      inset: 0,
      zIndex: 40,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(2px)',
    },
  },
});

export const sidebarBrand = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space4} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.sidebarLine}`,
});

export const sidebarBrandMark = style({
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

export const sidebarBrandText = style({
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: '#f1f5f9',
});

export const sidebarBrandClose = style({
  marginLeft: 'auto',
  display: 'none',
  width: '2rem',
  height: '2rem',
  alignItems: 'center',
  justifyContent: 'center',
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
  '@media': {
    '(max-width: 48em)': {
      display: 'inline-flex',
    },
  },
});

export const sidebarScroll = style({
  padding: `${themeVars.space3} ${themeVars.space2}`,
});

export const sidebarFooter = style({
  borderTop: `1px solid ${themeVars.sidebarLine}`,
  padding: themeVars.space3,
});

export const sidebarUser = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space2,
  borderRadius: themeVars.radius2,
  color: themeVars.sidebarText,
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.sidebarHover,
    },
  },
});

export const sidebarUserAvatar = style({
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

export const sidebarUserMeta = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const sidebarUserName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#f1f5f9',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const sidebarUserMetaSub = style({
  fontSize: '0.74rem',
  color: themeVars.sidebarMuted,
});

export const sidebarLogout = style({
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

export const navGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const navGroupDivider = style({
  height: '1px',
  background: themeVars.sidebarLine,
  margin: `${themeVars.space3} ${themeVars.space2}`,
});

export const navSectionLabel = style({
  color: themeVars.sidebarMuted,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: `${themeVars.space3} ${themeVars.space3} ${themeVars.space2}`,
});

export const shellMain = style({
  minWidth: 0,
  padding: `0 ${themeVars.space5}`,
});

export const burger = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'inline-grid',
  placeItems: 'center',
  border: '1px solid transparent',
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.text,
  cursor: 'pointer',
  marginRight: themeVars.space1,
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
    },
  },
  '@media': {
    '(min-width: 48.01em)': {
      display: 'none',
    },
  },
});

export const navLink = style({
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
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '2px',
      height: '60%',
      borderRadius: themeVars.radius1,
      background: 'transparent',
      transition: 'background 160ms ease',
    },
    '&[data-active="true"]::before': {
      background: themeVars.sidebarActiveText,
    },
  },
});

export const navLinkIcon = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  placeItems: 'center',
  color: 'currentColor',
});

export const toastViewport = style({
  position: 'fixed',
  right: themeVars.space4,
  bottom: themeVars.space4,
  zIndex: 100,
  display: 'grid',
  gap: themeVars.space2,
  width: 'min(24rem, calc(100vw - 2rem))',
});

export const toast = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  color: themeVars.text,
  padding: `${themeVars.space3} ${themeVars.space4}`,
});

export const grid3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
  gap: themeVars.space4,
});

export const featureGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
  gap: themeVars.space4,
});

export const cardGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
  gap: themeVars.space4,
});

export const twoColumn = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 58em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const iconTile = style({
  display: 'inline-grid',
  width: '2.2rem',
  height: '2.2rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const previewImage = style({
  width: '100%',
  aspectRatio: '16 / 10',
  borderRadius: themeVars.radius2,
  objectFit: 'cover',
  background: themeVars.bgSoft,
});

export const qrMock = style({
  display: 'grid',
  aspectRatio: '1',
  minHeight: '9rem',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background:
    `linear-gradient(90deg, ${themeVars.ink} 12px, transparent 12px) 0 0 / 26px 26px, ` +
    `linear-gradient(${themeVars.ink} 12px, transparent 12px) 0 0 / 26px 26px, ` +
    themeVars.panel,
  color: themeVars.panel,
  fontWeight: 700,
  textShadow: `0 1px 2px ${themeVars.ink}`,
});

export const qrPrintGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space3,
});

export const qrPrintLabel = style({
  width: '14rem',
  height: '8.5rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  pageBreakInside: 'avoid',
});

export const qrPrintQr = style({
  display: 'grid',
  placeItems: 'center',
  width: '4rem',
  height: '4rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const qrCodeImage = style({
  display: 'block',
  objectFit: 'contain',
});

export const qrPrintCode = style({
  fontFamily: 'monospace',
  fontSize: '0.55rem',
  color: themeVars.ink,
  textAlign: 'center',
  wordBreak: 'break-all',
  lineHeight: 1.2,
});

export const qrPrintNoCode = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
});

export const qrPrintName = style({
  fontWeight: 600,
  fontSize: '0.85rem',
  color: themeVars.ink,
});

export const qrPrintPath = style({
  fontSize: '0.7rem',
  color: themeVars.muted,
});

export const dashboardLayout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 22rem',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const dashboardMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space5,
  minWidth: 0,
});

export const dashboardRail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
  '@media': {
    '(min-width: 72.01em)': {
      position: 'sticky',
      top: `calc(${themeVars.shellHeaderH} + ${themeVars.space5})`,
    },
  },
});

export const greetingRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  flexWrap: 'wrap',
});

export const kpiStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
    },
  },
});

export const kpiTile = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space4,
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  selectors: {
    '&:hover': {
      transform: 'translateY(-1px)',
      borderColor: `color-mix(in srgb, ${themeVars.accent} 25%, ${themeVars.line})`,
      boxShadow: themeVars.shadow,
    },
  },
});

export const kpiIcon = styleVariants({
  teal: [
    {
      flex: '0 0 auto',
      display: 'inline-grid',
      width: '2.6rem',
      height: '2.6rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
  ],
  warning: [
    {
      flex: '0 0 auto',
      display: 'inline-grid',
      width: '2.6rem',
      height: '2.6rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.warningSoft,
      color: themeVars.warning,
    },
  ],
  danger: [
    {
      flex: '0 0 auto',
      display: 'inline-grid',
      width: '2.6rem',
      height: '2.6rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.dangerSoft,
      color: themeVars.danger,
    },
  ],
  info: [
    {
      flex: '0 0 auto',
      display: 'inline-grid',
      width: '2.6rem',
      height: '2.6rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.infoSoft,
      color: themeVars.info,
    },
  ],
  violet: [
    {
      flex: '0 0 auto',
      display: 'inline-grid',
      width: '2.6rem',
      height: '2.6rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.violetSoft,
      color: themeVars.violet,
    },
  ],
});

export const kpiMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const kpiLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 500,
});

export const kpiValue = style({
  color: themeVars.ink,
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
});

export const dashboardStats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
    },
    '(max-width: 40em)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: themeVars.space3,
    },
  },
});

export const mobileHidden = style({
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const dashboardSummary = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: themeVars.space4,
});

export const heroPanel = style([
  cardPadded,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: themeVars.space4,
  },
]);

export const statValue = style({
  color: themeVars.ink,
  fontSize: '2rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

export const sectionCard = style({
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space5}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  fontSize: '1rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  margin: 0,
});

export const sectionLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  fontSize: '0.82rem',
  fontWeight: 500,
  color: themeVars.muted,
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  padding: 0,
  textDecoration: 'none',
  selectors: {
    '&:hover': {
      color: themeVars.accent,
    },
  },
});

export const sectionBody = style({
  padding: themeVars.space5,
});

export const sectionBodyTight = style({
  padding: themeVars.space3,
});

export const categoryRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
  gap: themeVars.space3,
});

export const categoryTile = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: themeVars.space2,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  textDecoration: 'none',
  transition: 'border-color 180ms ease, transform 180ms ease, background-color 180ms ease',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
      transform: 'translateY(-2px)',
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
  },
});

export const categoryThumb = styleVariants({
  teal: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.accentSoft}, color-mix(in srgb, ${themeVars.accent} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.accentInk,
    },
  ],
  warning: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.warningSoft}, color-mix(in srgb, ${themeVars.warning} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.warning,
    },
  ],
  danger: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.dangerSoft}, color-mix(in srgb, ${themeVars.danger} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.danger,
    },
  ],
  info: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.infoSoft}, color-mix(in srgb, ${themeVars.info} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.info,
    },
  ],
  violet: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.violetSoft}, color-mix(in srgb, ${themeVars.violet} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.violet,
    },
  ],
  amber: [
    {
      width: '100%',
      aspectRatio: '16 / 10',
      borderRadius: themeVars.radius1,
      background: `linear-gradient(135deg, ${themeVars.amberSoft}, color-mix(in srgb, ${themeVars.amber} 22%, ${themeVars.panel}))`,
      display: 'grid',
      placeItems: 'center',
      color: themeVars.amber,
    },
  ],
});

export const categoryName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const categoryCount = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const recentList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const recentRow = style({
  display: 'grid',
  gridTemplateColumns: '3rem minmax(0, 1.6fr) auto auto',
  alignItems: 'center',
  gap: themeVars.space4,
  padding: `${themeVars.space3} ${themeVars.space5}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  textDecoration: 'none',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
    '&:first-child': {
      borderTop: 0,
    },
  },
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '3rem minmax(0, 1fr)',
    },
  },
});

export const recentThumb = style({
  width: '3rem',
  height: '3rem',
  borderRadius: themeVars.radius2,
  background: themeVars.lineSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const recentMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const recentName = style({
  fontSize: '0.92rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const recentSub = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const recentTags = style({
  display: 'flex',
  gap: themeVars.space1,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const recentPrice = style({
  fontSize: '0.95rem',
  fontWeight: 700,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const quickActionsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space2,
});

export const quickAction = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space2}`,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  textDecoration: 'none',
  fontSize: '0.78rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'border-color 160ms ease, background-color 160ms ease, transform 200ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
      background: themeVars.bgSoft,
      transform: 'translateY(-1px)',
      textDecoration: 'none',
    },
  },
});

export const quickActionIcon = styleVariants({
  teal: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
  ],
  info: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.infoSoft,
      color: themeVars.info,
    },
  ],
  warning: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.warningSoft,
      color: themeVars.warning,
    },
  ],
  violet: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.violetSoft,
      color: themeVars.violet,
    },
  ],
  amber: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.amberSoft,
      color: themeVars.amber,
    },
  ],
  success: [
    {
      display: 'inline-grid',
      width: '2.4rem',
      height: '2.4rem',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.successSoft,
      color: themeVars.success,
    },
  ],
});

export const reminderItem = style({
  display: 'flex',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const reminderDot = style({
  width: '0.5rem',
  height: '0.5rem',
  borderRadius: '999px',
  background: themeVars.danger,
  marginTop: '0.45rem',
  flex: '0 0 auto',
});

export const reminderDotWarn = style([
  reminderDot,
  { background: themeVars.warning },
]);

export const reminderDotInfo = style([
  reminderDot,
  { background: themeVars.info },
]);

export const reminderTitle = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const reminderSub = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const reminderEmpty = style({
  padding: `${themeVars.space5} ${themeVars.space4}`,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.85rem',
});

export const locationTreeWrap = style({
  padding: `${themeVars.space2} ${themeVars.space3} ${themeVars.space3}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  maxHeight: '20rem',
});

export const locationNode = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `0.4rem ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  color: themeVars.text,
  fontSize: '0.86rem',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

export const locationNodeMuted = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  marginLeft: 'auto',
  fontVariantNumeric: 'tabular-nums',
});

export const tableWrap = style({
  minWidth: 0,
});

export const tableRow = style({
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
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
  fontSize: '0.76rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  padding: `${themeVars.space2} ${themeVars.space4}`,
  textAlign: 'left',
  background: themeVars.bgSoft,
});

export const td = style({
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  fontSize: '0.92rem',
});

export const dialogBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
  padding: themeVars.space4,
});

export const dialogViewport = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'grid',
  placeItems: 'center',
  padding: themeVars.space4,
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
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
  color: themeVars.text,
  padding: themeVars.space5,
  '@media': {
    '(max-width: 48em)': {
      maxHeight: 'calc(100dvh - 5.5rem)',
      overflowY: 'auto',
      padding: themeVars.space4,
    },
  },
});

export const dialogBody = style({
  marginTop: themeVars.space4,
});

export const code = style({
  borderRadius: themeVars.radius1,
  background: themeVars.lineSoft,
  color: themeVars.ink,
  fontFamily: themeVars.fontMono,
  fontSize: '0.85em',
  padding: '0.08rem 0.32rem',
});

export const textCenter = style({
  textAlign: 'center',
});

export const photoPanel = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(14rem, 0.9fr) minmax(0, 1.1fr)',
  gap: themeVars.space4,
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
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
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
  padding: themeVars.space6,
  color: themeVars.muted,
  lineHeight: 1.6,
  textAlign: 'center',
});

export const photoList = style({
  display: 'grid',
  gap: themeVars.space2,
});

export const photoListItem = style({
  display: 'grid',
  gridTemplateColumns: '3rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  padding: themeVars.space2,
  textDecoration: 'none',
  transition: 'border-color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 30%, ${themeVars.line})`,
      background: themeVars.bgSoft,
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
  borderRadius: themeVars.radius1,
  objectFit: 'cover',
  background: themeVars.lineSoft,
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
  gap: themeVars.space1,
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  borderRadius: '999px',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: '0.74rem',
  fontWeight: 600,
  padding: `2px ${themeVars.space2}`,
});

export const tagChipNeutral = style([
  tagChip,
  {
    background: themeVars.lineSoft,
    color: themeVars.text,
  },
]);

export const tagChipInfo = style([
  tagChip,
  {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
]);

export const tagChipWarning = style([
  tagChip,
  {
    background: themeVars.warningSoft,
    color: themeVars.warningText,
  },
]);

export const tagRemove = style({
  display: 'inline-grid',
  width: '1.1rem',
  height: '1.1rem',
  placeItems: 'center',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: 'currentColor',
  cursor: 'pointer',
  padding: 0,
  opacity: 0.7,
  selectors: {
    '&:hover:not(:disabled)': {
      opacity: 1,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
    },
  },
});

export const tagEditor = style({
  display: 'grid',
  gap: themeVars.space2,
  marginTop: themeVars.space2,
});

export const inlineForm = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'end',
  '@media': {
    '(max-width: 38em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const bannerOffset = style({
  marginBottom: themeVars.space4,
});

export const formActions = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  paddingTop: themeVars.space1,
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
  top: 12,
  color: themeVars.muted,
});

export const searchInput = style({
  paddingLeft: '2.25rem',
});

/* ---------- Location page ---------- */

export const locationLayout = style({
  display: 'grid',
  gridTemplateColumns: '320px minmax(0, 1fr)',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
    '(max-width: 48em)': {
      gap: themeVars.space3,
    },
  },
});

export const locationTreePane = style({
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    '(min-width: 64.01em)': {
      position: 'sticky',
      top: `calc(${themeVars.shellHeaderH} + ${themeVars.space4})`,
      maxHeight: `calc(100dvh - ${themeVars.shellHeaderH} - ${themeVars.space6})`,
    },
  },
});

export const locationTreeHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const locationTreeHeadTitle = style({
  fontSize: '0.95rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

export const locationTreeBody = style({
  padding: `${themeVars.space2} ${themeVars.space2}`,
});

export const locationTreeGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingBlock: themeVars.space1,
});

export const locationTreeGroupLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.muted,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: `${themeVars.space3} ${themeVars.space3} ${themeVars.space2}`,
});

export const locationTreeRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  borderRadius: themeVars.radius1,
  color: themeVars.text,
  fontSize: '0.88rem',
  padding: `${themeVars.space2} ${themeVars.space2}`,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background-color 140ms ease, color 140ms ease, border-color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
    '&[data-active="true"]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
      fontWeight: 600,
    },
  },
});

export const locationTreeRowChevron = style({
  width: '1.1rem',
  height: '1.1rem',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: '3px',
  color: themeVars.muted,
  flex: '0 0 auto',
  cursor: 'pointer',
  transition: 'background-color 140ms ease, transform 200ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.text,
    },
    '&[data-expanded="true"]': {
      transform: 'rotate(90deg)',
    },
    '&[data-empty="true"]': {
      visibility: 'hidden',
    },
  },
});

export const locationTreeRowName = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const locationTreeRowCount = style({
  flex: '0 0 auto',
  fontSize: '0.75rem',
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
});

export const locationTreeFooter = style({
  borderTop: `1px solid ${themeVars.lineSoft}`,
  padding: themeVars.space3,
});

export const locationDetailPane = style({
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
});

export const locationDetailHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space5}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 48em)': {
      alignItems: 'stretch',
      padding: themeVars.space3,
    },
  },
});

export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  color: themeVars.muted,
  fontSize: '0.85rem',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const breadcrumbItem = style({
  color: themeVars.muted,
  selectors: {
    '&[data-current="true"]': {
      color: themeVars.ink,
      fontWeight: 600,
    },
  },
});

export const breadcrumbSep = style({
  color: themeVars.muted,
  opacity: 0.6,
});

export const detailToolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexShrink: 0,
  '@media': {
    '(max-width: 48em)': {
      width: '100%',
      overflowX: 'auto',
      paddingBottom: themeVars.space1,
      WebkitOverflowScrolling: 'touch',
    },
  },
});

globalStyle(`${detailToolbar} > *`, {
  flex: '0 0 auto',
});

export const locationHero = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space4,
  padding: themeVars.space5,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 48em)': {
      gap: themeVars.space3,
      padding: themeVars.space4,
    },
  },
});

export const locationHeroIcon = styleVariants({
  teal: [
    {
      width: '3.5rem',
      height: '3.5rem',
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
      flex: '0 0 auto',
    },
  ],
  info: [
    {
      width: '3.5rem',
      height: '3.5rem',
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.infoSoft,
      color: themeVars.info,
      flex: '0 0 auto',
    },
  ],
  warning: [
    {
      width: '3.5rem',
      height: '3.5rem',
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.warningSoft,
      color: themeVars.warning,
      flex: '0 0 auto',
    },
  ],
  violet: [
    {
      width: '3.5rem',
      height: '3.5rem',
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.violetSoft,
      color: themeVars.violet,
      flex: '0 0 auto',
    },
  ],
  amber: [
    {
      width: '3.5rem',
      height: '3.5rem',
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: themeVars.radius2,
      background: themeVars.amberSoft,
      color: themeVars.amber,
      flex: '0 0 auto',
    },
  ],
});

export const locationHeroMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
  minWidth: 0,
  flex: '1 1 12rem',
});

export const locationHeroName = style({
  fontSize: '1.4rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.015em',
  lineHeight: 1.2,
  '@media': {
    '(max-width: 48em)': {
      fontSize: '1.25rem',
    },
  },
});

export const locationHeroSub = style({
  color: themeVars.muted,
  fontSize: '0.85rem',
});

export const typeBadge = styleVariants({
  teal: [
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
      fontSize: '0.72rem',
      fontWeight: 600,
    },
  ],
  info: [
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      background: themeVars.infoSoft,
      color: themeVars.info,
      fontSize: '0.72rem',
      fontWeight: 600,
    },
  ],
  warning: [
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      background: themeVars.warningSoft,
      color: themeVars.warningText,
      fontSize: '0.72rem',
      fontWeight: 600,
    },
  ],
  violet: [
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      background: themeVars.violetSoft,
      color: themeVars.violet,
      fontSize: '0.72rem',
      fontWeight: 600,
    },
  ],
  amber: [
    {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      background: themeVars.amberSoft,
      color: themeVars.amber,
      fontSize: '0.72rem',
      fontWeight: 600,
    },
  ],
});

export const qrChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space1} ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.line}`,
  color: themeVars.text,
  fontFamily: themeVars.fontMono,
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
});

export const metaGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space3,
  padding: `0 ${themeVars.space5} ${themeVars.space5}`,
  '@media': {
    '(max-width: 36em)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: themeVars.space2,
      padding: `0 ${themeVars.space4} ${themeVars.space4}`,
    },
  },
});

export const metaChip = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  '@media': {
    '(max-width: 36em)': {
      padding: themeVars.space2,
    },
  },
});

export const metaChipLabel = style({
  color: themeVars.muted,
  fontSize: '0.74rem',
  fontWeight: 500,
  '@media': {
    '(max-width: 36em)': {
      fontSize: '0.68rem',
    },
  },
});

export const metaChipValue = style({
  color: themeVars.ink,
  fontSize: '1.4rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    '(max-width: 36em)': {
      fontSize: '1.15rem',
    },
  },
});

export const detailBody = style({
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

export const detailEmpty = style({
  padding: `${themeVars.space7} ${themeVars.space5}`,
  textAlign: 'center',
  color: themeVars.muted,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const detailEmptyIcon = style({
  width: '3rem',
  height: '3rem',
  borderRadius: themeVars.radius3,
  display: 'inline-grid',
  placeItems: 'center',
  background: themeVars.lineSoft,
  color: themeVars.muted,
});

export const detailItemList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const detailItemRow = style({
  display: 'grid',
  gridTemplateColumns: '3rem minmax(0, 1.5fr) auto auto',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space5}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  textDecoration: 'none',
  transition: 'background-color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
    '&:first-child': {
      borderTop: 0,
    },
  },
  '@media': {
    '(max-width: 48em)': {
      gridTemplateColumns: '2.5rem minmax(0, 1fr) auto',
      gap: themeVars.space2,
      padding: `${themeVars.space3} ${themeVars.space4}`,
    },
  },
});

export const detailItemPrice = style({
  fontSize: '0.92rem',
  fontWeight: 600,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  '@media': {
    '(max-width: 48em)': {
      display: 'none',
    },
  },
});

export const childrenStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
  gap: themeVars.space2,
  padding: themeVars.space5,
});

export const childChip = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.text,
  fontSize: '0.86rem',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background-color 140ms ease, transform 200ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 30%, ${themeVars.line})`,
      background: themeVars.bgSoft,
      transform: 'translateY(-1px)',
      textDecoration: 'none',
    },
  },
});

export const childChipName = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600,
  color: themeVars.ink,
});

export const childChipCount = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
  fontVariantNumeric: 'tabular-nums',
});

export const subsection = style({
  padding: `${themeVars.space4} ${themeVars.space5} ${themeVars.space2}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const subsectionTitle = style({
  fontSize: '0.78rem',
  fontWeight: 600,
  color: themeVars.muted,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

export const switchRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const switchTrack = style({
  position: 'relative',
  width: '2.4rem',
  height: '1.4rem',
  borderRadius: '999px',
  background: themeVars.lineSoft,
  cursor: 'pointer',
  transition: 'background-color 160ms ease',
  selectors: {
    '&[data-checked="true"]': {
      background: themeVars.accent,
    },
  },
});

export const switchThumb = style({
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '1rem',
  height: '1rem',
  borderRadius: '999px',
  background: '#fff',
  boxShadow: themeVars.shadowSoft,
  transition: 'transform 180ms cubic-bezier(0.34, 1.4, 0.64, 1)',
  selectors: {
    [`${switchTrack}[data-checked="true"] &`]: {
      transform: 'translateX(1rem)',
    },
  },
});

export const typeChoiceGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
  gap: themeVars.space2,
});

export const typeChoiceCard = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.text,
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
  transition: 'border-color 140ms ease, background-color 140ms ease',
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 32%, ${themeVars.line})`,
      background: themeVars.bgSoft,
    },
    '&[data-active="true"]': {
      borderColor: themeVars.accent,
      background: themeVars.accentSoft,
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
});

export const typeChoiceIcon = style({
  width: '2rem',
  height: '2rem',
  borderRadius: themeVars.radius1,
  display: 'inline-grid',
  placeItems: 'center',
  background: themeVars.bgSoft,
  color: themeVars.text,
  flex: '0 0 auto',
});

export const typeChoiceBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const typeChoiceLabel = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const typeChoiceDesc = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  lineHeight: 1.4,
});

/* ---------- Item Detail page ---------- */

export const itemHero = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
  gap: themeVars.space5,
  '@media': {
    '(max-width: 60em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const itemGallery = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: 0,
});

export const itemMainPhoto = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  aspectRatio: '4 / 3',
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  overflow: 'hidden',
});

export const itemMainPhotoImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  padding: themeVars.space4,
});

export const itemPhotoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space5,
  color: themeVars.muted,
  textAlign: 'center',
  lineHeight: 1.5,
});

export const itemPhotoCount = style({
  position: 'absolute',
  top: themeVars.space3,
  right: themeVars.space3,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: `${themeVars.space1} ${themeVars.space2}`,
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.55)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 600,
});

export const itemThumbStrip = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(64px, 1fr)',
  gap: themeVars.space2,
  overflowX: 'auto',
  paddingBottom: themeVars.space1,
});

export const itemThumb = style({
  aspectRatio: '1',
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  overflow: 'hidden',
  cursor: 'pointer',
  padding: 0,
  transition: 'border-color 160ms ease, box-shadow 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 40%, ${themeVars.line})`,
    },
    '&[data-active="true"]': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 2px ${themeVars.focusRing}`,
    },
  },
});

export const itemThumbImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
});

export const itemThumbAdd = style({
  display: 'grid',
  placeItems: 'center',
  aspectRatio: '1',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  cursor: 'pointer',
  transition: 'border-color 160ms ease, color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: themeVars.accent,
      color: themeVars.accent,
      background: themeVars.accentSoft,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const itemSpec = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const itemSpecHead = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const itemSpecBadges = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const itemSpecType = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: `2px ${themeVars.space2}`,
  borderRadius: '999px',
  background: themeVars.lineSoft,
  color: themeVars.text,
  fontSize: '0.74rem',
  fontWeight: 600,
});

export const itemSpecCategory = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
});

export const itemSpecGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 36em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const itemSpecCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  minWidth: 0,
});

export const itemSpecCellLabel = style({
  color: themeVars.muted,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

export const itemSpecCellValue = style({
  color: themeVars.ink,
  fontSize: '0.95rem',
  fontWeight: 600,
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.005em',
});

export const itemSpecCellMuted = style({
  color: themeVars.muted,
  fontWeight: 500,
});

export const itemNote = style({
  margin: 0,
  color: themeVars.text,
  fontSize: '0.9rem',
  lineHeight: 1.55,
});

export const itemDashboard = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 20rem',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const itemMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const itemRail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const itemSectionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
  gap: themeVars.space4,
});

export const itemSection = style({
  display: 'flex',
  flexDirection: 'column',
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
  overflow: 'hidden',
  minWidth: 0,
});

export const itemSectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const itemSectionTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  fontSize: '0.92rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.005em',
  margin: 0,
});

export const itemSectionTitleIcon = style({
  display: 'inline-grid',
  width: '1.6rem',
  height: '1.6rem',
  placeItems: 'center',
  borderRadius: themeVars.radius1,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const itemSectionHint = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const itemSectionBody = style({
  padding: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const itemSectionBodyTight = style({
  padding: 0,
});

export const itemSectionEmpty = style({
  padding: `${themeVars.space4} ${themeVars.space4} ${themeVars.space5}`,
  color: themeVars.muted,
  fontSize: '0.85rem',
  textAlign: 'center',
});

export const itemKvList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const itemKvRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.86rem',
  selectors: {
    '&:first-child': {
      paddingTop: 0,
    },
    '&:last-child': {
      borderBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const itemKvLabel = style({
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const itemKvValue = style({
  color: themeVars.ink,
  fontWeight: 500,
  textAlign: 'right',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const itemStockHero = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: themeVars.space2,
});

export const itemStockValue = style({
  color: themeVars.ink,
  fontSize: '2.2rem',
  fontWeight: 700,
  letterSpacing: '-0.025em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

export const itemStockUnit = style({
  color: themeVars.muted,
  fontSize: '0.85rem',
});

export const itemStockLow = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: `2px ${themeVars.space2}`,
  borderRadius: '999px',
  background: themeVars.warningSoft,
  color: themeVars.warningText,
  fontSize: '0.72rem',
  fontWeight: 600,
});

export const itemTimeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  position: 'relative',
});

export const itemTimelineRow = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingLeft: '1.4rem',
  paddingBottom: themeVars.space3,
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0.45rem',
      top: '0.55rem',
      bottom: 0,
      width: '1px',
      background: themeVars.lineSoft,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '0.25rem',
      top: '0.35rem',
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '999px',
      background: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.accentSoft}`,
    },
    '&:last-child': {
      paddingBottom: 0,
    },
    '&:last-child::before': {
      display: 'none',
    },
  },
});

export const itemTimelineTitle = style({
  color: themeVars.ink,
  fontSize: '0.88rem',
  fontWeight: 600,
});

export const itemTimelineMeta = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const itemTimelinePayload = style({
  marginTop: '4px',
  padding: `${themeVars.space1} ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: '0.78rem',
  fontFamily: themeVars.fontMono,
  wordBreak: 'break-all',
});

export const itemLoanCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
});

export const itemLoanHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
});

export const itemLoanName = style({
  color: themeVars.ink,
  fontSize: '0.95rem',
  fontWeight: 600,
});

export const itemLoanMeta = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const itemRailField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const itemRailFieldLabel = style({
  color: themeVars.muted,
  fontSize: '0.74rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
});

export const itemRailLocation = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  color: themeVars.text,
  fontSize: '0.85rem',
  lineHeight: 1.4,
});

export const itemRailDivider = style({
  height: '1px',
  background: themeVars.lineSoft,
});

export const itemCredentialCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
});

export const itemCredentialTitle = style({
  color: themeVars.ink,
  fontSize: '0.9rem',
  fontWeight: 600,
});

export const itemCredentialMeta = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const itemAddonRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const itemAddonName = style({
  color: themeVars.ink,
  fontSize: '0.86rem',
  fontWeight: 500,
});

export const itemAddonPrice = style({
  color: themeVars.accentInk,
  fontSize: '0.86rem',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
});

export const itemSectionFoot = style({
  padding: `${themeVars.space2} ${themeVars.space4} ${themeVars.space3}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  display: 'flex',
  justifyContent: 'flex-end',
  fontSize: '0.78rem',
  color: themeVars.muted,
});

/* ---------- Skeleton ---------- */

const shimmer = keyframes({
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
});

const skeletonBase = style({
  animation: `${shimmer} 1.4s ease-in-out infinite`,
  background: `linear-gradient(90deg, ${themeVars.lineSoft} 25%, ${themeVars.line} 50%, ${themeVars.lineSoft} 75%)`,
  backgroundSize: '200% 100%',
});

export const skeletonText = style([
  skeletonBase,
  {
    height: '0.85rem',
    borderRadius: themeVars.radius1,
    width: '100%',
  },
]);

export const skeletonTitle = style([
  skeletonBase,
  {
    height: '1.2rem',
    borderRadius: themeVars.radius1,
    width: '60%',
  },
]);

export const skeletonCircle = style([
  skeletonBase,
  {
    borderRadius: '999px',
  },
]);

export const skeletonRect = style([
  skeletonBase,
  {
    borderRadius: themeVars.radius2,
    aspectRatio: '16 / 10',
    width: '100%',
  },
]);

/* ---------- Tooltip ---------- */

export const tooltip = style({
  position: 'relative',
  display: 'inline-flex',
  selectors: {
    '&:hover::after, &:focus-visible::after': {
      content: 'attr(data-tip)',
      position: 'absolute',
      bottom: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: `${themeVars.space1} ${themeVars.space3}`,
      borderRadius: themeVars.radius1,
      background: themeVars.ink,
      color: themeVars.panel,
      fontSize: '0.78rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 70,
      lineHeight: 1.4,
    },
  },
});

/* ---------- ScrollArea (Base UI) ---------- */

const scrollbarThumb = `color-mix(in srgb, ${themeVars.muted} 42%, transparent)`;
const scrollbarThumbHover = `color-mix(in srgb, ${themeVars.accent} 34%, ${themeVars.muted})`;
const scrollbarTrack = `color-mix(in srgb, ${themeVars.lineSoft} 42%, transparent)`;

const scrollbarBase = style({
  display: 'flex',
  touchAction: 'none',
  userSelect: 'none',
  padding: 2,
  background: 'transparent',
  opacity: 0.62,
  transition: 'background-color 160ms ease, opacity 160ms ease',
  selectors: {
    '&:hover': {
      opacity: 1,
    },
    '&[data-state="visible"]': {
      opacity: 1,
    },
    '&[data-scrolling]': {
      opacity: 1,
    },
  },
});

export const scrollAreaRoot = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: '1 1 auto',
  overflow: 'hidden',
});

export const scrollAreaViewport = style({
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  height: '100%',
  overflow: 'auto',
  outline: 'none',
  borderRadius: 'inherit',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const scrollAreaScrollbarVert = style([
  scrollbarBase,
  {
    width: 10,
    height: '100%',
    borderLeft: '1px solid transparent',
    borderRadius: 999,
    selectors: {
      '&:hover': {
        background: scrollbarTrack,
      },
    },
  },
]);

export const scrollAreaScrollbarHoriz = style([
  scrollbarBase,
  {
    height: 10,
    width: '100%',
    borderTop: '1px solid transparent',
    borderRadius: 999,
    flexDirection: 'column',
    selectors: {
      '&:hover': {
        background: scrollbarTrack,
      },
    },
  },
]);

export const scrollAreaThumb = style({
  position: 'relative',
  flex: '1 1 auto',
  borderRadius: 999,
  background: scrollbarThumb,
  minHeight: 28,
  minWidth: 28,
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: scrollbarThumbHover,
    },
  },
});

export const scrollAreaCorner = style({
  background: 'transparent',
});

export const loanPageMetrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
    '(max-width: 48em)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '(max-width: 36em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const loanMetricCard = style({
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
  transition: 'border-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: themeVars.accent,
    },
  },
});

export const loanMetricLabel = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontWeight: 500,
});

export const loanMetricValue = style({
  color: themeVars.ink,
  fontSize: '1.6rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
});

export const loanMetricValueDanger = style([
  loanMetricValue,
  { color: themeVars.danger },
]);

export const loanMetricSub = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const loanFilterBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: themeVars.space3,
  marginBottom: themeVars.space3,
  '@media': {
    '(max-width: 48em)': {
      gap: themeVars.space2,
    },
  },
});

export const loanFilterSelect = style({
  minHeight: '2rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.82rem',
  padding: `${themeVars.space1} ${themeVars.space3}`,
  paddingRight: `${themeVars.space6}`,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${themeVars.space2} center`,
  transition: 'border-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 22%, ${themeVars.line})`,
    },
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const loanFilterIconBtn = style([
  iconButton,
  {
    width: '2rem',
    minWidth: '2rem',
    height: '2rem',
  },
]);

export const loanToolbarActions = style({
  display: 'flex',
  gap: themeVars.space2,
  marginLeft: 'auto',
});

export const loanStatusBadge = styleVariants({
  active: { background: themeVars.accentSoft, color: themeVars.accentInk },
  overdue: { background: themeVars.dangerSoft, color: themeVars.danger },
  due_soon: { background: themeVars.warningSoft, color: themeVars.warning },
  returned: { background: themeVars.successSoft, color: themeVars.success },
});

export const loanStatusBadgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: themeVars.radius1,
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  padding: `${themeVars.space1} ${themeVars.space2}`,
});

export const loanItemCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
});

export const loanItemThumb = style({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.line}`,
  objectFit: 'cover',
  flexShrink: 0,
});

export const loanItemThumbPlaceholder = style([
  loanItemThumb,
  {
    display: 'grid',
    placeItems: 'center',
    color: themeVars.muted,
    fontSize: '0.9rem',
  },
]);

export const loanItemInfo = style({
  minWidth: 0,
});

export const loanItemName = style({
  fontWeight: 600,
  color: themeVars.ink,
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const loanItemSn = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const loanActionBtn = style({
  background: 'transparent',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  padding: `${themeVars.space1} ${themeVars.space3}`,
  fontSize: '0.8rem',
  fontWeight: 500,
  color: themeVars.accent,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, border-color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.accentSoft,
      borderColor: themeVars.accent,
    },
  },
});

export const loanActionMore = style({
  background: 'transparent',
  border: 0,
  borderRadius: themeVars.radius2,
  padding: themeVars.space1,
  color: themeVars.muted,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 140ms ease, background-color 140ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.text,
      background: themeVars.lineSoft,
    },
  },
});

export const loanPageHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  paddingTop: themeVars.space2,
  paddingBottom: themeVars.space2,
  '@media': {
    '(max-width: 48em)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
});

export const loanPageHeaderRight = style({
  display: 'flex',
  gap: themeVars.space2,
  alignItems: 'center',
  flexShrink: 0,
});

export const loanPageSubtitle = style({
  color: themeVars.muted,
  fontSize: '0.88rem',
  marginTop: themeVars.space1,
});

export const loanBottomGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: themeVars.space4,
  marginTop: themeVars.space4,
  '@media': {
    '(max-width: 58em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const loanBottomCard = style({
  padding: themeVars.space5,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
});

export const loanBottomTitle = style({
  margin: 0,
  fontSize: '1rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

export const loanMobileCard = style({
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const loanMobileRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const loanMobileItemRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const loanMobileMeta = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: `${themeVars.space1} ${themeVars.space4}`,
  fontSize: '0.82rem',
});

export const loanMobileLabel = style({
  color: themeVars.muted,
});

export const loanMobileValue = style({
  color: themeVars.text,
  fontWeight: 500,
});

/* ---------- Essentials Page ---------- */

export const essentialsStatsRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const essentialsStatCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space4,
  padding: themeVars.space4,
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
});

export const essentialsStatIcon = styleVariants({
  blue: {
    width: '2.8rem',
    height: '2.8rem',
    borderRadius: themeVars.radius2,
    background: themeVars.infoSoft,
    color: themeVars.info,
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
  },
  green: {
    width: '2.8rem',
    height: '2.8rem',
    borderRadius: themeVars.radius2,
    background: themeVars.successSoft,
    color: themeVars.success,
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
  },
  orange: {
    width: '2.8rem',
    height: '2.8rem',
    borderRadius: themeVars.radius2,
    background: themeVars.warningSoft,
    color: themeVars.warning,
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
  },
  gray: {
    width: '2.8rem',
    height: '2.8rem',
    borderRadius: themeVars.radius2,
    background: themeVars.lineSoft,
    color: themeVars.muted,
    display: 'inline-grid',
    placeItems: 'center',
    flex: '0 0 auto',
  },
});

export const essentialsStatMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const essentialsStatLabel = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontWeight: 500,
});

export const essentialsStatValue = style({
  color: themeVars.ink,
  fontSize: '1.75rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
});

export const essentialsStatNote = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  marginTop: '1px',
});

export const essentialsMainLayout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 22rem',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const essentialsMainContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const essentialsSidebar = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
  '@media': {
    '(min-width: 72.01em)': {
      position: 'sticky',
      top: `calc(${themeVars.shellHeaderH} + ${themeVars.space5})`,
    },
  },
});

export const essentialsToolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  flexWrap: 'wrap',
});

export const essentialsToolbarLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const essentialsToolbarRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const essentialsToolbarTitle = style({
  margin: 0,
  fontSize: '1rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

export const essentialsToolbarDivider = style({
  display: 'inline-block',
  width: '1px',
  height: '1.2rem',
  background: themeVars.line,
});

export const essentialsViewToggle = style({
  display: 'inline-flex',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  overflow: 'hidden',
});

export const essentialsViewToggleBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  padding: `${themeVars.space1} ${themeVars.space3}`,
  border: 0,
  background: 'transparent',
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.text,
    },
    '&[data-active="true"]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
  },
});

export const essentialsItemRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1.5fr) minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space4,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  textDecoration: 'none',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const essentialsItemInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
});

export const essentialsItemThumb = style({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: themeVars.radius2,
  background: themeVars.lineSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
  flex: '0 0 auto',
  overflow: 'hidden',
});

export const essentialsItemName = style({
  fontSize: '0.92rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const essentialsItemCategory = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const essentialsStatusBadge = styleVariants({
  carry: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  bag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.infoSoft,
    color: themeVars.info,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  home: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.lineSoft,
    color: themeVars.muted,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  away: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.warningSoft,
    color: themeVars.warning,
    fontSize: '0.78rem',
    fontWeight: 600,
  },
});

export const essentialsQuickAction = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
  },
});

export const essentialsQuickActionIcon = style({
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: themeVars.radius2,
  display: 'inline-grid',
  placeItems: 'center',
  flex: '0 0 auto',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const essentialsQuickActionMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: '1 1 auto',
});

export const essentialsQuickActionTitle = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const essentialsQuickActionHint = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const essentialsQuickActionArrow = style({
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const essentialsDonut = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space5,
  padding: themeVars.space4,
});

export const essentialsDonutLegend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  minWidth: 0,
});

export const essentialsDonutLegendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  fontSize: '0.82rem',
  color: themeVars.text,
});

export const essentialsDonutLegendDot = style({
  width: '0.55rem',
  height: '0.55rem',
  borderRadius: '999px',
  flex: '0 0 auto',
});

export const essentialsDonutLegendValue = style({
  marginLeft: 'auto',
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
  fontSize: '0.78rem',
});

export const essentialsReminderItem = style({
  display: 'flex',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const essentialsReminderDot = style({
  width: '0.5rem',
  height: '0.5rem',
  borderRadius: '999px',
  background: themeVars.danger,
  marginTop: '0.45rem',
  flex: '0 0 auto',
});

export const essentialsReminderDotWarn = style([
  essentialsReminderDot,
  { background: themeVars.warning },
]);

export const essentialsReminderDotInfo = style([
  essentialsReminderDot,
  { background: themeVars.info },
]);

export const essentialsReminderMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const essentialsReminderTitle = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const essentialsReminderSub = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const essentialsChecklistStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: themeVars.space3,
  padding: themeVars.space4,
});

export const essentialsChecklistItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  textAlign: 'center',
  transition: 'border-color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 28%, ${themeVars.line})`,
      background: themeVars.bgSoft,
    },
  },
});

export const essentialsChecklistThumb = style({
  width: '3rem',
  height: '3rem',
  borderRadius: themeVars.radius2,
  background: themeVars.lineSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
});

export const essentialsChecklistName = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const essentialsChecklistStatus = style({
  fontSize: '0.72rem',
  color: themeVars.accentInk,
  fontWeight: 500,
});

export const essentialsTagBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 6px',
  borderRadius: '999px',
  fontSize: '0.68rem',
  fontWeight: 600,
  lineHeight: 1.5,
});

export const essentialsTagBadgeCommon = style([
  essentialsTagBadge,
  {
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
]);

export const essentialsTagBadgeEssential = style([
  essentialsTagBadge,
  {
    background: themeVars.warningSoft,
    color: themeVars.warningText,
  },
]);

export const essentialsTagBadgeRead = style([
  essentialsTagBadge,
  {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
]);

/* ---------- supplys Page ---------- */

export const supplyKpiStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
    },
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

export const supplyKpiTile = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space4,
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
});

export const supplyKpiIcon = styleVariants({
  blue: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.6rem',
    height: '2.6rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  red: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.6rem',
    height: '2.6rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
  orange: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.6rem',
    height: '2.6rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  green: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.6rem',
    height: '2.6rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  violet: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.6rem',
    height: '2.6rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.violetSoft,
    color: themeVars.violet,
  },
});

export const supplyKpiMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const supplyKpiLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 500,
});

export const supplyKpiValue = style({
  color: themeVars.ink,
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
});

export const supplyKpiNote = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
});

export const supplyForecastScroll = style({
  display: 'flex',
  gap: themeVars.space4,
  overflowX: 'auto',
  padding: `0 ${themeVars.space5} ${themeVars.space4}`,
  scrollSnapType: 'x mandatory',
  '@media': {
    '(max-width: 48em)': {
      padding: `0 ${themeVars.space3} ${themeVars.space3}`,
    },
  },
});

export const supplyForecastCard = style({
  flex: '0 0 16rem',
  scrollSnapAlign: 'start',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  minWidth: 0,
  '@media': {
    '(max-width: 48em)': {
      flex: '0 0 14rem',
    },
  },
});

export const supplyForecastHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const supplyForecastThumb = style({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: themeVars.radius2,
  background: themeVars.lineSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const supplyForecastName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const supplyForecastHint = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  lineHeight: 1.4,
});

export const supplyForecastMeta = style({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const supplyProgressBar = style({
  height: '6px',
  borderRadius: '999px',
  background: themeVars.lineSoft,
  overflow: 'hidden',
});

export const supplyProgressFill = style({
  height: '100%',
  borderRadius: '999px',
  transition: 'width 300ms ease',
});

export const supplyTwoCol = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const supplyTable = style({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const supplyTableHead = style({
  fontSize: '0.72rem',
  fontWeight: 600,
  color: themeVars.muted,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
});

export const supplyTableRow = style({
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

export const supplyTableCell = style({
  padding: `${themeVars.space3} ${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.88rem',
  verticalAlign: 'middle',
});

export const supplyStatusBadge = styleVariants({
  normal: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.successSoft,
    color: themeVars.success,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  sufficient: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  low: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.warningSoft,
    color: themeVars.warning,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  below: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    background: themeVars.dangerSoft,
    color: themeVars.danger,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
});

export const supplyViewAllLink = style({
  display: 'block',
  textAlign: 'center',
  padding: themeVars.space3,
  fontSize: '0.82rem',
  fontWeight: 500,
  color: themeVars.accent,
  textDecoration: 'none',
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  width: '100%',
  transition: 'color 160ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.accentHover,
    },
  },
});

export const supplyChartPlaceholder = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
});

export const supplyChartGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

// ----- Tag management page -----

export const tagsKpiGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 64em)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    '(max-width: 30em)': { gridTemplateColumns: '1fr' },
  },
});

export const tagsKpiCard = style([
  card,
  {
    padding: themeVars.space4,
    display: 'flex',
    flexDirection: 'column',
    gap: themeVars.space1,
  },
]);

export const tagsKpiLabel = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  letterSpacing: '0.02em',
});

export const tagsKpiValue = style({
  fontSize: '1.75rem',
  fontWeight: 600,
  fontFamily: themeVars.fontSerif,
  color: themeVars.ink,
  lineHeight: 1.1,
  fontFeatureSettings: '"tnum"',
});

export const tagsKpiValueAccent = style([
  tagsKpiValue,
  { color: themeVars.accentInk },
]);

export const tagsKpiValueWarn = style([
  tagsKpiValue,
  { color: themeVars.warningText },
]);

export const tagsKpiHint = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const tagsLayout = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 22rem',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': { gridTemplateColumns: '1fr' },
  },
});

export const tagsListCard = style([
  card,
  {
    padding: themeVars.space4,
    minWidth: 0,
  },
]);

export const tagsListToolbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  marginBottom: themeVars.space4,
  '@media': {
    '(max-width: 40em)': { flexDirection: 'column', alignItems: 'stretch' },
  },
});

export const tagsSearchWrap = style({
  position: 'relative',
  flex: 1,
});

export const tagsSearchIcon = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const tagsSearchInput = style({
  width: '100%',
  height: '2.25rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  paddingLeft: '2.25rem',
  paddingRight: themeVars.space3,
  background: themeVars.bgSoft,
  color: themeVars.text,
  fontSize: '0.85rem',
  selectors: {
    '&:focus': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: 0,
      borderColor: themeVars.accent,
    },
  },
});

export const tagsTableWrap = style({
  overflowX: 'auto',
  margin: `0 -${themeVars.space4}`,
});

export const tagsTable = style({
  width: '100%',
  borderCollapse: 'collapse',
});

export const tagsTableHead = style({
  textAlign: 'left',
  color: themeVars.muted,
  fontWeight: 500,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const tagsTableRow = style({
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:hover': { background: themeVars.bgSoft },
    '&:last-child': { borderBottom: 'none' },
  },
});

export const tagsTableCell = style({
  padding: `${themeVars.space3}`,
  fontSize: '0.85rem',
  color: themeVars.text,
  verticalAlign: 'middle',
});

export const tagsTableNameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const tagsColorSwatch = style({
  width: '0.875rem',
  height: '0.875rem',
  borderRadius: '50%',
  flexShrink: 0,
  border: '1px solid rgba(0,0,0,0.06)',
  background: themeVars.muted,
});

export const tagsName = style({
  color: themeVars.ink,
  fontWeight: 500,
});

export const tagsUsageBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: `2px ${themeVars.space2}`,
  borderRadius: '999px',
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontFeatureSettings: '"tnum"',
});

export const tagsUsageBadgeActive = style([
  tagsUsageBadge,
  {
    background: themeVars.accentSoft,
    borderColor: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
]);

export const tagsRowActions = style({
  display: 'flex',
  gap: themeVars.space1,
  justifyContent: 'flex-end',
});

export const tagsEmptyState = style({
  padding: themeVars.space6,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.9rem',
});

export const tagsRail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const tagsRailCard = style([
  card,
  {
    padding: themeVars.space4,
  },
]);

export const tagsRailTitle = style({
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: themeVars.muted,
  fontWeight: 500,
  marginBottom: themeVars.space3,
});

export const tagsRailItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px dashed ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': { borderBottom: 'none' },
  },
});

export const tagsRailItemName = style({
  fontSize: '0.85rem',
  color: themeVars.text,
  fontWeight: 500,
});

export const tagsRailItemMeta = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  marginLeft: 'auto',
  fontFeatureSettings: '"tnum"',
});

export const tagsMiniKpi = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: `${themeVars.space2} 0`,
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${themeVars.lineSoft}`,
    },
  },
});

export const tagsMiniKpiLabel = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const tagsMiniKpiValue = style({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: themeVars.ink,
  fontFeatureSettings: '"tnum"',
});

export const tagsColorPalette = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
});

export const tagsPaletteSwatch = style({
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  cursor: 'pointer',
  transition: 'transform 120ms ease, box-shadow 120ms ease',
  selectors: {
    '&:hover': { transform: 'scale(1.06)' },
    '&[data-selected="true"]': {
      boxShadow: `0 0 0 2px ${themeVars.accent}`,
    },
  },
});

export const tagsHexInput = style({
  width: '8rem',
  height: '2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  padding: `0 ${themeVars.space2}`,
  background: themeVars.bgSoft,
  color: themeVars.text,
  fontFamily: themeVars.fontMono,
  fontSize: '0.78rem',
  selectors: {
    '&:focus': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: 0,
      borderColor: themeVars.accent,
    },
  },
});

export const tagsDialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  marginTop: themeVars.space4,
});

export const tagsDeleteWarn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  background: themeVars.warningSoft,
  border: `1px solid ${themeVars.warning}`,
  borderRadius: themeVars.radius2,
  color: themeVars.warningText,
  fontSize: '0.85rem',
});

export const supplyChartMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: '12rem',
});

export const supplyChartAmount = style({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
});

export const supplyChartChange = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.82rem',
  fontWeight: 600,
});

export const supplyChartChangeNeg = style([
  supplyChartChange,
  { color: themeVars.success },
]);

export const supplyChartChangePos = style([
  supplyChartChange,
  { color: themeVars.danger },
]);

/* ---------- Supplies Detail Page ---------- */

export const supplyDetailHero = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  padding: themeVars.space4,
  '@media': {
    '(max-width: 48em)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
});

export const supplyDetailHeroMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  minWidth: 0,
  flex: 1,
});

export const supplyDetailHeroTitle = style({
  fontSize: '1.4rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  margin: 0,
});

export const supplyDetailHeroMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  fontSize: '0.82rem',
  color: themeVars.muted,
});

export const supplyDetailTypeBadge = styleVariants({
  typeA: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.74rem',
    fontWeight: 600,
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  typeB: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.74rem',
    fontWeight: 600,
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
});

export const supplyDetailActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexShrink: 0,
});

export const supplyActionRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
  gap: themeVars.space3,
});

export const supplyActionBigBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  fontSize: '0.92rem',
  fontWeight: 600,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.ink,
  cursor: 'pointer',
  transition: 'background 120ms ease, transform 120ms ease',
  ':hover': {
    background: themeVars.bgSoft,
  },
  ':active': {
    transform: 'translateY(1px)',
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const supplyActionPrimary = style([
  supplyActionBigBtn,
  {
    background: themeVars.accent,
    color: themeVars.accentInk,
    borderColor: themeVars.accent,
    ':hover': {
      background: themeVars.accentHover,
    },
  },
]);

export const supplyActionDanger = style([
  supplyActionBigBtn,
  {
    background: themeVars.dangerSoft,
    color: themeVars.danger,
    borderColor: themeVars.dangerSoft,
    ':hover': {
      background: themeVars.danger,
      color: themeVars.accentInk,
    },
  },
]);

export const supplyActionSuccess = style([
  supplyActionBigBtn,
  {
    background: themeVars.successSoft,
    color: themeVars.success,
    borderColor: themeVars.successSoft,
    ':hover': {
      background: themeVars.success,
      color: themeVars.accentInk,
    },
  },
]);

export const supplyStockHero = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space5} ${themeVars.space4}`,
});

export const supplyStockHeroValue = style({
  fontSize: '3.6rem',
  fontWeight: 700,
  lineHeight: 1,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
});

export const supplyStockHeroUnit = style({
  fontSize: '1rem',
  color: themeVars.muted,
});

export const supplyStockHeroSub = style({
  textAlign: 'center',
  fontSize: '0.82rem',
  color: themeVars.muted,
  marginTop: `calc(-1 * ${themeVars.space3})`,
  paddingBottom: themeVars.space3,
});

export const supplyCalibrationPill = styleVariants({
  almostEmpty: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
  plentyLeft: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    background: themeVars.successSoft,
    color: themeVars.success,
  },
});

export const supplyTimeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const supplyTimelineItem = style({
  display: 'grid',
  gridTemplateColumns: '0.6rem 1fr',
  gap: themeVars.space3,
  alignItems: 'flex-start',
  position: 'relative',
});

export const supplyTimelineDot = style({
  width: '0.6rem',
  height: '0.6rem',
  borderRadius: '999px',
  background: themeVars.accent,
  marginTop: '0.35rem',
  flexShrink: 0,
});

export const supplyTimelineBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const supplyTimelineMeta = style({
  fontSize: '0.74rem',
  color: themeVars.muted,
});

export const supplyStatGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
});

export const supplyStatCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
});

export const supplyStatLabel = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  fontWeight: 500,
});

export const supplyStatValue = style({
  fontSize: '1.1rem',
  fontWeight: 700,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
});

export const supplyStatHint = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const supplyLifeCountdown = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space4,
});

export const supplyLifeCountdownValue = style({
  fontSize: '2.4rem',
  fontWeight: 700,
  color: themeVars.ink,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

export const supplyLifeCountdownLabel = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const supplyDetailEmpty = style({
  textAlign: 'center',
  padding: `${themeVars.space5} ${themeVars.space4}`,
  color: themeVars.muted,
  fontSize: '0.86rem',
});

export const supplyBackLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.78rem',
  color: themeVars.muted,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  ':hover': {
    color: themeVars.ink,
  },
});

export const supplyForecastActions = style({
  display: 'flex',
  gap: themeVars.space2,
  marginTop: themeVars.space2,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

/* ---------- Virtual Assets Page ---------- */

export const vaKpiStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: themeVars.space4,
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
    },
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

export const vaKpiTile = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: themeVars.space4,
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadowSoft,
  minWidth: 0,
  '@media': {
    '(max-width: 40em)': {
      alignItems: 'flex-start',
      gap: themeVars.space2,
      padding: themeVars.space3,
    },
  },
});

export const vaKpiIcon = styleVariants({
  blue: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.5rem',
    height: '2.5rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
  teal: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.5rem',
    height: '2.5rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
  green: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.5rem',
    height: '2.5rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  orange: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.5rem',
    height: '2.5rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  red: {
    flex: '0 0 auto',
    display: 'inline-grid',
    width: '2.5rem',
    height: '2.5rem',
    placeItems: 'center',
    borderRadius: themeVars.radius2,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
});

export const vaKpiMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const vaKpiLabel = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
  fontWeight: 500,
});

export const vaKpiValue = style({
  color: themeVars.ink,
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  fontVariantNumeric: 'tabular-nums',
});

export const vaKpiNote = style({
  color: themeVars.muted,
  fontSize: '0.72rem',
  '@media': {
    '(max-width: 40em)': {
      display: 'none',
    },
  },
});

export const vaFilterRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 48em)': {
      gap: themeVars.space2,
    },
    '(max-width: 40em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const vaFilterRowLeft = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flex: '1 1 auto',
  minWidth: 0,
  flexWrap: 'wrap',
  '@media': {
    '(max-width: 40em)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
});

export const vaFilterRowRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexShrink: 0,
  '@media': {
    '(max-width: 40em)': {
      justifyContent: 'space-between',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
  },
});

export const vaFilterSelect = style({
  padding: '5px 8px',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  fontSize: '0.82rem',
  color: themeVars.text,
  minWidth: '7rem',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 22%, ${themeVars.line})`,
    },
    '&:focus': {
      borderColor: themeVars.accent,
    },
  },
});

export const vaViewToggle = style({
  display: 'inline-flex',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  overflow: 'hidden',
});

export const vaViewToggleBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  padding: `${themeVars.space1} ${themeVars.space3}`,
  border: 0,
  background: 'transparent',
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.text,
    },
    '&[data-active="true"]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
  },
});

export const vaItemRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 1.2fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  textDecoration: 'none',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      textDecoration: 'none',
    },
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const vaItemInfo = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
});

export const vaItemThumb = style({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: themeVars.radius2,
  background: themeVars.lineSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
  flex: '0 0 auto',
  overflow: 'hidden',
});

export const vaItemName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const vaItemCategory = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const vaPlatformBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
  background: themeVars.bgSoft,
  color: themeVars.text,
  border: `1px solid ${themeVars.line}`,
});

export const vaPlatformBadgeSteam = style([
  vaPlatformBadge,
  {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
]);

export const vaPlatformBadgeAppStore = style([
  vaPlatformBadge,
  {
    background: themeVars.lineSoft,
    color: themeVars.text,
  },
]);

export const vaPlatformBadgeKindle = style([
  vaPlatformBadge,
  {
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
]);

export const vaDlcBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 6px',
  borderRadius: '999px',
  fontSize: '0.68rem',
  fontWeight: 600,
  background: themeVars.warningSoft,
  color: themeVars.warningText,
});

export const vaDlcBadgeMulti = style([
  vaDlcBadge,
  {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
]);

export const vaTableHead = style({
  fontSize: '0.72rem',
  fontWeight: 600,
  color: themeVars.muted,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: `${themeVars.space2} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
});

export const vaTableCell = style({
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.88rem',
  verticalAlign: 'middle',
});

export const vaTable = style({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const vaTableRow = style({
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

export const vaBottomCards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space5,
  '@media': {
    '(max-width: 72em)': {
      gridTemplateColumns: '1fr',
    },
    '(max-width: 40em)': {
      gap: themeVars.space3,
    },
  },
});

export const vaBottomCard = style({
  padding: themeVars.space5,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  '@media': {
    '(max-width: 40em)': {
      padding: themeVars.space4,
    },
  },
});

export const vaBottomCardTitle = style({
  margin: 0,
  fontSize: '0.88rem',
  fontWeight: 700,
  color: themeVars.muted,
  letterSpacing: '-0.01em',
  marginBottom: themeVars.space4,
});

export const vaBottomStatLabel = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontWeight: 500,
});

export const vaBottomStatValue = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
});

export const vaBottomStatNote = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const vaMobileCard = style({
  padding: themeVars.space4,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const vaMobileCardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const vaMobileCardMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: '1 1 auto',
});

export const vaMobileCardPrice = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
});

export const vaMobileCardDate = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const vaMobileCardBadges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space1,
});

// ── Abnormal Asset Management Page ───────────────────────────────────────────

export const abnormalPageHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: themeVars.space2,
  gap: themeVars.space3,
  flexWrap: 'wrap',
});

export const abnormalTwoCol = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 320px',
  gap: themeVars.space5,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const abnormalAlertBanner = style({
  background: 'rgba(255, 100, 130, 0.10)',
  border: '1px solid rgba(255, 100, 130, 0.35)',
  borderRadius: '8px',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  fontSize: '0.875rem',
  color: '#c0392b',
});

export const abnormalBottomGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: themeVars.space4,
  alignItems: 'start',
});

export const abnormalQuickActions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const abnormalQuickBtn = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: '6px',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  cursor: 'pointer',
  fontSize: '0.82rem',
  color: themeVars.ink,
  transition: 'background 0.1s',
  ':hover': {
    background: themeVars.bgSoft,
  },
});

export const abnormalTypeBadgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
});

export const abnormalTypeBadge = styleVariants({
  lost: [abnormalTypeBadgeBase, { background: themeVars.infoSoft, color: themeVars.info }],
  stolen: [abnormalTypeBadgeBase, { background: themeVars.warningSoft, color: themeVars.warningText }],
  unreturned: [abnormalTypeBadgeBase, { background: themeVars.violetSoft, color: themeVars.violet }],
  damaged: [abnormalTypeBadgeBase, { background: themeVars.dangerSoft, color: themeVars.danger }],
});

export const abnormalProgressBadgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
});

export const abnormalProgressBadge = styleVariants({
  reporting: [abnormalProgressBadgeBase, { background: themeVars.infoSoft, color: themeVars.info }],
  searching: [abnormalProgressBadgeBase, { background: 'rgba(56,189,248,0.15)', color: '#0284c7' }],
  pending_compensation: [abnormalProgressBadgeBase, { background: themeVars.warningSoft, color: themeVars.warningText }],
  compensated: [abnormalProgressBadgeBase, { background: themeVars.successSoft, color: themeVars.success }],
  scrapped: [abnormalProgressBadgeBase, { background: themeVars.bgSoft, color: themeVars.muted }],
  closed: [abnormalProgressBadgeBase, { background: themeVars.successSoft, color: themeVars.success }],
  pending: [abnormalProgressBadgeBase, { background: themeVars.bgSoft, color: themeVars.muted }],
});

export const abnormalSidebarCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  ':last-child': {
    borderBottom: 'none',
  },
});

export const abnormalSidebarIcon = style({
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: themeVars.bgSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: themeVars.muted,
  fontSize: '1rem',
  fontWeight: 700,
});

export const abnormalSidebarInfo = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const abnormalSidebarName = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const abnormalSidebarMeta = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const abnormalPagination = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  padding: `${themeVars.space3} 0`,
});

export const abnormalPageBtn = style({
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  cursor: 'pointer',
  fontSize: '0.78rem',
  color: themeVars.ink,
  ':hover': { background: themeVars.bgSoft },
  selectors: {
    '&[disabled]': { opacity: 0.4, cursor: 'default' },
    '&.active': { background: themeVars.accent, color: themeVars.onAccent, borderColor: themeVars.accent },
  },
});

export const abnormalMetricStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: themeVars.space3,
});

export const abnormalMetricCard = style({
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const abnormalMetricLabel = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const abnormalMetricValue = style({
  fontSize: '1.6rem',
  fontWeight: 700,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
});

export const abnormalMetricSub = style({
  fontSize: '0.7rem',
  color: themeVars.muted,
});

export const abnormalChartCard = style({
  background: themeVars.panel,
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  padding: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const abnormalChartTitle = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
});

export const abnormalValuationRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  ':last-child': { borderBottom: 'none' },
});

export const abnormalThumb = style({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  objectFit: 'cover',
  flexShrink: 0,
  background: themeVars.bgSoft,
});

export const abnormalThumbPlaceholder = style({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.8rem',
  flexShrink: 0,
});

export const abnormalItemCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const abnormalItemInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  minWidth: 0,
});

export const abnormalItemName = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const abnormalItemSn = style({
  fontSize: '0.7rem',
  color: themeVars.muted,
});

export const abnormalActionBtn = style({
  padding: '3px 8px',
  borderRadius: '5px',
  border: `1px solid ${themeVars.line}`,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.72rem',
  color: themeVars.muted,
  transition: 'all 0.1s',
  ':hover': { background: themeVars.bgSoft, color: themeVars.ink },
});

export const abnormalMoreBtn = style({
  padding: '3px 6px',
  borderRadius: '5px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: themeVars.muted,
  ':hover': { background: themeVars.bgSoft },
});

export const abnormalLegendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const abnormalLegendDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  flexShrink: 0,
});

export const abnormalTrendSvg = style({
  width: '100%',
  height: '120px',
});

export const abnormalFilterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
  padding: `${themeVars.space2} 0`,
});

export const abnormalFilterSelect = style({
  padding: '5px 10px',
  borderRadius: '6px',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.ink,
  fontSize: '0.78rem',
  cursor: 'pointer',
});

/* ---------- TreeSelectField (Base UI Popover) ---------- */

export const treeSelectPopup = style({
  zIndex: 80,
  maxHeight: '18rem',
  minWidth: '14rem',
  overflowY: 'auto',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  padding: themeVars.space1,
});

export const treeSelectNode = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  borderRadius: themeVars.radius1,
  cursor: 'pointer',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  fontSize: '0.875rem',
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.accentSoft },
    '&[data-selected]': {
      background: themeVars.accentSoft,
      fontWeight: 600,
      color: themeVars.accentInk,
    },
  },
});

export const treeSelectChevron = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  color: themeVars.muted,
  transition: 'transform 150ms ease',
  selectors: {
    '&[data-expanded]': { transform: 'rotate(90deg)' },
    '&[data-empty]': { visibility: 'hidden' },
  },
});

export const treeSelectNodeName = style({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/* ---------- DatePickerField (Base UI Popover) ---------- */

export const datePickerPopup = style({
  zIndex: 80,
  minWidth: '17rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  boxShadow: themeVars.shadow,
  padding: themeVars.space3,
  userSelect: 'none',
});

export const datePickerHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: themeVars.space2,
});

export const datePickerTitle = style({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: themeVars.ink,
});

export const datePickerNavBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  border: 'none',
  borderRadius: themeVars.radius1,
  background: 'transparent',
  cursor: 'pointer',
  color: themeVars.text,
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.accentSoft },
  },
});

export const datePickerWeekdays = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '1px',
  marginBottom: themeVars.space1,
});

export const datePickerWeekday = style({
  textAlign: 'center',
  fontSize: '0.68rem',
  fontWeight: 500,
  color: themeVars.muted,
  padding: `${themeVars.space1} 0`,
});

export const datePickerGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '1px',
});

export const datePickerDay = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  margin: '0 auto',
  border: 'none',
  borderRadius: themeVars.radius1,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.8rem',
  color: themeVars.text,
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.accentSoft },
    '&[data-outside]': { color: themeVars.muted, opacity: 0.4 },
    '&[data-today]': { fontWeight: 700, color: themeVars.accentInk },
    '&[data-selected]': {
      background: themeVars.accent,
      color: themeVars.onAccent,
      fontWeight: 600,
    },
    '&[data-selected]:hover': {
      background: themeVars.accentHover,
    },
  },
});

/* ────────────────────────────────────────────────────────
   shadcn Select → vanilla-extract migration
   ──────────────────────────────────────────────────────── */

export const selTrigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.375rem',
  width: 'fit-content',
  height: '2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.text,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  padding: '0 0.5rem 0 0.625rem',
  outline: 'none',
  userSelect: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  cursor: 'pointer',
  selectors: {
    '&[data-size="sm"]': {
      height: '1.75rem',
      fontSize: '0.8rem',
    },
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    '&[data-popup-open]': {
      borderColor: themeVars.accent,
    },
  },
});

export const selTriggerIcon = style({
  pointerEvents: 'none',
  color: themeVars.muted,
  display: 'inline-flex',
  flexShrink: 0,
  width: '1rem',
  height: '1rem',
});

export const selValue = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  gap: '0.375rem',
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const selPositioner = style({
  zIndex: 50,
  isolation: 'isolate',
});

const selFadeIn = keyframes({
  from: { opacity: 0, transform: 'scale(0.95)' },
  to: { opacity: 1, transform: 'scale(1)' },
});

const selFadeOut = keyframes({
  from: { opacity: 1, transform: 'scale(1)' },
  to: { opacity: 0, transform: 'scale(0.95)' },
});

export const selPopup = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 50,
  maxHeight: 'var(--available-height)',
  width: 'var(--anchor-width)',
  minWidth: '9rem',
  overflowX: 'hidden',
  overflowY: 'auto',
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  boxShadow: `${themeVars.shadow}, 0 0 0 1px ${themeVars.line}`,
  padding: themeVars.space1,
  transformOrigin: 'var(--transform-origin)',
  animation: `${selFadeIn} 150ms ease-out`,
  selectors: {
    '&[data-ending-style]': {
      animation: `${selFadeOut} 100ms ease-in`,
    },
  },
});

export const selGroup = style({
  padding: themeVars.space1,
});

export const selLabel = style({
  padding: '0.25rem 0.375rem',
  fontSize: '0.75rem',
  color: themeVars.muted,
});

export const selItem = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  borderRadius: themeVars.radius1,
  padding: '0.25rem 2rem 0.25rem 0.375rem',
  fontSize: '0.875rem',
  cursor: 'default',
  userSelect: 'none',
  outline: 'none',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&[data-highlighted]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
    '&[data-disabled]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
  },
});

export const selItemIndicator = style({
  position: 'absolute',
  right: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  pointerEvents: 'none',
  color: themeVars.accentInk,
});

export const selItemText = style({
  display: 'flex',
  flex: 1,
  flexShrink: 0,
  alignItems: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const selSeparator = style({
  pointerEvents: 'none',
  margin: `${themeVars.space1} -${themeVars.space1}`,
  height: '1px',
  background: themeVars.line,
});

export const selScrollArrow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '0.25rem 0',
  cursor: 'default',
  background: themeVars.panel,
  color: themeVars.muted,
  zIndex: 10,
});
