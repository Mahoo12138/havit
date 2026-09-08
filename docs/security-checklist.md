# 安全检查清单

对自部署场景「最小泄漏面」的逐项审计。每项都标注验证方式；带测试的项对应 `internal/service/security_test.go`、`internal/middleware/auth_test.go` 等。

## 1. 个人访问令牌（PAT）

| 检查项 | 现状 | 验证 |
|---|---|---|
| 令牌随机性 | 32 字节 `crypto/rand`，`hv_pat_` 前缀 | `TestPATStoredHashedAndNeverExposesSecret` |
| 存储 | 仅存 SHA-256 哈希，库中无明文 | 同上（断言 `token_hash != plaintext` 且等于 `sha256(secret)`） |
| 明文暴露次数 | 创建响应仅返回一次（`plain_token`），列表/详情不回显 | `List` 结构体不含哈希字段 |
| 过期 | `expires_at` 到期后 `Verify` 拒绝 | `TestPATExpiry` |
| 撤销 | `Revoke` 删除指定用户自己的令牌；跨用户撤销返回 not found | `TestPATRevoke` |
| 最后使用 | `Verify` 成功后更新 `last_used_at` | `TestPATVerifyUpdatesLastUsedAndRejectsUnknown` |
| 鉴权接入 | `X-API-Key` 头 / `Authorization: Bearer hv_pat_*` 均可，撤销后 401 | `TestAuthMiddlewareAcceptsAndRejectsPATs` |

## 2. JWT 会话

| 检查项 | 现状 | 验证 |
|---|---|---|
| 签名 | HS256，密钥来自配置/环境变量；留空时首次启动自动生成并写回 `config.yaml` | 架构文档 |
| 过期 | `session_expire_hours`（默认 720h）写入 `exp` | `issueToken` |
| 强制下线 | 用户 `token_version` 递增使所有旧 JWT 失效（修改密码/全部撤销） | `TestJWTInvalidatedByTokenVersionBump` |
| 已删除用户 | 用户不存在/版本不匹配时拒绝 | handler `TestMeRejectsTokenForDeletedUser` |

## 3. 密码

| 检查项 | 现状 | 验证 |
|---|---|---|
| 存储 | bcrypt 哈希，绝不明文 | `TestPasswordStoredAsBcryptHash` |
| 校验 | `Login` 用 `bcrypt.CompareHashAndPassword` | auth 流程 |

## 4. 敏感字段加密（license key 等）

| 检查项 | 现状 | 验证 |
|---|---|---|
| 静态加密 | `virtual_credentials.license_key` 用 AES（密钥派生自 JWT secret）加密存储，读取时解密 | `internal/crypto`、`virtual_asset.go` |
| 导出 | 导出文件按当前用户可见范围生成（隐私过滤），license key 以明文随导出（用户主动导出） | `export.go`、隐私测试 |

## 5. 导出与隐私

| 检查项 | 现状 | 验证 |
|---|---|---|
| 私有数据 | 私有物品/位置对他人（含 owner 角色）在列表、搜索、位置树、导出、异常中彻底隐去 | `internal/service/privacy_test.go`（7 条跨账号） |
| 借出边界 | 成员无法借出/查看他人私人物品 | `TestPrivacyLoanGuardsPrivateItems` |

## 6. 权限边界

| 检查项 | 现状 | 验证 |
|---|---|---|
| Owner-only 路由 | 用户管理、实例配置仅 Owner 可访问，成员 403 | `internal/handler/permissions_test.go` |
| 删除用户 | 名下仍有资产时拒绝并提示；自删/自改角色被拒；审计署名置空保留 | 同上 + `DeleteUser` |

## 7. 传输与部署建议（自部署）

- 生产建议启用 HTTPS（反向代理 / Docker 暴露前加 TLS）。
- `auth.jwt_secret` 与 AI/通知密钥通过环境变量注入，避免写进镜像。
- 备份文件含全量数据（含加密字段密文），备份包本身应妥善保管。

## 已知待收尾

- 分类使用计数等聚合路径的隐私口径（私有物品数量对他人不可见）——S3 隐私剩余项。
- 真机验证移动端主链路；通知渠道实机（Apprise 自建实例）。
