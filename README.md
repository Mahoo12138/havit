# Havit

个人与家庭的全资产台账。当前版本：**1.0.0**。

产品与技术文档见 `docs/havit-product-design.md`、`docs/havit-tech-architecture.md`；接口说明见 [`docs/api.md`](docs/api.md)；变更记录见 [`CHANGELOG.md`](CHANGELOG.md)。

## 快速开始

要求：

- Go 1.25.7 以上（推荐使用 `go.mod` 中的 `toolchain go1.26.10`）
- Node.js 22
- pnpm 10.22.0

### 构建单二进制

```bash
cd web
pnpm install --frozen-lockfile
pnpm build                 # 产物 -> internal/static/dist

cd ..
go build -o havit ./cmd/havit
./havit
# -> http://localhost:3000
```

前端必须在后端构建前完成，否则二进制可以启动，但不会包含 Web UI。`internal/static/dist/.gitkeep` 只是为了让干净克隆可以先编译和运行 Go 测试。

开发模式：

```bash
# 终端 1
go run ./cmd/havit

# 终端 2
cd web
pnpm dev                   # http://localhost:5173，代理 /api -> :3000
```

### Docker

```bash
docker build -t havit:1.0.0 .
docker run -d \
  --name havit \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  -e HAVIT_MODE=release \
  havit:1.0.0
```

或使用 `docker compose up -d --build`。容器进程以 UID 10001 运行；Linux bind mount 需要提前给数据目录写权限，例如：

```bash
mkdir -p data
sudo chown -R 10001:10001 data
```

摄像头扫码、照片上传和 PWA 安装属于安全上下文功能，局域网部署也应通过 HTTPS 反向代理访问。后端本身只监听 HTTP，由反向代理终止 TLS。

## 运行模式

由配置 `mode` 或环境变量 `HAVIT_MODE` 控制；兼容 `HAVIT_RUN_MODE`，两者同时存在时 `HAVIT_MODE` 优先。

| 模式 | 行为 |
|---|---|
| `release`（默认） | 空库时跳转 `/setup` 创建 Owner；非空库正常启动 |
| `demo` | 空库时注入演示数据（`admin@havit.local` / `havit-demo`）；非空库拒绝启动 |

```bash
HAVIT_MODE=demo ./havit
```

## 配置

配置文件搜索路径为 `/data` 和当前目录的 `config.yaml`，环境变量优先级更高。常用变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `HAVIT_MODE` / `HAVIT_RUN_MODE` | `release` | 运行模式 |
| `HAVIT_SERVER_PORT` | `3000` | HTTP 端口 |
| `HAVIT_DATA_DIR` | `./data` | 数据目录 |
| `HAVIT_AUTH_JWT_SECRET` | 自动生成 | JWT 与字段加密密钥；生产环境建议显式注入 |
| `HAVIT_AUTH_SESSION_EXPIRE_HOURS` | `720` | JWT 有效期 |
| `HAVIT_BACKUP_ENABLED` | `true` | 定时备份 |
| `HAVIT_BACKUP_CRON` | `0 3 * * *` | 仅支持每日执行 |
| `HAVIT_BACKUP_KEEP_DAYS` | `30` | 备份保留天数 |
| `HAVIT_AI_*` / `HAVIT_NOTIFY_*` | 空/关闭 | AI、通知网关 |

`auth.jwt_secret` 留空时首次启动会生成并写入 `<data_dir>/config.yaml`。该文件同时用于字段加密，必须和备份一起保存；丢失后已加密的许可证字段无法恢复。

## API

完整接口见 [`docs/api.md`](docs/api.md)。认证支持：

- `Authorization: Bearer <JWT>`
- `Authorization: Bearer hv_pat_...` / `X-API-Key: hv_pat_...`
- 浏览器登录 Cookie

`/setup` 只在 `users` 表为空时开放。Owner 管理接口和 `/backups/run` 仅 Owner 可访问。

## 测试与发布检查

```bash
go vet ./...
go test ./...

cd web
pnpm exec tsc -b
pnpm build
pnpm test:e2e
pnpm audit --prod --audit-level=high --registry=https://registry.npmjs.org/
```

E2E 使用 demo 模式、独立临时数据目录和 Chromium；CI 配置见 `.github/workflows/ci.yml`。

## 备份与恢复

备份为 `havit.db` 一致性快照 + `attachments/` + `config.yaml`，手动与定时触发均可用（手动接口仅 Owner）。恢复步骤、密钥注意事项和演练记录见 [`docs/backup-restore.md`](docs/backup-restore.md)。

升级前请先备份整个数据目录；1.0 启动时会为早期测试库补齐用户资料字段，但后续版本仍应通过增量迁移升级。

## 已知行为

- FTS5 使用 `trigram` 分词；短关键词由 LIKE 兜底。
- 物品不硬删除，统一通过状态机归档。
- 私有物品和私有位置默认只对创建者可见（包括 Owner 角色）。
- 容器详情当前支持查看与移出，物品放入入口留待后续版本。
- 删除成员前若其名下仍有资产，需要后续版本的所有权转移流程。
- 前端 PWA 只缓存静态资源，不缓存需要鉴权的 API 响应。
- 理赔 PDF 当前为非嵌入 CJK CMap 输出，复杂中文排版依赖阅读器字体回退。

## License

MIT，见 [`LICENSE`](LICENSE)。
