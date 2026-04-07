import { invokeLLM } from "./_core/llm";

/**
 * AI 提供商接口定义
 */
export interface AIProvider {
  name: string;
  model: string;
  priority: number; // 优先级，越低越优先
  isAvailable: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
  maxTokens: number;
  costPer1kTokens: number; // 成本，用于智能路由
}

/**
 * AI 响应接口
 */
export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  streamable: boolean;
}

/**
 * 流式响应回调
 */
export type StreamCallback = (chunk: string) => void;

/**
 * AI 提供商配置
 */
const PROVIDERS: Record<string, AIProvider> = {
  openai_gpt4: {
    name: "OpenAI",
    model: "gpt-4-turbo",
    priority: 1,
    isAvailable: true,
    supportsStreaming: true,
    supportsVision: true,
    maxTokens: 4096,
    costPer1kTokens: 0.03,
  },
  openai_gpt35: {
    name: "OpenAI",
    model: "gpt-3.5-turbo",
    priority: 2,
    isAvailable: true,
    supportsStreaming: true,
    supportsVision: false,
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
  },
  anthropic_claude: {
    name: "Anthropic",
    model: "claude-3-opus",
    priority: 3,
    isAvailable: true,
    supportsStreaming: true,
    supportsVision: true,
    maxTokens: 4096,
    costPer1kTokens: 0.015,
  },
  google_gemini: {
    name: "Google",
    model: "gemini-pro",
    priority: 4,
    isAvailable: true,
    supportsStreaming: true,
    supportsVision: true,
    maxTokens: 4096,
    costPer1kTokens: 0.0005,
  },
  local_ollama: {
    name: "Local",
    model: "llama2",
    priority: 5,
    isAvailable: false, // 需要本地部署
    supportsStreaming: true,
    supportsVision: false,
    maxTokens: 2048,
    costPer1kTokens: 0,
  },
};

/**
 * 获取所有可用的 AI 提供商
 */
export function getAvailableProviders(): AIProvider[] {
  return Object.values(PROVIDERS)
    .filter((p) => p.isAvailable)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 根据任务类型选择最优 AI 提供商
 */
export function selectOptimalProvider(
  taskType: "general" | "code" | "creative" | "analysis" | "vision" = "general"
): AIProvider {
  const available = getAvailableProviders();

  switch (taskType) {
    case "code":
      // 代码任务优先选择 GPT-4
      return available.find((p) => p.model.includes("gpt-4")) || available[0];

    case "creative":
      // 创意任务优先选择 Claude
      return available.find((p) => p.model.includes("claude")) || available[0];

    case "analysis":
      // 分析任务优先选择成本低的模型
      return available.reduce((prev, curr) =>
        curr.costPer1kTokens < prev.costPer1kTokens ? curr : prev
      );

    case "vision":
      // 视觉任务选择支持视觉的模型
      return available.find((p) => p.supportsVision) || available[0];

    default:
      // 一般任务选择优先级最高的
      return available[0];
  }
}

/**
 * 调用 AI 并获取响应
 */
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  options: {
    provider?: string;
    taskType?: "general" | "code" | "creative" | "analysis" | "vision";
    onStream?: StreamCallback;
  } = {}
): Promise<AIResponse> {
  const { provider, taskType = "general", onStream } = options;

  // 选择提供商
  let selectedProvider: AIProvider;
  if (provider && PROVIDERS[provider]) {
    selectedProvider = PROVIDERS[provider];
  } else {
    selectedProvider = selectOptimalProvider(taskType);
  }

  try {
    // 调用 LLM
    const response = await invokeLLM({
      messages: messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
    });

    let content = "";
    const rawContent = response.choices?.[0]?.message?.content;
    
    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      content = rawContent
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
    }

    if (onStream && typeof content === "string") {
      const chunkSize = 10;
      for (let i = 0; i < content.length; i += chunkSize) {
        onStream(content.substring(i, i + chunkSize));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return {
      content: typeof content === "string" ? content : "",
      provider: selectedProvider.name,
      model: selectedProvider.model,
      tokensUsed: response.usage?.total_tokens || 0,
      streamable: selectedProvider.supportsStreaming,
    };
  } catch (error) {
    console.error(`[AI] Error calling ${selectedProvider.name}:`, error);
    throw error;
  }
}

/**
 * 调用 AI 并获取流式响应
 */
export async function callAIStream(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  options: {
    provider?: string;
    taskType?: "general" | "code" | "creative" | "analysis" | "vision";
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  return callAI(messages, {
    ...options,
    onStream: onChunk,
  });
}

/**
 * 批量调用多个 AI 并比较结果
 */
export async function callMultipleAIs(
  messages: Array<{ role: string; content: string }>,
  providerNames?: string[]
): Promise<AIResponse[]> {
  const providers = providerNames
    ? providerNames
        .map((name) => Object.values(PROVIDERS).find((p) => p.name === name))
        .filter(Boolean)
    : getAvailableProviders();

  const results = await Promise.allSettled(
    providers.map((p) =>
      callAI(messages, {
        provider: Object.entries(PROVIDERS).find(([, v]) => v === p)?.[0],
      })
    )
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<AIResponse>).value);
}

/**
 * 获取 AI 提供商的统计信息
 */
export function getProviderStats(): Record<string, any> {
  return Object.entries(PROVIDERS).reduce(
    (acc, [key, provider]) => {
      acc[key] = {
        name: provider.name,
        model: provider.model,
        available: provider.isAvailable,
        priority: provider.priority,
        capabilities: {
          streaming: provider.supportsStreaming,
          vision: provider.supportsVision,
        },
        cost: `$${provider.costPer1kTokens}/1k tokens`,
      };
      return acc;
    },
    {} as Record<string, any>
  );
}
