import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'grid',
  gap: themeVars.space2,
});

export const item = style({
  display: 'inline-flex',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '999px',
  background: themeVars.panel,
  color: themeVars.accent,
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
  selectors: {
    '&[data-checked]': {
      borderColor: themeVars.accent,
    },
    '&[data-focused]': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&[data-disabled]': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    '&[data-invalid]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
  },
});

export const indicator = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'currentColor',
});

globalStyle(`${indicator} svg`, {
  width: '0.5rem',
  height: '0.5rem',
  fill: 'currentColor',
});
