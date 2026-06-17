import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  paddingBottom: '5rem',
});

/* Stats scroll */
export const statsScroll = style({
  display: 'flex',
  gap: themeVars.space3,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});

export const statTile = style({
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  width: '7.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space1,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

export const statIcon = style({
  width: '1.75rem',
  height: '1.75rem',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
});

export const statValue = style({
  fontSize: '1.1rem',
  fontWeight: 700,
  color: themeVars.ink,
});

export const statLabel = style({
  fontSize: '0.68rem',
  color: themeVars.muted,
});

/* Filter bar */
export const filterBar = style({
  display: 'flex',
  gap: themeVars.space2,
  alignItems: 'center',
});

export const searchWrap = style({
  flex: 1,
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

export const filterBtn = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.muted,
  cursor: 'pointer',
  flex: '0 0 auto',
  selectors: { '&:hover': { color: themeVars.ink, background: themeVars.bgSoft } },
});

export const filterPanel = style({
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

/* Item count */
export const itemCount = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontWeight: 500,
});

/* Card list */
export const cardList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 120ms ease',
  selectors: {
    '&:hover': { background: themeVars.bgSoft, textDecoration: 'none' },
  },
});

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const cardThumb = style({
  width: '2.25rem',
  height: '2.25rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const cardMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const cardName = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardSub = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const cardPrice = style({
  flex: '0 0 auto',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const cardLocation = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const emptyState = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: `${themeVars.space6} 0`,
  fontSize: '0.88rem',
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
});

export const overlayHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.line}`,
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
  padding: themeVars.space4,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

export const overlayActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space3,
  paddingTop: themeVars.space4,
  borderTop: `1px solid ${themeVars.line}`,
});
