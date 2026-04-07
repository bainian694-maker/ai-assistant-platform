FROM node:22-slim

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建项目
# 1. 构建前端 (vite build) -> 产物在 dist/public
# 2. 构建后端 (esbuild) -> 产物在 dist/index.js
RUN pnpm run build

# 环境变量默认值
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/index.js"]
