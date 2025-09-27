import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用standalone输出模式，适合Docker部署
  output: 'standalone',
  
  // 优化构建性能
  compress: true,
  poweredByHeader: false,
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
