import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': { borderTop: 'none' },
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

export const rowActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  flexShrink: 0,
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

export const panel = style({
  width: 'min(22rem, calc(100vw - 2rem))',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const panelHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const panelTitle = style({
  fontSize: '0.85rem',
  fontWeight: 700,
  color: themeVars.text,
});

export const panelBody = style({
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '22rem',
  overflowY: 'auto',
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
      padding: `${themeVars.space3} ${themeVars.space4}`,
    },
  },
});
