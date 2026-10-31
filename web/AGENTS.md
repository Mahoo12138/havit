
# Web 前端规则

- 使用 React + TypeScript，不使用 tailwindcss，使用 vanilla-extract。
- UI 优先复用 `src/components/ui`，如果没有需要指出，人工手动去 shadcn 进行复制，然后执行类型迁移。
- 不要直接写内联样式，使用 vanilla-extract 编写样式，组件使用单文件。
- 页面必须考虑响应式适配，移动端适配采取 useDevice 区分组件渲染。
- 表单优先使用项目已有的表单封装。
- UI 中去除没必要的说明文字以及引导性文字

## 页面标题标准

- 页面标题组（`h1` / `h2` + 副标题）统一使用 `uiStyles.pageHeadingCopy`，标题与副标题间距固定 8px。
- 标题与副标题本身用 `textStyles.pageTitle` / `textStyles.pageSubtitle`；不要再写 `.page-heading`、`.page-kicker` 或自定义字号。
- 不要再给副标题单独写 `margin-top`，避免与父级 gap 叠加。

## 字体标准

- 字号/字重/行高/字距只能取 `styles/theme.css.ts` 的 `textSize*` / `weight*` / `leading*` / `tracking*`，不要写 `0.78rem`、`fontWeight: 650` 这类裸值。
- 角色样式统一取 `styles/typography.css.ts` 的 `textStyles`：`pageTitle` / `pageSubtitle` / `sectionTitle` / `cardTitle` / `eyebrow` / `caption` / `metricSm` / `metric` / `metricLg`。
- 指标数字一律走 `textStyles.metric*`（Instrument Serif）。该字体只有 400 一个字重，不要再叠加 600/700，否则浏览器会伪粗体。
- 正文 IBM Plex Sans 只用 400/500/600/700（与 index.html 加载的字重一致）；表单控件的 `font-family` 由全局 `button, input, select, textarea` 规则统一继承。

## 表格卡片标准

- 表格型卡片统一使用 `src/components/ui/table-card` 的 `TableCard`，不要手写 `Card` + toolbar + `Table`。
- 头部信息通过 `title` / `count` / `description` / `filters` / `actions` / `meta` 组合；筛选器放在卡片头部，移动端自动堆叠。
- 卡片头部高度、内边距、分隔线由 `TableCard`（内部复用 `CardToolbar`）统一控制，页面不再自定义 toolbar 样式。
- 表格使用 `Table` 并提供 `aria-label`；分页、批量操作等放在 `footer`。
- 数字列使用 `font-variant-numeric: tabular-nums`；日期和金额使用 `Intl.*`；空状态在表格体内处理。
- 图标按钮必须带 `aria-label`，筛选输入必须有 label 或 `aria-label`。
