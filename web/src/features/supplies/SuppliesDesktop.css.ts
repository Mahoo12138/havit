import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const itemLink = style({
  color: themeVars.ink,
  fontWeight: themeVars.weightMedium,
  textDecoration: 'none',
  selectors: {
    '&:hover': {
      color: themeVars.accent,
      textDecoration: 'underline',
    },
  },
});

export const typeOptionGroup = style({
  display: 'grid',
  gap: themeVars.space2,
});

export const typeOption = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, border-color 160ms ease',
  selectors: {
    '&[data-selected]': {
      borderColor: themeVars.accent,
      background: themeVars.accentSoft,
    },
  },
});

export const typeOptionText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const typeOptionRadio = style({
  marginTop: '3px',
});

export const typeOptionLabel = style({
  color: themeVars.text,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const typeOptionHint = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});
