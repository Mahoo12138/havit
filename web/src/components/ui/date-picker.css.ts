import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const trigger = style({
  width: '100%',
  justifyContent: 'flex-start',
  gap: themeVars.space2,
  overflow: 'hidden',
  paddingInline: themeVars.space3,
  selectors: {
    '&[data-empty]': {
      color: themeVars.muted,
    },
  },
});

export const value = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textAlign: 'left',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const clear = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  borderRadius: themeVars.radius1,
  color: themeVars.muted,
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.text,
    },
  },
});

globalStyle(`${clear} svg`, {
  width: '0.875rem',
  height: '0.875rem',
});

export const content = style({
  width: 'auto',
  minWidth: 'auto',
  padding: 0,
});
