import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '2.75rem',
  boxSizing: 'border-box',
  padding: `${themeVars.space2} 0`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': { borderTop: 'none' },
  },
});

// Compact variant used by the header bell popover.
export const rowCompact = style({
  minHeight: '2.5rem',
  padding: `${themeVars.space2} 0`,
});

export const rowIcon = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.25rem',
  color: themeVars.muted,
  selectors: {
    [`${row}:hover &`]: { color: themeVars.accentInk },
  },
});

export const rowMain = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const rowTitle = style({
  fontSize: '0.85rem',
  fontWeight: 600,
  color: themeVars.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const rowMeta = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// Fixed width keeps every row's trailing slot aligned, so pending rows (two
// icon buttons) and processed rows (a badge) share one right edge.
export const rowActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space1,
  flex: '0 0 auto',
  width: '3.5rem',
});

export const done = style({
  opacity: 0.55,
});

export const bellWrap = style({
  position: 'relative',
  display: 'inline-flex',
});

export const bellDot = style({
  position: 'absolute',
  top: 2,
  right: 2,
  minWidth: 15,
  height: 15,
  padding: '0 4px',
  borderRadius: 999,
  background: themeVars.danger,
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: '15px',
  textAlign: 'center',
  pointerEvents: 'none',
});

// The popover surface is deliberately tight: rows run edge-to-edge inside the
// popover's own padding, so head and body share one left/right rule.
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  margin: `calc(-1 * ${themeVars.space3})`,
  width: 'min(23rem, calc(100vw - 2.5rem))',
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4} 0`,
});

export const panelTitle = style({
  fontSize: '0.8rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

export const panelLink = style({
  flex: '0 0 auto',
  fontSize: '0.78rem',
  fontWeight: 500,
  color: themeVars.muted,
  selectors: {
    '&:hover': {
      color: themeVars.accent,
    },
  },
});

export const panelBody = style({
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '19rem',
  overflowY: 'auto',
  padding: `0 ${themeVars.space4}`,
});

export const panelFoot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: `0 ${themeVars.space4}`,
  padding: `${themeVars.space2} 0`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.78rem',
  fontWeight: 500,
  color: themeVars.accent,
});

export const panelCenter = style({
  display: 'grid',
  placeItems: 'center',
  minHeight: '5rem',
});

export const panelEmpty = style({
  padding: `${themeVars.space5} ${themeVars.space4}`,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.85rem',
  lineHeight: 1.6,
});

export const empty = style({
  padding: themeVars.space3,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.85rem',
});

// Applied as a className on the Card component; reminders rows sit flush
// inside with their own hairlines.
export const pageCard = style({
  selectors: {
    '&[data-slot="card"]': {
      padding: `${themeVars.space2} ${themeVars.space4}`,
    },
  },
});

export const pageCenter = style({
  display: 'grid',
  placeItems: 'center',
  minHeight: '6rem',
});
