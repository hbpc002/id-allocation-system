# 快速参考卡片

## 🚀 启动命令
```bash
# 安装依赖
npm install
# 或
pnpm install

# 开发模式（带热更新）
npm run dev
# 或
pnpm dev

# 生产构建
npm run build
npm start
```

## 🔑 默认凭证
- **管理员密码**: `root123`（请立即修改）

## 📂 核心文件
| 文件 | 说明 |
|------|------|
| `app/db.ts` | 数据库初始化、表创建、默认数据插入 |
| `app/id-allocation-service.ts` | 业务逻辑服务层（415行） |
| `app/api/id-allocation/route.ts` | API 路由（266行） |
| `app/id-allocation-ui.tsx` | 主 UI 组件（244行） |
| `app/hooks/useIdAllocation.ts` | 用户状态管理 Hook（226行） |
| `app/components/AdminPanel.tsx` | 管理面板（692行） |
| `data/employee_ids.db` | SQLite 数据库文件 |

## 🎯 主要功能

### 用户界面
- **申请工号**: 点击蓝色"申请工号"按钮
- **释放工号**: 点击橙色"释放工号"按钮
- **强制重申请**: 已有工号时可强制获取新的
- **实时滚动**: 20秒循环动画，支持鼠标滚轮控制
- **去重显示**: 自动过滤重复工号，用户工号显示为"Your IP"
- **状态卡片**: 总数/可用/已分配/已停用统计

### 管理员功能
1. **登录**: 点击右上角"管理员登录" → 输入密码
2. **查看工号**: 表格展示、搜索、多选、刷新
3. **批量导入**: 上传 `.txt` 文件（每行一个工号）
4. **单个管理**: 添加、删除、启用/停用
5. **批量操作**: 选中多个工号批量处理
6. **清空操作**: 一键清空所有已分配
7. **修改密码**: 旧密码验证后修改

## 📋 批量导入格式
创建 `.txt` 文件，每行一个工号：
```
644100
644101
644102
...
```
**注意**: 重复工号会自动跳过

## 🔗 API 快速参考

### 公共接口（无需认证）
```javascript
// 获取系统状态
GET /api/id-allocation
// 响应: { allocatedIds, totalPoolIds, availableIds, disabledIds, allocatedIdsCount, clientAllocatedId }

// 申请工号
POST /api/id-allocation
{ "action": "allocate", "forceNewAllocation": false }
// forceNewAllocation: true 时释放旧工号分配新的

// 释放工号
POST /api/id-allocation
{ "action": "release", "id": 644100 }
```

### 管理员接口（需 x-admin-session Header）
```javascript
// 登录获取会话
POST /api/id-allocation
{ "action": "adminLogin", "password": "root123" }
// 响应: { success: true, sessionId: "..." }

// 获取所有工号
POST /api/id-allocation
{ "action": "getAllIds" }
// Header: x-admin-session: <sessionId>

// 批量导入
POST /api/id-allocation
Content-Type: text/plain
Header: x-admin-session: <sessionId>
Body: "644100\n644101\n644102"

// 批量操作
POST /api/id-allocation
{ "action": "batchUpdate", "ids": [644100, 644101], "operation": "disable" }
// operation: enable | disable | delete

// 搜索工号
POST /api/id-allocation
{ "action": "searchIds", "query": "64410", "status": "available" }
// status: 可选 available | allocated | disabled

// 修改密码
POST /api/id-allocation
{ "action": "changePassword", "oldPassword": "...", "newPassword": "..." }
```

## 🛠️ 数据库表结构

### allocated_ids - 已分配工号
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 工号 |
| uniqueSessionId | TEXT NOT NULL UNIQUE | 唯一会话 ID |
| allocationTime | TEXT NOT NULL | 分配时间 (ISO) |
| ipAddress | TEXT NOT NULL | 分配者 IP |
| expiresAt | TEXT NOT NULL | 过期时间 (ISO) |

### employee_pool - 工号池
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 工号 |
| status | TEXT NOT NULL | available/allocated/disabled |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

### passwords - 密码存储
| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT PRIMARY KEY | 密钥 |
| value | TEXT NOT NULL | 密码值 |

### admin_sessions - 管理员会话
| 字段 | 类型 | 说明 |
|------|------|------|
| sessionId | TEXT PRIMARY KEY | 会话 ID |
| loginTime | TIMESTAMP | 登录时间 |
| lastActivity | TIMESTAMP | 最后活动时间 |

## ⚡ 状态说明
- **🟢 绿色**: 可用工号 (available)
- **🔵 蓝色**: 已分配 (allocated)
- **🟠 橙色**: 已停用 (disabled)

## 💡 实用提示
- ✅ 默认密码请立即修改
- ✅ 定期备份 `data/employee_ids.db`
- ✅ 鼠标滚轮控制滚动，暂停2秒后自动恢复
- ✅ 滚动区域自动去重，避免重复显示
- ✅ 所有操作都有详细日志输出
- ✅ 会话 24 小时自动过期
- ✅ 工号当天 23:59:59 自动释放
- ✅ 浏览器会保存管理员会话状态
- ✅ 生产环境建议使用 HTTPS
