import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  gap: themeVars.space2,
  selectors: {
    '&[data-orientation="horizontal"]': {
      flexDirection: 'column',
    },
  },
});

const listBase = style({
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.radius2,
  padding: '3px',
  color: themeVars.muted,
  selectors: {
    '[data-orientation="horizontal"] &': {
      height: '2rem',
    },
    '[data-orientation="vertical"] &': {
      height: 'fit-content',
      flexDirection: 'column',
    },
  },
});

export const listVariant = styleVariants({
  default: [
    listBase,
    {
      background: themeVars.secondaryBg,
    },
  ],
  line: [
    listBase,
    {
      gap: themeVars.space1,
      borderRadius: 0,
      background: 'transparent',
    },
  ],
});

export const trigger = style({
  position: 'relative',
  display: 'inline-flex',
  flex: 1,
  height: 'calc(100% - 1px)',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  border: '1px solid transparent',
  borderRadius: '6px',
  background: 'transparent',
  color: `color-mix(in srgb, ${themeVars.text} 60%, transparent)`,
  padding: '0.125rem 0.375rem',
  font: 'inherit',
  fontSize: '0.875rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  outline: 'none',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.text,
    },
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      outline: `1px solid ${themeVars.accent}`,
    },
    '&:disabled, &[aria-disabled="true"]': {
      pointerEvents: 'none',
      opacity: 0.5,
    },
    '&[data-selected], &[data-active]': {
      background: themeVars.panel,
      color: themeVars.ink,
      boxShadow: themeVars.shadowSoft,
    },
    '[data-orientation="vertical"] &': {
      width: '100%',
      justifyContent: 'flex-start',
    },
    '[data-variant="line"] &': {
      background: 'transparent',
      boxShadow: 'none',
    },
    '[data-variant="line"] &[data-selected], [data-variant="line"] &[data-active]': {
      background: 'transparent',
      boxShadow: 'none',
    },
    '&::after': {
      position: 'absolute',
      background: themeVars.ink,
      opacity: 0,
      transition: 'opacity 160ms ease',
      content: '""',
    },
    '[data-orientation="horizontal"] &::after': {
      insetInline: 0,
      bottom: '-5px',
      height: 2,
    },
    '[data-orientation="vertical"] &::after': {
      insetBlock: 0,
      right: '-4px',
      width: 2,
    },
    '[data-variant="line"] &[data-selected]::after, [data-variant="line"] &[data-active]::after': {
      opacity: 1,
    },
  },
});

globalStyle(`${trigger} svg`, {
  pointerEvents: 'none',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
});

export const content = style({
  flex: 1,
  fontSize: '0.875rem',
  outline: 'none',
});
