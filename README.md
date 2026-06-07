# Havit

个人与家庭的全资产台账。详见 `docs/havit-product-design.md` 与 `docs/havit-tech-architecture.md`。

> 本仓库是 M1 第一轮骨架：物品 CRUD + 位置树端到端跑通。
> 尚未实现：JWT 鉴权、附件上传、AI 识别、SSE 搜索、消耗品/借出/EDC、提醒、备份、Docker、CSV 导入。

## 快速开始

### 后端 (Go 1.24)

```
go build -o havit ./cmd/havit
./havit
# -> http://localhost:3000
```

数据写入 `./data/havit.db`。可通过 `config.yaml` 或 `HAVIT_*` 环境变量覆盖默认值（见 `internal/config/config.go`）。

### 前端 (Node 22)

```
cd web
npm install
npm run dev       # http://localhost:5173, 代理 /api → :3000
npm run build     # 产物 -> internal/static/dist (被 go:embed)
```

构建前端后重新 `go build`，单二进制即包含前端。

## 当前 API

```
GET    /api/v1/healthz

GET    /api/v1/items?q=&status=&type=&location=&limit=&offset=
POST   /api/v1/items
GET    /api/v1/items/{id}
PATCH  /api/v1/items/{id}
DELETE /api/v1/items/{id}        # 实际是状态流转到 archived

GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/{id}
PATCH  /api/v1/locations/{id}
DELETE /api/v1/locations/{id}    # 仅在无子节点和无关联物品时允许
```

## 已知行为

- FTS5 使用 `trigram` 分词，关键词需 ≥3 个字符才会命中（架构文档约束）。
- 物品不可硬删除，统一通过状态机归档；删除接口实际写 `status = 'archived'`。
- 位置删除是真删，仅在节点为空时允许。
- 配置 `auth.jwt_secret` 留空时首次启动自动生成并写回 `<data_dir>/config.yaml`。
