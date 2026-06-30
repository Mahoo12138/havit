import { globalStyle, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  width: '100%',
  minWidth: 0,
  paddingBottom: '5rem',
});

/* Stats scroll */
export const statsScroll = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
  minWidth: 0,
  '@media': {
    '(max-width: 22em)': {
      gap: themeVars.space2,
    },
  },
});

export const statTile = style({
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: '1.75rem minmax(0, 1fr)',
  gridTemplateRows: 'auto auto',
  columnGap: themeVars.space2,
  rowGap: '0.05rem',
  alignItems: 'center',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  '@media': {
    '(max-width: 22em)': {
      padding: themeVars.space2,
    },
  },
});

export const statIcon = style({
  width: '1.75rem',
  height: '1.75rem',
  gridRow: '1 / 3',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
});

export const statIconTone = styleVariants({
  teal: {
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
  },
  green: {
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  orange: {
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  red: {
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
});

export const statValue = style({
  fontSize: '1.08rem',
  lineHeight: 1.1,
  fontWeight: 760,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
});

export const statLabel = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/* Filter bar */
export const filterBar = style({
  display: 'flex',
  gap: themeVars.space2,
  alignItems: 'center',
  paddingTop: themeVars.space1,
  minWidth: 0,
});

export const searchWrap = style({
  flex: 1,
  minWidth: 0,
  position: 'relative',
});

export const searchIcon = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '100%',
  height: '2.25rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.85rem',
  padding: `0 ${themeVars.space3} 0 2.25rem`,
  outline: 'none',
  selectors: {
    '&::placeholder': { color: themeVars.muted },
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

globalStyle(`${searchWrap} [data-slot="input"]`, {
  background: themeVars.bgSoft,
  paddingLeft: '2.25rem',
});

export const filterBtn = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const filterPanel = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  minWidth: 0,
  '@media': {
    '(max-width: 24em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const filterSelectTrigger = style({
  width: '100%',
});

/* Item count */
export const itemCount = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontWeight: 500,
});

globalStyle(`${itemCount} strong`, {
  color: themeVars.ink,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
});

/* Card list */
export const cardList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 160ms ease, border-color 160ms ease, transform 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.bgSoft, borderColor: themeVars.line, textDecoration: 'none' },
    '&:active': { transform: 'translateY(1px)' },
  },
});

export const cardHeader = style({
  display: 'grid',
  gridTemplateColumns: '2.25rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  '@media': {
    '(max-width: 22em)': {
      gap: themeVars.space2,
    },
  },
});

export const cardThumb = style({
  width: '2.25rem',
  height: '2.25rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: `linear-gradient(145deg, ${themeVars.bgSoft}, ${themeVars.lineSoft})`,
  color: themeVars.muted,
  border: `1px solid ${themeVars.lineSoft}`,
});

export const cardMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const cardName = style({
  fontSize: '0.9rem',
  fontWeight: 650,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardSub = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardPrice = style({
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  maxWidth: '6.5rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'right',
  '@media': {
    '(max-width: 22em)': {
      maxWidth: '5.25rem',
      fontSize: '0.76rem',
    },
  },
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
  paddingTop: themeVars.space1,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
  flexWrap: 'wrap',
});

export const cardLocation = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.72rem',
  color: themeVars.muted,
  minWidth: 0,
  flex: '1 1 8rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const emptyState = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: `${themeVars.space6} 0`,
  fontSize: '0.88rem',
});

export const warrantyBadge = styleVariants({
  active: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 650,
    background: themeVars.successSoft,
    color: themeVars.success,
  },
  expiring: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 650,
    background: themeVars.warningSoft,
    color: themeVars.warning,
  },
  expired: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 650,
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
  none: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 650,
    background: themeVars.lineSoft,
    color: themeVars.muted,
  },
});

/* FAB */
export const fab = style({
  position: 'fixed',
  bottom: '5rem',
  right: themeVars.space4,
  width: '3rem',
  height: '3rem',
  borderRadius: '999px',
  display: 'grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: '#ffffff',
  border: 0,
  boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
  cursor: 'pointer',
  zIndex: 15,
  transition: 'transform 160ms ease',
  selectors: {
    '&:hover': { transform: 'scale(1.06)' },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

/* Create overlay */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  background: themeVars.bg,
  minWidth: 0,
});

export const overlayHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.line}`,
  paddingTop: 'max(1rem, env(safe-area-inset-top))',
});

export const overlayTitle = style({
  fontSize: '1.05rem',
  fontWeight: 700,
  margin: 0,
  color: themeVars.ink,
});

export const overlayClose = style({
  width: '2rem',
  height: '2rem',
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  borderRadius: themeVars.radius2,
  color: themeVars.muted,
  cursor: 'pointer',
  selectors: { '&:hover': { background: themeVars.lineSoft, color: themeVars.ink } },
});

export const overlayBody = style({
  flex: 1,
  overflow: 'auto',
  padding: `${themeVars.space4} ${themeVars.space4} calc(${themeVars.space4} + env(safe-area-inset-bottom))`,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const overlayActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space3,
  paddingTop: themeVars.space4,
  borderTop: `1px solid ${themeVars.line}`,
  flexWrap: 'wrap',
});

globalStyle(`${overlayActions} > *`, {
  flex: '1 1 8rem',
});
