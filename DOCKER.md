# Docker 部署指南

本文档提供了如何使用Docker部署Next.js应用的详细说明。

## 目录

- [先决条件](#先决条件)
- [项目结构](#项目结构)
- [构建和运行](#构建和运行)
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [数据持久化](#数据持久化)
- [环境变量](#环境变量)
- [健康检查](#健康检查)
- [故障排除](#故障排除)

## 先决条件

在开始之前，请确保您的系统已安装以下软件：

- [Docker](https://docs.docker.com/get-docker/) (版本 20.10 或更高)
- [Docker Compose](https://docs.docker.com/compose/install/) (版本 1.29 或更高)
- [pnpm](https://pnpm.io/installation) (如果需要在本地构建)

## 项目结构

以下是Docker相关文件的结构：

```
.
├── Dockerfile              # 生产环境多阶段构建
├── Dockerfile.dev          # 开发环境构建
├── docker-compose.yml      # Docker Compose 配置
├── .dockerignore           # Docker 构建排除文件
├── .env.example            # 环境变量示例
├── next.config.ts          # Next.js 配置
└── DOCKER.md               # 本文档
```

## 构建和运行

### 使用 Docker Compose (推荐)

#### 生产环境

```bash
# 构建并启动生产环境
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 开发环境

```bash
# 构建并启动开发环境
docker-compose --profile dev up -d

# 查看日志
docker-compose --profile dev logs -f

# 停止服务
docker-compose --profile dev down
```

### 使用 Docker 命令

#### 构建镜像

```bash
# 构建生产环境镜像
docker build -t nextjs-app .

# 构建开发环境镜像
docker build -f Dockerfile.dev -t nextjs-app:dev .
```

#### 运行容器

```bash
# 生产环境
docker run -d \
  --name nextjs-app \
  -p 3000:3000 \
  -v db_data:/app/data \
  nextjs-app

# 开发环境
docker run -d \
  --name nextjs-app-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v db_data_dev:/app/data \
  nextjs-app:dev
```

## 开发环境

开发环境支持热重载和开发工具，适合本地开发。

### 特性

- 代码热重载
- 开发依赖完整安装
- 源代码卷挂载
- 开发服务器模式

### 使用

```bash
# 启动开发环境
docker-compose --profile dev up -d

# 查看实时日志
docker-compose --profile dev logs -f app

# 进入容器
docker-compose --profile dev exec app sh
```

## 生产环境

生产环境使用多阶段构建，优化了镜像大小和安全性。

### 优化特性

- 多阶段构建减少镜像大小
- Alpine Linux 基础镜像
- 非root用户运行
- 健康检查
- 自动重启策略

### 使用

```bash
# 启动生产环境
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 数据持久化

应用使用SQLite数据库，数据持久化通过Docker卷实现。

### 数据卷配置

- **生产环境**: `db_data` 卷挂载到 `/app/data`
- **开发环境**: `db_data_dev` 卷挂载到 `/app/data`

### 备份数据

```bash
# 备份数据库
docker run --rm \
  -v db_data:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/db_backup.tar.gz -C /data .

# 恢复数据库
docker run --rm \
  -v db_data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/db_backup.tar.gz -C /data
```

## 环境变量

应用支持以下环境变量：

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `NODE_ENV` | `production` | 应用环境 |
| `PORT` | `3000` | 应用端口 |
| `HOSTNAME` | `0.0.0.0` | 监听地址 |
| `DATA_DIR` | `/app/data` | 数据目录路径 |
| `CUSTOM_KEY` | - | 自定义配置键 |
| `LOGIN_PASSWORD` | `root123` | 登录密码 |

### 设置环境变量

1. 复制环境变量示例文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置所需的环境变量。

3. 使用Docker Compose时，环境变量会自动加载。

## 健康检查

生产环境容器配置了健康检查，定期检查应用状态。

### 健康检查配置

- **检查间隔**: 30秒
- **超时时间**: 10秒
- **重试次数**: 3次
- **启动等待**: 40秒
- **检查端点**: `/api/id-allocation`

### 查看健康状态

```bash
# 查看容器健康状态
docker inspect --format='{{json .State.Health}}' nextjs-app

# 查看所有容器状态
docker ps
```

## 故障排除

### 常见问题

#### 1. 构建失败

**问题**: Docker构建过程中出现错误。

**常见错误1**: pnpm锁文件不兼容
```
ERR_PNPM_LOCKFILE_BREAKING_CHANGE Lockfile /app/pnpm-lock.yaml not compatible with current pnpm
```

**解决方案**:
```bash
# 清理Docker缓存
docker builder prune -f

# 重新构建
docker-compose build --no-cache

# 如果问题仍然存在，可能需要更新本地pnpm版本
npm install -g pnpm@8
pnpm install
```

**常见错误2**: 构建过程中其他错误
```bash
# 清理Docker缓存
docker builder prune -f

# 重新构建
docker-compose build --no-cache
```

#### 2. 端口冲突

**问题**: 端口3000已被占用。

**解决方案**:
```bash
# 修改docker-compose.yml中的端口映射
ports:
  - "3001:3000"  # 将3000改为其他端口
```

#### 3. 数据库权限问题

**问题**: SQLite数据库文件无法创建或访问。

**解决方案**:
```bash
# 检查数据目录权限
docker exec nextjs-app ls -la /app/

# 修复权限
docker exec nextjs-app chown -R nextjs:nodejs /app/data
```

#### 4. 应用启动缓慢

**问题**: 容器启动后应用长时间不可用。

**解决方案**:
```bash
# 查看启动日志
docker-compose logs app

# 检查资源使用情况
docker stats nextjs-app
```

### 日志调试

```bash
# 查看实时日志
docker-compose logs -f app

# 查看最近100行日志
docker-compose logs --tail=100 app

# 查看特定时间段的日志
docker-compose logs --since=1h app
```

### 进入容器调试

```bash
# 进入生产环境容器
docker exec -it nextjs-app sh

# 进入开发环境容器
docker exec -it nextjs-app-dev sh

# 查看应用进程
ps aux

# 查看文件系统
ls -la /app/
```

## 性能优化

### 镜像大小优化

当前Dockerfile已经实现了以下优化：

1. **多阶段构建**: 分离构建和运行环境
2. **Alpine基础镜像**: 使用轻量级Linux发行版
3. **依赖优化**: 仅安装必要的依赖
4. **清理缓存**: 构建完成后清理不必要的文件

### 运行时优化

1. **资源限制**: 在docker-compose.yml中设置资源限制
2. **缓存策略**: 利用Docker层缓存优化构建速度
3. **健康检查**: 定期检查应用状态，确保服务可用

## 安全考虑

1. **非root用户**: 应用以非root用户运行
2. **最小权限**: 仅授予必要的系统权限
3. **安全扫描**: 定期扫描镜像漏洞
4. **环境变量**: 敏感信息通过环境变量传递，不硬编码

## 更新和维护

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build
```

### 更新基础镜像

```bash
# 更新基础镜像
docker pull node:20-alpine

# 重新构建应用
docker-compose build --no-cache
```

### 定期维护

```bash
# 清理未使用的Docker资源
docker system prune -f

# 清理所有未使用的资源（包括卷）
docker system prune -a --volumes -f