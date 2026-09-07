# Havit 开发状态记录

> 本文档由开发过程持续维护，记录当前进行中的工作、最近完成的内容与下一步计划。
> 完整的里程碑规划与功能分区进度见 `PROJECT.md`，产品需求见 `docs/havit-product-design.md`。

更新时间：2026-09-07

## 当前阶段

**S2：M2 高频日常工作流收束（进行中）**

- S0 / S1 / S1.1 已完成，详见 `PROJECT.md`。
- S2.1 快速录入闭环已收口（剩真机验收）。
- S2.2 搜索与定位闭环已收口（含缩略图与归档显示开关两个尾巴）。
- 消耗品 + 提醒联动（10 件事第 7 项）已收口。
- 借出 + 异常联动（10 件事第 8 项）已收口。
- 备份恢复演练（10 件事第 9 项）已收口。
- 当前主线：**README 阶段更新（10 件事第 10 项）**。

## 基线验证（2026-09-07，备份恢复演练后）

| 检查项 | 命令 | 结果 |
|---|---|---|
| Go 测试 | `GOSUMDB=sum.golang.org go test ./...` | 通过（新增恢复测试 `TestBackupRestoresIntoFreshDataDir`） |
| 前端构建 | `pnpm build` | 通过 |
| E2E | `pnpm test:e2e` | 38 条全部通过（搜索 8 + 消耗品 1 + 借出联动 1） |

## 最近完成

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

- S2.1 剩余：真机验收移动端拍照/扫码（人工，无法在 E2E 中覆盖）。
- 当前主线：**README 阶段更新（10 件事第 10 项）**——README 与 PROJECT.md 阶段一致。
- 10 件事 1-9 已收口；S2 之后进入 S3（家庭与运维能力加固）。

## 下一步

- 收尾 10 件事第 10 项：README 阶段描述同步为当前进度（M2 收束，含 S2.1/S2.2 与消耗品/借出/备份联动）。
- 已知债务：README 阶段描述与 PROJECT.md 不一致，S2 期间同步更新。

## 环境备注

- 本机默认 `GOSUMDB=off`，跑 Go 测试需临时 `GOSUMDB=sum.golang.org`。
- E2E 默认命令已闭合端口配置，直接 `pnpm test:e2e` 即可。
- Docker 验证：Docker daemon 可用时跑 `scripts/verify-docker.ps1`（2026-07-04 已通过）。
