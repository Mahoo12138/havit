import { globalStyle, style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/**
 * 异常资产管理 · 移动端专属样式。
 *
 * 与 assetsMobile.css.ts 保持同一套「纸感台账」语汇：纸白卡片、细线分栏、
 * 近直角圆角、几乎为零的阴影。移动端的两处核心改动是：
 *  1. 桌面 8 列表格 → 卡片列表（recordsCard）
 *  2. 320px 侧栏快览列表 → 折进卡片列表上方的一行统计（quickCounts）
 */

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  width: '100%',
  minWidth: 0,
  paddingBottom: '5rem',
});

/* ── KPI 磁贴 ─────────────────────────────────────────────────────────────── */

export const statsScroll = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space3,
  minWidth: 0,
  '@media': {
    '(max-width: 22em)': {
      gap: themeVars.space2,
    },
  },
});

// 「占总资产」这一格跨两列，避免 5 个磁贴排出 2+2+1 的缺口
export const statTileWide = style({
  gridColumn: '1 / -1',
});

export const statTile = style({
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: '1.75rem minmax(0, 1fr)',
  gridTemplateRows: 'auto auto',
  columnGap: themeVars.space2,
  rowGap: '0.05rem',
  alignItems: 'center',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  '@media': {
    '(max-width: 22em)': {
      padding: themeVars.space2,
    },
  },
});

export const statIcon = style({
  width: '1.75rem',
  height: '1.75rem',
  gridRow: '1 / 3',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: themeVars.radius2,
});

export const statIconTone = {
  neutral: {
    background: themeVars.bgSoft,
    color: themeVars.muted,
  },
  red: {
    background: themeVars.dangerSoft,
    color: themeVars.danger,
  },
  orange: {
    background: themeVars.warningSoft,
    color: themeVars.warningText,
  },
  violet: {
    background: themeVars.violetSoft,
    color: themeVars.violet,
  },
  blue: {
    background: themeVars.infoSoft,
    color: themeVars.info,
  },
} as const;

export const statValue = style({
  fontSize: themeVars.textSizeLg,
  lineHeight: themeVars.leadingTight,
  fontWeight: themeVars.weightRegular,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  fontFamily: themeVars.fontSerif,
});

export const statLabel = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/* ── 提示条 ───────────────────────────────────────────────────────────────── */

export const alertBanner = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space2,
  padding: `${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  background: themeVars.dangerSoft,
  border: `1px solid color-mix(in srgb, ${themeVars.danger} 32%, transparent)`,
  color: themeVars.danger,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
  minWidth: 0,
});

export const alertText = style({
  flex: 1,
  minWidth: 0,
});

export const alertLink = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  background: 'transparent',
  border: 0,
  padding: 0,
  color: themeVars.danger,
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
});

/* ── 筛选 ─────────────────────────────────────────────────────────────────── */

export const filterBar = style({
  display: 'flex',
  gap: themeVars.space2,
  alignItems: 'center',
  minWidth: 0,
});

export const searchWrap = style({
  flex: 1,
  minWidth: 0,
  position: 'relative',
});

export const searchIcon = style({
  position: 'absolute',
  left: themeVars.space3,
  top: '50%',
  transform: 'translateY(-50%)',
  color: themeVars.muted,
  pointerEvents: 'none',
});

export const searchInput = style({
  width: '100%',
  height: '2.25rem',
  boxSizing: 'border-box',
  border: `1px solid ${themeVars.line}`,
  borderRadius: themeVars.radius2,
  background: themeVars.bgSoft,
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeBase,
  padding: `0 ${themeVars.space3} 0 2.25rem`,
  outline: 'none',
  selectors: {
    '&::placeholder': { color: themeVars.muted },
    '&:focus': {
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

globalStyle(`${searchWrap} [data-slot="input"]`, {
  background: themeVars.bgSoft,
  paddingLeft: '2.25rem',
});

export const filterBtn = style({
  width: '2.25rem',
  height: '2.25rem',
  display: 'grid',
  placeItems: 'center',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  color: themeVars.muted,
  flex: '0 0 auto',
  position: 'relative',
});

// 收在折叠面板里时，有筛选条件就在按钮右上角点一个印章红小点
export const filterBtnActive = style({
  selectors: {
    '&::after': {
      content: "''",
      position: 'absolute',
      top: '5px',
      right: '5px',
      width: '5px',
      height: '5px',
      borderRadius: '999px',
      background: themeVars.accent,
    },
  },
});

export const filterPanel = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
  minWidth: 0,
  '@media': {
    '(max-width: 24em)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const filterSelectTrigger = style({
  width: '100%',
});

/* ── 快览统计行（替代桌面侧栏列表） ───────────────────────────────────────── */

export const quickCounts = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.space2,
  minWidth: 0,
});

export const quickCount = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '4px 9px',
  borderRadius: '999px',
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  whiteSpace: 'nowrap',
});

globalStyle(`${quickCount} strong`, {
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
  fontVariantNumeric: 'tabular-nums',
});

/* 总条数 / 导出：一行压住列表头 */
export const listHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space3,
  minWidth: 0,
});

export const listCount = style({
  fontSize: themeVars.textSizeSm,
  color: themeVars.muted,
  fontWeight: themeVars.weightMedium,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`${listCount} strong`, {
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
  fontVariantNumeric: 'tabular-nums',
});

/* ── 记录卡片列表 ─────────────────────────────────────────────────────────── */

export const cardList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  minWidth: 0,
});

export const card = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const cardHeader = style({
  display: 'grid',
  gridTemplateColumns: '2.25rem minmax(0, 1fr)',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  '@media': {
    '(max-width: 22em)': {
      gap: themeVars.space2,
    },
  },
});

export const cardThumb = style({
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: themeVars.radius2,
  objectFit: 'cover',
  flexShrink: 0,
  background: themeVars.bgSoft,
  display: 'grid',
  placeItems: 'center',
  color: themeVars.muted,
});

export const cardThumbPlaceholder = style({
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: themeVars.radius2,
  background: themeVars.accentSoft,
  color: themeVars.accentInk,
  display: 'grid',
  placeItems: 'center',
  fontWeight: themeVars.weightBold,
  fontSize: themeVars.textSizeBase,
  flexShrink: 0,
});

export const cardMeta = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

export const cardNameRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minWidth: 0,
});

export const cardName = style({
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

export const cardSub = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/* 卡内 2×2 事实网格：位置 / 责任人 / 异常时间 / 更新于 */
export const cardFacts = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: `${themeVars.space2} ${themeVars.space3}`,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
});

export const fact = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  minWidth: 0,
});

export const factLabel = style({
  fontSize: themeVars.textSize2xs,
  color: themeVars.muted,
  letterSpacing: themeVars.trackingWide,
});

export const factValue = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.ink,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.space2,
  paddingTop: themeVars.space2,
  borderTop: `1px solid ${themeVars.lineSoft}`,
  minWidth: 0,
});

export const cardLoss = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  minWidth: 0,
});

export const cardLossLabel = style({
  fontSize: themeVars.textSize2xs,
  color: themeVars.muted,
});

export const cardLossValue = style({
  fontFamily: themeVars.fontSerif,
  fontSize: themeVars.textSizeMd,
  fontWeight: themeVars.weightRegular,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const cardActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  flexShrink: 0,
  marginLeft: 'auto',
});

/* 进度徽章做成可点的按钮，点开弹窗改处理进度 */
export const progressBtn = style({
  background: 'transparent',
  border: 0,
  padding: 0,
  font: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  selectors: {
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
      borderRadius: '999px',
    },
  },
});

export const emptyState = style({
  textAlign: 'center',
  color: themeVars.muted,
  padding: `${themeVars.space6} 0`,
  fontSize: themeVars.textSizeBase,
});

export const centered = style({
  display: 'grid',
  placeItems: 'center',
  padding: `${themeVars.space7} 0`,
});

/* ── 底部洞察（趋势 / 进度 / 估值） ───────────────────────────────────────── */

export const insightList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: 0,
});

export const insightCard = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space2,
  padding: themeVars.space3,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  boxShadow: themeVars.shadowSoft,
});

export const insightHead = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: themeVars.space2,
  minWidth: 0,
});

export const insightTitle = style({
  margin: 0,
  fontSize: themeVars.textSizeBase,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
  letterSpacing: themeVars.trackingTight,
});

export const insightMeta = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

export const quickGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.space2,
});

export const quickBtn = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  minHeight: '44px',
  padding: `${themeVars.space2} ${themeVars.space3}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.panel,
  cursor: 'pointer',
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingSnug,
  color: themeVars.ink,
  textAlign: 'left',
  textWrap: 'balance',
  transition: 'background-color 150ms ease, border-color 150ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      borderColor: `color-mix(in srgb, ${themeVars.accent} 25%, ${themeVars.line})`,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
  },
});

export const quickIcon = style({
  display: 'flex',
  flexShrink: 0,
  color: themeVars.muted,
});

export const chartEmpty = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: themeVars.space4,
  fontSize: themeVars.textSizeSm,
  color: themeVars.muted,
});

export const trendSvg = style({
  display: 'block',
  width: '100%',
  height: 'auto',
});

export const legend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
  flex: '1 1 8rem',
});

export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});

export const legendDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  flexShrink: 0,
});

export const legendCount = style({
  marginLeft: 'auto',
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
  fontVariantNumeric: 'tabular-nums',
});

export const donutRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: themeVars.space4,
});

export const donutSolo = style({
  display: 'flex',
  justifyContent: 'center',
});

export const valuationRows = style({
  display: 'flex',
  flexDirection: 'column',
});

export const valuationRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: `${themeVars.space2} 0`,
  minWidth: 0,
});

export const valuationLabel = style({
  fontSize: themeVars.textSizeSm,
  color: themeVars.muted,
  flexShrink: 0,
});

export const valuationLeader = style({
  flex: 1,
  minWidth: themeVars.space3,
  borderBottom: `1px dotted ${themeVars.line}`,
});

export const valuationValue = style({
  fontFamily: themeVars.fontSerif,
  fontSize: themeVars.textSizeLg,
  fontWeight: themeVars.weightRegular,
  letterSpacing: themeVars.trackingTight,
  lineHeight: themeVars.leadingTight,
  color: themeVars.ink,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
});

/* ── 弹窗（底部抽屉式） ───────────────────────────────────────────────────── */

export const sheetBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space3,
  minWidth: 0,
});

export const sheetActions = style({
  display: 'flex',
  gap: themeVars.space2,
  paddingTop: themeVars.space1,
});

globalStyle(`${sheetActions} > *`, {
  flex: '1 1 0',
  minWidth: 0,
});

export const sheetHint = style({
  margin: 0,
  fontSize: themeVars.textSizeSm,
  lineHeight: themeVars.leadingNormal,
  color: themeVars.muted,
});

export const sheetSectionTitle = style({
  margin: '0 0 4px',
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
});

export const flowStages = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
});

export const flowStage = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
});

export const flowArrow = style({
  color: themeVars.muted,
  fontSize: themeVars.textSizeSm,
});
