# Havit API 1.0

Base URL: `/api/v1`

认证方式：

- `Authorization: Bearer <JWT>`
- `Authorization: Bearer hv_pat_...`
- `X-API-Key: hv_pat_...`
- 浏览器登录后也可使用 `havit_token` HttpOnly Cookie

错误响应统一为：

```json
{ "error": "machine_readable_code", "message": "human readable message" }
```

除登录、初始化、健康检查和系统状态外，所有接口都要求认证。

## 公共接口

| Method | Path | 说明 |
|---|---|---|
| GET | `/healthz` | 存活检查，返回 `ok` |
| GET | `/system/status` | `mode`、`needs_setup`、`version` |
| POST | `/auth/setup` | 首次创建 Owner；仅在 `needs_setup=true` 时可用 |
| POST | `/auth/login` | 用户名密码登录；同一 IP + 用户名 15 分钟内失败 10 次后返回 429 |
| POST | `/auth/logout` | 清除会话 Cookie |

## 当前用户

| Method | Path | 说明 |
|---|---|---|
| GET | `/auth/me` | 当前用户资料 |
| PATCH | `/auth/me` | 更新昵称、邮箱、说明、头像 |
| POST | `/auth/me/password` | 修改密码并使其他 JWT 失效 |

## 物品

| Method | Path | 说明 |
|---|---|---|
| GET | `/items` | 列表；可选 `q/status/type/location/tag/limit/offset` |
| POST | `/items` | 创建；支持 `status`、`is_private` |
| GET | `/items/{id}` | 详情 |
| PATCH | `/items/{id}` | 更新，包括 `is_private` |
| DELETE | `/items/{id}` | 归档 |
| POST | `/items/{id}/exit` | 退出/售出/丢失等状态流转 |
| GET | `/items/{id}/claim-pdf` | 被盗理赔 PDF |
| POST | `/items/{id}/use-one` | 消耗一个备品 |
| POST | `/items/{id}/essentials-status` | 更新随身状态 |
| POST | `/items/{id}/return-home` | 随身物品归位 |
| GET/POST | `/items/{id}/purchase-events` | 购买事件 |
| GET/POST | `/items/{id}/calibration-events` | 消耗校准 |
| GET | `/items/{id}/events` | 生命周期事件 |
| PUT | `/items/{id}/tags` | 替换标签 |
| GET | `/items/{id}/contents` | 容器内容物 |
| POST | `/items/{id}/contents` | 放入容器 |
| DELETE | `/items/{id}/contents/{childId}` | 移出容器 |

`limit` 省略时返回全部可见匹配项；显式传入时最大 200。

## 位置

| Method | Path | 说明 |
|---|---|---|
| GET | `/locations` | 可见位置树 |
| POST | `/locations` | 创建位置 |
| GET/PATCH/DELETE | `/locations/{id}` | 详情/更新/删除 |
| POST | `/locations/{id}/qr-code` | 生成位置码 |
| GET | `/locations/scan/{code}` | 扫码反查 |

## 标签与分类

| Method | Path | 说明 |
|---|---|---|
| GET/POST | `/tags` | 列表/创建 |
| PATCH/DELETE | `/tags/{id}` | 更新/删除 |
| GET/POST | `/categories` | 列表/创建 |
| PATCH/DELETE | `/categories/{id}` | 更新/删除 |

## 搜索

`GET /search?q=...` 返回 SSE：

- `fts_results`：本地全文搜索结果
- `llm_results`：AI 解析后的结构化结果（启用 AI 时）
- `search_error`：本地搜索错误
- `done`：结束

## 借出与异常

| Method | Path | 说明 |
|---|---|---|
| POST/GET | `/items/{id}/loans` | 创建/查询物品借出 |
| GET | `/loans` | 可见借出列表 |
| POST | `/loans/{id}/return` | 归还 |
| POST | `/loans/{id}/unreturned` | 标记未归还 |
| GET | `/abnormal` | 异常列表 |
| GET | `/abnormal/stats`、`/trend`、`/progress`、`/valuation` | 聚合统计 |
| GET/PATCH | `/abnormal/{id}` | 详情/处理进度 |

## 提醒与通知

| Method | Path | 说明 |
|---|---|---|
| GET | `/reminders` | 提醒列表，可选 `due_only`、`item_id` |
| POST | `/reminders/{id}/sent` | 标记已发送 |
| POST | `/reminders/{id}/dismiss` | 忽略提醒 |
| POST | `/notify/process-due` | 手动触发到期通知投递 |

## 凭证、导入导出与备份

| Method | Path | 说明 |
|---|---|---|
| GET/POST | `/items/{id}/virtual-credentials` | 虚拟凭证 |
| GET/POST | `/items/{id}/virtual-addons` | 增补购买 |
| GET | `/virtual-credentials` | 当前用户可见凭证聚合 |
| PATCH/DELETE | `/virtual-credentials/{id}` | 更新/删除凭证 |
| POST | `/import/items/preview` | 导入预览，最大 16 MB |
| POST | `/import/items` | 导入提交，最大 16 MB |
| GET | `/export/items?format=csv\|json` | 导出当前可见数据 |
| POST | `/backups/run` | 手动备份（Owner only） |

## 附件与识别

| Method | Path | 说明 |
|---|---|---|
| GET | `/items/{id}/attachments` | 附件列表 |
| POST | `/items/{id}/photos` | 上传照片 |
| GET | `/attachments/{id}/content` | 读取附件 |
| DELETE | `/attachments/{id}` | 删除附件 |
| POST | `/ai/recognize-photo` | 识别照片草稿 |
| POST | `/items/{id}/ai-recognize-photo` | 识别并挂接照片 |
| GET | `/barcode/{code}` | 条码查询，失败返回手动降级信息 |

## 用户、配置、偏好与令牌（Owner/当前用户）

| Method | Path | 权限 | 说明 |
|---|---|---|---|
| GET/POST | `/users` | Owner | 成员列表/创建 |
| DELETE | `/users/{id}` | Owner | 删除成员 |
| PATCH | `/users/{id}/role` | Owner | 修改角色 |
| GET | `/system/configs` | Owner | 实例配置列表 |
| PATCH | `/system/configs/{key}` | Owner | 修改单个实例配置 |
| GET/PATCH | `/preferences` | 当前用户 | 个人偏好 |
| GET/POST | `/api-tokens` | 当前用户 | 个人访问令牌 |
| DELETE | `/api-tokens/{id}` | 当前用户 | 撤销令牌 |
| POST | `/api-tokens/revoke-all-sessions` | 当前用户 | 使所有 JWT 失效 |
