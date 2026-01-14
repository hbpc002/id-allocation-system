# 多阶段构建 - 第一阶段：构建环境
FROM node:20-alpine AS builder

# 清除所有代理环境变量，避免网络问题
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""
ENV no_proxy=""
ENV NO_PROXY=""

# 安装构建工具和Python（用于better-sqlite3原生模块编译）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    && ln -sf python3 /usr/bin/python

# 设置工作目录
WORKDIR /app

# 安装特定版本的 pnpm 并复制依赖文件，然后安装依赖
RUN npm install -g pnpm@8 && \
    npm config delete proxy && \
    npm config delete https-proxy && \
    npm config delete http-proxy

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码并构建应用，然后清理缓存
COPY . .
RUN pnpm build && \
    pnpm store prune && \
    npm cache clean --force && \
    rm -rf ~/.npm ~/.cache

# 多阶段构建 - 第二阶段：最小运行环境
FROM node:20-alpine AS runner

# 安装必要的系统依赖、时区数据并创建用户（单层合并减少镜像大小）
RUN apk add --no-cache dumb-init tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata && \
    rm -rf /var/cache/apk/* && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物（standalone模式已包含所有依赖，无需重新安装）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/id-allocation || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]