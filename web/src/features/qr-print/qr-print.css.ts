import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/* ---------- Page ---------- */

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
});

/* ---------- Selection card ---------- */

export const cardMeta = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const toolbarRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  alignItems: 'center',
});

export const searchInput = style({
  flex: '1 1 14rem',
  minWidth: 0,
  width: 'auto',
});

export const filterSelectTrigger = style({
  width: '9.5rem',
});

export const listBlock = style({
  display: 'flex',
  flexDirection: 'column',
});

export const locationList = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
});

export const locationRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  cursor: 'pointer',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const locationRowSelected = style({
  background: `color-mix(in srgb, ${themeVars.accent} 6%, ${themeVars.panel})`,
  selectors: {
    '&:hover': {
      background: `color-mix(in srgb, ${themeVars.accent} 6%, ${themeVars.panel})`,
    },
  },
});

export const rowMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
  minWidth: 0,
});

export const rowName = style({
  margin: 0,
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rowPath = style({
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rowCode = style({
  flex: '0 1 auto',
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardFoot = style({
  display: 'flex',
  justifyContent: 'flex-end',
  paddingTop: themeVars.space3,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

/* ---------- Label sheet preview ---------- */

export const sheetSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const sheetHead = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const sheetTitle = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const printSheet = style({
  overflowX: 'auto',
  padding: themeVars.space4,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  // Sticker paper is physically white, in both color schemes.
  background: '#ffffff',
  boxShadow: themeVars.shadowSoft,
});
