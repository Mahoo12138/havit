import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  position: 'relative',
  display: 'flex',
  gap: themeVars.space1,
  overflow: 'hidden',
  borderBottom: `1px solid ${themeVars.line}`,
  marginBottom: themeVars.space4,
});

export const tab = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  border: 0,
  borderBottom: '2px solid transparent',
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.88rem',
  fontWeight: 500,
  marginBottom: '-1px',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  transition: 'color 160ms ease, border-color 160ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.text,
    },
    '&[data-selected]': {
      borderBottomColor: themeVars.accent,
      color: themeVars.accent,
      fontWeight: 600,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const hiddenTab = style({
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
});

export const overflowPopup = style({
  width: '10rem',
  gap: 0,
  padding: themeVars.space1,
});

export const overflowItem = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.875rem',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  textAlign: 'left',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover, &[data-selected]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
    '&[data-selected]': {
      fontWeight: 600,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});
