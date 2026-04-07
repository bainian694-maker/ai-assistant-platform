FROM node:22-slim

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml ./
# 复制补丁文件（如果有）
COPY patches ./patches

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建项目
# 1. 构建前端 (vite build)
# 2. 构建后端 (esbuild)
RUN pnpm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"]
