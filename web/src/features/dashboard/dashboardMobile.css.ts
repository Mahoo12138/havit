import { style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';
import { textStyles } from '../../styles/typography.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  paddingBottom: themeVars.space6,
});

/* Greeting */
export const greeting = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
});

export const greetingTitle = style({
  fontSize: themeVars.textSizeXl,
  fontWeight: themeVars.weightBold,
  letterSpacing: themeVars.trackingTight,
  margin: 0,
  color: themeVars.ink,
});

export const greetingSub = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  margin: 0,
});

/* KPI horizontal scroll strip */
export const kpiScroll = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
  paddingBottom: themeVars.space1,
});

export const kpiCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});

export const kpiIconSm = style({
  width: '2rem', height: '2rem', display: 'inline-grid', placeItems: 'center',
  borderRadius: themeVars.radius2, background: themeVars.accentSoft, color: themeVars.accentInk,
});


export const kpiLabel = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  fontWeight: themeVars.weightMedium,
});

export const kpiValue = style({
  fontSize: themeVars.textSizeLg,
  fontWeight: themeVars.weightRegular,
  fontFamily: themeVars.fontSerif,
  fontVariantNumeric: 'tabular-nums',
  color: themeVars.ink,
  letterSpacing: themeVars.trackingTight,
});

/* Section card (mobile) — applied as a className on the Card component;
   head/body carry the padding. */
export const section = style({
  selectors: {
    '&[data-slot="card"]': {
      padding: 0,
      gap: 0,
    },
  },
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  margin: 0,
  color: themeVars.ink,
});

export const sectionLink = style({
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightMedium,
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
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightMedium,
  textAlign: 'center' as const,
  transition: 'background-color 160ms ease',
};

export const quickItem = style({
  ...qaBase,
  selectors: {
    '&:hover': { background: themeVars.lineSoft, textDecoration: 'none' },
  },
});

export const quickIcon = style({
  width: '2.25rem', height: '2.25rem', display: 'inline-grid', placeItems: 'center',
  borderRadius: themeVars.radius2, background: themeVars.accentSoft, color: themeVars.accentInk,
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
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.text,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
});

export const recentMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const recentName = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const recentSub = style({
  fontSize: themeVars.textSizeXs,
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
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
});

/* Reminder row */
export const reminderRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${themeVars.space2} ${themeVars.space1}`,
  fontSize: themeVars.textSizeSm,
});

export const reminderEmpty = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
  textAlign: 'center',
  padding: `${themeVars.space4} 0`,
});

/* Location node */
export const locationNode = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space1}`,
  fontSize: themeVars.textSizeBase,
  color: themeVars.text,
});

export const locationCount = style({
  marginLeft: 'auto',
  fontSize: themeVars.textSizeXs,
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
};

export const catThumb = styleVariants({
  teal: [{ ...catThumbBase, background: themeVars.accentSoft, color: themeVars.accentInk }],
  info: [{ ...catThumbBase, background: themeVars.infoSoft, color: themeVars.info }],
  warning: [{ ...catThumbBase, background: themeVars.warningSoft, color: themeVars.warning }],
  violet: [{ ...catThumbBase, background: themeVars.violetSoft, color: themeVars.violet }],
  amber: [{ ...catThumbBase, background: themeVars.amberSoft, color: themeVars.amber }],
  danger: [{ ...catThumbBase, background: themeVars.dangerSoft, color: themeVars.danger }],
});

export const catInitial = style({
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightSemibold,
  lineHeight: themeVars.leadingNone,
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
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightMedium,
  color: themeVars.text,
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
});

export const catCount = style({
  fontSize: themeVars.textSize2xs,
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

export const emptySub = textStyles.caption;
