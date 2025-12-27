# 工号分配系统 (Employee ID Allocation System)

一个基于 Next.js 15.2.0 和 SQLite 的工号分配管理系统，支持工号申请、释放、管理员管理和工号池管理。

## ✨ 功能特性

### 用户功能
- **工号申请**: 用户可以点击"申请工号"按钮获取可用工号
- **工号释放**: 用户可以点击"释放工号"按钮归还工号
- **工号重申请**: 支持强制重新分配新工号（释放旧工号后分配新的）
- **实时滚动**: 已分配工号列表实时滚动显示（20秒循环动画）
- **鼠标滚轮**: 支持鼠标滚轮控制滚动，滚轮暂停2秒后自动恢复
- **去重显示**: 自动过滤重复工号，用户工号显示为"Your IP"
- **IP 记录**: 系统记录用户的 IP 地址和分配时间（支持多种代理头部）
- **自动过期**: 工号在当天 23:59:59 自动释放
- **状态统计**: 显示工号总数、可用、已分配、已停用数量
- **实时时间**: 显示当前系统时间
- **优雅降级**: API 错误时静默处理，不影响用户体验

### 管理员功能
- **管理员登录**: 安全的管理员登录系统（默认密码: root123）
- **会话管理**:
  - 24小时会话过期自动清理
  - 会话活动时间更新
  - 本地存储会话状态
- **工号管理**:
  - **查看工号**: 表格展示、搜索、多选、实时刷新
  - **批量导入**: 上传 `.txt` 文件，每行一个工号，自动去重
  - **单个管理**: 添加、删除、启用、停用单个工号
  - **批量操作**: 选中多个工号进行批量启用、停用、删除
  - **清空操作**: 一键清空所有已分配工号
- **密码管理**: 安全的密码修改界面（需验证旧密码）

## 📁 项目结构

```
id-allocation-system/
├── app/
│   ├── api/
│   │   └── id-allocation/
│   │       └── route.ts          # API 路由（前后端分离）
│   ├── components/
│   │   ├── AdminPanel.tsx        # 管理员面板组件
│   │   ├── IdAllocationForm.tsx  # 工号操作表单
│   │   ├── IdAllocationStatus.tsx # 状态显示组件
│   │   └── IdAllocationList.tsx  # 工号列表组件
│   ├── hooks/
│   │   └── useIdAllocation.ts    # 工号分配 Hook
│   ├── id-allocation-service.ts  # 业务逻辑服务层
│   ├── db.ts                     # 数据库初始化
│   ├── id-allocation-ui.tsx      # 主 UI 组件
│   ├── page.tsx                  # 首页
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式（含滚动动画）
├── data/
│   └── employee_ids.db           # SQLite 数据库
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 快速开始

### 前置要求
- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 运行开发服务器

```bash
npm run dev
# 或
pnpm dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
npm start
```

## 🔧 使用说明

### 用户使用流程
1. 访问系统主页 `http://localhost:3000`
2. 点击"**申请工号**"获取工号
3. 工号将显示在页面上方（蓝色卡片）
4. 点击"**释放工号**"归还工号
5. 在滚动区域查看所有已分配工号（含 IP 地址）

### 管理员使用流程
1. 在主页点击右上角"**管理员登录**"
2. 输入默认密码 `root123`
3. 进入管理员面板，可以进行以下操作：

#### 查看工号 (View IDs)
- 浏览所有工号状态（可用/已分配/已停用）
- 搜索工号
- 选中多个工号进行批量操作
- 查看分配时间、IP 地址、过期时间

#### 批量导入 (Import)
- 上传 `.txt` 文件导入工号池
- 每行一个工号，自动去重
- 显示导入成功/失败数量和错误详情

#### 单个管理 (Manage)
- **添加工号**: 输入工号数字添加
- **快速操作**: 清空所有已分配工号
- **单个操作**: 启用、停用、删除单个工号

#### 修改密码 (Password)
- 输入旧密码和新密码
- 确认后立即生效

### 批量导入格式
创建一个 `.txt` 文件，每行一个工号：
```
644100
644101
644102
644103
...
```

## 🗄️ 数据库结构

### 表结构说明

**allocated_ids** - 已分配工号表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 工号 (主键) |
| uniqueSessionId | TEXT | 唯一会话 ID |
| allocationTime | TEXT | 分配时间 (ISO) |
| ipAddress | TEXT | 分配者 IP |
| expiresAt | TEXT | 过期时间 (ISO) |

**employee_pool** - 员工工号池表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 工号 (主键) |
| status | TEXT | 状态: available/allocated/disabled |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

**passwords** - 密码存储表
| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT | 密钥 (主键) |
| value | TEXT | 密码值 |

**admin_sessions** - 管理员会话表
| 字段 | 类型 | 说明 |
|------|------|------|
| sessionId | TEXT | 会话 ID (主键) |
| loginTime | TIMESTAMP | 登录时间 |
| lastActivity | TIMESTAMP | 最后活动时间 |

## 🔒 安全特性

- **会话管理**: 管理员操作需要有效会话（通过 HTTP Header `x-admin-session` 传递）
- **密码验证**: 密码在数据库中存储，登录时验证
- **自动清理**:
  - 过期工号在每次 GET 请求时自动清理
  - 过期会话（24 小时）在启动时和定时清理
- **权限控制**: 敏感操作（批量导入、删除、修改密码等）需要管理员认证

## 🎨 前端优化

### 滚动显示 (已申请工号)
- **CSS 动画**: 20秒循环滚动，无缝循环
- **鼠标滚轮**: 支持滚轮控制，暂停2秒后自动恢复
- **去重逻辑**: 自动过滤重复显示，用户工号标记为"Your IP"
- **实时更新**: 自动刷新显示最新数据
- **双倍内容**: 确保滚动流畅无闪烁
- **视觉优化**: 渐变遮罩效果，边缘淡入淡出

### 状态卡片
- **工号总数**: 灰色卡片
- **可用工号**: 绿色卡片
- **已分配**: 蓝色卡片
- **已停用**: 橙色卡片

### 响应式设计
- 适配移动端和桌面端
- 清晰的状态颜色区分
- 直观的操作界面

## 🔗 API 接口详解

### GET /api/id-allocation
获取当前系统状态（无需认证）

**功能**:
- 自动清理过期工号
- 获取当前客户端 IP 对应的工号
- 返回所有已分配工号列表（含 IP）
- 返回工号池统计信息

**响应示例**:
```json
{
  "allocatedIds": [
    {"id": 644100, "ipAddress": "192.168.1.1"},
    {"id": 644101, "ipAddress": "192.168.1.2"}
  ],
  "totalPoolIds": 100,
  "availableIds": 50,
  "disabledIds": 5,
  "allocatedIdsCount": 45,
  "clientAllocatedId": 644100
}
```

### POST /api/id-allocation
操作接口（根据 Content-Type 和 action 区分）

#### 1. 申请工号 (JSON)
```json
{ "action": "allocate", "forceNewAllocation": false }
```
- `forceNewAllocation`: 可选，设为 `true` 时会释放旧工号并分配新的
- **无需认证**

#### 2. 释放工号 (JSON)
```json
{ "action": "release", "id": 644100 }
```
- **无需认证**

#### 3. 管理员登录 (JSON)
```json
{ "action": "adminLogin", "password": "root123" }
```
**响应**: `{ "success": true, "sessionId": "..." }` 或 `{ "success": false, "error": "..." }`

#### 4. 验证会话 (JSON)
```json
{ "action": "verifySession" }
```
**Header**: `x-admin-session: <sessionId>`
**响应**: `{ "success": true/false }`

#### 5. 修改密码 (JSON)
```json
{ "action": "changePassword", "oldPassword": "...", "newPassword": "..." }
```
**Header**: `x-admin-session: <sessionId>`

#### 6. 批量导入 (text/plain)
**Content-Type**: `text/plain`
**Body**: 每行一个工号
```
644100
644101
644102
```
**Header**: `x-admin-session: <sessionId>`
**响应**:
```json
{
  "success": true,
  "uploadedCount": 3,
  "failedCount": 0,
  "totalPoolIds": 103,
  "errors": []
}
```

#### 7. 获取所有工号 (JSON)
```json
{ "action": "getAllIds" }
```
**Header**: `x-admin-session: <sessionId>`
**响应**: 包含所有工号的详细信息（状态、IP、时间等）

#### 8. 获取统计 (JSON)
```json
{ "action": "getPoolStats" }
```
**无需认证**
**响应**: `{ "success": true, "data": { total, available, disabled, allocated } }`

#### 9. 添加单个工号 (JSON)
```json
{ "action": "addId", "id": 644100 }
```
**Header**: `x-admin-session: <sessionId>`

#### 10. 删除工号 (JSON)
```json
{ "action": "deleteId", "id": 644100 }
```
**Header**: `x-admin-session: <sessionId>`
**注意**: 正在使用的工号无法删除

#### 11. 更新工号状态 (JSON)
```json
{ "action": "updateIdStatus", "id": 644100, "status": "available" }
```
**Header**: `x-admin-session: <sessionId>`
**status**: `available` (启用) 或 `disabled` (停用)

#### 12. 批量操作 (JSON)
```json
{ "action": "batchUpdate", "ids": [644100, 644101], "operation": "disable" }
```
**Header**: `x-admin-session: <sessionId>`
**operation**: `enable` | `disable` | `delete`

#### 13. 搜索工号 (JSON)
```json
{ "action": "searchIds", "query": "64410", "status": "available" }
```
**Header**: `x-admin-session: <sessionId>`
**status**: 可选，`available` | `allocated` | `disabled`

#### 14. 清空所有已分配 (JSON)
```json
{ "action": "clearAll" }
```
**Header**: `x-admin-session: <sessionId>`
**功能**: 清空所有已分配工号，重置为可用状态

#### 15. 登出 (JSON)
```json
{ "action": "logout" }
```
**Header**: `x-admin-session: <sessionId>`

## 🛠️ 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js | 15.2.0 | React 框架 |
| UI 库 | React | 19.0.0 | UI 组件 |
| 语言 | TypeScript | 5.x | 类型系统 |
| 样式 | Tailwind CSS | 3.4.1 | CSS 框架 |
| 数据库 | better-sqlite3 | 12.2.0 | SQLite 数据库 |
| 图标 | react-icons | 5.5.0 | 图标库 |
| 工具 | uuid | 13.0.0 | 唯一 ID 生成 |

## 📂 核心文件说明

| 文件 | 说明 |
|------|------|
| `app/db.ts` | 数据库初始化，创建表结构，插入默认数据 |
| `app/id-allocation-service.ts` | 业务逻辑服务层，包含所有核心功能 |
| `app/api/id-allocation/route.ts` | API 路由，统一处理所有请求 |
| `app/id-allocation-ui.tsx` | 主 UI 组件，管理视图切换 |
| `app/hooks/useIdAllocation.ts` | 用户界面状态管理 Hook |
| `app/components/AdminPanel.tsx` | 管理员面板组件 |
| `app/components/IdAllocationForm.tsx` | 用户操作表单组件 |
| `app/components/IdAllocationStatus.tsx` | 状态统计卡片组件 |
| `app/components/IdAllocationList.tsx` | 工号列表组件 |
| `data/employee_ids.db` | SQLite 数据库文件 |

## 📝 默认配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 管理员密码 | `root123` | 可在管理员面板修改 |
| 数据库位置 | `data/employee_ids.db` | 自动创建 |
| 工号过期时间 | 当天 23:59:59 | 自动清理 |
| 会话过期时间 | 24 小时 | 自动清理 |
| 滚动动画时长 | 20秒 | 可在 `tailwind.config.ts` 修改 |
| 自动刷新间隔 | 10秒 | 可在 `app/hooks/useIdAllocation.ts` 修改 |
| 服务器端口 | 3000 | 可在 `package.json` 修改 |

## 🔄 启动流程

系统启动时会自动执行：
1. 创建数据目录 `data/`
2. 创建数据库表（如果不存在）
   - `allocated_ids` - 已分配工号表
   - `employee_pool` - 工号池表
   - `passwords` - 密码存储表
   - `admin_sessions` - 管理员会话表
3. 插入默认管理员密码（如果不存在）
4. 清理过期工号（`allocated_ids` 中 `expiresAt` 过期的记录）
5. 清理过期会话（24 小时未活动的会话）
6. 数据库迁移（添加缺失字段，如 `updatedAt`）

## 🐛 故障排除

### 问题：数据库错误
**原因**: 数据库文件权限问题
**解决**:
```bash
chmod 755 data/
chmod 644 data/employee_ids.db
```

### 问题：依赖安装失败
**原因**: better-sqlite3 需要编译
**解决**:
```bash
# Ubuntu/Debian
apt-get install build-essential python3

# CentOS/RHEL
yum install gcc-c++ make python3

# 然后重新安装
npm install
```

### 问题：端口冲突
**解决**: 修改 `package.json`
```json
"scripts": {
  "dev": "next dev --port 3001"
}
```

### 问题：管理员登录失败
**检查**:
1. 确认密码正确（默认 root123）
2. 检查浏览器控制台是否有错误
3. 查看服务器日志

## 📦 部署

### Docker 部署
项目包含 Docker 支持：
```bash
docker build -t id-allocation-system .
docker run -p 3000:3000 -v $(pwd)/data:/app/data id-allocation-system
```

### 生产环境
```bash
npm run build
npm start
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- Next.js 团队提供优秀的框架
- better-sqlite3 提供可靠的 SQLite 支持
- Tailwind CSS 提供快速样式开发

---

**⚠️ 安全提示**:
- 请立即修改默认密码 `root123`
- 定期备份 `data/employee_ids.db` 数据库文件
- 不要将管理员会话 ID 泄露给他人
- 生产环境建议使用 HTTPS