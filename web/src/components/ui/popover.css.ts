import { style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const positioner = style({
  isolation: 'isolate',
  zIndex: 80,
});

export const content = style({
  zIndex: 80,
  display: 'flex',
  width: '18rem',
  transformOrigin: 'var(--transform-origin)',
  flexDirection: 'column',
  gap: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  boxShadow: `${themeVars.shadow}, 0 0 0 1px ${themeVars.line}`,
  padding: themeVars.space3,
  fontSize: '0.875rem',
  outline: 'none',
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  fontSize: '0.875rem',
});

export const title = style({
  color: themeVars.ink,
  fontWeight: 600,
});

export const description = style({
  color: themeVars.muted,
});
