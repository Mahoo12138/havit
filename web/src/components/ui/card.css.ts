import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  vars: {
    '--card-spacing': themeVars.space4,
  },
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--card-spacing)',
  overflow: 'hidden',
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  color: themeVars.text,
  boxShadow: `0 0 0 1px ${themeVars.line}`,
  padding: 'var(--card-spacing) 0',
  fontSize: '0.875rem',
  selectors: {
    '&:has([data-slot="card-footer"])': {
      paddingBottom: 0,
    },
    '&:has(> img:first-child)': {
      paddingTop: 0,
    },
  },
});

export const padded = style({
  padding: themeVars.space5,
});

export const sizeSm = style({
  vars: {
    '--card-spacing': themeVars.space3,
  },
});

export const header = style({
  display: 'grid',
  gridTemplateRows: 'auto auto',
  alignItems: 'start',
  gap: '0.25rem',
  padding: '0 var(--card-spacing)',
  selectors: {
    '&:has([data-slot="card-action"])': {
      gridTemplateColumns: '1fr auto',
    },
  },
});

export const title = style({
  color: themeVars.ink,
  fontSize: '0.875rem',
  fontWeight: 600,
  lineHeight: 1.375,
  selectors: {
    '[data-size="sm"] &': {
      fontSize: '0.8125rem',
    },
  },
});

export const description = style({
  color: themeVars.muted,
  fontSize: '0.8125rem',
});

export const action = style({
  gridColumn: 2,
  gridRow: '1 / 3',
  alignSelf: 'start',
  justifySelf: 'end',
});

export const content = style({
  padding: '0 var(--card-spacing)',
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  borderTop: `1px solid ${themeVars.line}`,
  borderBottomLeftRadius: themeVars.radius3,
  borderBottomRightRadius: themeVars.radius3,
  background: themeVars.bgSoft,
  padding: 'var(--card-spacing)',
});
