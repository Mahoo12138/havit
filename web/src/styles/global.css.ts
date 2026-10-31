import { globalStyle } from '@vanilla-extract/css';

import { themeVars } from './theme.css';

globalStyle(':root', { colorScheme: 'light' });

globalStyle('[data-color-scheme="dark"]', { colorScheme: 'dark' });

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  borderColor: themeVars.line,
  outlineColor: themeVars.focusRing,
});

globalStyle('*', {
  scrollbarWidth: 'thin',
  scrollbarColor: `color-mix(in srgb, ${themeVars.muted} 42%, transparent) transparent`,
});

globalStyle('*::-webkit-scrollbar', {
  width: '10px',
  height: '10px',
});

globalStyle('*::-webkit-scrollbar-track', {
  background: 'transparent',
});

globalStyle('*::-webkit-scrollbar-thumb', {
  minHeight: '28px',
  border: '3px solid transparent',
  borderRadius: '999px',
  backgroundClip: 'content-box',
  backgroundColor: `color-mix(in srgb, ${themeVars.muted} 42%, transparent)`,
});

globalStyle('*::-webkit-scrollbar-thumb:hover', {
  backgroundColor: `color-mix(in srgb, ${themeVars.accent} 34%, ${themeVars.muted})`,
});

globalStyle('*::-webkit-scrollbar-corner', {
  background: 'transparent',
});

globalStyle('#root', {
  isolation: 'isolate',
});

globalStyle('html', {
  scrollBehavior: 'smooth',
});

globalStyle('body', {
  margin: 0,
  minWidth: '320px',
  background: themeVars.bg,
  color: themeVars.text,
  fontFamily: themeVars.fontSans,
  letterSpacing: themeVars.trackingNormal,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});

globalStyle('a', {
  color: themeVars.accent,
  textDecoration: 'none',
});

// 表单控件默认不继承字体：统一到正文，避免混入 UA 的 Arial。
globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit',
});

globalStyle('a:hover', {
  color: themeVars.accentHover,
});

globalStyle('.auth-screen', {
  minHeight: '100dvh',
  padding: 'clamp(1rem, 4vw, 3rem)',
  background:
    `radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, ${themeVars.accent} 6%, transparent), transparent 60%), ${themeVars.bg}`,
});

globalStyle('.auth-card', {
  width: 'min(100%, 440px)',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  borderRadius: themeVars.radius3,
  boxShadow: themeVars.shadow,
});

globalStyle('.brand-lockup', {
  color: themeVars.ink,
  fontFamily: themeVars.fontSans,
  fontSize: themeVars.textSizeLg,
  fontWeight: themeVars.weightBold,
  letterSpacing: themeVars.trackingTight,
  lineHeight: themeVars.leadingNone,
  margin: 0,
});

globalStyle('.brand-mark', {
  display: 'grid',
  width: '2.1rem',
  height: '2.1rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontWeight: themeVars.weightBold,
  boxShadow: '0 2px 6px rgba(17, 24, 39, 0.16)',
});

globalStyle('.shell-header', {
  borderBottom: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

globalStyle('.shell-main', {
  background: themeVars.bg,
});

globalStyle('.page-shell', {
  width: `min(100%, ${themeVars.pageMaxW})`,
  margin: '0 auto',
  paddingBlock: `clamp(${themeVars.space4}, 2vw, ${themeVars.space5}) clamp(${themeVars.space6}, 4vw, ${themeVars.space7})`,
});

globalStyle('.stat-card', {
  position: 'relative',
});

globalStyle('.empty-state', {
  padding: `clamp(${themeVars.space6}, 8vw, ${themeVars.space8})`,
  textAlign: 'center',
  color: themeVars.muted,
  lineHeight: themeVars.leadingRelaxed,
});

globalStyle('.tree-row', {
  minHeight: '2.25rem',
  borderRadius: themeVars.radius1,
  transition: 'background-color 160ms ease',
});

globalStyle('.tree-row:hover', {
  background: `color-mix(in srgb, ${themeVars.accent} 8%, transparent)`,
});

globalStyle('.nav-link', {
  borderRadius: themeVars.radius1,
  color: themeVars.text,
});

globalStyle(".nav-link[data-active='true']", {
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontWeight: themeVars.weightSemibold,
});

globalStyle('.detail-grid', {
  display: 'grid',
  gap: 0,
});

globalStyle('.detail-row', {
  display: 'grid',
  gridTemplateColumns: 'minmax(8rem, 0.42fr) minmax(0, 1fr)',
  gap: themeVars.space4,
  padding: `${themeVars.space3} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

globalStyle('.detail-row:last-child', {
  borderBottom: 0,
});

globalStyle('.compact-detail-row', {
  gridTemplateColumns: 'minmax(6rem, 0.42fr) minmax(0, 1fr)',
  padding: `${themeVars.space2} 0`,
});

globalStyle('.status-pill', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.32rem',
  borderRadius: '999px',
  background: themeVars.lineSoft,
  color: themeVars.text,
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightSemibold,
  letterSpacing: themeVars.trackingNormal,
  padding: '0.18rem 0.55rem',
});

globalStyle('.status-pill-warning', {
  background: themeVars.warningSoft,
  color: themeVars.warningText,
});

globalStyle('.status-pill-danger', {
  background: themeVars.dangerSoft,
  color: themeVars.danger,
});

globalStyle('.stat-unit', {
  marginLeft: '0.3rem',
  color: themeVars.muted,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightMedium,
});

globalStyle('.export-row', {
  justifyContent: 'space-between',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  background: themeVars.panel,
});

globalStyle('h1', {
  color: themeVars.ink,
  fontWeight: themeVars.weightBold,
  letterSpacing: themeVars.trackingTighter,
});

globalStyle('h2, h3, h4', {
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
  letterSpacing: themeVars.trackingTight,
});

globalStyle('::selection', {
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
});

globalStyle('@media (max-width: 48em) .auth-card', {
  padding: '1.1rem !important',
});

globalStyle('@media (max-width: 48em) .page-shell', {
  paddingInline: 0,
});

globalStyle('@media (max-width: 48em) .detail-row', {
  gridTemplateColumns: '1fr',
  gap: '0.25rem',
});
