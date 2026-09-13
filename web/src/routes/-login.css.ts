import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';

import { themeVars } from '../styles/theme.css';

/*
 * 登录页动效：纸感台账 · 印章红
 *
 * 三条线索贯穿全部动效，保证「有趣」但不越出产品气质（Calm / practical）：
 *   墨 —— 低透明度色块缓慢呼吸、聚焦时墨线描出、按下时墨晕扩散
 *   格 —— 台账纸的横格线与双朱栏在入场时徐徐落定
 *   印 —— 品牌标记像印章一样压到纸面，主行动按钮按下即「盖章」
 * 全部动画均为纯 CSS，且在 prefers-reduced-motion 下整体关闭。
 */

/* 纸纤维：内联 SVG 湍流噪声，不产生额外网络请求 */
const PAPER_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E")`;

const EASE_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_STAMP = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

/* ── keyframes ───────────────────────────────────────────────────────── */

/** 纸张落定：微微倾斜着落在桌面上，再摆正 */
const sheetSettle = keyframes({
  '0%': { opacity: 0, transform: 'translateY(20px) rotate(-0.4deg)' },
  '100%': { opacity: 1, transform: 'translateY(0) rotate(0deg)' },
});

/** 印章压下：从高处带倾角落下，回弹后停在略微歪斜的印位上 */
const sealPress = keyframes({
  '0%': { opacity: 0, transform: 'scale(1.8) rotate(-18deg)' },
  '55%': { opacity: 1, transform: 'scale(0.93) rotate(-5deg)' },
  '78%': { transform: 'scale(1.04) rotate(-7deg)' },
  '100%': { opacity: 1, transform: 'scale(1) rotate(-6deg)' },
});

/** 印泥洇开：一圈朱边向外化开后消失 */
const inkRing = keyframes({
  '0%': { opacity: 0.5, transform: 'scale(0.65)' },
  '100%': { opacity: 0, transform: 'scale(2.1)' },
});

/** 墨晕：按钮内部的柔光扩散 */
const inkBloom = keyframes({
  '0%': { opacity: 0, transform: 'scale(0.4)' },
  '35%': { opacity: 0.55 },
  '100%': { opacity: 0, transform: 'scale(1)' },
});

/** 横格线描出 */
const ruleDraw = keyframes({
  '0%': { opacity: 0, transform: 'scaleX(0)' },
  '100%': { opacity: 1, transform: 'scaleX(1)' },
});

/** 朱栏自上而下立起 */
const marginDraw = keyframes({
  '0%': { opacity: 0, transform: 'scaleY(0)' },
  '100%': { opacity: 0.85, transform: 'scaleY(1)' },
});

/** 墨色呼吸 */
const washBreathe = keyframes({
  '0%, 100%': { opacity: 0.35, transform: 'scale(1)' },
  '50%': { opacity: 0.8, transform: 'scale(1.08)' },
});

/** 纸面格线落定 */
const rulesIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-14px)' },
  '100%': { opacity: 0.8, transform: 'translateY(0)' },
});

/** 纸纤维极缓慢游走（近乎无感，只为了让画面不像一张贴图） */
const grainDrift = keyframes({
  '0%': { backgroundPosition: '0 0' },
  '100%': { backgroundPosition: '180px 180px' },
});

/** 内容逐级浮现 */
const riseIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(10px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

/** 盖章那一瞬：先撑开再压下去 */
const stampPress = keyframes({
  '0%': { transform: 'scale(1.05)' },
  '46%': { transform: 'scale(0.95)' },
  '100%': { transform: 'scale(0.982)' },
});

/** 印歪了：拒绝时的横向震颤 */
const shake = keyframes({
  '0%, 100%': { transform: 'translateX(0)' },
  '16%': { transform: 'translateX(-6px)' },
  '36%': { transform: 'translateX(5px)' },
  '56%': { transform: 'translateX(-3px)' },
  '76%': { transform: 'translateX(2px)' },
});

/* ── 页面容器与背景 ─────────────────────────────────────────────────── */

export const screen = style({
  isolation: 'isolate',
});

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
});

/*
 * 视差纵深：光标移动时，墨晕 / 纸纤维 / 浮墨按不同深度随动（--px/--py 由 JS 注入，
 * 仅 pointer:fine 且未要求减弱动效时启用）。纸面格线与双朱栏保持不动，
 * 充当「近纸面」参照系，纵深对比由此而来。
 */
export const plWash = style({
  position: 'absolute',
  inset: '-25% -10%',
  transform: 'translate3d(calc(var(--px, 0) * 18px), calc(var(--py, 0) * 12px), 0)',
  transition: `transform 520ms ${EASE_SETTLE}`,
  willChange: 'transform',
});

/** 顶部一团印章红的墨色，缓慢呼吸（挂在视差层 plWash 之下） */
export const backdropWash = style({
  position: 'absolute',
  inset: 0,
  background: `radial-gradient(ellipse 42% 38% at 50% 22%, color-mix(in srgb, ${themeVars.accent} 13%, transparent), transparent 70%)`,
  animation: `${washBreathe} 14s ease-in-out infinite`,
});

/** 台账横格线 */
export const backdropRules = style({
  position: 'absolute',
  inset: 0,
  opacity: 0.8,
  background: `repeating-linear-gradient(to bottom, transparent 0 31px, ${themeVars.lineSoft} 31px 32px)`,
  animation: `${rulesIn} 900ms ${EASE_SETTLE} 80ms both`,
});

/**
 * 双朱栏：借传统「朱丝栏」纸的意象——纸面上下贯通两道朱线，把整页框成一页账。
 * 强度压得很低，只作为结构性的纤线，不参与强调色叙事。
 */
export const backdropMargin = style({
  position: 'absolute',
  top: '3.25rem',
  bottom: '3.25rem',
  left: 'max(2.5rem, 7vw)',
  width: '1px',
  opacity: 0.85,
  transformOrigin: 'top center',
  background: `color-mix(in srgb, ${themeVars.accent} 26%, transparent)`,
  animation: `${marginDraw} 1200ms ${EASE_SETTLE} 180ms both`,
  '@media': {
    '(max-width: 60em)': {
      display: 'none',
    },
  },
});

export const backdropMarginRight = style([
  backdropMargin,
  {
    left: 'auto',
    right: 'max(2.5rem, 7vw)',
  },
]);

/** 纸纤维（兼作一层浅视差） */
export const backdropGrain = style({
  position: 'absolute',
  inset: '-10%',
  opacity: 0.035,
  mixBlendMode: 'multiply',
  backgroundImage: PAPER_GRAIN,
  backgroundRepeat: 'repeat',
  animation: `${grainDrift} 90s linear infinite`,
  transform: 'translate3d(calc(var(--px, 0) * 5px), calc(var(--py, 0) * 4px), 0)',
  transition: `transform 520ms ${EASE_SETTLE}`,
});

globalStyle('[data-color-scheme="dark"] ' + backdropGrain, {
  opacity: 0.05,
  mixBlendMode: 'screen',
});

/* ── 卡片（纸张） ───────────────────────────────────────────────────── */

export const card = style({
  position: 'relative',
  zIndex: 1,
  transition: 'border-color 240ms ease, box-shadow 240ms ease',
  animation: `${sheetSettle} 620ms ${EASE_SETTLE} both`,
});

/** 纸页堆叠：卡片底下垫着的两页账页，只露出错开的边缘 */
export const cardStack = style({
  position: 'relative',
  width: 'min(100%, 440px)',
  isolation: 'isolate',
});

const stackSettle = keyframes({
  '0%': { opacity: 0, transform: 'translateY(26px) rotate(var(--rot, 0deg))' },
  '100%': { opacity: 1, transform: 'translateY(0) rotate(var(--rot, 0deg))' },
});

export const stackSheet = style({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  borderRadius: themeVars.radius3,
  border: `1px solid ${themeVars.line}`,
  background: themeVars.bgSoft,
  boxShadow: themeVars.shadowSoft,
  transform: 'rotate(var(--rot, 0deg))',
  transformOrigin: '50% 85%',
  animation: `${stackSettle} 760ms ${EASE_SETTLE} both`,
});

export const stackSheetBack = style([stackSheet, {
  vars: { '--rot': '-1.15deg' },
}]);

export const stackSheetMid = style([stackSheet, {
  vars: { '--rot': '0.8deg' },
}]);

/** 登录被拒：纸面染上一层警戒红边 */
export const cardError = style({
  selectors: {
    '&.auth-card': {
      borderColor: themeVars.danger,
      boxShadow: `0 0 0 3px ${themeVars.dangerSoft}, ${themeVars.shadow}`,
    },
  },
});

/* ── 印章式品牌标记 ─────────────────────────────────────────────────── */

/** 印章待机呼吸：墨压完毕之后，印面仍旧缓缓地呼吸 */
const sealBreathe = keyframes({
  '0%, 100%': {
    boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${themeVars.onAccent} 40%, transparent), 0 4px 12px color-mix(in srgb, ${themeVars.accent} 24%, transparent)`,
  },
  '50%': {
    boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${themeVars.onAccent} 58%, transparent), 0 5px 17px color-mix(in srgb, ${themeVars.accent} 34%, transparent)`,
  },
});

export const sealMark = style({
  position: 'relative',
  display: 'grid',
  width: '3rem',
  height: '3rem',
  marginInline: 'auto',
  marginBottom: themeVars.space2,
  placeItems: 'center',
  borderRadius: themeVars.radius2,
  background: themeVars.accent,
  color: themeVars.onAccent,
  fontFamily: themeVars.fontSerif,
  fontSize: '1.7rem',
  lineHeight: 1,
  // 内圈细边 = 印面的边框，外投影 = 墨迹压在纸上的重量
  boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${themeVars.onAccent} 42%, transparent), 0 4px 12px color-mix(in srgb, ${themeVars.accent} 26%, transparent)`,
  transformOrigin: '50% 55%',
  animation: `${sealPress} 760ms ${EASE_STAMP} 60ms both, ${sealBreathe} 6.5s ease-in-out 1.15s infinite`,
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '-5px',
      border: `1.5px solid ${themeVars.accent}`,
      borderRadius: themeVars.radius3,
      opacity: 0,
      pointerEvents: 'none',
      animation: `${inkRing} 1100ms ease-out 480ms both`,
    },
  },
});

/* ── 落款流水号：右上角的册页编号，翻牌般递增到「今日这页」 ─────────── */

export const folio = style({
  position: 'absolute',
  top: '0.9rem',
  right: '1.05rem',
  zIndex: 1,
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '0.24rem',
  border: `1px solid ${themeVars.lineSoft}`,
  borderRadius: themeVars.radius1,
  padding: '0.16rem 0.48rem',
  background: `color-mix(in srgb, ${themeVars.panel} 82%, transparent)`,
  color: themeVars.muted,
  fontFamily: themeVars.fontMono,
  fontSize: '0.64rem',
  fontWeight: 500,
  letterSpacing: '0.14em',
  whiteSpace: 'nowrap',
});

/** 编号本身用衬线台账数字、落一点印章红的淡墨 */
export const folioNum = style({
  color: themeVars.accentInk,
  fontFamily: themeVars.fontSerif,
  fontSize: '0.88rem',
  letterSpacing: '0.02em',
  fontVariantNumeric: 'tabular-nums',
});

/* ── 登记行（横线 + 台账抬头） ──────────────────────────────────────── */

export const entryRule = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: themeVars.space3,
  marginTop: themeVars.space1,
});

export const entryRuleLine = style({
  flex: '1 1 0',
  minWidth: '1rem',
  height: '1px',
  transformOrigin: 'center',
  background: `color-mix(in srgb, ${themeVars.line} 92%, transparent)`,
  animation: `${ruleDraw} 760ms ${EASE_SETTLE} 300ms both`,
});

export const entryRuleLabel = style({
  flex: '0 0 auto',
  color: themeVars.muted,
  fontFamily: themeVars.fontMono,
  fontSize: '0.64rem',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

/* ── 输入框：聚焦时墨线自中间描出 ───────────────────────────────────── */

export const fieldRule = style({
  position: 'relative',
});

globalStyle(`${fieldRule}::after`, {
  content: '""',
  position: 'absolute',
  left: '1px',
  right: '1px',
  bottom: 0,
  height: '2px',
  borderRadius: `0 0 ${themeVars.radius2} ${themeVars.radius2}`,
  background: themeVars.accent,
  transform: 'scaleX(0)',
  transformOrigin: 'center',
  transition: `transform 320ms ${EASE_SETTLE}`,
  pointerEvents: 'none',
});

globalStyle(`${fieldRule}:focus-within::after`, {
  transform: 'scaleX(1)',
});

/* ── 盖章式主行动 ───────────────────────────────────────────────────── */

export const stampButton = style({
  selectors: {
    '&[data-slot="button"]': {
      position: 'relative',
      height: '2.6rem',
      overflow: 'hidden',
      isolation: 'isolate',
      fontWeight: 600,
      letterSpacing: '0.02em',
      transition: `transform 140ms ${EASE_STAMP}, background-color 160ms ease, box-shadow 220ms ease, opacity 180ms ease`,
    },
    // 墨晕层：按钮自身的伪元素，状态类只负责给它挂动画
    '&[data-slot="button"]::after': {
      content: '""',
      position: 'absolute',
      inset: '-40%',
      borderRadius: '999px',
      opacity: 0,
      pointerEvents: 'none',
      background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${themeVars.onAccent} 26%, transparent), transparent 68%)`,
    },
    '&[data-slot="button"]:hover:not(:disabled)': {
      boxShadow: `0 6px 16px color-mix(in srgb, ${themeVars.accent} 28%, transparent)`,
    },
    '&[data-slot="button"]:active:not(:disabled)': {
      transform: 'translateY(1px) scale(0.985)',
    },
  },
});

export const stampLabel = style({
  position: 'relative',
  zIndex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: themeVars.space2,
});

/** 等待落印：墨晕持续扩散 */
export const stampPending = style({
  selectors: {
    '&[data-slot="button"]::after': {
      animation: `${inkBloom} 1.4s ease-in-out infinite`,
    },
  },
});

/** 已盖章：按下并停住，内圈出现印边 */
export const stampSealed = style({
  selectors: {
    '&[data-slot="button"]': {
      opacity: 1,
      cursor: 'default',
      transform: 'scale(0.982)',
      boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${themeVars.onAccent} 55%, transparent), 0 6px 18px color-mix(in srgb, ${themeVars.accent} 26%, transparent)`,
      animation: `${stampPress} 460ms ${EASE_STAMP} both`,
    },
    '&[data-slot="button"]:disabled': {
      opacity: 1,
      cursor: 'default',
    },
    '&[data-slot="button"]::after': {
      animation: `${inkBloom} 620ms ease-out both`,
    },
  },
});

/** 印歪了：抖动一次 */
export const stampShake = style({
  selectors: {
    '&[data-slot="button"]': {
      animation: `420ms cubic-bezier(0.36, 0.07, 0.19, 0.97) ${shake}`,
    },
  },
});

/* ── 内容逐级浮现（延迟递增） ───────────────────────────────────────── */

export const rise = styleVariants({
  r1: { animation: `${riseIn} 560ms ${EASE_SETTLE} 60ms both` },
  r2: { animation: `${riseIn} 560ms ${EASE_SETTLE} 110ms both` },
  r3: { animation: `${riseIn} 560ms ${EASE_SETTLE} 160ms both` },
  r4: { animation: `${riseIn} 560ms ${EASE_SETTLE} 210ms both` },
  r5: { animation: `${riseIn} 560ms ${EASE_SETTLE} 260ms both` },
  r6: { animation: `${riseIn} 560ms ${EASE_SETTLE} 310ms both` },
  r7: { animation: `${riseIn} 560ms ${EASE_SETTLE} 360ms both` },
  r8: { animation: `${riseIn} 560ms ${EASE_SETTLE} 410ms both` },
});

export const actionRow = style({
  position: 'relative',
  display: 'grid',
});

/* ── 浮墨：纸面上缓缓上浮的墨点与朱砂点 ─────────────────────────────── */

const dustRise = keyframes({
  '0%': { opacity: 0, transform: 'translate(0px, 34px)' },
  '14%': { opacity: 0.7 },
  '52%': { transform: 'translate(13px, -44px)' },
  '86%': { opacity: 0.4 },
  '100%': { opacity: 0, transform: 'translate(-6px, -128px)' },
});

/**
 * 浮墨层。等比例铺满视口（xMidYMid slice），所以圆点在任何窗口比例下都不会被拉成椭圆；
 * 每颗粒子的持续时间与延迟由 JSX 内联给出（程序化生成的粒子场，内联只承载时序）。
 * 整个粒子场本身也是最深的一层视差。
 */
export const dustField = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  transform: 'translate3d(calc(var(--px, 0) * 13px), calc(var(--py, 0) * 10px), 0)',
  transition: `transform 520ms ${EASE_SETTLE}`,
});

export const dustInk = style({
  opacity: 0.45,
  fill: `color-mix(in srgb, ${themeVars.ink} 50%, transparent)`,
  animation: `${dustRise} 26s linear infinite`,
});

export const dustSeal = style({
  opacity: 0.55,
  fill: `color-mix(in srgb, ${themeVars.accent} 52%, transparent)`,
  animation: `${dustRise} 32s linear infinite`,
});

/* ── 印章飞溅：登录成功「盖章」那一瞬的印泥飞溅 ─────────────────────── */

const splashOut = keyframes({
  '0%': { opacity: 0, transform: 'translateX(0px) scale(0.3)' },
  '16%': { opacity: 0.95 },
  '100%': { opacity: 0, transform: 'translateX(44px) scale(1)' },
});

const splashRingOut = keyframes({
  '0%': { opacity: 0.55, transform: 'scale(0.32)' },
  '100%': { opacity: 0, transform: 'scale(1.65)' },
});

export const splash = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: '15rem',
  height: '15rem',
  marginLeft: '-7.5rem',
  marginTop: '-7.5rem',
  pointerEvents: 'none',
  zIndex: 2,
});

export const splashDrop = style({
  fill: `color-mix(in srgb, ${themeVars.accent} 88%, transparent)`,
  transformBox: 'view-box',
  transformOrigin: '50% 50%',
  animation: `${splashOut} 520ms cubic-bezier(0.22, 1, 0.36, 1) both`,
});

export const splashDropInk = style([
  splashDrop,
  { fill: `color-mix(in srgb, ${themeVars.ink} 62%, transparent)` },
]);

export const splashRing = style({
  fill: 'none',
  stroke: `color-mix(in srgb, ${themeVars.accent} 60%, transparent)`,
  strokeWidth: 0.8,
  transformBox: 'view-box',
  transformOrigin: '50% 50%',
  animation: `${splashRingOut} 460ms cubic-bezier(0.22, 1, 0.36, 1) both`,
});

/* ── 降低动效偏好：整体关闭，只保留终态 ─────────────────────────────── */

globalStyle(`@media (prefers-reduced-motion: reduce) ${screen}.${screen} *`, {
  animation: 'none',
  transition: 'none',
});

globalStyle(`@media (prefers-reduced-motion: reduce) ${screen}.${screen} *::before`, {
  animation: 'none',
  transition: 'none',
});

globalStyle(`@media (prefers-reduced-motion: reduce) ${screen}.${screen} *::after`, {
  animation: 'none',
  transition: 'none',
});
