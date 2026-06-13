# Havit — 技术架构规划

**版本** v0.4  
**关联文档** havit-product-design.md v0.4

---

## 一、核心技术决策总览

| 层次 | 选型 | 理由 |
|---|---|---|
| 后端语言 | Go | 编译为单二进制，性能好，交叉编译方便 |
| Web 框架 | Chi | 轻量，基于标准库，无魔法 |
| 配置管理 | Viper | 统一管理 config file + 环境变量，Go 生态标准选择 |
| 数据库 | SQLite（sqlc + modernc/sqlite） | 零依赖，单文件，家庭数据规模完全够用 |
| 数据库迁移 | Goose | 显式迁移文件，生产环境安全 |
| 附件存储 | 本地文件系统（multipart 流式写入） | 无外部依赖，Docker volume 挂载，杜绝 OOM |
| 自然语言搜索 | FTS5 并发先出 + LLM 异步刷新（无向量库） | 体感即时，LLM 结果异步补全，零额外依赖 |
| 前端框架 | React 18 + Vite | 生态最大，组件库丰富 |
| UI 原语层 | Base UI | 无样式 headless 原语，与 VE 配合实现完全自主的设计系统 |
| 数据请求 | TanStack Query v5 | 缓存、乐观更新、后台刷新 |
| 路由 | TanStack Router v1 | 类型安全，与 TanStack Query 天然配合 |
| 样式 | Vanilla Extract | 零运行时 CSS-in-TS，编译时类型安全 |
| PWA 离线策略 | 仅离线读缓存（Offline Read Only） | 离线写复杂度过高，M3 前明确不做 |
| 部署 | 单容器 Docker / 裸二进制 | 极简，无强制 compose 依赖 |
| 认证 | JWT + 本地用户表 | 自部署场景，不依赖外部 OAuth |

---

## 二、后端架构

### 2.1 整体目录结构

```
havit/
├── cmd/
│   └── havit/
│       └── main.go              # 入口：初始化 Viper、DB、路由、调度器
├── internal/
│   ├── config/
│   │   └── config.go            # Viper 配置结构体与加载逻辑
│   ├── db/
│   │   ├── migrations/          # Goose SQL 迁移文件
│   │   ├── seeds/               # demo 模式种子数据
│   │   ├── db.go                # SQLite 初始化（WAL pragma、连接池）
│   │   └── seed.go              # 种子数据注入逻辑
│   ├── handler/                 # Chi 路由处理器（每个文件一个资源）
│   │   ├── system.go            # /system/status
│   │   ├── auth.go              # JWT 认证、初始设置
│   │   ├── item.go              # 物品 CRUD + EDC + 消耗品 + 退场 + 墓地
│   │   ├── location.go          # 位置树 CRUD + QR 码
│   │   ├── attachment.go        # multipart 流式上传
│   │   ├── tag.go               # 标签管理
│   │   ├── search.go            # 并发赛跑搜索（SSE）
│   │   ├── barcode.go           # 条码查询（Open Food Facts）
│   │   ├── ai.go                # AI 拍照识别
│   │   ├── loan.go              # 借出追踪
│   │   ├── virtual_asset.go     # 虚拟资产凭证
│   │   ├── reminder.go          # 提醒管理
│   │   ├── notify.go            # 通知渠道配置
│   │   ├── backup.go            # 备份触发 & 管理
│   │   ├── import.go            # CSV/JSON 导入
│   │   └── export.go            # CSV/JSON 导出
│   ├── service/                 # 业务逻辑层
│   ├── model/                   # 数据模型结构体
│   ├── middleware/
│   │   ├── auth.go              # JWT 鉴权中间件
│   │   └── cors.go
│   ├── crypto/                  # AES-256-GCM 加密
│   ├── errors/                  # 类型化错误码
│   └── system/                  # 应用运行时状态
├── web/                         # 前端源码（React + Vite）
├── static/                      # 前端编译产物（go:embed）
├── Dockerfile
├── sqlc.yaml
└── config.example.yaml
```

### 2.2 Web 框架：Chi

```go
func main() {
    cfg := config.Load()

    r := chi.NewRouter()
    r.Use(chimiddleware.RequestID)
    r.Use(chimiddleware.RealIP)
    r.Use(chimiddleware.Logger)
    r.Use(chimiddleware.Recoverer)
    // 全局请求体限制，防止恶意上传击穿内存
    // 附件上传路由单独在 handler 层用流式 multipart 处理，此处限制针对 JSON 接口
    r.Use(chimiddleware.RequestSize(4 * 1024 * 1024)) // 4MB JSON 上限

    r.Mount("/api/v1", buildAPIRouter(cfg))
    mountStatic(r)

    slog.Info("starting", "port", cfg.Server.Port)
    http.ListenAndServe(fmt.Sprintf(":%d", cfg.Server.Port), r)
}
```

### 2.3 配置管理：Viper

**加载优先级：环境变量 > config.yaml > 默认值**

```go
// internal/config/config.go
func Load() *Config {
    v := viper.New()

    v.SetDefault("server.port", 3000)
    v.SetDefault("auth.session_expire_hours", 720)
    v.SetDefault("storage.max_photo_size_mb", 20)
    v.SetDefault("storage.max_attachment_size_mb", 50)
    v.SetDefault("storage.max_total_size_gb", 10)
    v.SetDefault("backup.cron", "0 3 * * *")
    v.SetDefault("backup.keep_days", 30)
    v.SetDefault("ai.timeout_seconds", 10)

    v.SetConfigName("config")
    v.SetConfigType("yaml")
    v.AddConfigPath("/data")   // Docker 挂载目录优先
    v.AddConfigPath(".")
    v.ReadInConfig()           // 文件不存在时不报错，使用默认值

    // 环境变量映射：HAVIT_AI_API_KEY → ai.api_key
    v.SetEnvPrefix("HAVIT")
    v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
    v.AutomaticEnv()

    var cfg Config
    v.Unmarshal(&cfg)

    // jwt_secret 为空时自动生成并持久化
    if cfg.Auth.JWTSecret == "" {
        cfg.Auth.JWTSecret = generateSecret()
        v.Set("auth.jwt_secret", cfg.Auth.JWTSecret)
        v.WriteConfigAs("/data/config.yaml")
    }

    return &cfg
}
```

**config.example.yaml：**

```yaml
server:
  port: 3000
  base_url: "http://localhost:3000"

data:
  dir: "/data"

auth:
  jwt_secret: ""            # 留空则首次启动自动生成
  session_expire_hours: 720

ai:
  enabled: false
  base_url: "https://api.openai.com/v1"
  api_key: ""               # 建议通过 HAVIT_AI_API_KEY 环境变量传入
  model: "gpt-4o-mini"
  vision_model: "gpt-4o"
  timeout_seconds: 10

barcode:
  open_food_facts: true
  lookup_api_key: ""

notify:
  apprise_url: ""
  ntfy_url: ""
  webhook_url: ""

storage:
  max_photo_size_mb: 20
  max_attachment_size_mb: 50
  max_total_size_gb: 10

backup:
  enabled: true
  cron: "0 3 * * *"
  keep_days: 30
```

### 2.4 数据库：SQLite + sqlc + Goose

**驱动：`modernc.org/sqlite`**（纯 Go，无 CGO，交叉编译友好）

```go
func initDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("sqlite", dsn)
    if err != nil {
        return nil, err
    }
    for _, pragma := range []string{
        "PRAGMA journal_mode=WAL",
        "PRAGMA synchronous=NORMAL",
        "PRAGMA foreign_keys=ON",
        "PRAGMA busy_timeout=5000",
        "PRAGMA cache_size=-32000",  // 32MB page cache
    } {
        if _, err := db.Exec(pragma); err != nil {
            return nil, fmt.Errorf("pragma %q: %w", pragma, err)
        }
    }
    // 单写连接，避免 WAL 模式下的写锁竞争
    db.SetMaxOpenConns(1)
    return db, nil
}
```

### 2.5 数据库 Schema

```sql
-- 用户
CREATE TABLE users (
    id          TEXT PRIMARY KEY,   -- ULID
    username    TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,       -- bcrypt hash
    role        TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'member'
    created_at  INTEGER NOT NULL
);

-- 位置节点（树形，自引用）
-- type 使用现实语义类型，而非抽象的 physical/virtual：
--   property  — 大资产/房产（别墅、公寓、房车、公司）
--   room      — 独立房间（客厅、主卧、地下储藏室）
--   furniture — 固定家具/大型载具（衣柜、书架、冰箱、防潮箱）
--   container — 移动容器/最小寻址单元（收纳盒、摄影包、医药箱）
--   virtual   — 虚拟动态节点（@随身、@出差中）
-- 层级约束（由业务层强制，不在 DB 层做 CHECK 以保持灵活性）：
--   property → room → furniture → container
--   virtual 节点无父子约束，可挂任意层级
CREATE TABLE locations (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT REFERENCES locations(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'room',
    -- 'property' | 'room' | 'furniture' | 'container' | 'virtual'
    qr_code     TEXT UNIQUE,
    is_private  INTEGER NOT NULL DEFAULT 0,
    owner_id    TEXT REFERENCES users(id),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

-- 标签
CREATE TABLE tags (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    color   TEXT
);

-- 物品主表
CREATE TABLE items (
    id              TEXT PRIMARY KEY,   -- ULID
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    type            TEXT NOT NULL,
    -- 'durable' | 'consumable_a' | 'consumable_b' | 'edc' | 'virtual'
    status          TEXT NOT NULL DEFAULT 'in_stock',
    -- in_stock | borrowed | idle | for_sale | sold | given_away
    -- lost | stolen | unreturned | damaged | archived

    location_id             TEXT REFERENCES locations(id),
    home_base_location_id   TEXT REFERENCES locations(id),
    current_status_tag      TEXT,

    purchase_price      REAL,
    purchase_currency   TEXT,
    purchase_date       INTEGER,
    purchase_platform   TEXT,

    warranty_expires_at INTEGER,
    serial_number       TEXT,
    warranty_contact    TEXT,

    exit_type       TEXT,
    exit_date       INTEGER,
    exit_price      REAL,
    exit_currency   TEXT,
    exit_notes      TEXT,

    platform        TEXT,
    auth_account    TEXT,
    license_key     TEXT,   -- AES-256-GCM 加密存储
    download_url    TEXT,

    current_stock       INTEGER,
    min_stock_threshold INTEGER DEFAULT 1,
    lifespan_days       INTEGER,
    in_use_since        INTEGER,

    is_private  INTEGER NOT NULL DEFAULT 0,
    owner_id    TEXT REFERENCES users(id),
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

-- 物品-标签关联
CREATE TABLE item_tags (
    item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
    tag_id  TEXT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

-- 附件
CREATE TABLE attachments (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    filename     TEXT NOT NULL,
    path         TEXT NOT NULL,
    size         INTEGER,
    is_ai_source INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
);

-- 消耗品 A：购买事件
CREATE TABLE purchase_events (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 1,
    price        REAL,
    currency     TEXT,
    purchased_at INTEGER NOT NULL,
    notes        TEXT
);

-- 消耗品 A：校准事件
CREATE TABLE calibration_events (
    id         TEXT PRIMARY KEY,
    item_id    TEXT REFERENCES items(id) ON DELETE CASCADE,
    signal     TEXT NOT NULL,  -- 'almost_empty' | 'plenty_left'
    created_at INTEGER NOT NULL
);

-- 借出记录
CREATE TABLE loans (
    id                    TEXT PRIMARY KEY,
    item_id               TEXT REFERENCES items(id) ON DELETE CASCADE,
    borrower_name         TEXT NOT NULL,
    borrower_contact      TEXT,
    loaned_at             INTEGER NOT NULL,
    due_at                INTEGER,
    returned_at           INTEGER,
    status                TEXT NOT NULL DEFAULT 'active',
    compensation          REAL,
    compensation_currency TEXT,
    notes                 TEXT
);

-- 虚拟资产多平台凭证
CREATE TABLE virtual_credentials (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    platform     TEXT NOT NULL,
    account      TEXT,
    order_id     TEXT,
    license_key  TEXT,
    purchased_at INTEGER,
    price        REAL,
    currency     TEXT
);

-- 虚拟资产增补购买事件
CREATE TABLE virtual_addon_purchases (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    platform     TEXT,
    price        REAL,
    currency     TEXT,
    purchased_at INTEGER NOT NULL
);

-- 提醒任务
CREATE TABLE reminders (
    id           TEXT PRIMARY KEY,
    item_id      TEXT REFERENCES items(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    trigger_at   INTEGER NOT NULL,
    sent_at      INTEGER,
    is_dismissed INTEGER NOT NULL DEFAULT 0
);

-- 物品操作历史日志
CREATE TABLE item_events (
    id         TEXT PRIMARY KEY,
    item_id    TEXT REFERENCES items(id) ON DELETE CASCADE,
    actor_id   TEXT REFERENCES users(id),
    event_type TEXT NOT NULL,
    payload    TEXT,
    created_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX idx_items_location       ON items(location_id);
CREATE INDEX idx_items_status         ON items(status);
CREATE INDEX idx_items_type           ON items(type);
CREATE INDEX idx_items_owner          ON items(owner_id);
CREATE INDEX idx_attachments_item     ON attachments(item_id);
CREATE INDEX idx_purchase_events_item ON purchase_events(item_id);
CREATE INDEX idx_loans_item           ON loans(item_id);
CREATE INDEX idx_loans_status         ON loans(status);
CREATE INDEX idx_reminders_trigger    ON reminders(trigger_at) WHERE sent_at IS NULL;
CREATE INDEX idx_item_events_item     ON item_events(item_id);

-- FTS5 全文检索
-- ⚠️ 必须使用 tokenize='trigram'，否则中文（CJK）无法正确分词。
-- 默认分词器对中文支持极差，"数据线"无法匹配"苹果数据线"。
-- trigram 将文本切成所有连续三字符片段，天然支持中文子串匹配，SQLite 3.34+ 内置。
CREATE VIRTUAL TABLE items_fts USING fts5(
    item_id UNINDEXED,
    name,
    description,
    category,
    serial_number,
    content='items',
    content_rowid='rowid',
    tokenize='trigram'
);
```

---

## 三、自然语言搜索：并发赛跑架构

### 3.1 问题与方案

串行等待 LLM（即使 3s 超时）在搜索框场景体感极差，用户会以为 App 卡死。

采用**并发赛跑（Race）**策略：

```
用户提交查询
     │
     ├──→ Goroutine A：FTS5 全文检索（~10ms）──→ 立即返回第一阶段结果
     │
     └──→ Goroutine B：LLM 解析 query（1~3s）──→ 异步推送第二阶段精细结果
```

FTS5 结果在 10ms 内给用户即时反馈，LLM 结果通过 **SSE（Server-Sent Events）** 推送，前端静默刷新结果列表。用户感知到的是"瞬间有结果，然后结果变精准了"，而不是等待。

### 3.2 后端实现

```go
// handler/search.go
// GET /api/v1/search?q=...
// 响应格式：text/event-stream（SSE）
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")

    // 设置 SSE 响应头
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("X-Accel-Buffering", "no")
    flusher := w.(http.Flusher)

    ctx := r.Context()

    // 阶段一：FTS5 即时结果（trigram 支持中文）
    ftsResults, _ := h.search.FTSSearch(ctx, query)
    writeSSEEvent(w, "fts_results", ftsResults)
    flusher.Flush()

    // 阶段二：LLM 精细结果（AI 可用时）
    if h.ai != nil {
        llmCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
        defer cancel()

        filter, err := h.ai.ParseSearchQuery(llmCtx, query)
        if err == nil {
            llmResults, _ := h.search.FilterSearch(ctx, filter)
            writeSSEEvent(w, "llm_results", llmResults)
            flusher.Flush()
        }
    }

    // 结束流
    fmt.Fprintf(w, "event: done\ndata: {}\n\n")
    flusher.Flush()
}

func writeSSEEvent(w http.ResponseWriter, event string, data any) {
    b, _ := json.Marshal(data)
    fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, b)
}
```

### 3.3 前端消费 SSE

SSE 消费逻辑在 `routes/search.tsx` 中内联实现，没有抽取为独立模块（仅单页面使用）。核心流程：

```typescript
// routes/search.tsx — 使用 EventSource 消费 SSE 流
const es = new EventSource(`/api/v1/search?q=${encodeURIComponent(query)}`);

es.addEventListener('fts_results', (e: MessageEvent) => {
    setFtsResults(JSON.parse(e.data));   // 即时展示 FTS 结果
    setIsRefining(true);                 // 显示"AI 优化中…"
});

es.addEventListener('llm_results', (e: MessageEvent) => {
    setLlmResults(JSON.parse(e.data));   // 静默替换为 LLM 精细结果
});

es.addEventListener('done', () => {
    setIsRefining(false);
    es.close();
});

// 最终展示：优先 LLM 结果，FTS 结果作为回退
const results = llmResults.length > 0 ? llmResults : ftsResults;
```

### 3.4 LLM 解析 Prompt

位置节点携带语义类型，给 LLM 提供物理常识约束上下文，避免解析出"把冰箱放进收纳盒"这类违反常识的路径。

```
你是家庭物品管理系统 Havit 的搜索解析器。
将用户的自然语言查询解析为以下 JSON，严格输出 JSON，不输出任何其他内容。
无法确定的字段填 null。

位置节点的语义类型层级（从大到小）：
  property（房产/大资产）→ room（房间）→ furniture（家具）→ container（容器）
  virtual（虚拟节点，如 @随身）不受层级约束
解析位置时请遵守物理常识：容器不能包含房间，家具不能包含房产。

{
  "keywords": [],
  "status": null,           // in_stock|borrowed|idle|lost|stolen|archived
  "type": null,             // durable|consumable_a|consumable_b|edc|virtual
  "location_hint": {
    "name": null,           // 位置名称关键词
    "semantic_type": null   // property|room|furniture|container|virtual
  },
  "tags": [],
  "time_filter": {
    "field": null,          // purchase_date|exit_date|created_at
    "op": null,             // before|after|between
    "value": null,
    "value2": null
  },
  "idle_days": null,
  "warranty_expiring_days": null,
  "stock_low": null,
  "sort": null,             // name|purchase_date|updated_at
  "sort_dir": "desc"
}
```

---

## 四、AI 集成层

### 4.1 统一接口

```go
type AIProvider interface {
    RecognizeItem(ctx context.Context, imageData []byte) (*ItemDraft, error)
    ParseSearchQuery(ctx context.Context, query string) (*SearchFilter, error)
}

// 不确定的字段为 nil，禁止填入推测值
type ItemDraft struct {
    Name        *string
    Category    *string
    Description *string
    // 序列号、具体型号后缀等高风险字段不在此结构体中
}
```

### 4.2 统一走 OpenAI 兼容协议

Ollama 提供完全兼容的接口，`base_url` 设为 `http://ollama:11434/v1` 即可，无需额外适配。

```go
const recognizePrompt = `分析图片中的物品，以 JSON 返回：
{"name": "名称或null", "category": "分类或null", "description": "简短描述或null"}
规则：
1. 不确定的字段必须返回 null，不允许猜测
2. 型号后缀（如 F1.2 vs F1.4）、序列号必须返回 null
3. 只输出 JSON，不输出其他内容`
```

### 4.3 幻觉防御三件套

- **结构化 Prompt**：返回字段严格映射 `ItemDraft`，高风险字段不在结构体中
- **不确定字段留 null**：前端展示为"待填写"，不自动填入任何推测值
- **AI 原始照片永久保存**：`is_ai_source=1` 的附件，handler 层拒绝 DELETE 和覆盖

---

## 五、附件上传：流式写入，杜绝内存击穿

### 5.1 问题说明

手机拍摄原图通常 5~15MB。若前端将图片转 Base64 塞入 JSON，体积膨胀 33%，且 Go 会在内存中产生完整字符串对象。在 1~2GB 内存的家庭 NAS 或软路由上极易触发 OOM。

**解决方案：强制 `multipart/form-data`，`io.Copy` 直接流式落盘，文件内容不经过内存缓冲。**

### 5.2 Handler 实现

```go
// handler/attachment.go
func (h *AttachmentHandler) Upload(w http.ResponseWriter, r *http.Request) {
    itemID := chi.URLParam(r, "itemID")

    // 限制此路由的最大请求体（覆盖全局 4MB 限制）
    maxBytes := int64(h.cfg.Storage.MaxPhotoSizeMB) * 1024 * 1024
    r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

    // 流式解析 multipart，不将整个文件加载到内存
    if err := r.ParseMultipartForm(2 * 1024 * 1024); err != nil { // 2MB 内存缓冲
        http.Error(w, "file too large", http.StatusRequestEntityTooLarge)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "invalid file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // io.Copy 流式写入磁盘，内存中只有 2MB 缓冲
    attachmentID := ulid.Make().String()
    destPath := h.storage.AttachmentPath(itemID, attachmentID, header.Filename)
    if err := h.storage.StreamWrite(destPath, file); err != nil {
        http.Error(w, "storage error", http.StatusInternalServerError)
        return
    }

    // 异步生成缩略图（不阻塞响应）
    go h.storage.GenerateThumb(destPath)

    // 写入数据库记录
    // ...
}

// storage/storage.go
func (s *Storage) StreamWrite(path string, r io.Reader) error {
    if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
        return err
    }
    f, err := os.Create(path)
    if err != nil {
        return err
    }
    defer f.Close()
    _, err = io.Copy(f, r)   // 流式写入，无内存积压
    return err
}
```

### 5.3 目录结构

```
/data/
├── havit.db
├── havit.db-wal
├── attachments/
│   └── {item_id}/
│       ├── {id}_original.jpg     # AI 来源照片，is_ai_source=1，不可覆盖
│       ├── {id}_thumb.webp       # 缩略图，320px 宽，异步生成
│       └── {id}_invoice.pdf
└── backups/
    └── 2026-06-07T030000_havit.tar.gz
```

---

## 六、备份：三步原子流程

### 6.1 正确流程（严格遵守）

**⚠️ 绝对不能直接 `tar` 正在运行的 `havit.db` 和 `havit.db-wal`。WAL 模式下这两个文件随时可能处于不一致状态，打出来的压缩包大概率是损坏的数据库。**

正确的三步流程：

```go
// internal/service/backup.go
func (s *BackupService) Run(ctx context.Context) error {
    timestamp := time.Now().Format("2006-01-02T150405")
    tempDB   := filepath.Join(s.cfg.Data.Dir, "backups", "temp_backup.db")
    finalTar := filepath.Join(s.cfg.Data.Dir, "backups",
                    fmt.Sprintf("%s_havit.tar.gz", timestamp))

    // 步骤一：VACUUM INTO 生成一致性快照
    // 这是 SQLite 官方推荐的热备方式，线程安全，保证文件完整性。
    // 绝对不要用 file copy 或 tar 直接打包 havit.db + havit.db-wal。
    if _, err := s.db.ExecContext(ctx,
        fmt.Sprintf("VACUUM INTO '%s'", tempDB)); err != nil {
        return fmt.Errorf("vacuum into: %w", err)
    }

    // 步骤二：将一致性快照 + attachments 打包
    attachDir := filepath.Join(s.cfg.Data.Dir, "attachments")
    if err := createTarGz(finalTar, tempDB, attachDir); err != nil {
        return fmt.Errorf("tar: %w", err)
    }

    // 步骤三：删除临时快照
    os.Remove(tempDB)

    // 清理超过 keep_days 的旧备份
    s.pruneOldBackups(ctx)

    slog.Info("backup completed", "file", finalTar)
    return nil
}
```

### 6.2 定时调度

```go
// 使用 robfig/cron 解析 cron 表达式
func (s *BackupService) StartScheduler(ctx context.Context) {
    c := cron.New()
    c.AddFunc(s.cfg.Backup.Cron, func() {
        if err := s.Run(context.Background()); err != nil {
            slog.Error("backup failed", "err", err)
        }
    })
    c.Start()
    <-ctx.Done()
    c.Stop()
}
```

---

## 七、前端架构

### 7.1 技术栈总览

| 职责 | 选型 |
|---|---|
| 构建工具 | Vite 5 |
| UI 框架 | React 18 |
| UI 原语层 | Base UI（MUI） |
| 路由 | TanStack Router v1 |
| 数据请求 | TanStack Query v5 |
| 样式 | Vanilla Extract |
| 图标 | @tabler/icons-react |
| 条码扫描 | @zxing/browser（纯前端） |
| HTTP 客户端 | ky |
| PWA | vite-plugin-pwa |

### 7.2 目录结构

```
web/
├── src/
│   ├── routes/
│   │   ├── __root.tsx             # 根布局、导航栏、路由守卫（beforeLoad）
│   │   ├── index.tsx              # Dashboard
│   │   ├── login.tsx              # 登录页（demo 模式自动填充）
│   │   ├── setup.tsx              # 首次初始化向导
│   │   ├── search.tsx             # SSE 两阶段搜索页
│   │   ├── items.index.tsx        # 物品列表
│   │   ├── items.$itemId.tsx      # 物品详情
│   │   ├── locations.index.tsx    # 位置树
│   │   ├── consumables.tsx        # 消耗品 A/B 管理
│   │   ├── edc.tsx                # EDC 随身物品
│   │   ├── loans.tsx              # 借出追踪
│   │   ├── credentials.tsx        # 凭证与保修
│   │   ├── lifecycle.tsx          # 物品退场 & 墓地
│   │   ├── capture.tsx            # 录入（条码/AI 识别/手动）
│   │   ├── qr-print.tsx           # 位置二维码批量打印
│   │   ├── location-scan.tsx      # 位置扫码盘点
│   │   ├── operations.tsx         # 操作中心（备份/提醒/导出）
│   │   └── import.tsx             # CSV/JSON 批量导入
│   ├── components/
│   │   └── ui/
│   │       ├── index.tsx          # 设计系统组件（Button、Card、Dialog、Toast 等）
│   │       └── styles.css.ts      # Vanilla Extract 样式
│   ├── features/
│   │   ├── m2/components.tsx      # M2 公共组件（FeatureHeader、MetricStrip、DataCard）
│   │   ├── qr/                   # QR 码相关（扫描、生成、打印）
│   │   └── locations/types.ts     # 位置类型定义
│   ├── api/
│   │   └── client.ts             # ky 实例 + 全量 API 方法
│   ├── styles/
│   │   ├── theme.css.ts          # Design token（色彩、间距、圆角、阴影）
│   │   ├── global.css.ts         # 全局 reset 与基础样式
│   │   └── print.css             # 打印样式
│   ├── utils/
│   │   └── useNetworkStatus.ts   # 网络状态感知 hook
├── public/manifest.json
├── vite.config.ts
└── package.json
```

### 7.3 PWA 离线策略：仅离线读缓存

**M3 前明确不做离线写（Offline Write）。**

离线写需要在前端引入 IndexedDB Mutation Queue，等网络恢复后后台同步，并处理冲突合并。对于家庭自部署场景，这套机制的复杂度远超收益（实际断网录入的需求极低）。

**离线读缓存策略（vite-plugin-pwa + TanStack Query）：**

```typescript
// vite.config.ts
VitePWA({
    registerType: 'autoUpdate',
    workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp}'],
        // 静态资源：Cache First
        runtimeCaching: [{
            urlPattern: /\/api\/v1\/(items|locations)/,
            handler: 'NetworkFirst',   // 优先网络，失败时用缓存
            options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 3,
                expiration: { maxAgeSeconds: 3600 },
            },
        }],
    },
})
```

**网络状态感知（禁用写操作按钮）：**

```typescript
// utils/useNetworkStatus.ts
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const on  = () => setIsOnline(true);
        const off = () => setIsOnline(false);
        window.addEventListener('online',  on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online',  on);
            window.removeEventListener('offline', off);
        };
    }, []);
    return isOnline;
}

// 在新增/编辑按钮处使用
const isOnline = useNetworkStatus();
<Button disabled={!isOnline} title={!isOnline ? '离线模式下无法录入' : ''}>
    新增物品
</Button>
```

### 7.4 设计系统：Base UI + Vanilla Extract

Base UI 提供无样式的行为原语（可访问性、键盘交互、ARIA 属性），Vanilla Extract 负责全部视觉样式。两者分工明确，共同构成 Havit 自有的设计系统。

**Design Token 定义（styles/theme.css.ts）：**

```typescript
// styles/theme.css.ts
import { createGlobalTheme } from '@vanilla-extract/css';

export const themeVars = createGlobalTheme(':root', {
    color: {
        primary:       '#3B6DEA',
        primaryHover:  '#2F5DC9',
        surface:       '#FFFFFF',
        surfaceRaised: '#F8F7F4',
        border:        '#E2E0D8',
        borderStrong:  '#C8C6BC',
        textPrimary:   '#1A1917',
        textSecondary: '#6B6964',
        textTertiary:  '#9C9A94',
        success:       '#2D7D46',
        successBg:     '#EAF4ED',
        warning:       '#A05C00',
        warningBg:     '#FEF3E2',
        danger:        '#C53030',
        dangerBg:      '#FDECEA',
        info:          '#1D6FA4',
        infoBg:        '#E6F1FB',
    },
    space: {
        '1': '4px',  '2': '8px',  '3': '12px', '4': '16px',
        '5': '20px', '6': '24px', '8': '32px', '10': '40px',
    },
    radius: {
        sm: '6px', md: '8px', lg: '12px', full: '9999px',
    },
    shadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
    },
    font: {
        sans: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, monospace',
        sm:   '13px', base: '14px', md: '15px', lg: '16px', xl: '20px',
    },
});
```

**自定义组件示例（components/Button/Button.css.ts）：**

```typescript
import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

const base = style({
    display:        'inline-flex',
    alignItems:     'center',
    gap:            vars.space['2'],
    padding:        `${vars.space['2']} ${vars.space['4']}`,
    borderRadius:   vars.radius.md,
    fontSize:       vars.font.base,
    fontWeight:     500,
    border:         'none',
    cursor:         'pointer',
    transition:     'background 0.15s, box-shadow 0.15s',
    ':disabled': {
        opacity: 0.45,
        cursor:  'not-allowed',
    },
});

export const button = styleVariants({
    primary: [base, {
        background: vars.color.primary,
        color:      '#fff',
        ':hover':   { background: vars.color.primaryHover },
    }],
    secondary: [base, {
        background: vars.color.surfaceRaised,
        color:      vars.color.textPrimary,
        border:     `1px solid ${vars.color.border}`,
        ':hover':   { background: vars.color.border },
    }],
    ghost: [base, {
        background: 'transparent',
        color:      vars.color.textSecondary,
        ':hover':   { background: vars.color.surfaceRaised },
    }],
    danger: [base, {
        background: vars.color.danger,
        color:      '#fff',
        ':hover':   { filter: 'brightness(0.92)' },
    }],
});
```

**Base UI 原语封装示例（Select 组件）：**

```typescript
// components/Select/Select.tsx
import * as BaseSelect from '@base-ui-components/react/select';
import * as styles from './Select.css';

interface SelectProps {
    value:       string;
    onChange:    (v: string) => void;
    options:     { label: string; value: string }[];
    placeholder?: string;
}

export function Select({ value, onChange, options, placeholder }: SelectProps) {
    return (
        // Base UI 处理：键盘导航、ARIA、焦点管理
        // Vanilla Extract 处理：全部视觉样式
        <BaseSelect.Root value={value} onValueChange={onChange}>
            <BaseSelect.Trigger className={styles.trigger}>
                <BaseSelect.Value placeholder={placeholder} />
                <BaseSelect.Icon className={styles.icon} />
            </BaseSelect.Trigger>
            <BaseSelect.Positioner>
                <BaseSelect.Popup className={styles.popup}>
                    {options.map(opt => (
                        <BaseSelect.Item
                            key={opt.value}
                            value={opt.value}
                            className={styles.item}
                        >
                            <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                        </BaseSelect.Item>
                    ))}
                </BaseSelect.Popup>
            </BaseSelect.Positioner>
        </BaseSelect.Root>
    );
}
```

**状态徽章示例（复用 statusBadge）：**

```typescript
// components/StatusBadge/StatusBadge.css.ts
import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/tokens.css';

export const badge = styleVariants({
    in_stock: { background: vars.color.successBg, color: vars.color.success },
    borrowed: { background: vars.color.warningBg, color: vars.color.warning },
    lost:     { background: vars.color.dangerBg,  color: vars.color.danger  },
    archived: { background: vars.color.surfaceRaised, color: vars.color.textTertiary },
});
```

**需要自建的组件清单（均在 components/ui/ 单文件中）：**

- `Button`（variant: primary / subtle / quiet）
- `TextField` / `TextareaField`（含 label、error state）
- `SelectField`（Base UI Select 封装）
- `Dialog`（Base UI Dialog 封装，未单独导出 Modal）
- `Tooltip`（CSS 纯工具类，data-tip 属性驱动）
- `Badge` / `StatusBadge`
- `Card`
- `Spinner` / `Skeleton`（SkeletonText / SkeletonTitle / SkeletonCircle / SkeletonRect）
- `Alert`
- `Tabs`
- `Toast`（`ToastProvider` + `useToast` hook，Base UI Toast 封装）

这些组件复用 theme.css.ts 中的 design token，保证视觉一致性。

### 7.5 embed 进 Go 二进制

```typescript
// vite.config.ts
export default defineConfig({
    plugins: [react(), vanillaExtractPlugin(), VitePWA({ ... })],
    build: {
        outDir: '../static',
        emptyOutDir: true,
    },
    server: {
        proxy: { '/api': 'http://localhost:3000' },
    },
});
```

```go
//go:embed static/*
var embeddedStatic embed.FS

func mountStatic(r chi.Router) {
    staticFS, _ := fs.Sub(embeddedStatic, "static")
    fileServer := http.FileServer(http.FS(staticFS))
    r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        path := strings.TrimPrefix(r.URL.Path, "/")
        if _, err := staticFS.Open(path); errors.Is(err, fs.ErrNotExist) {
            r.URL.Path = "/"  // SPA fallback
        }
        fileServer.ServeHTTP(w, r)
    }))
}
```

---

## 八、通知系统

后台 Goroutine 每 15 分钟扫描 `reminders` 表，通过用户配置的网关推送提醒。优先对接 Apprise（一个实例覆盖 Bark、Ntfy、Telegram 等数十种渠道）：

```go
type NotifyGateway interface {
    Send(ctx context.Context, title, body string) error
}

func (s *NotifyService) StartScheduler(ctx context.Context) {
    ticker := time.NewTicker(15 * time.Minute)
    for {
        select {
        case <-ticker.C:
            s.processReminders(ctx)
        case <-ctx.Done():
            return
        }
    }
}
```

---

## 九、Docker 部署

### 9.1 多阶段 Dockerfile

```dockerfile
# 阶段一：构建前端
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build          # 输出到 ../static

# 阶段二：构建后端
FROM golang:1.23-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/static ./static
# modernc/sqlite 纯 Go，CGO_ENABLED=0
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o havit ./cmd/havit

# 阶段三：最终镜像
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=backend /app/havit .
VOLUME ["/data"]
EXPOSE 3000
ENTRYPOINT ["./havit"]
```

### 9.2 最简启动

```bash
docker run -d \
  --name havit \
  -p 3000:3000 \
  -v havit_data:/data \
  -e HAVIT_AI_ENABLED=true \
  -e HAVIT_AI_API_KEY=sk-xxx \
  ghcr.io/yourname/havit:latest
```

### 9.3 带 Apprise 的 compose（可选）

```yaml
services:
  havit:
    image: ghcr.io/yourname/havit:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      HAVIT_AI_ENABLED: "true"
      HAVIT_AI_API_KEY: ${AI_API_KEY}
      HAVIT_NOTIFY_APPRISE_URL: http://apprise:8000
    restart: unless-stopped

  apprise:
    image: caronc/apprise:latest
    restart: unless-stopped
```

---

## 十、开发工作流

```bash
# 安装工具链
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install github.com/pressly/goose/v3/cmd/goose@latest
go install github.com/air-verse/air@latest

# 数据库迁移
goose -dir internal/db/migrations sqlite ./data/havit.db up

# 修改 query/*.sql 后重新生成类型安全代码
sqlc generate

# 后端热重载
air

# 前端开发（代理 /api 到 :3000）
cd web && npm run dev
```

**.air.toml：**

```toml
[build]
  cmd = "go build -o ./tmp/havit ./cmd/havit"
  bin = "./tmp/havit"
  include_ext = ["go"]
  exclude_dir = ["web", "static", "data", "tmp"]
```

---

## 十一、关键技术风险与应对

| 风险 | 应对方案 |
|---|---|
| **中文 FTS 无效** | FTS5 必须使用 `tokenize='trigram'`，否则中文子串匹配完全失效 |
| SQLite 并发写锁 | `SetMaxOpenConns(1)` + `busy_timeout=5000`；家庭 QPS 极低，实际不成问题 |
| 附件上传内存击穿 | 强制 multipart，`io.Copy` 流式落盘，全局 JSON 接口限 4MB，附件接口独立限制 |
| AI 识别幻觉 | 结构化 Prompt + 高风险字段强制 null + 原始照片永久留存 |
| LLM 搜索体感延迟 | 并发赛跑：FTS5 先出结果，LLM 结果 SSE 异步刷新，用户感知瞬时响应 |
| SQLite 备份文件损坏 | 三步原子流程：`VACUUM INTO` 先建一致性快照，再打包，绝不直接 tar 运行中的 db 文件 |
| PWA 离线写冲突 | M3 前明确不做离线写，网络断开时置灰所有写操作按钮 |
| Base UI 默认样式覆盖 | VE 覆盖 Base UI 所有样式，通过 CSS 变量统一 design token，无运行时冲突 |
| 单二进制体积 | 前端 tree-shaking + `-ldflags="-s -w"`，预计 < 35MB |

---

## 十二、里程碑规划

**M1（P0，约 6~8 周）**

Go：Viper 配置 + Chi 路由 + SQLite 初始化（WAL pragma）+ Goose 迁移 + 全量 Schema + FTS5（trigram）+ 物品 CRUD + 位置树 CRUD + JWT 认证 + CSV/JSON 批量导入 + Docker 多阶段构建

前端：React + Vite + Base UI + TanStack Router/Query + Vanilla Extract 骨架 + 基础页面 + PWA manifest + 网络状态感知（写操作 online-only）

**M2（P1，约 8~10 周）**

- 条码扫描（@zxing/browser 前端 + 后端条码库查询）
- AI 拍照识别（multipart 流式上传 + 幻觉防御）
- 自然语言搜索（并发赛跑：FTS5 + SSE + LLM 异步刷新）
- 消耗品 A/B 双模型 + 校准事件
- EDC 双轨模型 + 搜索降级提示
- 位置二维码生成与打印
- 凭证与保修管理
- 借出追踪 + 责任交割
- 资产退场状态机 + 物品墓地
- 提醒调度器 + Apprise/Ntfy/Webhook
- 备份服务（三步原子流程 + cron 调度）

**M3（P2，持续迭代）**

- 虚拟资产管理
- 多用户家庭账号（Instance Owner + Member）
- 容器型物品（路径动态联动）
- EDC 一键打包 / 归位
- 理赔凭证 PDF 导出
- 损耗记录列表
- PWA 离线写探索（IndexedDB Mutation Queue）

---

*关联文档：havit-product-design.md v0.4*

---

## 十三、系统启动模式（Run Mode）

### 13.1 两种运行模式

通过配置项 `mode` 或环境变量 `HAVIT_RUN_MODE` 控制，分为 `release`（默认）和 `demo` 两种模式。

| 维度 | release | demo |
|---|---|---|
| 定位 | 家庭生产部署 | 在线演示站 / 本地试用 |
| 初始化方式 | `/setup` 向导注册 Owner | 自动注入种子数据 |
| 非空库行为 | 正常启动 | Fatal 拒绝启动（保护生产数据） |
| 登录页 | 标准登录 | 自动填充测试账号 + Demo Banner |
| 写操作 | 全部开放 | 按需限制（可配置为只读） |

### 13.2 启动时序

```
┌─────────────────────────────────────────────────────────┐
│                     Go 进程启动                          │
└───────────────────────────┬─────────────────────────────┘
                            │
                    Viper 加载配置
                            │
                    Goose 执行迁移
                            │
               ┌────────────┴────────────┐
          release 模式               demo 模式
               │                         │
       查询 users 表                查询 users 表
               │                         │
        ┌──────┴──────┐           ┌──────┴──────┐
      有数据         空库         有数据         空库
        │              │            │              │
     正常启动    标记           Fatal 拒绝      注入种子数据
              needs_setup       启动            然后启动
               = true
```

### 13.3 系统状态接口

前端挂载时的第一个请求，无需鉴权：

```
GET /api/v1/system/status
```

```go
// handler/system.go
type SystemStatus struct {
    Mode       string `json:"mode"`        // "release" | "demo"
    NeedsSetup bool   `json:"needs_setup"` // true = 重定向 /setup
    Version    string `json:"version"`     // "v0.1.0"
}

func (h *SystemHandler) Status(w http.ResponseWriter, r *http.Request) {
    render.JSON(w, r, SystemStatus{
        Mode:       h.cfg.Mode,
        NeedsSetup: h.state.NeedsSetup,
        Version:    buildVersion, // ldflags 注入
    })
}
```

响应示例：

```json
{ "mode": "release", "needs_setup": true,  "version": "v0.1.0" }
{ "mode": "demo",    "needs_setup": false, "version": "v0.1.0" }
```

### 13.4 前端路由守卫

前端挂载时先请求 `/api/system/status`，根据返回结果决定路由走向，不直接跳登录页：

```typescript
// routes/__root.tsx
const PUBLIC_PATHS = new Set(['/login', '/setup']);

export const Route = createRootRouteWithContext<RouterContext>()({
    beforeLoad: async ({ context, location }) => {
        const status = await context.queryClient.fetchQuery({
            queryKey:  ['system', 'status'],
            queryFn:   () => api.get('system/status').json<SystemStatus>(),
            staleTime: Infinity,
        });

        // Release 模式：未初始化且不在 /setup，强制跳 /setup
        if (status.mode === 'release' && status.needs_setup && location.pathname !== '/setup') {
            throw redirect({ to: '/setup' });
        }

        // 已初始化却在 /setup，跳 /login
        if (!status.needs_setup && location.pathname === '/setup') {
            throw redirect({ to: '/login', search: { redirect: undefined } });
        }

        // 非公开路径需要 token
        const isPublic = PUBLIC_PATHS.has(location.pathname);
        if (!isPublic && !getToken()) {
            throw redirect({ to: '/login', search: { redirect: location.pathname } });
        }

        return { systemStatus: status };
    },
});
```

### 13.5 Release 模式：初始化向导（/setup）

首次部署后，任何路由访问都被重定向到 `/setup`。第一个注册的用户自动获得 `owner` 角色，注册完成后 `needs_setup` 状态持久化为 `false`，后续访问恢复正常登录页。

`/setup` 路由本身需要跳过鉴权中间件（和 `/api/system/status` 一样加入白名单）。

### 13.6 Demo 模式：种子数据

**目录结构：**

```
internal/
└── db/
    ├── migrations/        # Goose 结构迁移
    ├── query/             # sqlc 查询语句
    ├── sqlc/              # 生成的 Go 代码
    └── seeds/
        ├── embed.go       # go:embed 挂载
        └── demo-seed.sql  # 纯 SQL 种子数据
```

**embed 实现：**

```go
// internal/db/seeds/embed.go
package seeds

import _ "embed"

//go:embed demo-seed.sql
var DemoSeedSQL string
```

**启动注入逻辑：**

```go
// internal/db/init.go
func InitDemoDataIfNeeded(db *sql.DB, mode string) error {
    if mode != "demo" {
        return nil
    }

    var count int
    if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count); err != nil {
        return err
    }

    // 非空库：拒绝启动，防止覆写生产数据
    if count > 0 {
        return fmt.Errorf(
            "fatal: database already initialized, " +
            "refusing to start in demo mode to protect existing data")
    }

    slog.Info("demo mode: empty database detected, injecting seed data")
    if _, err := db.Exec(seeds.DemoSeedSQL); err != nil {
        return fmt.Errorf("seed injection failed: %w", err)
    }
    slog.Info("demo mode: seed data injected successfully")
    return nil
}
```

**demo-seed.sql 编写规范：**

```sql
-- internal/db/seeds/demo-seed.sql
-- ⚠️ 插入顺序必须遵守外键依赖关系：users → locations → items → 关联表

-- 1. 超级管理员（密码 havit-demo 的 bcrypt hash）
INSERT INTO users (id, username, password, role, created_at)
VALUES ('01DEMO0000USER000001', 'admin@havit.local',
        '$2a$10$demoHashPlaceholder', 'owner', 1717770000);

-- 2. 位置节点（先父后子）
INSERT INTO locations (id, parent_id, name, type, created_at, updated_at) VALUES
('01DEMO000LOC0000001', NULL,                  '我的家',   'physical', 1717770000, 1717770000),
('01DEMO000LOC0000002', '01DEMO000LOC0000001', '客厅',     'physical', 1717770000, 1717770000),
('01DEMO000LOC0000003', '01DEMO000LOC0000002', '电视柜',   'physical', 1717770000, 1717770000),
('01DEMO000LOC0000004', '01DEMO000LOC0000001', '卧室',     'physical', 1717770000, 1717770000),
('01DEMO000LOC0000005', '01DEMO000LOC0000004', '书桌',     'physical', 1717770000, 1717770000),
('01DEMO000LOC0000006', NULL,                  '@随身',    'virtual',  1717770000, 1717770000);

-- 3. 标签
INSERT INTO tags (id, name, color) VALUES
('01DEMO000TAG0000001', '摄影',     '#4A90D9'),
('01DEMO000TAG0000002', '数码',     '#7B61FF'),
('01DEMO000TAG0000003', '高频使用', '#F5A623');

-- 4. 物品（覆盖全部 5 种类型）
INSERT INTO items (id, name, category, type, status,
                   location_id, current_stock, min_stock_threshold,
                   is_private, owner_id, created_at, updated_at) VALUES
-- 耐用品
('01DEMO000ITEM000001', 'Sony A7M4 相机机身',   '数码电子', 'durable',      'in_stock',
 '01DEMO000LOC0000003', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000002', 'Sony 50mm F1.2 镜头',  '数码电子', 'durable',      'borrowed',
 '01DEMO000LOC0000003', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
-- EDC 物品（当前 @随身）
('01DEMO000ITEM000003', 'AirPods Pro 2',         '数码电子', 'edc',          'in_stock',
 '01DEMO000LOC0000006', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
-- 消耗品 A（时间推算型）
('01DEMO000ITEM000004', '埃塞俄比亚咖啡豆',        '食品',     'consumable_a', 'in_stock',
 '01DEMO000LOC0000002', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
-- 消耗品 B（库存阈值型）
('01DEMO000ITEM000005', '净水器滤芯',            '家庭用品', 'consumable_b', 'in_stock',
 '01DEMO000LOC0000002', 0,    1,    0, '01DEMO0000USER000001', 1717770000, 1717770000),
-- 虚拟资产（无实物位置）
('01DEMO000ITEM000006', 'Adobe 创意云摄影计划',  '软件订阅', 'virtual',     'in_stock',
 NULL,                NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000);

-- 5. items_fts 同步
INSERT INTO items_fts (item_id, name, description, category, serial_number) VALUES
('01DEMO000ITEM000001', 'Sony A7M4 相机机身',   NULL, '数码电子', NULL),
('01DEMO000ITEM000002', 'Sony 50mm F1.2 镜头',  NULL, '数码电子', NULL),
('01DEMO000ITEM000003', 'AirPods Pro 2',         NULL, '数码电子', NULL),
('01DEMO000ITEM000004', '埃塞俄比亚咖啡豆',      NULL, '食品',     NULL),
('01DEMO000ITEM000005', '净水器滤芯',            NULL, '家庭用品', NULL),
('01DEMO000ITEM000006', 'Adobe 创意云摄影计划',  NULL, '软件订阅', NULL);

-- 6. 物品-标签关联
INSERT INTO item_tags (item_id, tag_id) VALUES
('01DEMO000ITEM000001', '01DEMO000TAG0000001'),
('01DEMO000ITEM000001', '01DEMO000TAG0000002'),
('01DEMO000ITEM000002', '01DEMO000TAG0000001'),
('01DEMO000ITEM000003', '01DEMO000TAG0000003');

-- 7. 消耗品 A 历史购买事件
INSERT INTO purchase_events (id, item_id, quantity, purchased_at) VALUES
('01DEMO000EVT0000001', '01DEMO000ITEM000004', 1, 1710000000),
('01DEMO000EVT0000002', '01DEMO000ITEM000004', 1, 1712678400),
('01DEMO000EVT0000003', '01DEMO000ITEM000004', 1, 1715270400);

-- 8. 虚拟资产凭证（演示加密凭证功能）
INSERT INTO virtual_credentials (id, item_id, platform, account, order_id, purchased_at, price, currency) VALUES
('01DEMO000VRC0000001', '01DEMO000ITEM000006', 'Adobe', 'photo@example.com', 'ADOBE-2024-001',
 1700000000, 1188.00, 'CNY');

-- 9. 虚拟资产增补购买
INSERT INTO virtual_addon_purchases (id, item_id, name, platform, price, currency, purchased_at) VALUES
('01DEMO000ADP0000001', '01DEMO000ITEM000006', 'Lightroom 高级预设包', 'Adobe', 199.00, 'CNY', 1710000000),
('01DEMO000ADP0000002', '01DEMO000ITEM000006', 'Photoshop 笔刷扩展',  'Adobe', 89.00,  'CNY', 1712600000);

-- 10. 借出记录（演示借出追踪 + 逾期未还状态）
INSERT INTO loans (id, item_id, borrower_name, borrower_contact,
                   loaned_at, due_at, status) VALUES
('01DEMO000LOAN000001', '01DEMO000ITEM000002', '小王', 'xiaowang@example.com',
 1714521600, 1717200000, 'active');
-- due_at 已过期，演示"逾期未还"提醒状态
