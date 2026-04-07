# AI 助手平台 (A) - 全球 AI 集成系统

一个功能完整的全球 AI 集成平台，集合了多个 AI 服务、VPN 访问、文件处理、图片生成、代码执行等高级功能。

## 📋 项目概述

**A** 是一个集成全球顶级 AI 算力的智能助手平台，为中国用户提供无缝的全域网访问和丰富的 AI 工具集。

### 核心特性

- **🤖 多 AI 集成** - 集成 OpenAI GPT-4、Anthropic Claude、Google Gemini 等
- **🌐 全域网 VPN** - 一键领取 VPN 配置，支持多个全球节点
- **📁 文件处理** - 支持 PDF、Word、Excel、图片等格式的上传和分析
- **🎨 图片生成** - 集成 DALL-E、Stable Diffusion 等图片生成服务
- **💻 代码执行** - 支持 Python、JavaScript、Shell 等多种编程语言
- **📊 数据分析** - 数据可视化和分析工具
- **👤 账户管理** - 邮箱绑定、VIP 充值、主题自定义
- **📱 响应式设计** - 完美适配 PC 和移动设备

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm
- MySQL 8.0+
- 互联网连接

### 安装步骤

```bash
# 1. 解压项目
unzip ai-assistant-platform-complete.zip
cd ai-assistant-platform

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
# 复制 .env.example 到 .env 并填写必要的配置
cp .env.example .env

# 4. 初始化数据库
pnpm drizzle-kit migrate

# 5. 启动开发服务器
pnpm dev

# 6. 构建生产版本
pnpm build

# 7. 启动生产服务器
pnpm start
```

## 📁 项目结构

```
ai-assistant-platform/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── Home.tsx   # 主页面（AI 对话、VPN、设置）
│   │   │   ├── Tools.tsx  # 工具页面（文件、图片、代码等）
│   │   │   └── ...
│   │   ├── components/    # UI 组件
│   │   ├── _core/hooks/   # 自定义 hooks
│   │   │   ├── useApi.ts  # 基础 API hooks
│   │   │   └── useExtendedApi.ts  # 扩展功能 hooks
│   │   ├── lib/           # 工具库
│   │   └── contexts/      # React 上下文
│   └── public/            # 静态资源
├── server/                # 后端应用
│   ├── routers.ts         # 主路由定义
│   ├── routers-extended.ts # 扩展功能路由
│   ├── db.ts              # 数据库查询函数
│   ├── db-extended.ts     # 扩展数据库函数
│   ├── storage.ts         # S3 存储操作
│   └── _core/             # 核心框架代码
├── drizzle/               # 数据库 schema 和迁移
│   ├── schema.ts          # 数据库表定义
│   └── migrations/        # SQL 迁移文件
├── shared/                # 前后端共享代码
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
└── vite.config.ts         # Vite 配置
```

## 🗄️ 数据库 Schema

### 核心表

| 表名 | 描述 |
|------|------|
| `users` | 用户信息（邮箱、VIP 状态、主题色） |
| `chat_messages` | AI 聊天记录 |
| `vpn_nodes` | VPN 节点配置 |
| `vpn_assignments` | 用户 VPN 分配 |
| `vip_subscriptions` | VIP 订阅信息 |

### 扩展表

| 表名 | 描述 |
|------|------|
| `file_records` | 文件上传记录 |
| `image_generations` | 图片生成记录 |
| `code_executions` | 代码执行记录 |
| `conversation_favorites` | 对话收藏 |
| `api_key_configs` | API 密钥配置 |
| `user_tool_preferences` | 用户工具偏好 |

## 🔌 API 文档

### 认证相关

```typescript
// 获取当前用户信息
GET /api/trpc/auth.me

// 登出
POST /api/trpc/auth.logout
```

### AI 聊天

```typescript
// 发送消息
POST /api/trpc/chat.sendMessage
Input: { prompt: string }
Output: { content: string, success: boolean }

// 获取聊天历史
GET /api/trpc/chat.getHistory?input={"limit":50}
Output: ChatMessage[]
```

### VPN 管理

```typescript
// 获取 VPN 节点列表
GET /api/trpc/vpn.getNodes
Output: VpnNode[]

// 领取 VPN 配置
POST /api/trpc/vpn.claimNode
Output: { url: string, success: boolean }
```

### 文件处理

```typescript
// 上传文件
POST /api/trpc/files.upload
Input: { fileName, fileType, fileSize, fileUrl }

// 获取文件列表
GET /api/trpc/files.list
Output: FileRecord[]
```

### 图片生成

```typescript
// 生成图片
POST /api/trpc/images.generate
Input: { prompt: string, model: string }
Output: { success: boolean, imageUrl: string }

// 获取生成历史
GET /api/trpc/images.list
Output: ImageGeneration[]
```

### 代码执行

```typescript
// 执行代码
POST /api/trpc/code.execute
Input: { language: string, code: string }
Output: { success: boolean, result: string }

// 获取执行历史
GET /api/trpc/code.history
Output: CodeExecution[]
```

### 对话收藏

```typescript
// 添加收藏
POST /api/trpc/favorites.add
Input: { chatMessageId: number, title?: string }

// 获取收藏列表
GET /api/trpc/favorites.list
Output: ConversationFavorite[]
```

### API 密钥管理

```typescript
// 保存 API 密钥
POST /api/trpc/apiKeys.save
Input: { provider: string, apiKey: string }

// 获取 API 密钥列表
GET /api/trpc/apiKeys.list
Output: { id, provider, isActive }[]
```

## 🛠️ 功能模块详解

### 1. AI 对话界面

- **多 AI 集成** - 支持 OpenAI、Anthropic、Google Gemini 等
- **智能路由** - 根据网友评价自动选择最佳 AI
- **上下文记忆** - 保持对话历史和上下文
- **流式响应** - 实时显示 AI 生成内容
- **消息收藏** - 收藏重要对话

### 2. VPN 全域网

- **多节点支持** - 美国、日本、新加坡等全球节点
- **一键领取** - 快速获取 VPN 配置链接
- **节点状态** - 实时显示节点在线/满载状态
- **连接数监测** - 查看当前连接用户数

### 3. 文件处理工具

- **格式支持** - PDF、Word、Excel、图片、TXT 等
- **文件分析** - AI 驱动的文件内容摘要和分析
- **格式转换** - PDF 转图片、Word 转 Markdown 等
- **历史管理** - 查看和管理上传历史

### 4. 图片生成工具

- **多模型支持** - DALL-E、Stable Diffusion 等
- **参数配置** - 自定义图片风格、尺寸等
- **历史管理** - 保存和下载生成的图片
- **批量生成** - 支持批量生成多张图片

### 5. 代码执行工具

- **多语言支持** - Python、JavaScript、Bash、Java 等
- **代码编辑器** - 集成代码高亮和自动补全
- **实时执行** - 快速执行代码并显示结果
- **历史记录** - 保存代码执行历史

### 6. 账户管理

- **邮箱绑定** - 绑定邮箱用于账户恢复和通知
- **VIP 充值** - 支持多种充值方式
- **主题自定义** - 上传图片 AI 识别色调并应用主题
- **工具偏好** - 自定义启用/禁用各个工具

## 🔐 安全性

- **OAuth 认证** - 使用 Manus OAuth 进行安全认证
- **API 密钥加密** - 用户 API 密钥安全存储
- **HTTPS 通信** - 所有通信都通过 HTTPS 加密
- **会话管理** - 安全的会话 cookie 管理
- **权限控制** - 基于用户角色的权限控制

## 📊 性能优化

- **前端优化**
  - 代码分割和懒加载
  - 组件虚拟化处理大列表
  - 缓存策略优化
  - 响应式图片加载

- **后端优化**
  - 数据库查询优化
  - 缓存层实现
  - 异步处理任务
  - 连接池管理

- **网络优化**
  - CDN 资源加速
  - 压缩和 gzip
  - HTTP/2 支持
  - 预连接和预加载

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test server/api.test.ts

# 生成覆盖率报告
pnpm test -- --coverage
```

## 📦 部署

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t ai-assistant-platform .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e JWT_SECRET="..." \
  ai-assistant-platform
```

### 云服务部署

支持部署到：
- Vercel（前端）
- Railway（全栈）
- Render（全栈）
- AWS、GCP、Azure 等

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

MIT License - 详见 LICENSE 文件

## 🆘 常见问题

### Q: 如何集成真实的 AI API？

A: 在 `server/routers.ts` 中的 `chat.sendMessage` 方法中，替换模拟响应为真实 API 调用：

```typescript
const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt },
  ],
});
```

### Q: 如何添加新的工具？

A: 
1. 在 `drizzle/schema.ts` 中添加新表
2. 在 `server/db-extended.ts` 中添加查询函数
3. 在 `server/routers-extended.ts` 中添加 API 路由
4. 在 `client/src/pages/Tools.tsx` 中添加 UI 组件

### Q: 如何自定义主题色？

A: 修改 `client/src/index.css` 中的 CSS 变量：

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --primary: 0 0% 9%;
    /* ... 其他颜色 */
  }
}
```

## 📞 技术支持

- 📧 邮件：support@example.com
- 💬 Discord：https://discord.gg/example
- 🐛 Issue：https://github.com/example/issues

## 🎯 未来计划

- [ ] 实时协作编辑
- [ ] 插件系统
- [ ] 本地 LLM 支持
- [ ] 多语言支持
- [ ] 移动应用
- [ ] 企业版功能

---

**版本**: 2.0.0  
**最后更新**: 2026-04-07  
**维护者**: AI Assistant Platform Team
