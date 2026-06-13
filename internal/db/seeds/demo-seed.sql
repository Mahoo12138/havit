-- demo-seed.sql
-- 演示模式种子数据。仅在 users 表为空时由 InitDemoDataIfNeeded 注入。
-- 插入顺序遵守外键依赖: users → locations → tags → items → 关联表。
-- __DEMO_PASSWORD_HASH__ 由启动代码运行时替换为 bcrypt('havit-demo')。

-- 1. Demo Owner
INSERT INTO users (id, username, password, role, created_at)
VALUES ('01DEMO0000USER000001', 'admin@havit.local',
        '__DEMO_PASSWORD_HASH__', 'owner', 1717770000);

-- 2. 位置节点 (先父后子，语义类型: property → room → furniture → container / virtual)
INSERT INTO locations (id, parent_id, name, type, sort_order, is_private, created_at, updated_at) VALUES
('01DEMO000LOC0000001', NULL,                  '我的家',   'property', 0, 0, 1717770000, 1717770000),
('01DEMO000LOC0000002', '01DEMO000LOC0000001', '客厅',     'room',     0, 0, 1717770000, 1717770000),
('01DEMO000LOC0000003', '01DEMO000LOC0000002', '电视柜',   'furniture', 0, 0, 1717770000, 1717770000),
('01DEMO000LOC0000004', '01DEMO000LOC0000001', '卧室',     'room',     1, 0, 1717770000, 1717770000),
('01DEMO000LOC0000005', '01DEMO000LOC0000004', '书桌',     'furniture', 0, 0, 1717770000, 1717770000),
('01DEMO000LOC0000006', NULL,                  '@随身',    'virtual',  9, 0, 1717770000, 1717770000);

-- 3. 标签
INSERT INTO tags (id, name, color) VALUES
('01DEMO000TAG0000001', '摄影',     '#4A90D9'),
('01DEMO000TAG0000002', '数码',     '#7B61FF'),
('01DEMO000TAG0000003', '高频使用', '#F5A623');

-- 4. 物品
INSERT INTO items (id, name, category, type, status,
                   location_id, current_stock, min_stock_threshold,
                   is_private, owner_id, created_at, updated_at) VALUES
('01DEMO000ITEM000001', 'Sony A7M4 相机机身',   '数码电子', 'durable',      'in_stock',
 '01DEMO000LOC0000003', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000002', 'Sony 50mm F1.2 镜头',  '数码电子', 'durable',      'borrowed',
 '01DEMO000LOC0000003', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000003', 'AirPods Pro 2',         '数码电子', 'edc',          'in_stock',
 '01DEMO000LOC0000006', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000004', '埃塞俄比亚咖啡豆',      '食品',     'consumable_a', 'in_stock',
 '01DEMO000LOC0000002', NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000005', '净水器滤芯',            '家庭用品', 'consumable_b', 'in_stock',
 '01DEMO000LOC0000002', 0,    1,    0, '01DEMO0000USER000001', 1717770000, 1717770000),
('01DEMO000ITEM000006', 'Adobe 创意云摄影计划',  '软件订阅', 'virtual',     'in_stock',
 NULL,                NULL, NULL, 0, '01DEMO0000USER000001', 1717770000, 1717770000);

-- 5. items_fts 同步 (content='items' 模式下需要手动 rebuild,这里逐行插入更直观)
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

-- 7. 消耗品 A 历史购买事件 (演示推算)
INSERT INTO purchase_events (id, item_id, quantity, purchased_at) VALUES
('01DEMO000EVT0000001', '01DEMO000ITEM000004', 1, 1710000000),
('01DEMO000EVT0000002', '01DEMO000ITEM000004', 1, 1712678400),
('01DEMO000EVT0000003', '01DEMO000ITEM000004', 1, 1715270400);

-- 8. 虚拟资产凭证 (演示 Adobe 摄影计划账号)
INSERT INTO virtual_credentials (id, item_id, platform, account, order_id, purchased_at, price, currency) VALUES
('01DEMO000VRC0000001', '01DEMO000ITEM000006', 'Adobe', 'photo@example.com', 'ADOBE-2024-001',
 1700000000, 1188.00, 'CNY');

-- 9. 虚拟资产增补购买 (演示 Lightroom 预设包)
INSERT INTO virtual_addon_purchases (id, item_id, name, platform, price, currency, purchased_at) VALUES
('01DEMO000ADP0000001', '01DEMO000ITEM000006', 'Lightroom 高级预设包', 'Adobe', 199.00, 'CNY', 1710000000),
('01DEMO000ADP0000002', '01DEMO000ITEM000006', 'Photoshop 笔刷扩展',  'Adobe', 89.00,  'CNY', 1712600000);

-- 10. 借出记录 (due_at 已过期,演示逾期未还)
INSERT INTO loans (id, item_id, borrower_name, borrower_contact,
                   loaned_at, due_at, status) VALUES
('01DEMO000LOAN000001', '01DEMO000ITEM000002', '小王', 'xiaowang@example.com',
 1714521600, 1717200000, 'active');
