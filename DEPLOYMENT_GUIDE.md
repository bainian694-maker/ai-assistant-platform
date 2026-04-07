# AI 助手平台 - 独立部署指南

## 概述

本平台现已支持**完全独立的开源 LLM 部署**，不依赖任何商业 API。支持以下开源模型：

- **Qwen 2.5** (推荐) - 阿里开源，中文最强
- **LLaMA 2/3** - Meta 开源，英文强项
- **ChatGLM** - 清华开源，中文优化
- **Mistral** - 欧洲开源，性能均衡

## 快速开始

### 方案 1：使用 Ollama（推荐，最简单）

#### 1.1 安装 Ollama

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
从 https://ollama.ai 下载安装程序

#### 1.2 启动 Ollama 服务

```bash
ollama serve
```

#### 1.3 拉取模型

```bash
# 推荐：Qwen 2.5 (14B，平衡性能和质量)
ollama pull qwen2.5:14b

# 或轻量级版本 (7B)
ollama pull qwen2.5:7b

# 或其他模型
ollama pull llama2
ollama pull mistral
```

#### 1.4 验证模型

```bash
ollama list
```

### 方案 2：使用 vLLM（高性能）

#### 2.1 安装 vLLM

```bash
pip install vllm
```

#### 2.2 启动 vLLM 服务

```bash
python -m vllm.entrypoints.openai.api_server \
  --model qwen/Qwen2.5-14B-Instruct \
  --tensor-parallel-size 1 \
  --port 8000
```

#### 2.3 配置环境变量

```bash
export VLLM_BASE_URL=http://localhost:8000
export VLLM_MODEL=qwen/Qwen2.5-14B-Instruct
```

## 环境配置

### 后端环境变量

在 `.env` 文件中配置：

```env
# Ollama 配置（推荐）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b

# 或 vLLM 配置
VLLM_BASE_URL=http://localhost:8000
VLLM_MODEL=qwen/Qwen2.5-14B-Instruct

# AI 服务提供商（ollama | vllm | local）
AI_PROVIDER=ollama
```

### 使用环境变量

在代码中：

```typescript
import { getDefaultAIConfig, callAI } from "./server/ai-service-independent";

const config = getDefaultAIConfig();
const response = await callAI(messages, config);
```

## 部署到中国网络可访问的服务器

### 选项 1：Railway（推荐）

Railway 支持中国网络访问，且有免费额度。

#### 步骤：

1. 注册 Railway: https://railway.app
2. 连接 GitHub 仓库
3. 配置环境变量（见上面的环境配置）
4. 部署

#### 配置 railway.json：

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "on_failure"
  }
}
```

### 选项 2：Render

Render 也支持中国访问。

#### 步骤：

1. 注册 Render: https://render.com
2. 创建新的 Web Service
3. 连接 GitHub 仓库
4. 配置构建命令：`pnpm install && pnpm build`
5. 配置启动命令：`pnpm start`
6. 配置环境变量
7. 部署

### 选项 3：自建服务器（阿里云、腾讯云等）

#### 前置要求：

- Node.js 18+
- Docker（可选但推荐）
- 2GB+ RAM
- 稳定的网络连接

#### 部署步骤：

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd ai-assistant-platform

# 2. 安装依赖
pnpm install

# 3. 构建
pnpm build

# 4. 启动 Ollama（如果使用）
ollama serve &

# 5. 启动应用
pnpm start
```

#### 使用 Docker 部署：

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 Ollama
RUN apk add --no-cache curl
RUN curl -fsSL https://ollama.ai/install.sh | sh

# 复制项目
COPY . .

# 安装依赖
RUN npm install -g pnpm
RUN pnpm install

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000 11434

# 启动
CMD ["sh", "-c", "ollama serve & pnpm start"]
```

## 性能优化

### 模型选择建议

| 模型 | 大小 | 速度 | 质量 | 推荐场景 |
|------|------|------|------|---------|
| Qwen 2.5 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 轻量级部署 |
| Qwen 2.5 14B | 14B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 推荐 |
| Qwen 2.5 32B | 32B | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 高性能服务器 |
| LLaMA 2 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 英文优先 |
| Mistral 7B | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 均衡选择 |

### 内存要求

- **7B 模型**: 最少 8GB RAM
- **14B 模型**: 最少 16GB RAM
- **32B 模型**: 最少 32GB RAM

### GPU 加速

如果有 GPU，可以显著提升性能：

```bash
# NVIDIA GPU
ollama pull qwen2.5:14b
# Ollama 会自动检测 GPU

# 或指定 GPU
CUDA_VISIBLE_DEVICES=0 ollama serve
```

## 测试部署

### 1. 检查后端健康状态

```bash
curl http://localhost:3000/api/health
```

### 2. 测试 AI 服务

```bash
curl -X POST http://localhost:3000/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"prompt": "你好，请介绍一下你自己"}'
```

### 3. 测试前端

访问 http://localhost:3000

## 故障排查

### 问题 1：Ollama 连接失败

**症状**: `Error: connect ECONNREFUSED 127.0.0.1:11434`

**解决**:
```bash
# 确保 Ollama 正在运行
ollama serve

# 或检查 Ollama 状态
curl http://localhost:11434/api/tags
```

### 问题 2：模型加载缓慢

**症状**: 首次请求响应时间很长

**解决**:
- 这是正常的，模型首次加载需要时间
- 后续请求会快得多
- 可以预先加载模型：`ollama pull qwen2.5:14b`

### 问题 3：内存不足

**症状**: `OOM killed` 或应用崩溃

**解决**:
- 使用更小的模型（7B 而不是 14B）
- 增加服务器 RAM
- 启用 GPU 加速

### 问题 4：中国网络访问慢

**症状**: 响应时间长，超时

**解决**:
- 使用国内云服务商（阿里云、腾讯云）
- 配置 CDN
- 优化模型推理（使用 vLLM 而不是 Ollama）

## 生产部署清单

- [ ] 配置环境变量
- [ ] 测试 AI 服务连接
- [ ] 配置日志系统
- [ ] 设置监控告警
- [ ] 配置备份策略
- [ ] 测试故障恢复
- [ ] 性能基准测试
- [ ] 安全审计
- [ ] 文档完善
- [ ] 用户培训

## 支持的 AI 提供商

### Ollama

**优点**:
- 最简单易用
- 完全离线
- 支持多种模型
- 社区活跃

**缺点**:
- 性能不如 vLLM
- 内存占用较大

**配置**:
```typescript
const config = {
  provider: "ollama",
  model: "qwen2.5:14b",
  baseUrl: "http://localhost:11434"
};
```

### vLLM

**优点**:
- 高性能推理
- 支持张量并行
- 内存优化

**缺点**:
- 配置复杂
- 需要 GPU

**配置**:
```typescript
const config = {
  provider: "vllm",
  model: "qwen/Qwen2.5-14B-Instruct",
  baseUrl: "http://localhost:8000"
};
```

## 常见问题

**Q: 可以使用 OpenAI API 吗?**
A: 可以，但本指南重点是开源方案。如需 OpenAI，请参考之前的集成文档。

**Q: 支持多用户并发吗?**
A: 支持。Ollama 和 vLLM 都支持多并发请求。

**Q: 可以微调模型吗?**
A: 可以，但超出本指南范围。建议参考 Hugging Face 微调文档。

**Q: 如何更新模型?**
A: 
```bash
ollama pull qwen2.5:14b  # 自动更新到最新版本
```

## 参考资源

- Ollama: https://ollama.ai
- Qwen: https://github.com/QwenLM/Qwen
- vLLM: https://github.com/lm-sys/vllm
- Railway: https://railway.app
- Render: https://render.com
