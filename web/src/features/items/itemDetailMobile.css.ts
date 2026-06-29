import { style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  paddingBottom: '5.5rem',
});

export const mobileTopActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space1,
});

export const hero = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const photoFrame = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: '14rem',
  aspectRatio: '4 / 3',
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
});

export const heroPhoto = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  color: themeVars.muted,
  fontSize: '0.84rem',
});

export const photoCount = style({
  position: 'absolute',
  right: themeVars.space3,
  bottom: themeVars.space3,
  padding: '0.15rem 0.45rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.72)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 700,
});

export const thumbStrip = style({
  display: 'flex',
  gap: themeVars.space2,
  overflowX: 'auto',
  padding: `${themeVars.space3} ${themeVars.space3} 0`,
});

export const thumbButton = style({
  flex: '0 0 auto',
  width: '3rem',
  height: '3rem',
  padding: 0,
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  overflow: 'hidden',
  selectors: {
    '&[data-active]': {
      borderColor: themeVars.info,
      boxShadow: `0 0 0 2px ${themeVars.infoSoft}`,
    },
  },
});

export const thumbImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const thumbAdd = style({
  flex: '0 0 auto',
  width: '3rem',
  height: '3rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.accentInk,
});

export const hiddenInput = style({
  display: 'none',
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
});

export const title = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.3rem',
  lineHeight: 1.2,
  fontWeight: 760,
  letterSpacing: 0,
  textWrap: 'balance',
});

export const badgeRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const typeBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.secondaryBg,
  color: themeVars.secondaryText,
  fontSize: '0.72rem',
  fontWeight: 650,
});

export const categoryBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: '1.45rem',
  padding: '0 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontSize: '0.72rem',
  fontWeight: 650,
});

export const tagRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: '0.74rem',
  fontWeight: 650,
});

export const mutedText = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
});

export const specList = style({
  display: 'flex',
  flexDirection: 'column',
  borderTop: `1px solid ${themeVars.lineSoft}`,
});

export const specRow = style({
  display: 'grid',
  gridTemplateColumns: '6rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'center',
  minHeight: '2.2rem',
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const specLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
});

export const specValue = style({
  color: themeVars.text,
  fontSize: '0.84rem',
  fontWeight: 600,
  textAlign: 'right',
  overflowWrap: 'anywhere',
});

export const qrChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: '0.74rem',
});

export const actionList = style({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const actionRow = style({
  display: 'grid',
  gridTemplateColumns: '1.75rem minmax(0, 1fr) auto auto',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '3rem',
  border: 0,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  background: themeVars.panel,
  color: themeVars.text,
  padding: `0 ${themeVars.space4}`,
  textAlign: 'left',
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const actionIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  color: themeVars.muted,
});

export const actionLabel = style({
  color: themeVars.ink,
  fontSize: '0.9rem',
  fontWeight: 650,
});

export const actionValue = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
});

export const chevron = style({
  color: themeVars.muted,
});

export const section = style({
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  overflow: 'hidden',
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minHeight: '3rem',
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
});

export const sectionTitle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.94rem',
  fontWeight: 720,
});

export const sectionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
});

export const sectionEmpty = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  textAlign: 'center',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
});

export const compactTitle = style({
  color: themeVars.ink,
  fontSize: '0.86rem',
  fontWeight: 650,
});

export const compactSub = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const timelineRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  paddingBottom: themeVars.space2,
  borderBottom: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:last-child': {
      borderBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const timelineTitle = style({
  color: themeVars.ink,
  fontSize: '0.86rem',
  fontWeight: 650,
});

export const timelineMeta = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const warningText = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  color: themeVars.danger,
  fontSize: '0.76rem',
  fontWeight: 650,
});

export const bottomBar = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: themeVars.space2,
  padding: `${themeVars.space3} ${themeVars.space4}`,
  borderTop: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
});
