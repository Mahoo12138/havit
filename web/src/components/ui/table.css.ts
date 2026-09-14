import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  position: 'relative',
  width: '100%',
  overflowX: 'auto',
});

// Table floor width so sparse tables still scroll instead of crushing their
// columns; pages that need a wider floor override it via `--table-min`.
export const table = style({
  width: '100%',
  minWidth: 'var(--table-min, 40rem)',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

export const body = style({});

globalStyle(`${body} tr:last-child th, ${body} tr:last-child td`, {
  borderBottom: 'none',
});

export const footer = style({});

globalStyle(`${footer} th, ${footer} td`, {
  borderTop: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
  fontWeight: 600,
});

export const row = style({
  transition: 'background-color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

export const head = style({
  padding: `${themeVars.space2} ${themeVars.space4}`,
  textAlign: 'left',
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontSize: '0.76rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

export const cell = style({
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: '0.92rem',
  verticalAlign: 'middle',
  textAlign: 'left',
});

export const caption = style({
  marginTop: themeVars.space3,
  color: themeVars.muted,
  fontSize: '0.82rem',
  textAlign: 'left',
});
