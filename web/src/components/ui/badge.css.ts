import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const base = style({
  display: 'inline-flex',
  minHeight: '1.25rem',
  width: 'fit-content',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  overflow: 'hidden',
  border: '1px solid transparent',
  borderRadius: '999px',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
  selectors: {
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

globalStyle(`${base} svg`, {
  pointerEvents: 'none',
  width: '0.75rem',
  height: '0.75rem',
});

export const variant = styleVariants({
  default: [base, { background: themeVars.accent, color: themeVars.onAccent }],
  secondary: [base, { background: themeVars.secondaryBg, color: themeVars.secondaryText }],
  destructive: [base, { background: themeVars.dangerSoft, color: themeVars.danger }],
  outline: [base, { borderColor: themeVars.line, background: 'transparent', color: themeVars.text }],
  ghost: [
    base,
    {
      background: 'transparent',
      color: themeVars.text,
      selectors: { '&:hover': { background: themeVars.lineSoft } },
    },
  ],
  link: [
    base,
    {
      background: 'transparent',
      color: themeVars.accent,
      textDecoration: 'underline',
      textUnderlineOffset: 4,
    },
  ],
});
