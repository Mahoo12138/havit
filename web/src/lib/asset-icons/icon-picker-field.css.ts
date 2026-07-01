import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  width: '100%',
  minWidth: 0,
});

export const preview = style({
  display: 'grid',
  gridTemplateColumns: '2.5rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  padding: themeVars.space3,
});

export const previewIcon = style({
  display: 'inline-grid',
  width: '2.5rem',
  height: '2.5rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

export const previewText = style({
  display: 'flex',
  minWidth: 0,
  flexDirection: 'column',
  gap: '0.125rem',
});

export const previewLabel = style({
  overflow: 'hidden',
  color: themeVars.ink,
  fontSize: '0.875rem',
  fontWeight: 650,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const previewMeta = style({
  overflow: 'hidden',
  color: themeVars.muted,
  fontSize: '0.75rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const search = style({
  width: '100%',
});

export const groups = style({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  gap: themeVars.space2,
  overflowX: 'auto',
  paddingBottom: themeVars.space1,
  scrollbarWidth: 'none',
});

globalStyle(`${groups}::-webkit-scrollbar`, {
  display: 'none',
});

export const groupButton = style({
  height: '1.875rem',
  flex: '0 0 auto',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.muted,
  padding: `0 ${themeVars.space3}`,
  font: 'inherit',
  fontSize: '0.78rem',
  fontWeight: 650,
  cursor: 'pointer',
  selectors: {
    '&[aria-pressed="true"]': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 42%, ${themeVars.line})`,
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
    '&:focus-visible': {
      outline: `3px solid ${themeVars.focusRing}`,
      outlineOffset: '2px',
    },
  },
});

export const gridWrap = style({
  width: '100%',
  height: '15.5rem',
  minHeight: 0,
  minWidth: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(4.25rem, 1fr))',
  gap: themeVars.space2,
  padding: themeVars.space2,
});

export const iconButton = style({
  display: 'grid',
  minWidth: 0,
  height: '4.75rem',
  gridTemplateRows: '1.5rem 1fr',
  placeItems: 'center',
  gap: themeVars.space1,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  padding: themeVars.space2,
  font: 'inherit',
  cursor: 'pointer',
  selectors: {
    '&[aria-pressed="true"]': {
      borderColor: themeVars.accent,
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
      boxShadow: `0 0 0 1px ${themeVars.accent}`,
    },
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 35%, ${themeVars.line})`,
    },
    '&:focus-visible': {
      outline: `3px solid ${themeVars.focusRing}`,
      outlineOffset: '2px',
    },
  },
});

export const iconName = style({
  width: '100%',
  overflow: 'hidden',
  color: 'currentColor',
  fontSize: '0.68rem',
  lineHeight: 1.2,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const empty = style({
  padding: themeVars.space5,
  color: themeVars.muted,
  fontSize: '0.875rem',
  textAlign: 'center',
});
