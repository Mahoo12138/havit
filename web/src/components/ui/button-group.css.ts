import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const rootBase = style({
  display: 'flex',
  width: 'fit-content',
  alignItems: 'stretch',
});

export const rootOrientation = styleVariants({
  horizontal: [
    rootBase,
    {
      flexDirection: 'row',
    },
  ],
  vertical: [
    rootBase,
    {
      flexDirection: 'column',
    },
  ],
});

globalStyle(`${rootBase} > [data-slot]`, {
  position: 'relative',
});

globalStyle(`${rootBase} > [data-slot]:focus-visible`, {
  zIndex: 1,
});

globalStyle(`${rootOrientation.horizontal} > [data-slot]:not(:first-child)`, {
  marginLeft: '-1px',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
});

globalStyle(`${rootOrientation.horizontal} > [data-slot]:not(:last-child)`, {
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
});

globalStyle(`${rootOrientation.vertical} > [data-slot]:not(:first-child)`, {
  marginTop: '-1px',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
});

globalStyle(`${rootOrientation.vertical} > [data-slot]:not(:last-child)`, {
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
});

globalStyle(`${rootBase} > [data-slot='button'][data-active='true']`, {
  zIndex: 1,
  borderColor: `color-mix(in srgb, ${themeVars.accent} 30%, ${themeVars.line})`,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  boxShadow: themeVars.shadowSoft,
});

export const text = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.secondaryBg,
  color: themeVars.text,
  padding: `0 ${themeVars.space3}`,
  fontSize: '0.875rem',
  fontWeight: 500,
});

globalStyle(`${text} svg`, {
  pointerEvents: 'none',
  width: '1rem',
  height: '1rem',
  flexShrink: 0,
});

export const separator = style({
  position: 'relative',
  alignSelf: 'stretch',
  background: themeVars.line,
  selectors: {
    '&[data-orientation="horizontal"]': {
      marginBlock: '1px',
      height: 'auto',
    },
    '&[data-orientation="vertical"]': {
      marginInline: '1px',
      width: 'auto',
    },
  },
});
