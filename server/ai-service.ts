/**
 * 真实 AI 服务实现
 * 使用 Manus 内置 LLM 和其他真实 AI API
 */

import { invokeLLM } from "./_core/llm";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  provider: string;
}

/**
 * 调用 Manus 内置 LLM
 */
export async function callManuLLM(
  messages: AIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  try {
    const response = await invokeLLM({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = typeof response.choices?.[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : "无法获取响应";
    const tokensUsed = 0; // Manus LLM 不提供 token 计数

    return {
      content,
      model: response.model || "manus-llm",
      tokensUsed,
      provider: "manus",
    };
  } catch (error) {
    console.error("[AI Service] Manus LLM Error:", error);
    throw new Error(`Manus LLM 调用失败: ${(error as Error).message}`);
  }
}

/**
 * 调用 OpenAI API（如果配置了 API 密钥）
 */
export async function callOpenAI(
  messages: AIMessage[],
  options: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API 密钥未配置");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-3.5-turbo",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API 错误: ${error.error?.message || "未知错误"}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "无法获取响应";
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      content,
      model: data.model || "gpt-3.5-turbo",
      tokensUsed,
      provider: "openai",
    };
  } catch (error) {
    console.error("[AI Service] OpenAI Error:", error);
    throw error;
  }
}

/**
 * 调用 Claude API（如果配置了 API 密钥）
 */
export async function callClaude(
  messages: AIMessage[],
  options: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Anthropic API 密钥未配置");
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || "claude-3-sonnet-20240229",
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        system: messages.find((m) => m.role === "system")?.content,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Claude API 错误: ${error.error?.message || "未知错误"}`
      );
    }

    const data = await response.json();
    const content =
      data.content?.[0]?.text || "无法获取响应";
    const tokensUsed =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return {
      content,
      model: data.model || "claude-3-sonnet",
      tokensUsed,
      provider: "anthropic",
    };
  } catch (error) {
    console.error("[AI Service] Claude Error:", error);
    throw error;
  }
}

/**
 * 智能 AI 选择和调用
 */
export async function callAIWithFallback(
  messages: AIMessage[],
  options: {
    preferredProvider?: "manus" | "openai" | "claude";
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const preferred = options.preferredProvider || "manus";

  // 按优先级尝试调用
  const providers: Array<() => Promise<AIResponse>> = [];

  if (preferred === "manus") {
    providers.push(() => callManuLLM(messages, options));
    providers.push(() => callOpenAI(messages, options));
    providers.push(() => callClaude(messages, options));
  } else if (preferred === "openai") {
    providers.push(() => callOpenAI(messages, options));
    providers.push(() => callClaude(messages, options));
    providers.push(() => callManuLLM(messages, options));
  } else if (preferred === "claude") {
    providers.push(() => callClaude(messages, options));
    providers.push(() => callOpenAI(messages, options));
    providers.push(() => callManuLLM(messages, options));
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(
        `[AI Service] 尝试调用 AI 提供商: ${provider.name || "unknown"}`
      );
      return await provider();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[AI Service] AI 提供商失败，尝试下一个:`,
        lastError.message
      );
    }
  }

  throw (
    lastError ||
    new Error("所有 AI 提供商都失败了")
  );
}

/**
 * 获取可用的 AI 提供商列表
 */
export function getAvailableProviders(): string[] {
  const providers = ["manus"];

  if (process.env.OPENAI_API_KEY) {
    providers.push("openai");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push("claude");
  }

  return providers;
}
