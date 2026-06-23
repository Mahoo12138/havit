import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  fieldSizing: 'content',
  minHeight: '4rem',
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: '1rem',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  outline: 'none',
  resize: 'vertical',
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
      cursor: 'not-allowed',
      background: themeVars.bgSoft,
      opacity: 0.5,
    },
    '&[aria-invalid="true"]': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
    },
  },
  '@media': {
    '(min-width: 48em)': {
      fontSize: '0.875rem',
    },
  },
});
