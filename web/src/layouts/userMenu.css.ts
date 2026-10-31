import { style } from '@vanilla-extract/css';

import { themeVars } from '../styles/theme.css';

export const trigger = style({
  // 与图标组拉开一倍间距（8px + 8px），让头像作为身份入口单独成组；
  // 铃铛角标压在按钮右上角，不加这一档会和头像贴在一起。
  marginLeft: themeVars.space2,
  width: '2.25rem',
  height: '2.25rem',
  padding: 0,
  border: 0,
  borderRadius: '999px',
  display: 'inline-grid',
  placeItems: 'center',
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightBold,
  lineHeight: themeVars.leadingNone,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, box-shadow 160ms ease',
  overflow: 'hidden',
  selectors: {
    '&:hover': {
      background: themeVars.accentHover,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const triggerImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

// 负 margin 抵消 PopoverContent 自身的内边距，让分隔线和退出行贴住弹层边缘。
export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  width: 'min(17rem, calc(100vw - 2.5rem))',
  margin: `calc(-1 * ${themeVars.space3})`,
});

export const identity = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const identityAvatar = style({
  flex: '0 0 auto',
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: '999px',
  display: 'inline-grid',
  placeItems: 'center',
  overflow: 'hidden',
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightBold,
});

export const identityAvatarImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const identityMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
  minWidth: 0,
});

export const identityName = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const identityVersion = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});

export const language = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const languageLabel = style({
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.muted,
});

export const languageSwitch = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2px',
  padding: '2px',
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
});

export const languageOption = style({
  border: 0,
  borderRadius: themeVars.radius1,
  padding: `${themeVars.space2} 0`,
  background: 'transparent',
  color: themeVars.text,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightMedium,
  lineHeight: themeVars.leadingTight,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
  selectors: {
    '&:hover': {
      color: themeVars.ink,
    },
    '&[data-active="true"]': {
      background: themeVars.panel,
      color: themeVars.accentInk,
      fontWeight: themeVars.weightSemibold,
      boxShadow: themeVars.shadowSoft,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const navItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  width: '100%',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  background: 'transparent',
  color: themeVars.text,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightMedium,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `inset 0 0 0 2px ${themeVars.focusRing}`,
    },
  },
});

export const logout = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  width: '100%',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  border: 0,
  borderRadius: `0 0 ${themeVars.radius2} ${themeVars.radius2}`,
  background: 'transparent',
  color: themeVars.text,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightMedium,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.dangerSoft,
      color: themeVars.danger,
    },
    '&:focus-visible': {
      outline: 'none',
      background: themeVars.dangerSoft,
      color: themeVars.danger,
      boxShadow: `inset 0 0 0 2px ${themeVars.danger}`,
    },
  },
});
