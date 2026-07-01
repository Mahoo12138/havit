import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../../styles/theme.css';

export const group = style({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  gap: themeVars.space4,
  selectors: {
    '&:has([data-size="sm"])': {
      gap: '0.625rem',
    },
    '&:has([data-size="xs"])': {
      gap: themeVars.space2,
    },
  },
});

export const separator = style({
  marginBlock: themeVars.space2,
});

const itemBase = style({
  display: 'flex',
  width: '100%',
  flexWrap: 'wrap',
  alignItems: 'center',
  border: '1px solid transparent',
  borderRadius: themeVars.radius2,
  fontSize: '0.875rem',
  outline: 'none',
  transition:
    'background-color 100ms ease, border-color 100ms ease, color 100ms ease, box-shadow 100ms ease',
  selectors: {
    '&:focus-visible': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

globalStyle(`${itemBase} a`, {
  transition: 'background-color 100ms ease, color 100ms ease',
});

globalStyle(`${itemBase} a:hover`, {
  background: themeVars.lineSoft,
});

export const itemVariant = styleVariants({
  default: [
    itemBase,
    {
      borderColor: 'transparent',
    },
  ],
  outline: [
    itemBase,
    {
      borderColor: themeVars.line,
    },
  ],
  muted: [
    itemBase,
    {
      borderColor: 'transparent',
      background: `color-mix(in srgb, ${themeVars.lineSoft} 50%, transparent)`,
    },
  ],
});

export const itemSize = styleVariants({
  default: {
    gap: '0.625rem',
    padding: '0.625rem 0.75rem',
  },
  sm: {
    gap: '0.625rem',
    padding: '0.625rem 0.75rem',
  },
  xs: {
    gap: themeVars.space2,
    padding: '0.5rem 0.625rem',
  },
});

globalStyle(`[data-slot="dropdown-menu-content"] ${itemSize.xs}`, {
  padding: 0,
});

const mediaBase = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space2,
});

globalStyle(`${itemBase}:has([data-slot="item-description"]) ${mediaBase}`, {
  alignSelf: 'flex-start',
  transform: 'translateY(0.125rem)',
});

globalStyle(`${mediaBase} svg`, {
  pointerEvents: 'none',
});

export const mediaVariant = styleVariants({
  default: [
    mediaBase,
    {
      background: 'transparent',
    },
  ],
  icon: [mediaBase, {}],
  image: [
    mediaBase,
    {
      width: '2.5rem',
      height: '2.5rem',
      overflow: 'hidden',
      borderRadius: '0.125rem',
    },
  ],
});

globalStyle(`${mediaVariant.icon} svg:not([class*="size-"])`, {
  width: themeVars.space4,
  height: themeVars.space4,
});

globalStyle(`${itemSize.sm} ${mediaVariant.image}`, {
  width: '2rem',
  height: '2rem',
});

globalStyle(`${itemSize.xs} ${mediaVariant.image}`, {
  width: '1.5rem',
  height: '1.5rem',
});

globalStyle(`${mediaVariant.image} img`, {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const content = style({
  display: 'flex',
  flex: '1 1 0%',
  flexDirection: 'column',
  gap: themeVars.space1,
  selectors: {
    '& + [data-slot="item-content"]': {
      flex: 'none',
    },
  },
});

globalStyle(`${itemSize.xs} ${content}`, {
  gap: 0,
});

export const title = style({
  display: 'flex',
  width: 'fit-content',
  alignItems: 'center',
  gap: themeVars.space2,
  overflow: 'hidden',
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.375,
  textDecorationThickness: 'from-font',
  textUnderlineOffset: 4,
});

export const description = style({
  display: '-webkit-box',
  overflow: 'hidden',
  color: themeVars.muted,
  fontSize: '0.875rem',
  fontWeight: 400,
  lineHeight: 1.5,
  textAlign: 'left',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
});

globalStyle(`${itemSize.xs} ${description}`, {
  fontSize: '0.75rem',
});

globalStyle(`${description} > a`, {
  textDecoration: 'underline',
  textUnderlineOffset: 4,
});

globalStyle(`${description} > a:hover`, {
  color: themeVars.accent,
});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

export const header = style({
  display: 'flex',
  flexBasis: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
});

export const footer = style({
  display: 'flex',
  flexBasis: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
});
