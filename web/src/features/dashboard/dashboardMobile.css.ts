import { style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  paddingBottom: themeVars.space6,
});

/* Greeting */
export const greeting = style({
  padding: `${themeVars.space2} 0`,
});

export const greetingTitle = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: 0,
  color: themeVars.ink,
});

export const greetingSub = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  margin: `${themeVars.space1} 0 0`,
});

/* KPI horizontal scroll strip */
export const kpiScroll = style({
  display: 'flex',
  gap: themeVars.space3,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  paddingBottom: themeVars.space1,
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

export const kpiCard = style({
  flex: '0 0 auto',
  scrollSnapAlign: 'start',
  width: '8.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

export const kpiIconSm = styleVariants({
  teal: {
    width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.accentSoft, color: themeVars.accentInk,
  },
  warning: {
    width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.warningSoft, color: themeVars.warning,
  },
  danger: {
    width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.dangerSoft, color: themeVars.danger,
  },
  info: {
    width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.infoSoft, color: themeVars.info,
  },
  violet: {
    width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.violetSoft, color: themeVars.violet,
  },
});

export const kpiLabel = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
  fontWeight: 500,
});

export const kpiValue = style({
  fontSize: '1.15rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

/* Section card (mobile) */
export const section = style({
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  fontSize: '0.88rem',
  fontWeight: 600,
  margin: 0,
  color: themeVars.ink,
});

export const sectionLink = style({
  fontSize: '0.78rem',
  fontWeight: 500,
  color: themeVars.accent,
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  textDecoration: 'none',
  selectors: { '&:hover': { textDecoration: 'none' } },
});

export const sectionBody = style({
  padding: themeVars.space3,
});

/* Quick actions grid (2x3) */
export const quickGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: themeVars.space2,
});

const qaBase = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space2}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
  textDecoration: 'none',
  color: themeVars.text,
  fontSize: '0.72rem',
  fontWeight: 500,
  textAlign: 'center' as const,
  transition: 'background-color 160ms ease',
};

export const quickItem = style({
  ...qaBase,
  selectors: {
    '&:hover': { background: themeVars.lineSoft, textDecoration: 'none' },
  },
});

export const quickIcon = styleVariants({
  teal: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.accentSoft, color: themeVars.accentInk,
  },
  info: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.infoSoft, color: themeVars.info,
  },
  warning: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.warningSoft, color: themeVars.warning,
  },
  violet: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.violetSoft, color: themeVars.violet,
  },
  amber: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.amberSoft, color: themeVars.amber,
  },
  success: {
    width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
    borderRadius: themeVars.radius2, background: themeVars.successSoft, color: themeVars.success,
  },
});

/* Recent items vertical card list */
export const recentCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 120ms ease',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { background: themeVars.bgSoft, textDecoration: 'none' },
  },
});

export const recentThumb = style({
  width: '2.25rem',
  height: '2.25rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const recentMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const recentName = style({
  fontSize: '0.85rem',
  fontWeight: 600,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const recentSub = style({
  fontSize: '0.72rem',
  color: themeVars.muted,
});

export const recentRight = style({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
});

export const recentPrice = style({
  fontSize: '0.78rem',
  fontWeight: 600,
  color: themeVars.ink,
});

/* Reminder row */
export const reminderRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space2} ${themeVars.space1}`,
  fontSize: '0.82rem',
});

export const reminderEmpty = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  textAlign: 'center',
  padding: `${themeVars.space4} 0`,
});

/* Location node */
export const locationNode = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space1}`,
  fontSize: '0.85rem',
  color: themeVars.text,
});

export const locationCount = style({
  marginLeft: 'auto',
  fontSize: '0.75rem',
  color: themeVars.muted,
});

/* Category horizontal chips */
export const catScroll = style({
  display: 'flex',
  gap: themeVars.space3,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  paddingBottom: themeVars.space1,
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});

const catThumbBase = {
  width: '2.5rem',
  height: '2.5rem',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  color: '#fff',
};

export const catThumb = styleVariants({
  teal: [{ ...catThumbBase, background: themeVars.accent }],
  info: [{ ...catThumbBase, background: themeVars.info }],
  warning: [{ ...catThumbBase, background: themeVars.warning }],
  violet: [{ ...catThumbBase, background: themeVars.violet }],
  amber: [{ ...catThumbBase, background: themeVars.amber }],
  danger: [{ ...catThumbBase, background: themeVars.danger }],
});

export const catTile = style({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  width: '5.5rem',
  textDecoration: 'none',
  color: 'inherit',
  selectors: { '&:hover': { textDecoration: 'none' } },
});

export const catName = style({
  fontSize: '0.75rem',
  fontWeight: 500,
  color: themeVars.text,
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const catCount = style({
  fontSize: '0.68rem',
  color: themeVars.muted,
});

/* Empty state */
export const emptyState = style({
  display: 'grid',
  placeItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space5} 0`,
  textAlign: 'center',
});

export const emptyIcon = style({
  color: themeVars.muted,
});

/* Tag chip variants */
export const tagInfo = style({
  fontSize: '0.68rem',
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: '999px',
  background: themeVars.infoSoft,
  color: themeVars.info,
});

export const tagWarning = style({
  fontSize: '0.68rem',
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: '999px',
  background: themeVars.warningSoft,
  color: themeVars.warningText ?? themeVars.warning,
});

export const tagNeutral = style({
  fontSize: '0.68rem',
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: '999px',
  background: themeVars.lineSoft,
  color: themeVars.muted,
});
