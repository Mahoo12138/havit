import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'inline-flex',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  color: themeVars.onAccent,
  outline: 'none',
  cursor: 'pointer',
  transition: 'background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
  selectors: {
    '&[data-checked], &[data-indeterminate]': {
      borderColor: themeVars.accent,
      background: themeVars.accent,
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
  width: '0.875rem',
  height: '0.875rem',
});
