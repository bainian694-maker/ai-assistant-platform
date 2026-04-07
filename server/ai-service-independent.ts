/**
 * 独立的 AI 服务层
 * 支持多个开源 LLM 提供商（Ollama、vLLM 等）
 * 完全独立，不依赖 Manus
 */

import { callOllama, streamOllama, checkOllamaHealth } from "./ollama-service";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

type AIProvider = "ollama" | "vllm" | "local";

interface AIServiceConfig {
  provider: AIProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

/**
 * 调用 AI 服务
 */
export async function callAI(
  messages: AIMessage[],
  config: AIServiceConfig
): Promise<AIResponse> {
  const { provider, model } = config;

  try {
    let content: string;

    switch (provider) {
      case "ollama":
        content = await callOllama(messages);
        break;

      case "vllm":
        content = await callVLLM(messages, config);
        break;

      case "local":
        content = await callLocalLLM(messages, config);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return {
      content,
      model,
      provider,
    };
  } catch (error) {
    console.error(`[AI Service] Error calling ${provider}:`, error);
    throw error;
  }
}

/**
 * 流式调用 AI 服务
 */
export async function* streamAI(
  messages: AIMessage[],
  config: AIServiceConfig
): AsyncGenerator<string, void, unknown> {
  const { provider, model } = config;

  try {
    switch (provider) {
      case "ollama":
        yield* streamOllama(messages);
        break;

      case "vllm":
        yield* streamVLLM(messages, config);
        break;

      case "local":
        yield* streamLocalLLM(messages, config);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[AI Service] Error streaming from ${provider}:`, error);
    throw error;
  }
}

/**
 * 调用 vLLM 服务
 */
async function callVLLM(
  messages: AIMessage[],
  config: AIServiceConfig
): Promise<string> {
  const baseUrl = config.baseUrl || "http://localhost:8000";
  const model = config.model;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[vLLM] Error:", error);
    throw error;
  }
}

/**
 * 流式调用 vLLM 服务
 */
async function* streamVLLM(
  messages: AIMessage[],
  config: AIServiceConfig
): AsyncGenerator<string, void, unknown> {
  const baseUrl = config.baseUrl || "http://localhost:8000";
  const model = config.model;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || "";
            if (content) yield content;
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    console.error("[vLLM Stream] Error:", error);
    throw error;
  }
}

/**
 * 调用本地 LLM（使用 Hugging Face Transformers）
 */
async function callLocalLLM(
  messages: AIMessage[],
  config: AIServiceConfig
): Promise<string> {
  // 这里可以集成 Hugging Face transformers 或其他本地推理库
  // 目前作为占位符
  throw new Error("Local LLM inference not yet implemented");
}

/**
 * 流式调用本地 LLM
 */
async function* streamLocalLLM(
  messages: AIMessage[],
  config: AIServiceConfig
): AsyncGenerator<string, void, unknown> {
  // 这里可以集成 Hugging Face transformers 或其他本地推理库
  // 目前作为占位符
  throw new Error("Local LLM streaming not yet implemented");
}

/**
 * 检查 AI 服务健康状态
 */
export async function checkAIHealth(
  config: AIServiceConfig
): Promise<boolean> {
  const { provider } = config;

  try {
    switch (provider) {
      case "ollama":
        return await checkOllamaHealth();

      case "vllm":
        const baseUrl = config.baseUrl || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/health`);
        return response.ok;

      case "local":
        return true; // 本地推理总是可用

      default:
        return false;
    }
  } catch (error) {
    console.error(`[AI Service] Health check failed for ${provider}:`, error);
    return false;
  }
}

/**
 * 获取默认 AI 配置
 */
export function getDefaultAIConfig(): AIServiceConfig {
  return {
    provider: "ollama",
    model: process.env.OLLAMA_MODEL || "qwen2.5:14b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  };
}

export { AIMessage, AIResponse, AIProvider, AIServiceConfig };
