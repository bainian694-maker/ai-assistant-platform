# AI 助手平台 - 企业级增强功能完整指南

## 概述

本指南提供了完整的 AI 能力升级方案，包括 RAG 知识库、工具调用、多模态处理、长期记忆、实时信息和自我反思等企业级功能。

---

## 1. RAG 知识库系统

### 1.1 功能概述

RAG (Retrieval-Augmented Generation) 允许 AI 基于用户上传的文档进行智能回答。

### 1.2 实现方案

**后端实现** (`server/rag-system.ts`):
```typescript
// 上传文档
await uploadDocument(userId, {
  name: "document.pdf",
  content: buffer,
  type: "application/pdf"
});

// 搜索相关文档
const results = await searchDocuments(userId, "查询内容");

// 在 AI 回答中使用检索结果
const context = results.map(r => r.chunk).join("\n");
const response = await callAI([
  { role: "system", content: `使用以下文档回答问题:\n${context}` },
  { role: "user", content: userQuery }
], config);
```

### 1.3 集成到 API

**路由** (`server/routers.ts`):
```typescript
rag: router({
  uploadDocument: protectedProcedure
    .input(z.object({ file: z.any() }))
    .mutation(async ({ input, ctx }) => {
      return uploadDocument(ctx.user!.id, input.file);
    }),

  searchDocuments: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      return searchDocuments(ctx.user!.id, input.query);
    }),
})
```

### 1.4 前端集成

**UI** (`client/src/pages/ToolsPage.tsx`):
```tsx
const uploadFile = trpc.rag.uploadDocument.useMutation();
const searchDocs = trpc.rag.searchDocuments.useQuery({ query });

const handleUpload = async (file: File) => {
  const buffer = await file.arrayBuffer();
  await uploadFile.mutateAsync({
    file: {
      name: file.name,
      content: buffer,
      type: file.type
    }
  });
};
```

---

## 2. 工具调用能力

### 2.1 支持的工具

- **Web 搜索** - 使用 SerpAPI 或 Google Custom Search
- **代码执行** - 安全的 Python/JavaScript 沙箱
- **计算器** - 复杂数学计算
- **天气查询** - 实时天气信息
- **翻译** - 多语言翻译
- **图片生成** - DALL-E 或 Stable Diffusion

### 2.2 实现方案

**工具定义** (`server/tools.ts`):
```typescript
const tools = [
  {
    name: "web_search",
    description: "搜索网络信息",
    parameters: {
      query: "搜索查询"
    },
    execute: async (query: string) => {
      const response = await fetch(
        `https://api.serpapi.com/search?q=${query}&api_key=${process.env.SERPAPI_KEY}`
      );
      return response.json();
    }
  },
  {
    name: "execute_code",
    description: "执行 Python 代码",
    parameters: {
      code: "Python 代码"
    },
    execute: async (code: string) => {
      // 使用 PyodideWorker 或 Pyodide 在浏览器中执行
      return executeInSandbox(code);
    }
  }
];
```

### 2.3 AI 工具调用集成

**后端** (`server/ai-with-tools.ts`):
```typescript
export async function callAIWithTools(
  messages: AIMessage[],
  config: AIServiceConfig,
  tools: Tool[]
) {
  let response = await callAI(messages, config);
  
  // 检查是否需要调用工具
  while (response.content.includes("[TOOL_CALL]")) {
    const toolCall = parseToolCall(response.content);
    const toolResult = await executeTool(toolCall);
    
    // 继续对话，包含工具结果
    messages.push({
      role: "assistant",
      content: response.content
    });
    messages.push({
      role: "user",
      content: `工具执行结果:\n${toolResult}`
    });
    
    response = await callAI(messages, config);
  }
  
  return response;
}
```

---

## 3. 多模态处理

### 3.1 支持的模态

- **图片识别** - 使用 Claude Vision 或 GPT-4 Vision
- **视频理解** - 提取关键帧进行分析
- **音频转文本** - 使用 Whisper API
- **文档 OCR** - 从图片/PDF 提取文本

### 3.2 实现方案

**图片处理** (`server/multimodal.ts`):
```typescript
export async function analyzeImage(imageUrl: string, prompt: string) {
  const response = await callAI([
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    }
  ], config);
  
  return response.content;
}

export async function analyzeVideo(videoUrl: string, prompt: string) {
  // 提取视频关键帧
  const frames = await extractVideoFrames(videoUrl, 5);
  
  // 分析每一帧
  const analyses = await Promise.all(
    frames.map(frame => analyzeImage(frame, prompt))
  );
  
  // 综合分析结果
  return synthesizeAnalysis(analyses);
}

export async function transcribeAudio(audioUrl: string) {
  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData // 包含音频文件
    }
  );
  
  return response.json();
}
```

---

## 4. 长期记忆和个性化

### 4.1 用户偏好学习

**用户档案** (`server/user-profile.ts`):
```typescript
interface UserProfile {
  userId: number;
  preferences: {
    responseStyle: "formal" | "casual" | "technical";
    language: string;
    topics: string[];
    avoidTopics: string[];
  };
  conversationHistory: {
    sessionId: string;
    summary: string;
    keyPoints: string[];
  }[];
  feedback: {
    messageId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
  }[];
}

export async function updateUserProfile(
  userId: number,
  feedback: { messageId: string; rating: number; comment?: string }
) {
  // 分析反馈，更新用户偏好
  const profile = await getUserProfile(userId);
  
  if (feedback.rating <= 2) {
    // 降低该类型回答的权重
    profile.preferences.avoidTopics.push(extractTopic(feedback));
  } else if (feedback.rating >= 4) {
    // 增加该类型回答的权重
    profile.preferences.topics.push(extractTopic(feedback));
  }
  
  await saveUserProfile(userId, profile);
}
```

### 4.2 跨会话记忆

**会话管理** (`server/session-memory.ts`):
```typescript
export async function getConversationContext(userId: number) {
  // 获取最近的对话摘要
  const recentSessions = await getRecentSessions(userId, 5);
  
  const context = recentSessions
    .map(session => `
      时间: ${session.date}
      主题: ${session.topic}
      要点: ${session.keyPoints.join(", ")}
    `)
    .join("\n");
  
  return context;
}

export async function callAIWithMemory(
  messages: AIMessage[],
  userId: number,
  config: AIServiceConfig
) {
  // 获取用户历史上下文
  const context = await getConversationContext(userId);
  const profile = await getUserProfile(userId);
  
  // 构建系统提示，包含用户偏好和历史
  const systemPrompt = `
    你是一个智能 AI 助手。
    
    用户偏好:
    - 回答风格: ${profile.preferences.responseStyle}
    - 语言: ${profile.preferences.language}
    - 感兴趣的主题: ${profile.preferences.topics.join(", ")}
    
    用户历史背景:
    ${context}
  `;
  
  return callAI([
    { role: "system", content: systemPrompt },
    ...messages
  ], config);
}
```

---

## 5. 实时信息和网络搜索

### 5.1 实时数据源

- **新闻** - NewsAPI
- **股票** - Alpha Vantage
- **天气** - OpenWeatherMap
- **体育** - ESPN API
- **加密货币** - CoinGecko

### 5.2 实现方案

**实时搜索** (`server/realtime-search.ts`):
```typescript
export async function searchRealtime(query: string, category?: string) {
  const sources = [
    searchNews(query),
    searchWeather(query),
    searchStocks(query),
    searchCrypto(query)
  ];
  
  const results = await Promise.race([
    Promise.all(sources),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Search timeout")), 5000)
    )
  ]);
  
  return aggregateResults(results);
}

export async function callAIWithRealtime(
  messages: AIMessage[],
  config: AIServiceConfig
) {
  const lastMessage = messages[messages.length - 1];
  
  // 检测是否需要实时信息
  if (needsRealtimeInfo(lastMessage.content)) {
    const realtimeData = await searchRealtime(lastMessage.content);
    
    messages.push({
      role: "user",
      content: `最新信息:\n${JSON.stringify(realtimeData, null, 2)}`
    });
  }
  
  return callAI(messages, config);
}
```

---

## 6. 自我反思和错误纠正

### 6.1 自我评估

**质量检查** (`server/self-reflection.ts`):
```typescript
export async function evaluateResponse(
  response: string,
  originalQuery: string
): Promise<{ score: number; issues: string[] }> {
  const evaluation = await callAI([
    {
      role: "system",
      content: `你是一个 AI 质量评估器。评估以下回答的质量。
      
      评估标准:
      1. 是否回答了问题 (0-25 分)
      2. 准确性 (0-25 分)
      3. 完整性 (0-25 分)
      4. 清晰度 (0-25 分)
      
      返回格式: {"score": 0-100, "issues": ["问题1", "问题2"]}`
    },
    {
      role: "user",
      content: `问题: ${originalQuery}\n\n回答: ${response}`
    }
  ], config);
  
  return JSON.parse(evaluation.content);
}

export async function improveResponse(
  response: string,
  issues: string[]
): Promise<string> {
  const improved = await callAI([
    {
      role: "system",
      content: "改进以下回答，解决指出的问题。"
    },
    {
      role: "user",
      content: `原始回答:\n${response}\n\n需要改进的问题:\n${issues.join("\n")}`
    }
  ], config);
  
  return improved.content;
}
```

### 6.2 自动纠正流程

**完整流程** (`server/ai-with-reflection.ts`):
```typescript
export async function callAIWithReflection(
  messages: AIMessage[],
  config: AIServiceConfig,
  maxIterations: number = 3
) {
  let response = await callAI(messages, config);
  let iteration = 0;
  
  while (iteration < maxIterations) {
    const { score, issues } = await evaluateResponse(
      response.content,
      messages[messages.length - 1].content
    );
    
    if (score >= 80) {
      // 质量足够好
      break;
    }
    
    if (issues.length > 0) {
      // 改进回答
      const improved = await improveResponse(response.content, issues);
      response.content = improved;
    }
    
    iteration++;
  }
  
  return response;
}
```

---

## 7. 集成所有功能

### 7.1 完整的 AI 管道

**主 AI 服务** (`server/ai-complete.ts`):
```typescript
export async function callAIComplete(
  messages: AIMessage[],
  userId: number,
  config: AIServiceConfig,
  options: {
    useRAG?: boolean;
    useTools?: boolean;
    useRealtime?: boolean;
    useReflection?: boolean;
  } = {}
) {
  let processedMessages = [...messages];
  
  // 1. 添加用户历史背景
  const context = await getConversationContext(userId);
  const profile = await getUserProfile(userId);
  
  const systemPrompt = `你是一个高级 AI 助手。
    用户偏好: ${JSON.stringify(profile.preferences)}
    历史背景: ${context}`;
  
  processedMessages[0] = {
    ...processedMessages[0],
    content: systemPrompt + "\n" + processedMessages[0].content
  };
  
  // 2. RAG 检索
  if (options.useRAG) {
    const query = processedMessages[processedMessages.length - 1].content;
    const docs = await searchDocuments(userId, query);
    const ragContext = docs.map(d => d.chunk).join("\n");
    
    processedMessages.push({
      role: "system",
      content: `相关文档:\n${ragContext}`
    });
  }
  
  // 3. 实时信息
  if (options.useRealtime) {
    const realtimeData = await searchRealtime(
      processedMessages[processedMessages.length - 1].content
    );
    processedMessages.push({
      role: "system",
      content: `最新信息:\n${JSON.stringify(realtimeData)}`
    });
  }
  
  // 4. 工具调用
  let response = options.useTools
    ? await callAIWithTools(processedMessages, config, tools)
    : await callAI(processedMessages, config);
  
  // 5. 自我反思
  if (options.useReflection) {
    response = await callAIWithReflection(
      [...processedMessages, { role: "assistant", content: response.content }],
      config
    );
  }
  
  // 6. 保存到记忆
  await saveConversation(userId, {
    query: messages[messages.length - 1].content,
    response: response.content,
    profile: profile
  });
  
  return response;
}
```

### 7.2 API 路由

**完整路由** (`server/routers-complete.ts`):
```typescript
export const completeAIRouter = router({
  chat: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      options: z.object({
        useRAG: z.boolean().optional(),
        useTools: z.boolean().optional(),
        useRealtime: z.boolean().optional(),
        useReflection: z.boolean().optional()
      }).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const response = await callAIComplete(
        [
          { role: "system", content: "你是一个高级 AI 助手。" },
          { role: "user", content: input.prompt }
        ],
        ctx.user!.id,
        getDefaultAIConfig(),
        input.options || {
          useRAG: true,
          useTools: true,
          useRealtime: true,
          useReflection: true
        }
      );
      
      return response;
    })
});
```

---

## 8. 环境配置

### 8.1 必需的 API 密钥

```env
# 搜索
SERPAPI_KEY=your_serpapi_key
GOOGLE_SEARCH_API_KEY=your_google_key

# 数据源
OPENWEATHERMAP_API_KEY=your_weather_key
NEWSAPI_KEY=your_news_key
ALPHAVANTAGE_KEY=your_stock_key

# 多模态
OPENAI_API_KEY=your_openai_key (for vision)

# 可选
REPLICATE_API_TOKEN=for_image_generation
```

### 8.2 数据库迁移

```bash
# 生成迁移
pnpm drizzle-kit generate

# 应用迁移
pnpm drizzle-kit migrate
```

---

## 9. 前端集成示例

### 9.1 完整的聊天界面

```tsx
export function AdvancedChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [options, setOptions] = useState({
    useRAG: true,
    useTools: true,
    useRealtime: true,
    useReflection: true
  });
  
  const sendMessage = trpc.completeAI.chat.useMutation();
  
  const handleSend = async (prompt: string) => {
    const response = await sendMessage.mutateAsync({
      prompt,
      options
    });
    
    setMessages([
      ...messages,
      { role: "user", content: prompt },
      { role: "assistant", content: response.content }
    ]);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <label>
          <input
            type="checkbox"
            checked={options.useRAG}
            onChange={(e) => setOptions({...options, useRAG: e.target.checked})}
          />
          使用知识库
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.useTools}
            onChange={(e) => setOptions({...options, useTools: e.target.checked})}
          />
          使用工具
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.useRealtime}
            onChange={(e) => setOptions({...options, useRealtime: e.target.checked})}
          />
          实时信息
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.useReflection}
            onChange={(e) => setOptions({...options, useReflection: e.target.checked})}
          />
          自我反思
        </label>
      </div>
      
      {/* 消息显示 */}
      <div className="flex-1 overflow-auto">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : ""}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {/* 输入框 */}
      <input
        type="text"
        placeholder="输入消息..."
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSend(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
```

---

## 10. 部署和优化

### 10.1 性能优化

- **缓存**: Redis 缓存频繁查询
- **异步处理**: 使用队列处理长时间任务
- **并行化**: 并行调用多个 API
- **模型优化**: 使用量化模型减少内存占用

### 10.2 监控和日志

```typescript
// 添加性能监控
import { performance } from "perf_hooks";

export async function callAIWithMetrics(
  messages: AIMessage[],
  config: AIServiceConfig
) {
  const start = performance.now();
  
  try {
    const response = await callAI(messages, config);
    const duration = performance.now() - start;
    
    console.log(`[AI] Response time: ${duration}ms`);
    
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[AI] Error after ${duration}ms:`, error);
    throw error;
  }
}
```

---

## 11. 常见问题

**Q: 如何处理 API 超时?**
A: 使用 Promise.race() 设置超时，实现降级策略。

**Q: 如何保证隐私?**
A: 所有用户数据加密存储，API 调用使用代理。

**Q: 如何提高响应速度?**
A: 使用缓存、异步处理、并行 API 调用。

**Q: 支持离线使用吗?**
A: 支持，使用本地 Ollama 模型可完全离线。

---

## 12. 下一步

1. 实现完整的 RAG 系统
2. 集成真实的 API（SerpAPI、OpenWeather 等）
3. 添加更多工具（计算器、翻译等）
4. 优化性能和缓存
5. 部署到生产环境

---

**最后更新**: 2026-04-07
**版本**: 1.0 Enterprise Edition
