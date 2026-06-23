import { style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

const base = style({
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  border: '1px solid transparent',
  borderRadius: themeVars.radius2,
  backgroundClip: 'padding-box',
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.875rem',
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  outline: 'none',
  userSelect: 'none',
  cursor: 'pointer',
  transition:
    'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, opacity 160ms ease, transform 80ms ease',
  selectors: {
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:active:not([aria-haspopup])': {
      transform: 'translateY(1px)',
    },
    '&:disabled': {
      pointerEvents: 'none',
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    '& svg': {
      pointerEvents: 'none',
      flexShrink: 0,
    },
  },
});

export const variant = styleVariants({
  default: [
    base,
    {
      background: themeVars.accent,
      borderColor: themeVars.accent,
      color: themeVars.onAccent,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.accentHover,
          borderColor: themeVars.accentHover,
        },
      },
    },
  ],
  outline: [
    base,
    {
      background: themeVars.panel,
      borderColor: themeVars.line,
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled), &[aria-expanded="true"]': {
          background: themeVars.bgSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  secondary: [
    base,
    {
      background: themeVars.secondaryBg,
      color: themeVars.secondaryText,
      selectors: {
        '&:hover:not(:disabled), &[aria-expanded="true"]': {
          background: `color-mix(in srgb, ${themeVars.secondaryBg} 82%, ${themeVars.ink})`,
        },
      },
    },
  ],
  ghost: [
    base,
    {
      background: 'transparent',
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled), &[aria-expanded="true"]': {
          background: themeVars.lineSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  destructive: [
    base,
    {
      background: themeVars.dangerSoft,
      color: themeVars.danger,
      selectors: {
        '&:hover:not(:disabled)': {
          background: `color-mix(in srgb, ${themeVars.dangerSoft} 70%, ${themeVars.danger})`,
        },
        '&:focus-visible': {
          borderColor: themeVars.danger,
          boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
        },
      },
    },
  ],
  link: [
    base,
    {
      background: 'transparent',
      color: themeVars.accent,
      textDecoration: 'underline',
      textUnderlineOffset: 4,
      selectors: {
        '&:hover:not(:disabled)': {
          color: themeVars.accentHover,
        },
      },
    },
  ],
  subtle: [
    base,
    {
      background: 'transparent',
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.lineSoft,
          color: themeVars.ink,
        },
      },
    },
  ],
  quiet: [
    base,
    {
      background: themeVars.panel,
      borderColor: themeVars.line,
      color: themeVars.text,
      selectors: {
        '&:hover:not(:disabled)': {
          background: themeVars.bgSoft,
          borderColor: `color-mix(in srgb, ${themeVars.accent} 30%, ${themeVars.line})`,
          color: themeVars.ink,
        },
      },
    },
  ],
});

export const size = styleVariants({
  default: { height: '2rem', padding: '0 0.625rem' },
  xs: { height: '1.5rem', gap: '0.25rem', padding: '0 0.5rem', fontSize: '0.75rem' },
  sm: { height: '1.75rem', gap: '0.25rem', padding: '0 0.625rem', fontSize: '0.8rem' },
  lg: { height: '2.25rem', padding: '0 0.75rem' },
  icon: { width: '2rem', height: '2rem', padding: 0 },
  'icon-xs': { width: '1.5rem', height: '1.5rem', padding: 0 },
  'icon-sm': { width: '1.75rem', height: '1.75rem', padding: 0 },
  'icon-lg': { width: '2.25rem', height: '2.25rem', padding: 0 },
});
