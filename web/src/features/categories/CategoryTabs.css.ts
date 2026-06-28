import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  marginBottom: themeVars.space4,
});

export const list = style({
  position: 'relative',
  display: 'flex',
  width: 'max-content',
  maxWidth: '100%',
  overflow: 'hidden',
  justifyContent: 'flex-start',
});

export const tab = style({
  display: 'inline-flex',
  minHeight: '1.75rem',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  border: '1px solid transparent',
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.875rem',
  lineHeight: 1.25,
  padding: '0.25rem 0.75rem',
  flex: '0 0 auto',
  transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
  selectors: {
    '&:hover': {
      background: `color-mix(in srgb, ${themeVars.panel} 48%, transparent)`,
      color: themeVars.text,
    },
    '&[data-selected]': {
      background: themeVars.panel,
      color: themeVars.ink,
      fontWeight: 600,
      boxShadow: themeVars.shadowSoft,
    },
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      outline: `1px solid ${themeVars.accent}`,
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
      background: themeVars.secondaryBg,
      color: themeVars.ink,
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
