import { globalStyle, style } from '@vanilla-extract/css';
import { themeVars } from '../../styles/theme.css';

/**
 * 借出管理 · 移动端专属样式。
 *
 * 桌面版首屏是「5 张指标卡 + 7 列表格」，窄屏下单列堆叠的指标卡会把
 * 列表整个推到屏幕之外——这正是「几个卡片占满了」的根因。移动端因此：
 *  1. 指标由 5 张大卡 → 2 列小磁贴（statTile），首屏能直接看到列表
 *  2. 7 列表格 → 卡片列表（card），每张卡承载一件借出物的全部字段
 *  3. 逾期提醒由底部大卡 → 列表上方的细提示条（alertBanner），
 *     逾期信息出现在用户第一眼看到的位置
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

// 「累计归还」跨两列，避免 5 个磁贴排出 2+2+1 的缺口
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
  textAlign: 'left',
  '@media': {
    '(max-width: 22em)': {
      padding: themeVars.space2,
    },
  },
});

// 「已逾期」磁贴是可点的：点一下直接跳到逾期分页
export const statTileAction = style({
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  transition: 'border-color 140ms ease, background-color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      borderColor: `color-mix(in srgb, ${themeVars.danger} 35%, ${themeVars.line})`,
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
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
  green: {
    background: themeVars.successSoft,
    color: themeVars.success,
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

export const statValueDanger = style({
  color: themeVars.danger,
});

export const statLabel = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/* ── 逾期提示条 ───────────────────────────────────────────────────────────── */

export const alertBanner = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: themeVars.space2,
  padding: themeVars.space3,
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

globalStyle(`${alertText} strong`, {
  fontWeight: themeVars.weightBold,
  fontVariantNumeric: 'tabular-nums',
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
  selectors: {
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}`,
      borderRadius: themeVars.radius1,
    },
  },
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

export const clearRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: themeVars.space1,
});

/* ── 列表头 ───────────────────────────────────────────────────────────────── */

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

/* ── 借出卡片列表 ─────────────────────────────────────────────────────────── */

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

// 逾期卡：左侧一道印章红细线，扫一眼就能挑出来
export const cardOverdue = style({
  borderColor: `color-mix(in srgb, ${themeVars.danger} 38%, ${themeVars.line})`,
  boxShadow: `inset 3px 0 0 ${themeVars.danger}, ${themeVars.shadowSoft}`,
});

export const cardHeader = style({
  display: 'grid',
  gridTemplateColumns: '2.25rem minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: themeVars.space3,
  minWidth: 0,
  '@media': {
    '(max-width: 22em)': {
      gap: themeVars.space2,
    },
  },
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
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
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

/* 状态徽章：比桌面略小一号，避免在窄卡里喧宾夺主 */
export const statusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  borderRadius: themeVars.radius1,
  fontSize: themeVars.textSize2xs,
  fontWeight: themeVars.weightBold,
  letterSpacing: themeVars.trackingWide,
  padding: `2px ${themeVars.space2}`,
});

export const statusBadgeTone = {
  active: { background: themeVars.accentSoft, color: themeVars.accentInk },
  overdue: { background: themeVars.dangerSoft, color: themeVars.danger },
  due_soon: { background: themeVars.warningSoft, color: themeVars.warningText },
  returned: { background: themeVars.successSoft, color: themeVars.success },
} as const;

/* 卡内 2×2 事实网格：借用人 / 联系方式 / 借出时间 / 预计归还 */
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

export const factValueOverdue = style({
  color: themeVars.danger,
  fontWeight: themeVars.weightSemibold,
});

export const factValueDueSoon = style({
  color: themeVars.warningText,
  fontWeight: themeVars.weightSemibold,
});

export const factValueReturned = style({
  color: themeVars.success,
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

export const cardValue = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  minWidth: 0,
});

export const cardValueLabel = style({
  fontSize: themeVars.textSize2xs,
  color: themeVars.muted,
});

export const cardValueAmount = style({
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
});

/* 卡内动作：触摸目标统一 1.75rem 起，避免桌面那排窄文字按钮在手机上误触 */
export const actionBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  height: '1.75rem',
  padding: `0 ${themeVars.space2}`,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: 'transparent',
  color: themeVars.text,
  font: 'inherit',
  fontSize: themeVars.textSizeXs,
  fontWeight: themeVars.weightMedium,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
    },
    '&:disabled': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
});

// 归还 = 主行动，印章红描边
export const actionBtnPrimary = style({
  color: themeVars.accent,
  borderColor: `color-mix(in srgb, ${themeVars.accent} 40%, ${themeVars.line})`,
  selectors: {
    '&:hover': {
      background: themeVars.accentSoft,
      borderColor: themeVars.accent,
      color: themeVars.accentInk,
    },
  },
});

// 标记遗失 = 低频且后果重，压低成灰字，不跟「归还」抢注意力
export const actionBtnMuted = style({
  color: themeVars.muted,
});

export const iconBtn = style({
  width: '1.75rem',
  height: '1.75rem',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: 'transparent',
  color: themeVars.muted,
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'background-color 140ms ease, color 140ms ease',
  selectors: {
    '&:hover': {
      background: themeVars.bgSoft,
      color: themeVars.ink,
    },
    '&:focus-visible': {
      outline: 'none',
      borderColor: themeVars.accent,
      boxShadow: `0 0 0 3px ${themeVars.focusRing}`,
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

/* 空列表时的引导按钮 */
export const emptyAction = style({
  marginTop: themeVars.space3,
  display: 'flex',
  justifyContent: 'center',
});

/* ── 弹窗（Dialog 自适应，这里只补内部排布） ──────────────────────────────── */

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

globalStyle(`${sheetHint} strong`, {
  color: themeVars.ink,
  fontWeight: themeVars.weightSemibold,
});

export const sheetTarget = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.space2,
  padding: themeVars.space2,
  borderRadius: themeVars.radius2,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
  minWidth: 0,
});

export const sheetTargetMeta = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
});

globalStyle(`${sheetTargetMeta} span`, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const sheetTargetName = style({
  fontSize: themeVars.textSizeSm,
  fontWeight: themeVars.weightSemibold,
  color: themeVars.ink,
});

export const sheetTargetSub = style({
  fontSize: themeVars.textSizeXs,
  color: themeVars.muted,
});
