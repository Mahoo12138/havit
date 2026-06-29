import { globalStyle, style } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingBlock: themeVars.space1,
});

export const groupLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.muted,
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: `${themeVars.space3} ${themeVars.space3} ${themeVars.space2}`,
});

export const item = style({
  position: 'relative',
  zIndex: 0,
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: themeVars.space2,
  border: '1px solid transparent',
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.88rem',
  lineHeight: 1.25,
  paddingBlock: themeVars.space2,
  paddingInlineEnd: themeVars.space2,
  paddingInlineStart: 'calc(var(--tree-item-depth, 0) * var(--tree-indent, 14px) + 0.5rem)',
  textAlign: 'left',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
    '&:focus-visible': {
      zIndex: 1,
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      outline: 'none',
    },
    '&[data-selected="true"]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
      fontWeight: 600,
    },
    '&[data-disabled="true"]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    '&[data-drag-target="true"], &[data-search-match="true"]': {
      background: themeVars.infoSoft,
    },
  },
});

globalStyle(`${item} svg`, {
  pointerEvents: 'none',
  flexShrink: 0,
});

export const chevron = style({
  width: '1.1rem',
  height: '1.1rem',
  display: 'inline-grid',
  placeItems: 'center',
  flex: '0 0 auto',
  border: 0,
  borderRadius: '3px',
  background: 'transparent',
  color: themeVars.muted,
  padding: 0,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease, transform 200ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.lineSoft,
      color: themeVars.text,
    },
    '&:focus-visible': {
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      outline: 'none',
    },
    '&[data-expanded="true"]': {
      transform: 'rotate(90deg)',
    },
    '&[data-empty="true"]': {
      visibility: 'hidden',
      pointerEvents: 'none',
    },
  },
});

export const itemIcon = style({
  width: '1rem',
  height: '1rem',
  display: 'inline-grid',
  placeItems: 'center',
  flex: '0 0 auto',
  color: 'currentColor',
  opacity: 0.85,
});

export const label = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const count = style({
  flex: '0 0 auto',
  color: themeVars.muted,
  fontSize: '0.75rem',
  fontVariantNumeric: 'tabular-nums',
});

export const dragLine = style({
  position: 'absolute',
  zIndex: 30,
  width: 'unset',
  height: '2px',
  marginTop: '-1px',
  background: themeVars.accent,
  selectors: {
    '&::before': {
      position: 'absolute',
      top: '-3px',
      left: 0,
      width: '0.5rem',
      height: '0.5rem',
      border: `2px solid ${themeVars.accent}`,
      borderRadius: 999,
      background: themeVars.panel,
      content: '""',
    },
  },
});
