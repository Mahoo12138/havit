import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  height: '2.25rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  padding: '0 0.75rem',
  font: 'inherit',
  fontSize: '0.875rem',
  lineHeight: 1,
  outline: 'none',
  transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
  selectors: {
    '&::placeholder': {
      color: themeVars.muted,
    },
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
    '&[aria-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
    '&::file-selector-button': {
      display: 'inline-flex',
      height: '1.5rem',
      border: 0,
      background: 'transparent',
      color: themeVars.text,
      font: 'inherit',
      fontSize: '0.875rem',
      fontWeight: 600,
    },
  },
});
