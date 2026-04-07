/**
 * Ollama LLM 集成服务
 * 支持本地部署的开源 LLM 模型（Qwen、LLaMA 等）
 * 完全独立，不依赖 Manus 内置模型
 */

import axios, { AxiosInstance } from "axios";

interface OllamaConfig {
  baseUrl: string; // Ollama 服务地址，例如 http://localhost:11434
  model: string; // 模型名称，例如 qwen2.5:14b
  temperature?: number;
  topP?: number;
  topK?: number;
}

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

interface StreamingOllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

class OllamaService {
  private config: OllamaConfig;
  private client: AxiosInstance;

  constructor(config: OllamaConfig) {
    this.config = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 300000, // 5 分钟超时
    });
  }

  /**
   * 检查 Ollama 服务是否可用
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/api/tags");
      return response.status === 200;
    } catch (error) {
      console.error("[Ollama] Health check failed:", error);
      return false;
    }
  }

  /**
   * 获取可用的模型列表
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get("/api/tags");
      const models = response.data.models || [];
      return models.map((m: any) => m.name);
    } catch (error) {
      console.error("[Ollama] Failed to list models:", error);
      return [];
    }
  }

  /**
   * 拉取模型（如果本地没有）
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      await this.client.post("/api/pull", { name: modelName });
      return true;
    } catch (error) {
      console.error("[Ollama] Failed to pull model:", error);
      return false;
    }
  }

  /**
   * 调用 Ollama 生成响应（非流式）
   */
  async generate(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await this.client.post<OllamaResponse>(
        "/api/chat",
        {
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            top_k: this.config.topK,
          },
        }
      );

      return response.data.message.content;
    } catch (error) {
      console.error("[Ollama] Generation failed:", error);
      throw new Error("Failed to generate response from Ollama");
    }
  }

  /**
   * 流式调用 Ollama 生成响应
   */
  async *generateStream(
    messages: OllamaMessage[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this.client.post(
        "/api/chat",
        {
          model: this.config.model,
          messages,
          stream: true,
          options: {
            temperature: this.config.temperature,
            top_p: this.config.topP,
            top_k: this.config.topK,
          },
        },
        {
          responseType: "stream",
        }
      );

      for await (const chunk of response.data) {
        try {
          const line = chunk.toString().trim();
          if (line) {
            const data = JSON.parse(line) as StreamingOllamaResponse;
            if (data.message?.content) {
              yield data.message.content;
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    } catch (error) {
      console.error("[Ollama] Streaming generation failed:", error);
      throw new Error("Failed to stream response from Ollama");
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<OllamaConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }
}

// 创建全局 Ollama 服务实例
let ollamaService: OllamaService | null = null;

/**
 * 初始化 Ollama 服务
 */
export function initializeOllama(config: OllamaConfig): OllamaService {
  ollamaService = new OllamaService(config);
  return ollamaService;
}

/**
 * 获取 Ollama 服务实例
 */
export function getOllamaService(): OllamaService {
  if (!ollamaService) {
    // 使用默认配置
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "qwen2.5:14b";

    ollamaService = new OllamaService({
      baseUrl,
      model,
    });
  }
  return ollamaService;
}

/**
 * 便捷函数：直接调用 Ollama
 */
export async function callOllama(messages: OllamaMessage[]): Promise<string> {
  const service = getOllamaService();
  return service.generate(messages);
}

/**
 * 便捷函数：流式调用 Ollama
 */
export async function* streamOllama(
  messages: OllamaMessage[]
): AsyncGenerator<string, void, unknown> {
  const service = getOllamaService();
  yield* service.generateStream(messages);
}

/**
 * 便捷函数：检查 Ollama 健康状态
 */
export async function checkOllamaHealth(): Promise<boolean> {
  const service = getOllamaService();
  return service.healthCheck();
}

export { OllamaService, OllamaMessage, OllamaConfig };
