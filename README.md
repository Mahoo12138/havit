# Havit

个人与家庭的全资产台账。详见 `docs/havit-product-design.md` 与 `docs/havit-tech-architecture.md`。

> M1 第二轮：在物品/位置端到端骨架之上，补齐运行模式 (release / demo)、初始化向导、JWT 鉴权。

## 快速开始

### 后端 (Go 1.24)

```
go build -o havit ./cmd/havit
./havit
# -> http://localhost:3000
```

### 前端 (Node 22)

```
cd web
npm install
npm run dev       # http://localhost:5173, 代理 /api → :3000
npm run build     # 产物 -> internal/static/dist (被 go:embed)
```

构建前端后重新 `go build`，单二进制即包含前端。

## 运行模式

由配置 `mode` 或环境变量 `HAVIT_MODE` 控制：

| 模式 | 行为 |
|---|---|
| `release` (默认) | 空库时强制跳转 `/setup` 创建 Owner；非空库正常启动 |
| `demo` | 空库时注入演示种子数据（账号 `admin@havit.local` / `havit-demo`）；非空库 fatal 拒绝启动，保护现有数据 |

种子数据中预置：5 件物品（覆盖 durable / consumable_a / consumable_b / edc）、二级位置树、`@随身` 虚拟节点、低库存滤芯、逾期未还借出记录。

```
HAVIT_MODE=demo ./havit       # 演示站
./havit                       # 家庭部署，默认 release
```

## API

### 公开（不需要 token）

```
GET    /api/v1/healthz
GET    /api/v1/system/status     # { mode, needs_setup, version }
POST   /api/v1/auth/setup        # 仅在 needs_setup=true 时可用，否则 410
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
```

### 受保护（需要 `Authorization: Bearer <token>` 或 `havit_token` cookie）

```
GET    /api/v1/auth/me

GET    /api/v1/items?q=&status=&type=&location=&limit=&offset=
POST   /api/v1/items
GET    /api/v1/items/{id}
PATCH  /api/v1/items/{id}
DELETE /api/v1/items/{id}        # 实际写 status = 'archived'

GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/{id}
PATCH  /api/v1/locations/{id}
DELETE /api/v1/locations/{id}    # 仅在子节点和关联物品都为空时允许
```

`/setup` 仅在 `users` 表为空时可调用；首次调用成功后端立刻把 `needs_setup` 标记为 false，第二次调用返回 410。

## 已知行为

- FTS5 使用 `trigram` 分词，关键词需 ≥3 个字符才会命中（架构文档约束）。
- 物品不可硬删除，统一通过状态机归档。
- 配置 `auth.jwt_secret` 留空时首次启动自动生成并写回 `<data_dir>/config.yaml`。
- Demo 种子里的密码 hash 由启动代码用 `bcrypt('havit-demo')` 实时生成后替换占位符，仓库里不保存真实 hash。
