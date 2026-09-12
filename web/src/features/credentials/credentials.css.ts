import { style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/* ---------- Metric strip ---------- */

export const metricStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space3,
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const metricCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  padding: `${themeVars.space3} ${themeVars.space4}`,
});

const metricIconBase = {
  flex: '0 0 auto',
  display: 'inline-grid',
  width: '2.2rem',
  height: '2.2rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
} as const;

export const metricIcon = styleVariants({
  accent: [{ ...metricIconBase, background: themeVars.accentSoft, color: themeVars.accentInk }],
  success: [{ ...metricIconBase, background: themeVars.successSoft, color: themeVars.success }],
  warning: [{ ...metricIconBase, background: themeVars.warningSoft, color: themeVars.warningText }],
  danger: [{ ...metricIconBase, background: themeVars.dangerSoft, color: themeVars.danger }],
  info: [{ ...metricIconBase, background: themeVars.infoSoft, color: themeVars.info }],
});

export const metricMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const metricLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontWeight: 600,
});

export const metricValue = style({
  color: themeVars.ink,
  fontFamily: themeVars.fontSerif,
  fontSize: '1.5rem',
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  fontVariantNumeric: 'tabular-nums',
});

/* ---------- Toolbar ---------- */

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  flexWrap: 'wrap',
});

export const toolbarCount = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  fontVariantNumeric: 'tabular-nums',
});

export const emptyNote = style({
  padding: `${themeVars.space6} ${themeVars.space4}`,
  textAlign: 'center',
  color: themeVars.muted,
  fontSize: '0.85rem',
});

/* ---------- Record card (warranty / credential) ---------- */

export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: `0 ${themeVars.space4}`,
});

export const cardHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
});

const statusTileBase = {
  flex: '0 0 auto',
  display: 'inline-grid',
  width: '2.2rem',
  height: '2.2rem',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
} as const;

export const statusTile = styleVariants({
  active: [{ ...statusTileBase, background: themeVars.successSoft, color: themeVars.success }],
  expiring: [{ ...statusTileBase, background: themeVars.warningSoft, color: themeVars.warningText }],
  expired: [{ ...statusTileBase, background: themeVars.dangerSoft, color: themeVars.danger }],
  credential: [{ ...statusTileBase, background: themeVars.accentSoft, color: themeVars.accentInk }],
});

export const cardHeadMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  flex: '1 1 auto',
});

export const cardTitle = style({
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 700,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardSub = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const statusChipBase = {
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: `2px ${themeVars.space2}`,
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
} as const;

export const statusChip = styleVariants({
  active: [{ ...statusChipBase, background: themeVars.successSoft, color: themeVars.success }],
  expiring: [{ ...statusChipBase, background: themeVars.warningSoft, color: themeVars.warningText }],
  expired: [{ ...statusChipBase, background: themeVars.dangerSoft, color: themeVars.danger }],
  platform: [{ ...statusChipBase, background: themeVars.infoSoft, color: themeVars.info }],
});

/* ---------- Warranty days hero ---------- */

export const daysHero = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
});

const daysValueBase = {
  fontFamily: themeVars.fontSerif,
  fontSize: '1.75rem',
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: '-0.01em',
  fontVariantNumeric: 'tabular-nums',
} as const;

export const daysValue = styleVariants({
  active: [{ ...daysValueBase, color: themeVars.ink }],
  expiring: [{ ...daysValueBase, color: themeVars.warningText }],
  expired: [{ ...daysValueBase, color: themeVars.danger }],
});

export const daysLabel = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
});

export const daysDate = style({
  marginLeft: 'auto',
  color: themeVars.muted,
  fontSize: '0.78rem',
  fontVariantNumeric: 'tabular-nums',
});

/* ---------- Key-value rows ---------- */

export const kvList = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
});

export const kvRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space1} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  fontSize: '0.82rem',
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const kvLabel = style({
  color: themeVars.muted,
  flex: '0 0 auto',
});

export const kvValue = style({
  margin: 0,
  color: themeVars.ink,
  fontWeight: 500,
  textAlign: 'right',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const mono = style({
  fontFamily: themeVars.fontMono,
  fontSize: '0.78rem',
  letterSpacing: '0.02em',
});

/* ---------- License key box ---------- */

export const licenseBox = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.bgSoft,
});

export const licenseValue = style({
  flex: '1 1 auto',
  minWidth: 0,
  fontFamily: themeVars.fontMono,
  fontSize: '0.8rem',
  color: themeVars.ink,
  letterSpacing: '0.03em',
  wordBreak: 'break-all',
});

export const licenseAction = style({
  flex: '0 0 auto',
  display: 'inline-grid',
  width: '1.75rem',
  height: '1.75rem',
  placeItems: 'center',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
  transition: 'background-color 160ms ease, color 160ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.panel,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

/* ---------- Card footer ---------- */

export const cardFoot = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});
