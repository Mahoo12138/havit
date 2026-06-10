import { globalStyle } from '@vanilla-extract/css';

import { themeVars } from './theme.css';

globalStyle(':root', { colorScheme: 'light' });

globalStyle('[data-color-scheme="dark"]', { colorScheme: 'dark' });

globalStyle('#root', {
  isolation: 'isolate',
});

globalStyle('html', {
  scrollBehavior: 'smooth',
});

globalStyle('body', {
  margin: 0,
  minWidth: '320px',
  background:
    `radial-gradient(circle at 18% -12%, rgba(18, 108, 96, 0.09), transparent 28rem), linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.bg})`,
  color: themeVars.text,
  fontFamily:
    '"Segoe UI Variable", Aptos, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  fontVariantNumeric: 'tabular-nums',
});

globalStyle('body::before', {
  content: "''",
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  opacity: 0.28,
  backgroundImage:
    'linear-gradient(rgba(24, 33, 30, 0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 33, 30, 0.022) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: 'linear-gradient(to bottom, black, transparent 68%)',
});

globalStyle('a', {
  color: themeVars.accent,
  textDecoration: 'none',
});

globalStyle('a:hover', {
  textDecoration: 'underline',
});

globalStyle('.auth-screen', {
  minHeight: '100dvh',
  padding: 'clamp(1rem, 4vw, 3rem)',
  background:
    `radial-gradient(circle at 50% -10%, rgba(15, 111, 100, 0.13), transparent 28rem)`,
});

globalStyle('.auth-card', {
  width: 'min(100%, 440px)',
  border: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 95%, transparent)`,
  boxShadow: themeVars.shadow,
});

globalStyle('.brand-lockup', {
  color: themeVars.text,
  letterSpacing: 0,
  fontSize: '1rem',
  fontWeight: 760,
  margin: 0,
});

globalStyle('.brand-mark', {
  display: 'grid',
  width: '2.35rem',
  height: '2.35rem',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '9px',
  background:
    `linear-gradient(180deg, color-mix(in srgb, ${themeVars.panel} 86%, white), ${themeVars.accentSoft})`,
  color: themeVars.accent,
});

globalStyle('.shell-header', {
  borderBottom: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 88%, transparent)`,
  backdropFilter: 'blur(14px)',
});

globalStyle('.shell-navbar', {
  borderRight: `1px solid ${themeVars.line}`,
  background: `color-mix(in srgb, ${themeVars.panel} 92%, transparent)`,
});

globalStyle('.shell-main', {
  background: 'transparent',
});

globalStyle('.page-shell', {
  width: 'min(100%, 1220px)',
  margin: '0 auto',
  paddingBlock: 'clamp(1.15rem, 2vw, 1.85rem) clamp(2.75rem, 6vw, 4.25rem)',
});

globalStyle('.page-heading', {
  letterSpacing: 0,
  color: themeVars.text,
  fontSize: 'clamp(1.72rem, 2.35vw, 2.4rem)',
  fontWeight: 780,
  lineHeight: 1.03,
  margin: 0,
  textWrap: 'balance',
});

globalStyle('.page-kicker', {
  maxWidth: '58ch',
  color: themeVars.muted,
  lineHeight: 1.65,
  margin: 0,
});

globalStyle('.surface-card', {
  border: `1px solid ${themeVars.line}`,
  borderRadius: '12px',
  background: `color-mix(in srgb, ${themeVars.panel} 98%, transparent)`,
  boxShadow: themeVars.shadow,
});

globalStyle('.surface-card, .auth-card', {
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
});

globalStyle('.surface-card:hover', {
  borderColor: `color-mix(in srgb, ${themeVars.accent} 22%, ${themeVars.line})`,
});

globalStyle('.stat-card', {
  position: 'relative',
  overflow: 'hidden',
});

globalStyle('.stat-card::before', {
  content: "''",
  position: 'absolute',
  inset: '0 auto 0 0',
  width: '1px',
  background: themeVars.accent,
  opacity: 0.72,
});

globalStyle('.table-card', {
  overflow: 'hidden',
});

globalStyle('.empty-state', {
  padding: 'clamp(2.25rem, 8vw, 4.25rem)',
  textAlign: 'center',
  color: themeVars.muted,
  lineHeight: 1.7,
});

globalStyle('.tree-row', {
  minHeight: '2.5rem',
  borderRadius: '7px',
  transition: 'background-color 160ms ease, transform 160ms ease',
});

globalStyle('.tree-row:hover', {
  background: `color-mix(in srgb, ${themeVars.accentSoft} 64%, transparent)`,
});

globalStyle('.nav-link', {
  borderRadius: '9px',
  color: themeVars.text,
});

globalStyle(".nav-link[data-active='true']", {
  background: `color-mix(in srgb, ${themeVars.accentSoft} 78%, ${themeVars.panel})`,
  color: themeVars.accent,
  fontWeight: 650,
});

globalStyle('.detail-grid', {
  display: 'grid',
  gap: 0,
});

globalStyle('.detail-row', {
  display: 'grid',
  gridTemplateColumns: 'minmax(8rem, 0.45fr) minmax(0, 1fr)',
  gap: '1rem',
  padding: '1rem 0',
  borderBottom: `1px solid ${themeVars.line}`,
});

globalStyle('.detail-row:last-child', {
  borderBottom: 0,
});

globalStyle('.compact-detail-row', {
  gridTemplateColumns: 'minmax(6rem, 0.42fr) minmax(0, 1fr)',
  padding: '0.55rem 0',
});

globalStyle('.status-pill', {
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '999px',
  background: `color-mix(in srgb, ${themeVars.panel} 92%, ${themeVars.bgSoft})`,
  color: themeVars.text,
  fontSize: '0.78rem',
  fontWeight: 720,
  padding: '0.2rem 0.52rem',
});

globalStyle('.status-pill-warning', {
  borderColor: `color-mix(in srgb, ${themeVars.warningText} 24%, ${themeVars.line})`,
  background: themeVars.warningSoft,
  color: themeVars.warningText,
});

globalStyle('.status-pill-danger', {
  borderColor: `color-mix(in srgb, ${themeVars.danger} 24%, ${themeVars.line})`,
  background: `color-mix(in srgb, ${themeVars.danger} 9%, ${themeVars.panel})`,
  color: themeVars.danger,
});

globalStyle('.stat-unit', {
  marginLeft: '0.28rem',
  color: themeVars.muted,
  fontSize: '0.95rem',
  fontWeight: 680,
});

globalStyle('.export-row', {
  justifyContent: 'space-between',
  border: `1px solid ${themeVars.line}`,
  borderRadius: '10px',
  padding: '0.8rem',
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
