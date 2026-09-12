import { style, styleVariants } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/* ---------- QR label tiles ---------- */

export const qrGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(9.5rem, 11rem))',
  justifyContent: 'center',
  gap: themeVars.space3,
});

export const qrTile = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  minWidth: 0,
  padding: themeVars.space3,
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  textAlign: 'center',
  transition: 'border-color 200ms ease, background-color 200ms ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${themeVars.accent} 25%, ${themeVars.lineSoft})`,
      background: themeVars.panel,
    },
  },
});

export const qrName = style({
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
});

export const qrCode = style({
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
  color: themeVars.muted,
});

/* ---------- Card footer links ---------- */

export const cardFoot = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space4,
  paddingTop: themeVars.space3,
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

/* ---------- Reminder list ---------- */

export const reminderList = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
});

export const reminderRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  padding: `${themeVars.space2} 0`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const reminderMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const reminderType = style({
  margin: 0,
  fontSize: '0.88rem',
  fontWeight: 600,
  color: themeVars.ink,
  letterSpacing: '-0.01em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const reminderItem = style({
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  letterSpacing: '0.02em',
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const reminderSide = style({
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space3,
});

export const reminderTime = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

const statusChipBase = {
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  padding: `2px ${themeVars.space2}`,
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
} as const;

export const statusChip = styleVariants({
  pending: [{ ...statusChipBase, background: themeVars.warningSoft, color: themeVars.warningText }],
  sent: [{ ...statusChipBase, background: themeVars.successSoft, color: themeVars.success }],
  dismissed: [{ ...statusChipBase, background: themeVars.secondaryBg, color: themeVars.secondaryText }],
});

/* ---------- Backup & export ---------- */

export const backupPath = style({
  fontFamily: themeVars.fontMono,
  fontSize: '0.75rem',
  letterSpacing: '0.02em',
  color: themeVars.success,
  wordBreak: 'break-all',
});

export const backupError = style({
  fontSize: '0.8rem',
  color: themeVars.danger,
  wordBreak: 'break-all',
});

export const divider = style({
  height: '1px',
  border: 0,
  margin: 0,
  background: themeVars.lineSoft,
});

export const exportRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space2,
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const exportHint = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
});

/* ---------- DataCard meta ---------- */

export const cardMeta = style({
  fontSize: '0.78rem',
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});
