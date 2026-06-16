import type {
  BackupRun,
  CaptureDraft,
  SupplyForecast,
  CredentialRecord,
  EssentialsAsset,
  ExportPreset,
  LifecycleRecord,
  LoanRecord,
  LocationLabel,
  ReminderJob,
  SearchResultHint,
} from './types';

export const captureDrafts: CaptureDraft[] = [
  {
    id: 'capture-1',
    source: 'barcode',
    title: 'Calbee 薯片 75g',
    confidence: 0.92,
    status: 'ready',
    fields: [
      { label: '商品名', value: 'Calbee 薯片 75g', confidence: 'high' },
      { label: '分类', value: '零食', confidence: 'high' },
      { label: '位置', value: '厨房 → 零食抽屉', confidence: 'medium' },
    ],
  },
  {
    id: 'capture-2',
    source: 'ai_photo',
    title: 'Sony FE 35mm F1.8',
    confidence: 0.74,
    status: 'needs_review',
    imageUrl:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=640&q=80',
    fields: [
      { label: '名称', value: 'Sony FE 35mm F1.8', confidence: 'high' },
      { label: '型号后缀', value: '留空，等待人工确认', confidence: 'empty' },
      { label: '序列号', value: '留空，禁止推测', confidence: 'empty' },
    ],
  },
  {
    id: 'capture-3',
    source: 'manual',
    title: '未知条码，进入手动录入',
    confidence: 0,
    status: 'failed',
    fields: [
      { label: '条码库', value: '未命中', confidence: 'empty' },
      { label: '下一步', value: '拍照识别或手动填写', confidence: 'medium' },
    ],
  },
];

export const searchResults: SearchResultHint[] = [
  {
    itemName: 'AirPods Pro',
    locationPath: '玄关 → 每日托盘',
    status: 'essentials_away',
    hint: '随身常备状态为 @随身，优先检查背包外层口袋。',
    tags: ['随身常备', '通勤', '音频'],
  },
  {
    itemName: 'Nikon 50mm F1.8',
    locationPath: '书房 → 防潮箱 A → 第二层',
    status: 'in_stock',
    hint: '位置路径可信，标签命中摄影与尼康。',
    tags: ['摄影', '尼康'],
  },
  {
    itemName: '旧 iPad mini',
    locationPath: '卧室 → 床底收纳盒',
    status: 'idle',
    hint: '闲置超过 180 天，可进入流转查询。',
    tags: ['数码', '闲置'],
  },
];

export const supplies: SupplyForecast[] = [
  {
    id: 'supply-1',
    name: '厨房纸巾',
    model: 'event_forecast',
    stock: 9,
    unit: '卷',
    threshold: 3,
    nextRunoutDate: '2026-07-18',
    confidence: 'stable',
    lastSignal: '最近一次购买 12 卷，预测消耗稳定。',
  },
  {
    id: 'supply-2',
    name: '净水器滤芯',
    model: 'counter',
    stock: 1,
    unit: '支',
    threshold: 1,
    nextRunoutDate: '2026-06-28',
    confidence: 'needs_calibration',
    lastSignal: '已更换后进入 180 天寿命倒计时。',
  },
  {
    id: 'supply-3',
    name: '猫砂',
    model: 'event_forecast',
    stock: 2,
    unit: '袋',
    threshold: 2,
    confidence: 'needs_calibration',
    lastSignal: '用户标记“快没了”，需要修正曲线。',
  },
];

export const essentialsAssets: EssentialsAsset[] = [
  {
    id: 'essentials-1',
    name: '钥匙串',
    baselineLocation: '玄关 → 每日托盘',
    dynamicState: '@carry',
    lastConfirmedAt: '今天 08:12',
    searchHint: '当前在随身状态，搜索时不展示基准位置。',
  },
  {
    id: 'essentials-2',
    name: '移动电源',
    baselineLocation: '书房 → 充电抽屉',
    dynamicState: '@travel_bag',
    lastConfirmedAt: '昨天 22:30',
    searchHint: '优先提示出差包，回家后一键归位。',
  },
  {
    id: 'essentials-3',
    name: 'AirTag 备用电池',
    baselineLocation: '玄关 → 备件盒',
    dynamicState: '@home',
    lastConfirmedAt: '2026-06-08',
    searchHint: '未打包，出门检查清单会标记缺失。',
  },
];

export const locationLabels: LocationLabel[] = [
  {
    id: 'loc-42',
    code: 'LOC-0042',
    name: '防潮箱 A',
    path: '书房 → 防潮箱 A',
    itemCount: 18,
    printState: 'printed',
  },
  {
    id: 'loc-57',
    code: 'LOC-0057',
    name: '收纳盒 3',
    path: '储藏室 → 货架 B → 收纳盒 3',
    itemCount: 31,
    printState: 'ready',
  },
  {
    id: 'loc-61',
    code: 'LOC-0061',
    name: '出差包',
    path: '@随身 → 出差包',
    itemCount: 7,
    printState: 'needs_reprint',
  },
];

export const credentials: CredentialRecord[] = [
  {
    id: 'cred-1',
    itemName: 'MacBook Pro 14',
    credentialType: 'invoice',
    expiresAt: '2026-07-02',
    warrantyState: 'expiring',
    attachments: 2,
  },
  {
    id: 'cred-2',
    itemName: 'Final Cut Pro',
    platform: 'Apple App Store',
    credentialType: 'license',
    warrantyState: 'none',
    attachments: 1,
  },
  {
    id: 'cred-3',
    itemName: '净水器主机',
    credentialType: 'warranty_card',
    expiresAt: '2027-03-15',
    warrantyState: 'active',
    attachments: 3,
  },
];

export const loans: LoanRecord[] = [
  {
    id: 'loan-1',
    itemName: '冲击钻',
    borrower: '老周',
    contact: '微信',
    lentAt: '2026-05-19',
    dueAt: '2026-06-12',
    state: 'active',
    handoffNote: '含电池 2 块、充电器 1 个。',
  },
  {
    id: 'loan-2',
    itemName: '投影仪',
    borrower: '小林',
    contact: '138****9988',
    lentAt: '2026-04-21',
    dueAt: '2026-05-01',
    state: 'overdue',
    handoffNote: '借出前拍照确认外壳划痕。',
  },
  {
    id: 'loan-3',
    itemName: '露营灯',
    borrower: '阿杰',
    contact: '微信',
    lentAt: '2026-03-02',
    dueAt: '2026-03-10',
    state: 'lost_by_borrower',
    handoffNote: '对方确认遗失，赔偿 120 CNY。',
  },
];

export const lifecycleRecords: LifecycleRecord[] = [
  {
    id: 'life-1',
    itemName: '旧显示器 Dell U2414H',
    status: 'sold',
    date: '2026-04-12',
    amount: 260,
    currency: 'CNY',
    note: '闲鱼售出，保留成交截图。',
  },
  {
    id: 'life-2',
    itemName: '破损行李箱',
    status: 'damaged',
    date: '2026-05-03',
    note: '拉杆断裂，已归档到物品墓地。',
  },
  {
    id: 'life-3',
    itemName: '自行车尾灯',
    status: 'stolen',
    date: '2026-05-27',
    note: '保留购买凭证，后续可导出理赔资料。',
  },
];

export const reminderJobs: ReminderJob[] = [
  {
    id: 'reminder-1',
    title: '投影仪借出到期',
    channel: 'ntfy',
    nextRunAt: '2026-06-10 21:00',
    state: 'scheduled',
  },
  {
    id: 'reminder-2',
    title: 'MacBook 保修 30 天提醒',
    channel: 'apprise',
    nextRunAt: '2026-06-12 09:00',
    state: 'scheduled',
  },
  {
    id: 'reminder-3',
    title: 'Webhook 网关连通性',
    channel: 'webhook',
    nextRunAt: '暂停',
    state: 'failed',
  },
];

export const backups: BackupRun[] = [
  {
    id: 'backup-1',
    startedAt: '2026-06-10 03:00',
    state: 'success',
    target: 'D:\\Backups\\havit\\2026-06-10.zip',
    size: '48.2 MB',
    steps: ['vacuum', 'archive', 'manifest'],
  },
  {
    id: 'backup-2',
    startedAt: '2026-06-09 03:00',
    state: 'success',
    target: 'D:\\Backups\\havit\\2026-06-09.zip',
    size: '47.9 MB',
    steps: ['vacuum', 'archive', 'manifest'],
  },
];

export const exports: ExportPreset[] = [
  {
    id: 'export-1',
    label: '完整 JSON 备份',
    format: 'json',
    scope: '物品、位置、标签、附件索引、历史记录',
    lastExportedAt: '2026-06-09 23:18',
  },
  {
    id: 'export-2',
    label: '物品清单 CSV',
    format: 'csv',
    scope: '导入兼容字段',
  },
];
