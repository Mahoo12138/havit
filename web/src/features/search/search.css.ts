import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/* ---------- Search field ---------- */

export const searchWrap = style({
  position: 'relative',
});

export const searchIcon = style({
  position: 'absolute',
  left: themeVars.space4,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '100%',
  height: '2.75rem',
  paddingLeft: '2.75rem',
  paddingRight: '2.75rem',
  fontSize: '0.95rem',
  selectors: {
    '&::-webkit-search-cancel-button': {
      display: 'none',
    },
  },
});

export const clearButton = style({
  position: 'absolute',
  right: themeVars.space2,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  padding: 0,
  border: 0,
  borderRadius: themeVars.radius3,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.secondaryBg,
      color: themeVars.text,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: '1px',
    },
  },
});

/* ---------- Status line ---------- */

export const statusLine = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space3,
  minHeight: '1.5rem',
  fontSize: '0.8rem',
  color: themeVars.muted,
});

export const sourceChip = styleVariants({
  fts: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${themeVars.space2}`,
    borderRadius: '999px',
    background: themeVars.secondaryBg,
    color: themeVars.secondaryText,
    fontFamily: themeVars.fontMono,
    fontSize: '0.72rem',
    letterSpacing: '0.02em',
    fontWeight: 600,
  },
  llm: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: `2px ${themeVars.space2}`,
    borderRadius: '999px',
    background: themeVars.accentSoft,
    color: themeVars.accentInk,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
});

export const errorText = style({
  fontSize: '0.8rem',
  color: themeVars.danger,
});

/* ---------- Result list ---------- */

export const resultList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const resultRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space4,
  minWidth: 0,
  padding: `${themeVars.space3} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  textDecoration: 'none',
  transition: 'background-color 160ms ease',
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      background: themeVars.bgSoft,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: '-2px',
    },
  },
});

export const thumb = style({
  flex: '0 0 auto',
  width: '2.75rem',
  height: '2.75rem',
  borderRadius: themeVars.radius2,
  objectFit: 'cover',
  background: themeVars.secondaryBg,
});

export const thumbFallback = style({
  flex: '0 0 auto',
  width: '2.75rem',
  height: '2.75rem',
  borderRadius: themeVars.radius2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: themeVars.secondaryBg,
  color: themeVars.muted,
});

export const resultMain = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: '1 1 auto',
  minWidth: 0,
});

export const resultName = style({
  margin: 0,
  fontSize: '0.92rem',
  fontWeight: 600,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const resultMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minWidth: 0,
  fontSize: '0.78rem',
  color: themeVars.muted,
});

export const resultPath = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const resultHint = style({
  margin: 0,
  fontSize: '0.78rem',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const resultSide = style({
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const resultType = style({
  fontSize: '0.75rem',
  color: themeVars.muted,
  whiteSpace: 'nowrap',
});

/* ---------- Empty / hint states ---------- */

export const exampleRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  justifyContent: 'center',
});

export const exampleChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${themeVars.space1} ${themeVars.space3}`,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: '999px',
  background: themeVars.bgSoft,
  color: themeVars.secondaryText,
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, background-color 160ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 25%, ${themeVars.lineSoft})`,
      background: themeVars.panel,
    },
    '&:focus-visible': {
      outline: `2px solid ${themeVars.focusRing}`,
      outlineOffset: '1px',
    },
  },
});

/* ---------- Skeletons ---------- */

const shimmer = keyframes({
  from: { opacity: '0.45' },
  to: { opacity: '1' },
});

export const skeletonRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space4,
  padding: `${themeVars.space3} ${themeVars.space2}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const skeletonBone = style({
  borderRadius: themeVars.radius2,
  background: themeVars.secondaryBg,
  animation: `${shimmer} 900ms ease-in-out infinite alternate`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const skeletonThumb = style([skeletonBone, { width: '2.75rem', height: '2.75rem' }]);
export const skeletonLine = style([skeletonBone, { height: '0.75rem' }]);

export const skeletonPulse = style({
  animation: `${shimmer} 900ms ease-in-out infinite alternate`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});
