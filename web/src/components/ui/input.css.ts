import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  height: '2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.text,
  padding: '0.25rem 0.625rem',
  font: 'inherit',
  fontSize: '1rem',
  lineHeight: 1.5,
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
      background: `color-mix(in srgb, ${themeVars.lineSoft} 70%, transparent)`,
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
  '@media': {
    '(min-width: 48em)': {
      fontSize: '0.875rem',
    },
  },
});
