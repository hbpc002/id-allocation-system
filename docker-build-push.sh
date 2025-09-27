#!/bin/bash

# Docker镜像构建和上传脚本
# 用于构建Next.js应用镜像并上传到Docker Hub

# 设置镜像名称和版本
IMAGE_NAME="hb-openeye-app"
VERSION="0.1.0"
DOCKER_HUB_USERNAME="hbpc002"

# 完整的镜像名称
FULL_IMAGE_NAME="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "开始构建Docker镜像..."
echo "镜像名称: $FULL_IMAGE_NAME"

# 1. 使用优化后的Dockerfile构建镜像
echo "步骤1: 构建Docker镜像..."
docker build -f Dockerfile.optimized -t ${IMAGE_NAME}:latest .

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "错误: 镜像构建失败"
    exit 1
fi

echo "镜像构建成功!"

# 2. 为镜像打上版本标签
echo "步骤2: 为镜像打上版本标签..."
docker tag ${IMAGE_NAME}:latest ${FULL_IMAGE_NAME}

# 检查标签是否成功
if [ $? -ne 0 ]; then
    echo "错误: 镜像标签失败"
    exit 1
fi

echo "镜像标签成功!"

# 3. 将镜像推送到Docker Hub
echo "步骤3: 将镜像推送到Docker Hub..."
docker push ${FULL_IMAGE_NAME}

# 检查推送是否成功
if [ $? -ne 0 ]; then
    echo "错误: 镜像推送失败"
    exit 1
fi

echo "镜像推送成功!"

# 4. 验证镜像是否成功上传
echo "步骤4: 验证镜像..."
echo "本地镜像列表:"
docker images | grep ${IMAGE_NAME}

echo "可以尝试使用以下命令从Docker Hub拉取镜像进行验证:"
echo "docker pull ${FULL_IMAGE_NAME}"

echo "所有操作完成!"