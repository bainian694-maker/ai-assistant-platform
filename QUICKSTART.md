# 快速开始指南

## 5 分钟快速上手

### 第一步：环境准备

```bash
# 安装依赖
pnpm install

# 或使用 npm
npm install
```

### 第二步：配置数据库

```bash
# 初始化数据库
pnpm drizzle-kit migrate

# 或手动运行迁移
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 第三步：启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 服务器将在 http://localhost:3000 启动
```

### 第四步：访问应用

打开浏览器访问 `http://localhost:3000`

## 🎯 主要功能使用

### 1. AI 聊天

1. 点击左侧导航的"智能 A"
2. 在底部输入框输入你的问题
3. 点击发送按钮或按 Enter 键
4. AI 将自动响应

### 2. VPN 全域网

1. 点击"全域网"标签
2. 查看可用的 VPN 节点
3. 点击"一键领取"获取配置链接
4. 复制链接到 VPN 应用

### 3. 工具箱

1. 点击"工具"标签
2. 选择你需要的工具：
   - **文件处理** - 上传和分析文件
   - **图片生成** - 生成 AI 图片
   - **代码执行** - 运行代码
   - **收藏** - 管理收藏的对话
   - **API 密钥** - 配置 API 密钥
   - **工具设置** - 自定义工具偏好

### 4. 账户设置

1. 点击"设置"标签
2. 配置：
   - 邮箱绑定
   - VIP 充值
   - 主题自定义
   - 个人信息

## 🔧 常见配置

### 集成 OpenAI API

1. 获取 OpenAI API Key：https://platform.openai.com/api-keys
2. 在设置中添加 API 密钥
3. 在 `server/routers.ts` 中修改 `chat.sendMessage`：

```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: prompt },
  ],
});

const aiResponse = response.choices[0].message.content;
```

### 集成图片生成

在 `server/routers-extended.ts` 中修改 `images.generate`：

```typescript
// 调用真实的图片生成 API
const { url: imageUrl } = await generateImage({
  prompt: input.prompt,
});
```

### 配置 VPN 节点

编辑 `seed-vpn-nodes.mjs` 文件，修改节点信息：

```javascript
const nodes = [
  {
    name: "你的节点名称",
    region: "地区",
    configUrl: "vless://配置链接",
    maxUsers: 3,
    currentUsers: 0,
    status: "online",
  },
];
```

然后运行：

```bash
node seed-vpn-nodes.mjs
```

## 📱 移动端适配

应用已完全适配移动设备：

- 导航栏自动在移动端显示在底部
- 所有页面都是响应式设计
- 触摸友好的按钮和输入框

## 🐛 调试

### 查看日志

```bash
# 前端日志在浏览器控制台
# 后端日志在终端输出

# 查看数据库日志
pnpm drizzle-kit studio
```

### 常见错误

| 错误 | 解决方案 |
|------|--------|
| 数据库连接失败 | 检查 DATABASE_URL 环境变量 |
| 认证失败 | 检查 OAuth 配置和 JWT_SECRET |
| API 调用超时 | 检查网络连接和 API 端点 |
| 样式不显示 | 清除浏览器缓存，重新加载 |

## 📚 下一步

1. **阅读完整文档** - 查看 `README-ENHANCED.md`
2. **浏览源代码** - 理解项目结构
3. **修改样式** - 编辑 `client/src/index.css`
4. **添加功能** - 参考现有功能实现新功能
5. **部署上线** - 按照部署指南发布应用

## 💡 提示

- 使用 `pnpm` 而不是 `npm` 可以获得更快的安装速度
- 开发时保持开发服务器运行，修改文件会自动热更新
- 使用 TypeScript 获得更好的代码提示和类型检查
- 定期运行测试确保代码质量

## 🚀 生产部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 或使用 Docker
docker build -t ai-assistant .
docker run -p 3000:3000 ai-assistant
```

## 📞 获取帮助

- 查看 README-ENHANCED.md 中的常见问题
- 检查错误日志和浏览器控制台
- 查看源代码中的注释
- 提交 Issue 或联系技术支持

---

祝你使用愉快！🎉
