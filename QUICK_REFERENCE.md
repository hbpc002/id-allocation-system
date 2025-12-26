# 快速参考卡片

## 🚀 启动命令
```bash
npm install    # 安装依赖
npm run dev    # 开发模式
npm run build  # 生产构建
```

## 🔑 默认凭证
- **管理员密码**: `root123`

## 📂 核心文件
| 文件 | 说明 |
|------|------|
| `app/db.ts` | 数据库初始化 |
| `app/id-allocation-service.ts` | 业务逻辑 |
| `app/api/id-allocation/route.ts` | API 路由 |
| `app/id-allocation-ui.tsx` | 主界面 |
| `app/components/AdminPanel.tsx` | 管理面板 |
| `data/employee_ids.db` | 数据库文件 |

## 🎯 主要功能

### 用户界面
- **申请工号**: 点击蓝色"申请工号"按钮
- **释放工号**: 点击橙色"释放工号"按钮
- **实时滚动**: 查看已分配工号列表

### 管理员功能
1. **登录**: 点击右上角"管理员登录"
2. **查看工号**: 浏览、搜索、多选
3. **批量导入**: 上传 `.txt` 文件
4. **单个管理**: 添加、删除、启用/停用
5. **批量操作**: 选中后批量处理
6. **修改密码**: 安全修改

## 📋 批量导入格式
```
644100
644101
644102
...
```

## 🔗 API 快速参考
```javascript
// 申请工号
POST /api/id-allocation
{ "action": "allocate" }

// 管理员登录
POST /api/id-allocation
{ "action": "adminLogin", "password": "root123" }

// 获取状态
GET /api/id-allocation
```

## 🛠️ 数据库表
- `allocated_ids` - 已分配工号
- `employee_pool` - 工号池（状态：available/allocated/disabled）
- `passwords` - 密码存储
- `admin_sessions` - 管理员会话

## ⚡ 状态说明
- **绿色**: 可用工号
- **蓝色**: 已分配
- **橙色**: 已停用

## 💡 提示
- 默认密码请立即修改
- 定期备份数据库
- 悬停滚动区域可暂停动画
- 所有操作都有详细日志