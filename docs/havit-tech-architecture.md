# Havit — 技术架构规划

**版本** v0.3  
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
| UI 组件库 | Mantine v7 | 内置表单/日期/上传/通知，无需再选配 |
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
│   │   ├── query/               # sqlc 原始 .sql 查询文件
│   │   └── sqlc/                # sqlc 生成的 Go 代码（不手写）
│   ├── handler/
│   │   ├── item.go
│   │   ├── location.go
│   │   ├── consumable.go
│   │   ├── attachment.go        # multipart 流式上传，禁止 Base64-in-JSON
│   │   ├── search.go            # 并发赛跑：FTS5 先出 + LLM 异步刷新
│   │   └── auth.go
│   ├── service/
│   │   ├── item.go
│   │   ├── search.go            # Race 搜索实现
│   │   ├── ai.go                # AI 识别 + LLM query 解析
│   │   ├── notify.go            # 提醒调度器
│   │   └── backup.go            # 三步原子备份（VACUUM INTO）
│   ├── model/
│   ├── middleware/
│   └── storage/                 # 附件流式写入抽象
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
CREATE TABLE locations (
    id          TEXT PRIMARY KEY,
    parent_id   TEXT REFERENCES locations(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'physical', -- 'physical' | 'virtual' | 'container'
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

```typescript
// api/search.ts
export function streamSearch(
    query: string,
    onFTSResults: (items: Item[]) => void,
    onLLMResults: (items: Item[]) => void,
) {
    const url = `/api/v1/search?q=${encodeURIComponent(query)}`;
    const es = new EventSource(url);

    es.addEventListener('fts_results', (e) => {
        onFTSResults(JSON.parse(e.data));
    });
    es.addEventListener('llm_results', (e) => {
        onLLMResults(JSON.parse(e.data));
    });
    es.addEventListener('done', () => es.close());
    es.onerror = () => es.close();

    return () => es.close(); // 返回清理函数
}

// routes/items/index.tsx（搜索框）
function SearchBar() {
    const [items, setItems] = useState<Item[]>([]);
    const [isRefining, setIsRefining] = useState(false);

    const handleSearch = (query: string) => {
        const cleanup = streamSearch(
            query,
            (ftsItems) => {
                setItems(ftsItems);          // 立即展示 FTS 结果
                setIsRefining(true);         // 显示"AI 优化中…"提示
            },
            (llmItems) => {
                setItems(llmItems);          // 静默替换为 LLM 精细结果
                setIsRefining(false);
            },
        );
        return cleanup;
    };

    return (
        <TextInput
            placeholder="搜索物品…"
            rightSection={isRefining
                ? <Loader size="xs" />
                : <IconSearch size={16} />
            }
            onChange={(e) => handleSearch(e.target.value)}
        />
    );
}
```

### 3.4 LLM 解析 Prompt

```
你是家庭物品管理系统 Havit 的搜索解析器。
将用户的自然语言查询解析为以下 JSON，严格输出 JSON，不输出任何其他内容。
无法确定的字段填 null。

{
  "keywords": [],
  "status": null,           // in_stock|borrowed|idle|lost|stolen|archived
  "type": null,             // durable|consumable_a|consumable_b|edc|virtual
  "location_hint": null,
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
| 组件库 | Mantine v7 |
| 路由 | TanStack Router v1 |
| 数据请求 | TanStack Query v5 |
| 样式 | Vanilla Extract |
| 图标 | Tabler Icons（@tabler/icons-react） |
| 条码扫描 | @zxing/browser（纯前端） |
| HTTP 客户端 | ky |
| PWA | vite-plugin-pwa |

### 7.2 目录结构

```
web/
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx              # Dashboard
│   │   ├── items/
│   │   │   ├── index.tsx          # 物品列表
│   │   │   ├── $itemId.tsx        # 物品详情
│   │   │   └── new.tsx            # 录入（拍照/扫码/手动）
│   │   ├── locations/index.tsx
│   │   ├── consumables/index.tsx
│   │   ├── loans/index.tsx
│   │   ├── archive/index.tsx      # 物品墓地
│   │   └── settings/index.tsx
│   ├── components/
│   │   ├── ItemCard/
│   │   ├── LocationTree/
│   │   ├── BarcodeScanner/
│   │   ├── CameraCapture/
│   │   ├── SearchBar/             # SSE 消费，两阶段结果展示
│   │   └── QrPrintSheet/
│   ├── api/
│   │   ├── client.ts              # ky 实例
│   │   ├── items.ts
│   │   ├── locations.ts
│   │   └── search.ts              # streamSearch（SSE）
│   ├── styles/
│   │   ├── theme.css.ts           # Mantine token → VE CSS 变量
│   │   └── global.css.ts
│   └── utils/
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

### 7.4 Vanilla Extract 与 Mantine 协同

VE 负责自定义组件和布局样式，Mantine 内部样式不干预，通过 CSS 变量共享 design token：

```typescript
// styles/theme.css.ts
export const card = style({
    background: 'var(--mantine-color-default)',
    borderRadius: 'var(--mantine-radius-md)',
    padding: 'var(--mantine-spacing-md)',
    border: '1px solid var(--mantine-color-default-border)',
    transition: 'box-shadow 0.15s ease',
    ':hover': { boxShadow: 'var(--mantine-shadow-sm)' },
});

export const statusBadge = styleVariants({
    in_stock:  { background: 'var(--mantine-color-green-1)'  },
    borrowed:  { background: 'var(--mantine-color-yellow-1)' },
    lost:      { background: 'var(--mantine-color-red-1)'    },
    archived:  { background: 'var(--mantine-color-gray-1)'   },
});
```

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
| Vanilla Extract 与 Mantine 样式冲突 | VE 只负责自定义组件，Mantine 内部样式不干预，通过 CSS 变量共享 token |
| 单二进制体积 | 前端 tree-shaking + `-ldflags="-s -w"`，预计 < 35MB |

---

## 十二、里程碑规划

**M1（P0，约 6~8 周）**

Go：Viper 配置 + Chi 路由 + SQLite 初始化（WAL pragma）+ Goose 迁移 + 全量 Schema + FTS5（trigram）+ 物品 CRUD + 位置树 CRUD + JWT 认证 + CSV/JSON 批量导入 + Docker 多阶段构建

前端：React + Vite + Mantine + TanStack Router/Query + Vanilla Extract 骨架 + 基础页面 + PWA manifest + 网络状态感知（写操作 online-only）

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
