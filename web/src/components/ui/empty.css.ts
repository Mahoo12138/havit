import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const root = style({
  display: 'flex',
  width: '100%',
  minWidth: 0,
  flex: '1 1 auto',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space4,
  borderRadius: themeVars.radius3,
  padding: themeVars.space6,
  textAlign: 'center',
  textWrap: 'balance',
});

export const header = style({
  display: 'flex',
  maxWidth: '24rem',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const mediaBase = style({
  marginBottom: themeVars.space2,
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
});

globalStyle(`${mediaBase} svg`, {
  pointerEvents: 'none',
  flexShrink: 0,
});

export const media = styleVariants({
  default: [mediaBase, { background: 'transparent' }],
  icon: [
    mediaBase,
    {
      width: '2rem',
      height: '2rem',
      borderRadius: themeVars.radius2,
      background: themeVars.lineSoft,
      color: themeVars.ink,
    },
  ],
});

globalStyle(`${media.icon} svg`, {
  width: '1rem',
  height: '1rem',
});

export const title = style({
  color: themeVars.ink,
  fontSize: '0.875rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
});

export const description = style({
  margin: 0,
  color: themeVars.muted,
  fontSize: '0.875rem',
  lineHeight: 1.625,
});

export const content = style({
  display: 'flex',
  width: '100%',
  maxWidth: '24rem',
  minWidth: 0,
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space3,
  fontSize: '0.875rem',
  textWrap: 'balance',
});
