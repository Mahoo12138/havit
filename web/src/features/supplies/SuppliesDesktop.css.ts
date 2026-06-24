import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

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

export const typeOptionLabel = style({
  color: themeVars.text,
  fontSize: '0.88rem',
  fontWeight: 600,
});

export const typeOptionHint = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});
