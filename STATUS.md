# Havit 开发状态记录

> 本文档由开发过程持续维护，记录当前进行中的工作、最近完成的内容与下一步计划。
> 完整的里程碑规划与功能分区进度见 `PROJECT.md`，产品需求见 `docs/havit-product-design.md`。

更新时间：2026-10-31

## 当前阶段

**1.0.0 发布候选（RC）**

- 主要发布阻断项已修复，见下方 2026-10-31 记录。
- 全量 E2E：71/71 通过（16.3 分钟）；Go vet/test、前端构建、govulncheck 通过，pnpm audit 仅剩 1 个无修复版本的低危告警。
- 待完成：Docker 实机构建（CI 已配置）、真机扫码/外部 AI/通知端点验收。
- 历史 S0-S3 进度与功能分区见 `PROJECT.md`。

## 基线验证（2026-09-13，登录页动效改造后）

| 检查项 | 命令 | 结果 |
|---|---|---|
| 前端构建 | `vite build` | 通过（`tsc -b` 仍报工作区既有的半成品类型错误，见「最近完成」备注） |
| E2E | `pnpm test:e2e` | 67 passed / 1 failed（失败项为搜索页既有问题，与本次改动无关） |

## 基线验证（2026-09-12，凭证保修闭环收尾后）

| 检查项 | 命令 | 结果 |
|---|---|---|
| Go 测试 | `go test ./...` | 通过（新增凭证 CRUD/隐私 6 组测试） |
| 前端构建 | `pnpm build` | 通过 |
| E2E | `pnpm test:e2e` | 61 条全部通过（新增凭证保修 3 条） |

## 最近完成

- 2026-10-31：**1.0.0 发布加固**。
  - 隐私：退出、容器挂入/移除、位置删除、异常详情/更新/统计统一补可见性校验；新增跨账号写路径测试。
  - 前端：移除鉴权 API 的 PWA 运行时缓存，登录/退出清理旧缓存；物品列表不再默认截断 50 条；资产搜索补齐 FTS 转义与短中文 LIKE 兜底。
  - 数据：备份加入 `config.yaml`，密钥读取/持久化失败阻断启动；备份改为原子写入、串行执行并限制 Owner；新增旧库用户资料字段兼容修复。
  - 资产：统一 `in_use` 状态，创建支持初始状态；默认可见性接入创建流程，新增物品私密切换和移动端私有位置开关。
  - 发布：统一版本 1.0.0，修复干净克隆 embed 占位，升级 chi/JWT/TanStack/seroval，Docker 使用 Go 1.26.10 + Alpine 3.22，新增 CI 与 API 文档。
  - 验证：Go `vet/test`、前端 `pnpm build`、全量 Playwright **71/71** 通过（16.3 分钟）；`govulncheck` 0 个可达漏洞，`pnpm audit --prod` 仅 1 个 low。

- 2026-10-29 / 30：**账户设置：头像、昵称与登录密码**。此前没有任何配置用户自身数据的入口。
  - 后端：`users` 表新增 `nickname` / `email` / `bio` / `avatar` 四列。项目尚未发布，迁移历史已压平：
    现在只有 `0001_init.sql` 一个初始化文件，直接建出最终结构（旧库记录的 2-4 版本号会被 goose 忽略）。
    `GET /auth/me` 返回完整资料；`PATCH /api/v1/auth/me`
    一次保存昵称/邮箱/说明/头像（昵称 ≤40 字、邮箱经 `net/mail` 校验、说明 ≤200 字、头像仅接受
    png/jpeg/webp 的 data URL 且 ≤400KB）。头像由前端裁切压缩成 256×256 JPEG data URL 后入库。
    `POST /api/v1/auth/me/password` 校验当前密码后改密，递增 `token_version` 让其他设备下线，
    同时回发新 JWT / 刷新 cookie 保持当前设备登录；demo 模式拒绝改密（403 `demo_readonly`），资料编辑放开。
  - 前端：设置页把「账户」「个人偏好」合并为「我的」tab，详情区不再重复面板标题与描述；
    「个人资料」改为账号卡片（头像 / 昵称 / 登录名 / 说明 / 角色）+「编辑」「修改密码」两个弹窗，
    弹窗内可上传或移除头像、改昵称、填邮箱与说明；头像同步显示在页眉账户菜单、移动端顶栏与抽屉。
  - 错误码：新增 `invalid_current_password`（400，不能复用 401——前端对任何 401 都会清 token 并跳登录）。
  - 验证：`go test ./...` 通过（昵称/邮箱/说明/头像校验、demo 拒绝、旧 token 失效、新 token 可用）；
    `tsc -b`、`pnpm build` 通过；Playwright `account/settings/login/mobile` 共 17 条通过
    （含头像上传、资料持久化、demo 改密只读）；release 模式实测改密后会话保持、旧密码失效。

- 2026-09-17：**异常资产管理页移动端响应式适配**。
  - 根因：`web/src/routes/abnormal.tsx` 对**所有设备**都渲染 `AbnormalDesktop`，而
    `abnormalTwoCol`（`minmax(0,1fr) 320px`）只在 `max-width: 64em` 折成一列——8 列主表格
    本身从不重排、320px 的侧栏快览列表也照常渲染，两者在手机上必然溢出。
  - 新增 `web/src/features/abnormal/AbnormalMobile.tsx` + `abnormalMobile.css.ts`，与
    `assetsMobile` 同一套「纸感台账」语汇；`abnormal.tsx` 改为按 `useDevice()` 分流
    （与 `assets.tsx` / `supplies.tsx` 一致）。**桌面实现未改动。**
  - 8 列主表格 → 卡片列表：删掉 `<Table>`，每张卡 = 缩略图 + 名称/类型·SN，加一个 2×2 事实
    网格（位置 / 责任人 / 异常时间 / 更新于），页脚放衬线体预损金额 + 进度徽章 + 查看按钮；
    搜索框改为对当前页做客户端过滤（桌面走服务端筛选）。
  - 320px 侧栏快览列表 → 一行类型计数 chip（`quickCounts`）：四种类型各一枚「类型 + 数量」
    胶囊，颜色点与图表配色一致，既保住「一眼看全类型分布」的信息，又不再占一整块竖排空间。
  - 其余移动化：KPI 五磁贴 2 列网格（「占总资产」跨两列，避免 2+2+1 的缺口）；进度徽章改成
    可点按钮，弹窗内用 2 列状态网格直接改状态（取代桌面表格单元格里的内联 Select）；弹窗复用
    已响应式的 `Dialog`，底部按钮做成等宽；接 `havit:mobile-primary-action` 让底部导航「+」
    直接打开「新增异常」；写操作按 `useNetworkStatus()` 门控。
  - 验证：`tsc --noEmit` 0 错误、`vite build` 通过；Playwright 在 390×844 与 320×640 两个
    视口核对（`table` 数为 0、卡片数为 5），逐屏确认卡片流 / 筛选面板 / 进度弹窗 / 底部洞察卡
    （趋势图、环形图、估值点线行）排版正常。一次性 harness 用完已删。

- 2026-09-17：**页眉通知浮层排版修复（铃铛 Popover「一沓糊涂」）**。
  - 根因：`76ba8238`（card/tab/table 样式统一）把 Card 表面烘焙进组件后，页面卡片的行式列表
    改为 flush 布局，但**浮层内的 `ReminderRow` 没有跟上**——行没有左右内边距、操作按钮仍是
    默认尺寸（2.25rem 高 / `0 1rem` 内边距），又撞上 `PopoverContent` 写死的 `width: 18rem`
    与 `.panel` 的 `22rem` 打架，于是按钮占掉大半行宽、左右边界对不齐。
  - `reminderUi.css.ts`：新增 `rowCompact`（浮层专用紧凑行高 2.5rem）、`rowIcon`（1.25rem 定宽
    图标槽，hover 转 `accentInk`）；`rowActions` 固定 `width: 3.5rem` + 右对齐，使「两个图标按钮」
    的待处理行与「一个 Badge」的已处理行共享同一条右边界；`row` 加 `minHeight` / `boxSizing`
    消除有无 meta 行之间的高度抖动。浮层区新增 `panelHead/panelLink/panelBody/panelFoot/
    panelCenter/panelEmpty`，`panel` 用 `margin: -space3` 抵消浮层自身内边距，让 header、列表、
    页脚共用同一条 `space4` 左右规线；`pageCard` 行内边距由 `space3` 收到 `space2`。
  - `reminderUi.tsx`：`ReminderRow` 新增 `compact` 变体；操作按钮改 `size="icon-xs"`（1.75rem）。
  - `NotificationBell.tsx`：加载态套 `panelCenter` 居中（原先 `Spinner` 在 flex 列里被拉成整行、
    视觉飘在左上角）；「查看全部」换成 `panelLink` 并在无提醒时隐藏；「还有 N 条」换成带分隔线的
    `panelFoot` 页脚（原先复用 `empty` 样式，与头部链接样式不一致）。
  - `popover.css.ts`：`content` 由写死的 `width: 18rem` 改为 `width: fit-content` +
    `maxWidth: calc(100vw - 1.5rem)`，宽度交给消费者决定（`reminderUi.panel` 现为 23rem）。
    其余 Popover 消费者（actionMenu 13rem、overflowPopup、date-picker、location picker）本就自带
    显式宽度，不受影响；`overflowPopup` 的 `&&` 覆写补了 `minWidth: 0` 以保住原来的收缩行为。
  - 验证：`tsc -b` 与 `vite build` 通过；用 Playwright 起的 demo 后端 + 注入 8 条提醒，
    对亮/暗两套配色、空态与列表态分别截图核对（浮层宽 368px，10 个操作按钮布局对齐）。

- 2026-09-17：**提醒文案动态 key 修复（`warranty_<N>d` 泄漏成裸 key）**。
  - 根因：后端 `item.go` 的 `replaceWarrantyReminders` 用
    `fmt.Sprintf("warranty_%dd", offsetDays)` 按**设置的提醒天数**产出类型，而 i18n 只写了
    `warranty_30d` / `warranty_7d` 两个字面 key。天数一旦不是默认的 30/7，翻译就落空，
    前端 `t(key, type)` 的 fallback 把 `warranty_45d` 这种裸 key 直接显示给用户。
  - `reminderUi.tsx`：`reminderLabel` 改为先按模式匹配 `warranty_<N>d` / `loan_due_<N>d`，
    命中则用格式化 key `reminder.warrantyDays` / `reminder.loanDueDays`（带 `{{count}}`）；
    未命中已知类型的，fallback 从「裸 key」改为通用文案 `reminder.default`。
  - i18n：`reminder` 命名空间新增 `warrantyDays` / `loanDueDays`，删掉已被模式取代的
    `warranty_30d` / `warranty_7d`（现有 30/7 的显示文案不变）。
  - 顺带收口：`OperationsDesktop.tsx` 与 `DashboardMobile.tsx` 各自内联的
    `t(\`reminder.${r.type}\`, r.type)` 改为复用导出的 `reminderLabel`，三处终于同源。
  - 验证：`tsc -b` 与 `vite build` 通过；注入 `warranty_45d` / `warranty_90d` / 未知类型
    `some_future_type`，中英双语核对——`保修到期前 45 天` / `Warranty, 90 days left` 正常解析，
    未知类型显示通用 `提醒` / `Reminder`，不再泄漏裸 key，30/7 的既有文案未变。
    相关 E2E 17 条（supplies / loans / mobile / settings）全通过。

- 2026-09-13：**登录页动效设计（把「纸感台账 · 印章红」做成可感知的动效）**。
  - 新增 `web/src/routes/-login.css.ts`（`-` 前缀遵循 TanStack Router 的 `routeFileIgnorePrefix`，
    routes/ 下的非路由文件必须这样命名）。
  - 线索一「墨」：顶部一团印章红墨色 14s 缓慢呼吸；纸纤维用内联 SVG `feTurbulence` 噪声
    极缓慢游走（不产生额外网络请求）；输入框聚焦时墨线自中间描出；按钮按下时墨晕在内部扩散。
  - 线索二「格」：台账横格线自上落定；双朱栏（借传统「朱丝栏」纸的意象）分别自上下立起，
    把整页框成一页账；窄屏自动隐藏朱栏。
  - 线索三「印」：品牌标记做成印章「H」——从高处带倾角压到纸面、回弹后停成 -6°，印泥圈向外洇开；
    主行动按钮做成「盖章」：等待落印时墨晕脉冲，成功回执时按钮压下去停住、内缘出现印边、
    文案切到「已盖章」+ 勾，被拒时按钮横向震颤一次且卡片纸面染上警戒红边。
  - 节奏：内容按 8 级（60→410ms）延迟逐级浮现，卡片以 0.4° 的微小倾角「落到桌面」再摆正；
    登录成功回执停留 420ms 后再跳转，给「盖章」留一瞬。
  - 无障碍：装饰层（背景、印章标记、登记行）全部 `aria-hidden`；`prefers-reduced-motion: reduce`
    时统一关闭全部动画与过渡并跳过 420ms 回执停留；键盘可直达提交，无 hover 依赖。
  - 文案：新增 `auth.ledgerEntry`、`auth.sealed`（en / zh-CN）。
  - 追加三层 SVG 视觉（第二轮）：
    - **浮墨粒子场**：`<svg>` + 24 颗墨点/朱砂点缓缓上浮（rise + sway + 淡入淡出），
      `viewBox 1000×700` 配 `preserveAspectRatio="xMidYMid slice"` 等比铺满视口，
      圆点在任意窗口比例下都不会被拉成椭圆；x/y 收在中央带，保证窄屏裁切后仍留得住粒子。
    - **边缘刻度**（已于同日按要求移除）：曾在卡片左边栏排 20 道墨线刻度，
      后经用户确认删除；`vector-effect: non-scaling-stroke` 保证 `preserveAspectRatio="none"`
      拉伸下仍是 1px 发丝线——该结论仍适用于其他 SVG 细线。
    - **印章飞溅**：登录成功「盖章」那一瞬，按钮中心按 22 道射线甩出印泥/墨点（角度、缩距、
      粒径、时长各不相同）+ 一圈墨环，只在回执期间挂载，动画自然只跑一次。
  - 追加一层「纵深与巧思」（第三轮）：
    - **光标视差**：墨晕 / 纸纤维 / 浮墨三层按不同深度（18/5/13px）随光标随动，
      纸面格线与双朱栏保持不动充当近纸面参照系；仅 `pointer:fine` 且未要求减弱动效时
      由 JS 注入 `--px/--py`（rAF 节流），各层用 `calc(var(--px) * depth)` 换算位移 + 缓出过渡。
    - **纸页堆叠**：卡片底下垫两页账页（`-1.15° / 0.8°`），只露出错开的边缘，
      让登录卡读起来像一册账本的顶页；随卡片一同落定入场。
    - **落款流水号**：卡片右上角细线小框 `No. N`（N=今天是今年第几页），衬线台账数字
      落一点印章红淡墨，入场时数字翻牌递增到「今日这页」。
    - **印章待机呼吸**：顶部印章在压印落位后，印面内圈细边与外投影继续缓慢呼吸（box-shadow 双动画）。
  - 踩坑记录：绝对定位的 `<svg>` 是 replaced element，`height: auto` 会退回 viewBox 的固有比例
    （刻度只铺满顶部一小段），必须显式给 `height`；已在 `-login.css.ts` 注释标明。
  - 验证：`vite build` 通过（已逐条核对产出的选择器）；新增 `web/e2e/login.spec.ts` 3 条
    （装饰层不进无障碍树 / 键盘提交 / 减弱动效下仍可登录）通过；全量 E2E 67 passed / 1 failed。
  - 视觉核对：`tmp/login-shots/` 下截图（`final-*` 亮/暗整页、印章区、盖章飞溅；
    `noScale-*` 为移除左缘刻度后的复检）。
  - 备注（两项均与本次改动无关）：
    - `pnpm build` 里的 `tsc -b` 仍会失败，报错集中在工作区既有的半成品文件
      `pagination.tsx`、`AssetsDesktop.tsx`、`AbnormalDesktop.tsx`、`ReturnLog.tsx`（本次未触碰）。
    - 唯一 E2E 失败项 `search.spec.ts`「hides archived items by default and shows them when the
      preference is on」：13:39 的搜索页重构（`2ce6c6c1`）把空结果态改成「Loading / AI refining…」，
      该断言未同步更新；单独重跑 `search.spec.ts` 同样复现（ARIA 快照显示页面停在 Loading 态）。

- 2026-09-12：**凭证保修页面闭环（/credentials 从只读聚合到可用闭环）**。
  - 后端：`VirtualAssetService` 新增全局凭证聚合列表（JOIN items + 隐私过滤，
    替代前端 N+1 串行取数）、PATCH/DELETE 凭证（授权码语义：缺省不改、
    空串清除、有值重加密）；所有凭证读写补 `itemVisible` 隐私校验（修复越权
    读写隐患）；凭证增删改写入 `item_events` 台账（credential_created/updated/deleted）。
  - 前端：`/credentials` 重构为容器 + 双 Tab（`WarrantyTab`/`CredentialsTab`）——
    保修 Tab 三态状态徽标（有效/即将到期/已过期）、状态筛选、保修编辑弹窗
    （改到期日自动重建保修提醒）；凭证 Tab 单次聚合取数、平台筛选、添加/编辑/
    删除凭证、授权码显隐与复制、空态引导；可复用 `CredentialFormDialog` 同时
    挂到物品详情页（桌面 + 移动），补齐虚拟资产录入入口。
  - 顺带修复 `SelectField` 以 label 文本作 id 导致含空格/中文标签 aria 关联
    失效的无障碍缺陷（改用 useId）。
  - 测试：service 单测覆盖 CRUD、授权码加密落库、隐私隔离；E2E 覆盖聚合 API
    往返、页面增删改闭环、保修徽标与编辑闭环。

- 2026-09-12：**设计风格颠覆性重确立：纸感台账 · 印章红（第三轮视觉重设计）**。
  - 方向决策：经用户确认，从「白卡片 + teal + 深藏青侧边栏」的温和 SaaS 风，
    颠覆为「纸感台账 · 印章红」——纸白底（#f4f1e9）+ 纸页面板（#fbf9f3）+
    墨黑文字 + 细线分栏 + 衬线台账数字，印章红（#ad3a25）作为唯一强调色，
    只用于主行动、激活态与告警；信息架构、路由与交互全部保留。
  - `theme.css.ts` 全量重写（亮/暗双主题，token 契约不变，48 个样式文件零改动跟随）：
    中性色转暖纸色系，半径收敛为 2/4/6/8px 近直角，阴影近乎清零（纸面无高光），
    暗色定义为「灯下墨」暖黑反转（#161410 底 + #d9603f 亮印章红）。
  - 字体：正文 Outfit → IBM Plex Sans（登记表格气质），等宽 → IBM Plex Mono，
    数字/点睛沿用 Instrument Serif（Ledger Numerals），Google Fonts 链接同步更新。
  - 品牌物料：PWA 图标与 manifest 主题色改印章红方章，侧边栏/抽屉/头像的
    accent 渐变全部改平色印章（印章不发光），移动端底部中央 FAB 改为
    「盖章」式印章红主行动；桌面侧边栏定为深墨书脊 + 纸色文字 + 印章红激活条。
  - 硬编码色清理：mobileShell/资产 FAB/图片计数角标/异常横幅/标签色板/
    异常进度色/内联 var() fallback 全部对齐新 token；顺带修正
    LocationScan/Operations/QrScanner 中写错的 CSS 变量名（--line → --havit-line 等）。
  - 数字排版统一：statValue/metaChipValue/itemStockValue/loanMetricValue 四处
    大数字并入衬线台账数字词汇（与 KPI 条一致）。
  - judge 视觉验收抓出并修复 4 个上一轮遗留缺陷：侧边栏语言标签重复
    （Desktop/Tablet 壳层）、移动端位置页根级面包屑与标题重复、消耗品移动端
    页签条溢出时左缘裁切（justify-content center 改 auto margin 居中，注意
    vanilla-extract 不允许 style() 内 `& > *` 子选择器，需走 globalStyle）、
    移动端消耗品 KPI 与桌面口径不一致（补上预测型 7 天内到期计入待补货）。
  - 验证：`tsc -b`、`pnpm build` 通过；`pnpm test:e2e` 49 条全部通过；
    桌面亮/暗 + 移动端共 15 页截图 judge 复检（第二轮）确认修复。
- 2026-09-12：**UI 视觉统一化重设计（第二轮，接续 09-11 critique）**。
  - 仪表盘 KPI 改为单卡台账条（1px 缝隙 hairline 分隔网格，任意换行分隔线都正确），
    图标统一 teal tint、数值衬线 tabular-nums，修复 3+2 参差换行与斜向布局。
  - 消除「图片加载失败」观感：分类瓷砖（桌面+移动）从大色块占位图改为 2.5rem
    分类色首字符瓷砖；仪表盘最近添加/资产表格与卡片/位置详情行/补货预测的灰色
    图片图标占位统一改为首字符瓷砖。
  - 三页指标砖统一为一套词汇：资产页 statIcon 四色变体、消耗品页 supplyKpiIcon
    六色变体收敛为统一 accentSoft/accentInk；资产页数值改衬线（Ledger Numerals）。
  - 清理「—」假数据占位：总价值显示 ¥0，零价格直接留空。
  - 消耗品趋势图：容器不再整块铺 accent 渐变；全零月份走空态文案；柱状图修复
    百分比高度不生效（列高度 100% + justify-end）并加 hairline 基线。
  - 快捷操作格去掉逐格边框（更安静的 rail）；分类瓷砖 hover 去上浮动效。
  - 修复 mobile.spec.ts 位置创建用例：入口已从页面内 FAB 收敛为顶栏「+」primary
    action（上一轮改动遗留），用例改为点击顶栏按钮并更名。
  - 验证：`tsc -b`、`pnpm build`、`pnpm test:e2e` 49 条全部通过。
- 2026-09-10：**移动端四主链路 E2E（S2.1 自动化覆盖）**。
  - 新增 `web/e2e/mobile.spec.ts` 8 条（390×844 移动端视口）：底部导航/子页返回键、
    资产列表→详情、资产搜索与创建、位置下钻/面包屑/直挂物品、位置创建、消耗品页签与
    补货清单、消耗品详情 Use One。
  - 顺带修复真机验收才会暴露的问题：`/supplies/:id` 被 TanStack 生成为 `/supplies` 的
    子路由，而父页面（移动/桌面）都没有渲染 `<Outlet/>`，导致消耗品详情两个端都只显示
    列表页；`supplies.tsx` 现对子路由渲染 `Outlet`。桌面 `supplies.spec.ts` 此前误点的是
    列表卡片的 Use One，本次修复后该用例实际验证详情页。
  - 至此资产/位置/消耗品/详情四主链路的移动端可用性已由自动化覆盖；真机验收剩余拍照/扫码。
- 2026-09-08：**隐私聚合路径收尾（S3）**。
  - 分类使用计数（category List/Get/getByName 的 `COUNT(i.id)`）不再把他人私有物品
    计入可见计数：JOIN 侧加「公开或本人私有 + 位置链可见」过滤，修复参数占位符顺序。
  - 新增 `TestPrivacyCategoryUsageCountsExcludePrivateItems`：Bob 只见共享物品计数，
    Alice 见全部。
  - 至此 S3 隐私隔离在列表、搜索、位置树、导出、异常、借出、分类计数全部收口。
- 2026-09-08：**安全检查清单（S3）**。
  - 新增 `docs/security-checklist.md`：PAT（随机 32 字节、SHA-256 静态存储、明文仅一次、
    过期/撤销/last_used）、JWT（HS256、过期、token_version 强制下线）、密码 bcrypt、
    license key AES 静态加密、导出隐私过滤、Owner-only 权限边界、自部署传输建议。
  - 新增 7 条安全测试：PAT 哈希存储/未知拒绝/last_used、PAT 过期、PAT 撤销（含跨用户
    撤销保护）、密码 bcrypt 存储、JWT token_version 失效、middleware 对 PAT 的鉴权与
    撤销后 401。
- 2026-09-08：**通知真实 endpoint 验证（S3）**。
  - 服务层：Webhook 真实 HTTP 接收（httptest）已验证成功路径；新增「失败重试」测试——
    endpoint 返回 500 时 ProcessDue 报 failed、reminder 保持 pending（sent_at 不变），
    下一轮 endpoint 恢复后成功投递；新增 Ntfy 路径格式测试（text/plain + Title 头）。
  - handler 层：`POST /notify/process-due` 对不可达 webhook 返回 `{processed, sent, failed}`
    失败计数（错误可见性），而不是假装成功。
  - 重试策略确认：失败的 reminder 不会标记已发送，由调度器/手动触发自然重试（幂等）。
- 2026-09-08：**设置页 E2E（S3）**。
  - 新增 `web/e2e/settings.spec.ts` 3 条：偏好修改自动保存并持久化（含改回还原）、
    实例配置（storage.webp_quality）自动保存并持久化（含还原）、Owner 在 UI 中添加
    成员 → 新成员可登录 → UI 删除成员 → 登录失效。
  - 排查了两个测试陷阱：Radix Select 触发器不暴露可访问名（改用 label → 容器 → combobox
    结构定位）；autosave 的「Saved」指示会跨保存周期残留（改用 API 轮询断言持久化结果）。
- 2026-09-08：**多用户 Owner/Member 边界验收（S3）**。
  - 测试路由补齐 owner-only 组（users + system/configs + preferences），与 main.go 对齐。
  - 新增 4 条权限测试：成员访问 /users、/system/configs 全部 403（含改角色、增删用户、
    改实例配置）；成员可修改自己的偏好；Owner 不能删自己/改自己角色/设非法角色；
    删除名下仍有资产的用户被明确拦截（400 + 可读提示，而非原始外键错误）。
  - `DeleteUser` 强化：事务内先查名下 items/locations 数量，有资产则拒绝并提示
    「先归档或转移」；删除时把 item_events.actor_id / system_configs.updated_by 置空
    保留审计历史。
- 2026-09-08：**S3 隐私隔离核心（高风险项）**。
  - 机制：middleware 把调用者（`service.Caller`）注入请求 ctx；服务层新增
    `privacy.go`，统一「私有仅本人可见」+「位置链继承」过滤。
  - 读路径全部收口：物品（List/Get/保修/墓地/损耗记录/容器内容）、位置
    （Get/Tree/位置内物品）、搜索（FTS/LIKE/Filter）、导出、异常（List/损失估值）。
  - 私有位置继承：私有节点隐藏整棵子树；私有位置内的公开物品同样对他人隐藏。
  - 借出边界：`LoanService` 的 Create/ListForItem/Return/MarkUnreturned 校验物品
    可见性，成员无法凭 id 借出/归还/查看他人私人物品。
  - 角色口径：私有物品对**其他成员包括管理员（owner 角色）**彻底隐去（惊喜礼物场景）。
  - 新增 7 条跨账号测试：列表/详情 404、owner 角色不可见、搜索、位置树继承、
    导出、异常列表、借出守卫。
- 2026-09-07：**README 阶段更新（10 件事第 10 项）**。
  - README 阶段描述从「M1 第二轮」对齐到当前状态（M2 收束：S2.1/S2.2 收口 +
    消耗品/借出/备份联动已打通），并新增「备份与恢复」章节指向 `docs/backup-restore.md`。
  - PROJECT.md 风险清单中「README 与实际阶段不一致」移入已关闭。
- 2026-09-07：**备份恢复演练（10 件事第 9 项）**。
  - 新增自动化恢复验证 `TestBackupRestoresIntoFreshDataDir`：建库写数据与附件 → 生成备份 →
    解包到全新目录 → 打开恢复后 DB 并跑迁移 → 断言数据与附件字节完整（每次 `go test ./...` 都会执行）。
  - 新增 `docs/backup-restore.md`：备份格式（`havit.db` 快照 + `attachments/`）、手动恢复步骤、
    注意事项；并记录了 2026-09-07 真实二进制级演练（release 模式：创建中文物品+照片 → 备份 →
    清空 → 解包 → 重启 → 物品名/附件字节/FTS 全通过）。
  - 演练中发现并记录：demo 模式会拒绝在已有数据目录启动（安全护栏），恢复演练须用 release 模式。
- 2026-09-07：**借出 + 异常联动（10 件事第 8 项）**。
  - `markUnreturned`（借出未还/对方弄丢）现在把责任交割沉淀进异常模块：upsert
    `abnormal_records`（类型 `unreturned` =「借出遗失 / Lent & Lost」，负责人=借用人，
    预估损失=赔偿金额），同一物品再次出事时刷新记录而不撞 UNIQUE 约束。
  - 借出全生命周期写入物品事件日志：`loan_started` / `loan_returned` /
    `loan_unreturned`（后者带借用人与赔偿明细 payload），详情页「Event Log」可见。
  - 借出页新增「标记未还（遗失）」按钮与赔偿弹窗（金额 / 币种 / 交割备注）。
  - 新增 Go 测试：借出/归还事件落账、遗失后异常记录与事件日志断言；新增
    `web/e2e/loans.spec.ts`：标记遗失 → 异常模块出现「Lent & Lost」→ 物品事件日志
    出现「Loan Lost & Unreturned」。
- 2026-09-07：**消耗品 + 提醒联动（10 件事第 7 项）**。
  - 计件备品低库存进入提醒：`use-one` 与手动改库存（Update）后，库存 ≤ 阈值即创建
    `stock_low` 提醒（trigger_at=now，进入通知循环），同一物品只保留一条未处理提醒；
    补货到阈值以上自动置为已处理（dismiss），避免过期提醒继续打扰。
  - 寿命到期提醒修正：`use-one`（已更换）时重置 `in_use_since` 并删除旧 `filter_life`
    提醒、按「新装入件」重新创建到期提醒（对齐保修提醒 replace 模式），修复原实现
    更换后仍按旧装机时间计时的缺陷与重复提醒。
  - 新增 Go 测试：低库存提醒创建与去重、补货后提醒自动关闭；新增
    `web/e2e/supplies.spec.ts`：用掉最后一个备件 → 出现待补货清单 + 产生待发 stock_low 提醒。
  - 通知发送链路（ProcessDue / 调度器 / 手动触发）为既有能力，reminder 就绪后直接生效。
- 2026-09-07：**S2.2 尾巴：搜索结果缩略图 + 归档物品显示开关**。
  - 搜索服务 FTS / LIKE / Filter 三条路径统一携带最新照片附件作为缩略图
    （`thumbnail_url` → `/api/v1/attachments/{id}/content`），前端结果卡展示封面图。
  - 「主搜索显示已归档物品」是用户级偏好（`user_preferences.show_archived_in_search`），
    搜索 handler 读取当前用户偏好并透传给 FTS 与 AI 精排两条路径；设置页 behavior 面板
    开关早已存在，本次打通后端执行。
  - 新增 Go 测试：归档默认隐藏/开启后可见（FTS + Filter）、缩略图取最新照片且无照片为空；
    E2E：有照片物品显示缩略图、归档件默认不出现/开启偏好后出现并带「归档」标记。
- 2026-09-02：**EDC 搜索降级提示补全「最后确认」时间（S2.2 收尾）**。
  - essentials 物品搜索提示按设计文档结构化为三段：当前状态 → 基准归宿 →
    最后确认（今天 / N 天前，取自 updated_at）。
  - 同步更新 handler SSE 断言与测试；新增 essentials 提示服务测试。
- 2026-09-02：**搜索结果「下一步行动」增强（S2.2 第二轮）**。
  - 后端：SearchResult 新增 `loan_hint`；借出中物品按产品设计文档 3.3 附加
    "已借给 X；应还 YYYY-MM-DD（已逾期）" 状态提示，FTS 与 Filter 两条路径均生效。
  - 前端：搜索结果卡展示 loan_hint；新增服务测试（未逾期/逾期）与 E2E 借出提示用例。
- 2026-09-02：**S2.2 搜索与定位闭环第一轮收束**。
  - 后端（`internal/service/search.go`）：FTS5 MATCH 查询改为逐词加引号的安全表达式，
    用户输入中的 `( ) : " %` 等字符不再引发 FTS 语法错误；FTS 失败降级为纯 LIKE。
  - 中文与短词可达：FTS（trigram）与 LIKE 合并去重返回，2 字中文词（无法构成 trigram）
    由 LIKE 兜底命中。
  - 关键词搜索覆盖扩展到**标签名**和**位置名**（LIKE EXISTS 子查询），搜"防潮箱""尼康"
    能找到对应物品。
  - SSE `error` 事件更名为 `search_error`（避免与 EventSource 内置 error 冲突），
    前端监听并展示搜索错误提示。
  - 新增测试：中文多字/短词查询、特殊字符不报错、标签命中、位置命中（含路径断言）、
    matchExpression 转义单测；新增 `web/e2e/search.spec.ts` 5 条 E2E（中文关键词、
    标签、位置、EDC 降级提示、移动端视口）。
- 2026-09-02：**恢复 Capture 页条码录入入口**（按产品设计文档三入口口径）。
  - 手动输入条码 + 摄像头扫码（复用 `QrScanner`/`@zxing/browser`），查询命中自动填充
    名称/分类/描述，只填空字段不覆盖用户输入。
  - 降级链落地：条码未命中或接口异常时显示提示，转入手动确认流程，不阻塞录入；
    恢复了 `QrScanner` 依赖的 camera i18n 键（en / zh-CN）。
  - 新增 E2E：条码命中自动填充并保存（校验落库字段）、条码查不到→手动保存、
    条码接口异常→手动保存；移动端用例扩展为拍照识别 + 保存全流程。
- 2026-07-04 `a79e797b`：Capture 页重构为多图 AI 识别 + 手动确认 + 保存挂附件的纵向流程；
  拍照草稿识别（无 item 依赖）、AI 失败转手动、保存必选位置、照片挂到真实物品。
- 后端 AI provider 测试已覆盖三种场景：provider 为 nil、provider 出错、provider 成功
  （`internal/service/ai_test.go`）。
- 拍照存证语义已有测试与 E2E：草稿阶段不写 item / attachments；保存后照片挂为真实物品附件，
  AI 识别失败时退回普通上传（`is_ai_source=false`）。

## 进行中 / 下一步

- **S2.1 剩余：真机验收移动端拍照/扫码**（人工，无法在 E2E 中覆盖）——S3 代码侧工作已全部收口。
- 移动端四主链路（资产/位置/消耗品/详情）可用性已由 `web/e2e/mobile.spec.ts` 8 条 E2E 覆盖。

## 下一步

- 真机验收移动端拍照录入与扫码（人工，摄像头/文件选择等真机行为无法在 E2E 中覆盖）。
- 之后可进入 M3 已提前实现功能的产品化（PROJECT.md S4）。

## 环境备注

- 本机默认 `GOSUMDB=off`，跑 Go 测试需临时 `GOSUMDB=sum.golang.org`。
- E2E 默认命令已闭合端口配置，直接 `pnpm test:e2e` 即可。
- Docker 验证：Docker daemon 可用时跑 `scripts/verify-docker.ps1`（2026-07-04 已通过）。
