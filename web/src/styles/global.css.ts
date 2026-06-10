import { globalStyle } from '@vanilla-extract/css';

import { themeVars } from './theme.css';

globalStyle(':root', { colorScheme: 'light' });

globalStyle('[data-color-scheme="dark"]', { colorScheme: 'dark' });

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
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
  fontFeatureSettings: '"cv11", "ss01"',
  letterSpacing: '-0.005em',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
});

globalStyle('a', {
  color: themeVars.accent,
  textDecoration: 'none',
});

globalStyle('a:hover', {
  color: themeVars.accentHover,
});

globalStyle('.auth-screen', {
  minHeight: '100dvh',
  padding: 'clamp(1rem, 4vw, 3rem)',
  background:
    `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(13, 148, 136, 0.10), transparent 60%), ${themeVars.bg}`,
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
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  lineHeight: 1,
  margin: 0,
});

globalStyle('.brand-mark', {
  display: 'grid',
  width: '2.1rem',
  height: '2.1rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background:
    `linear-gradient(135deg, ${themeVars.accent}, ${themeVars.accentHover})`,
  color: themeVars.onAccent,
  fontWeight: 700,
  boxShadow: `0 4px 12px rgba(13, 148, 136, 0.25)`,
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

globalStyle('.page-heading', {
  fontFamily: themeVars.fontSans,
  fontSize: 'clamp(1.5rem, 2.2vw, 1.875rem)',
  fontWeight: 700,
  letterSpacing: '-0.018em',
  lineHeight: 1.15,
  color: themeVars.ink,
  margin: 0,
  textWrap: 'balance',
});

globalStyle('.page-kicker', {
  maxWidth: '60ch',
  color: themeVars.muted,
  fontSize: '0.95rem',
  lineHeight: 1.55,
  margin: 0,
  textWrap: 'pretty',
});

globalStyle('.surface-card', {
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
});

globalStyle('.surface-card:hover', {
  borderColor: `color-mix(in srgb, ${themeVars.accent} 25%, ${themeVars.line})`,
});

globalStyle('.stat-card', {
  position: 'relative',
});

globalStyle('.table-card', {
  overflow: 'hidden',
});

globalStyle('.empty-state', {
  padding: `clamp(${themeVars.space6}, 8vw, ${themeVars.space8})`,
  textAlign: 'center',
  color: themeVars.muted,
  lineHeight: 1.65,
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
  fontWeight: 600,
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
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.005em',
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
  fontSize: '0.85rem',
  fontWeight: 500,
});

globalStyle('.export-row', {
  justifyContent: 'space-between',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  background: themeVars.panel,
});

globalStyle('h1, h2, h3, h4', {
  color: themeVars.ink,
  fontWeight: 700,
  letterSpacing: '-0.01em',
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
