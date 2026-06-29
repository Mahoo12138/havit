import { globalStyle, style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  minWidth: 0,
});

export const errorText = style({
  color: themeVars.danger,
});

export const topBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space4,
  padding: `${themeVars.space1} 0`,
  '@media': {
    '(max-width: 64em)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space1,
  minWidth: 0,
  color: themeVars.muted,
  fontSize: '0.82rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

globalStyle(`${breadcrumb} a`, {
  color: themeVars.muted,
  textDecoration: 'none',
});

globalStyle(`${breadcrumb} a:hover`, {
  color: themeVars.accentInk,
});

globalStyle(`${breadcrumb} [data-current]`, {
  color: themeVars.ink,
  fontWeight: 650,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const topActions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
  flexWrap: 'wrap',
});

export const heroCard = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(16rem, 0.9fr) minmax(28rem, 1.35fr) minmax(15rem, 0.7fr)',
  gap: 0,
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  '@media': {
    '(max-width: 86em)': {
      gridTemplateColumns: 'minmax(15rem, 0.9fr) minmax(0, 1.25fr)',
    },
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const gallery = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space5,
  borderRight: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
  '@media': {
    '(max-width: 64em)': {
      borderRight: 0,
      borderBottom: `1px solid ${themeVars.lineSoft}`,
    },
  },
});

export const mainPhoto = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: '17rem',
  aspectRatio: '4 / 3',
  borderRadius: themeVars.radius2,
  background: `linear-gradient(180deg, ${themeVars.bgSoft}, ${themeVars.panel})`,
  overflow: 'hidden',
});

export const mainPhotoImg = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const photoEmpty = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space5,
  color: themeVars.muted,
  textAlign: 'center',
  fontSize: '0.84rem',
});

globalStyle(`${photoEmpty} strong`, {
  color: themeVars.ink,
  fontSize: '0.95rem',
});

export const photoCount = style({
  position: 'absolute',
  right: themeVars.space3,
  bottom: themeVars.space3,
  padding: '0.15rem 0.45rem',
  borderRadius: '999px',
  background: 'rgba(15, 23, 42, 0.7)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 700,
});

export const thumbStrip = style({
  display: 'flex',
  gap: themeVars.space2,
  minWidth: 0,
  overflowX: 'auto',
  paddingBottom: themeVars.space1,
});

export const thumbButton = style({
  width: '3rem',
  height: '3rem',
  flex: '0 0 auto',
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  padding: 0,
  cursor: 'pointer',
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
  width: '3rem',
  height: '3rem',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.accentInk,
  cursor: 'pointer',
});

export const hiddenInput = style({
  display: 'none',
});

export const heroInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  minWidth: 0,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const title = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '1.45rem',
  lineHeight: 1.2,
  fontWeight: 760,
  letterSpacing: 0,
  textWrap: 'balance',
});

export const badgeRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  marginTop: themeVars.space2,
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

export const iconBadge = style({
  width: '1.45rem',
  height: '1.45rem',
  display: 'inline-grid',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  color: themeVars.muted,
  cursor: 'pointer',
});

export const tagRow = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
});

export const tagChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: '0.74rem',
  fontWeight: 650,
});

export const tagRemove = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1rem',
  height: '1rem',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: 'currentColor',
  cursor: 'pointer',
  padding: 0,
});

export const mutedText = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
});

export const specGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: `${themeVars.space3} ${themeVars.space5}`,
  '@media': {
    '(max-width: 40em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const specCell = style({
  display: 'grid',
  gridTemplateColumns: '6rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'baseline',
  minWidth: 0,
  selectors: {
    '&[data-span]': {
      gridColumn: '1 / -1',
    },
  },
});

export const specLabel = style({
  color: themeVars.muted,
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
});

export const specValue = style({
  color: themeVars.text,
  fontSize: '0.84rem',
  fontWeight: 600,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const inlineCode = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space1,
  padding: '0.15rem 0.45rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: '0.75rem',
  fontWeight: 700,
});

export const copyButton = style({
  border: 0,
  background: 'transparent',
  color: 'currentColor',
  padding: 0,
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
});

export const locationCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space4,
  padding: themeVars.space5,
  borderLeft: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
  '@media': {
    '(max-width: 86em)': {
      gridColumn: '1 / -1',
      borderLeft: 0,
      borderTop: `1px solid ${themeVars.lineSoft}`,
    },
  },
});

export const cardTitleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
});

export const cardTitle = style({
  margin: 0,
  color: themeVars.ink,
  fontSize: '0.95rem',
  fontWeight: 720,
});

export const routeList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const routeItem = style({
  display: 'grid',
  gridTemplateColumns: '1.65rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '2rem',
  padding: `0 ${themeVars.space2}`,
  borderRadius: themeVars.radius1,
  color: themeVars.text,
  fontSize: '0.82rem',
  selectors: {
    '&[data-current]': {
      background: themeVars.infoSoft,
      color: themeVars.info,
      fontWeight: 650,
    },
  },
});

export const routeIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  color: 'currentColor',
});

export const routeCode = style({
  color: themeVars.info,
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  fontWeight: 700,
});

export const blockLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  minHeight: '2.2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  color: themeVars.info,
  textDecoration: 'none',
  fontSize: '0.82rem',
  fontWeight: 650,
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
    },
  },
});

export const contentGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(20rem, 0.85fr)',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 78em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const leftColumn = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 64em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const rightColumn = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space4,
  alignItems: 'start',
  '@media': {
    '(max-width: 52em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const sectionCard = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflow: 'hidden',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius3,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minHeight: '3.2rem',
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

export const sectionIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.65rem',
  height: '1.65rem',
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.info,
});

export const sectionBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  padding: themeVars.space4,
});

export const documentStrip = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.space3,
});

export const documentThumb = style({
  minHeight: '4.2rem',
  display: 'grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  border: `1px solid ${themeVars.lineSoft}`,
  color: themeVars.muted,
  selectors: {
    '&[data-card]': {
      background: themeVars.dangerSoft,
      color: themeVars.danger,
    },
  },
});

export const documentAdd = style({
  minHeight: '4.2rem',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: themeVars.space1,
  borderRadius: themeVars.radius2,
  border: `1px dashed ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.info,
  fontSize: '0.8rem',
  cursor: 'pointer',
});

export const kvList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const kvRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(6rem, 0.72fr) minmax(0, 1fr) auto',
  gap: themeVars.space3,
  alignItems: 'center',
  minHeight: '2rem',
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const kvLabel = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
});

export const kvValue = style({
  color: themeVars.text,
  fontSize: '0.83rem',
  fontWeight: 600,
  textAlign: 'right',
  overflowWrap: 'anywhere',
});

export const kvValueButton = style({
  border: 0,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: '0.83rem',
  fontWeight: 600,
  textAlign: 'right',
  cursor: 'pointer',
});

export const iconOnly = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.75rem',
  height: '1.75rem',
  border: 0,
  borderRadius: themeVars.radius1,
  background: 'transparent',
  color: themeVars.muted,
  cursor: 'pointer',
});

export const taskList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const taskRow = style({
  display: 'grid',
  gridTemplateColumns: '1.75rem minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'center',
  padding: `${themeVars.space2} 0`,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  selectors: {
    '&:first-child': {
      borderTop: 0,
    },
  },
});

export const taskIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.55rem',
  height: '1.55rem',
  borderRadius: themeVars.radius1,
  background: themeVars.infoSoft,
  color: themeVars.info,
  selectors: {
    '&[data-tone="danger"]': {
      background: themeVars.dangerSoft,
      color: themeVars.danger,
    },
    '&[data-tone="warning"]': {
      background: themeVars.warningSoft,
      color: themeVars.warningText,
    },
    '&[data-tone="success"]': {
      background: themeVars.successSoft,
      color: themeVars.success,
    },
  },
});

export const taskMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
});

export const taskTitle = style({
  color: themeVars.ink,
  fontSize: '0.84rem',
  fontWeight: 650,
});

export const taskSub = style({
  color: themeVars.muted,
  fontSize: '0.76rem',
});

export const taskState = style({
  color: themeVars.muted,
  fontSize: '0.8rem',
});

export const blockLinkButton = style({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '2.2rem',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius1,
  background: themeVars.panel,
  color: themeVars.info,
  fontSize: '0.82rem',
  fontWeight: 650,
  cursor: 'pointer',
});

export const relatedList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
});

export const relatedRow = style({
  display: 'grid',
  gridTemplateColumns: '2.3rem minmax(0, 1fr) auto',
  gap: themeVars.space3,
  alignItems: 'center',
  color: themeVars.text,
  textDecoration: 'none',
});

export const relatedThumb = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '2.3rem',
  height: '2.3rem',
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const relatedMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
  minWidth: 0,
});

export const relatedName = style({
  color: themeVars.ink,
  fontSize: '0.84rem',
  fontWeight: 650,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const relatedSub = style({
  color: themeVars.muted,
  fontSize: '0.75rem',
});

export const emptyState = style({
  color: themeVars.muted,
  fontSize: '0.82rem',
  padding: themeVars.space3,
  textAlign: 'center',
  background: themeVars.bgSoft,
  borderRadius: themeVars.radius2,
});

export const stockHero = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: themeVars.space2,
  color: themeVars.muted,
});

export const stockValue = style({
  color: themeVars.ink,
  fontSize: '2rem',
  fontWeight: 760,
  fontVariantNumeric: 'tabular-nums',
});

export const warningText = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  color: themeVars.warningText,
  fontSize: '0.76rem',
  fontWeight: 650,
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

export const loanRow = style({
  display: 'grid',
  gridTemplateColumns: '2rem minmax(0, 1fr) auto',
  gap: themeVars.space3,
  alignItems: 'center',
});

export const avatar = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  fontSize: '0.8rem',
  fontWeight: 700,
});

export const loanMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
});

export const timeline = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const timelineRow = style({
  display: 'grid',
  gridTemplateColumns: '2rem minmax(0, 1fr)',
  gap: themeVars.space3,
  alignItems: 'start',
});

export const timelineIcon = style({
  display: 'inline-grid',
  placeItems: 'center',
  width: '1.9rem',
  height: '1.9rem',
  borderRadius: '999px',
  background: themeVars.bgSoft,
  color: themeVars.muted,
});

export const timelineMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
});

export const payload = style({
  display: 'block',
  marginTop: themeVars.space1,
  padding: themeVars.space2,
  borderRadius: themeVars.radius1,
  background: themeVars.bgSoft,
  color: themeVars.muted,
  fontFamily: themeVars.fontMono,
  fontSize: '0.72rem',
  whiteSpace: 'pre-wrap',
});

export const dialogStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
});

export const inlineForm = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: themeVars.space2,
  alignItems: 'end',
  '@media': {
    '(max-width: 38em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.space2,
});
