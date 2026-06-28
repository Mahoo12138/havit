import { keyframes, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const group = style({
  padding: themeVars.space1,
});

export const value = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  gap: '0.375rem',
  overflow: 'hidden',
  textAlign: 'left',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.375rem',
  width: 'fit-content',
  height: '2.25rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  padding: '0 0.5rem 0 0.625rem',
  outline: 'none',
  userSelect: 'none',
  cursor: 'pointer',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  selectors: {
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
    '&[data-popup-open]': {
      borderColor: themeVars.accent,
    },
  },
});

export const triggerSize = styleVariants({
  default: {},
  sm: {
    height: '2rem',
    fontSize: '0.8125rem',
  },
});

export const chevron = style({
  display: 'inline-flex',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const positioner = style({
  zIndex: 50,
  isolation: 'isolate',
});

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'scale(0.95)' },
  to: { opacity: 1, transform: 'scale(1)' },
});

const fadeOut = keyframes({
  from: { opacity: 1, transform: 'scale(1)' },
  to: { opacity: 0, transform: 'scale(0.95)' },
});

export const popup = style({
  position: 'relative',
  isolation: 'isolate',
  zIndex: 50,
  maxHeight: 'var(--available-height)',
  width: 'var(--anchor-width)',
  minWidth: '9rem',
  overflowX: 'hidden',
  overflowY: 'auto',
  borderRadius: themeVars.radius2,
  background: themeVars.panel,
  color: themeVars.text,
  boxShadow: `${themeVars.shadow}, 0 0 0 1px ${themeVars.line}`,
  padding: themeVars.space1,
  transformOrigin: 'var(--transform-origin)',
  animation: `${fadeIn} 150ms ease-out`,
  selectors: {
    '&[data-ending-style]': {
      animation: `${fadeOut} 100ms ease-in`,
    },
  },
});

export const label = style({
  padding: '0.25rem 0.375rem',
  color: themeVars.muted,
  fontSize: '0.75rem',
});

export const item = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  borderRadius: themeVars.radius1,
  padding: '0.25rem 2rem 0.25rem 0.375rem',
  fontSize: '0.875rem',
  outline: 'none',
  userSelect: 'none',
  cursor: 'default',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&[data-highlighted]': {
      background: themeVars.accentSoft,
      color: themeVars.accentInk,
    },
    '&[data-disabled]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
  },
});

export const itemIndicator = style({
  position: 'absolute',
  right: '0.5rem',
  display: 'flex',
  width: '1rem',
  height: '1rem',
  alignItems: 'center',
  justifyContent: 'center',
  color: themeVars.accentInk,
  pointerEvents: 'none',
});

export const itemText = style({
  display: 'flex',
  flex: 1,
  flexShrink: 0,
  alignItems: 'center',
  gap: '0.5rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const separator = style({
  height: 1,
  margin: `${themeVars.space1} -${themeVars.space1}`,
  background: themeVars.line,
  pointerEvents: 'none',
});

export const scrollArrow = style({
  zIndex: 10,
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.25rem 0',
  background: themeVars.panel,
  color: themeVars.muted,
  cursor: 'default',
});
