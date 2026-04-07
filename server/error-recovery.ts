/**
 * 错误恢复和故障转移系统
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // 毫秒
  maxDelay: number;
  backoffMultiplier: number;
}

export interface FallbackConfig {
  providers: string[];
  skipOnError: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * 带重试的函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = finalConfig.initialDelay;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[ErrorRecovery] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed:`,
        lastError.message
      );

      if (attempt < finalConfig.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * 带故障转移的函数执行
 */
export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>,
  config: Partial<FallbackConfig> = {}
): Promise<T> {
  const finalConfig = {
    providers: ["primary", ...fallbackFns.map((_, i) => `fallback_${i + 1}`)],
    skipOnError: true,
    ...config,
  };

  // 尝试主函数
  try {
    console.log("[ErrorRecovery] Trying primary function");
    return await primaryFn();
  } catch (error) {
    console.warn("[ErrorRecovery] Primary function failed:", (error as Error).message);
    if (!finalConfig.skipOnError) {
      throw error;
    }
  }

  // 尝试备选函数
  for (let i = 0; i < fallbackFns.length; i++) {
    try {
      console.log(`[ErrorRecovery] Trying fallback ${i + 1}`);
      return await fallbackFns[i]();
    } catch (error) {
      console.warn(
        `[ErrorRecovery] Fallback ${i + 1} failed:`,
        (error as Error).message
      );
      if (i === fallbackFns.length - 1) {
        throw error;
      }
    }
  }

  throw new Error("All fallback functions failed");
}

/**
 * 带超时的函数执行
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * 带熔断器的函数执行
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private lastFailureTime: number | null = null;

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private timeout: number = 60000 // 1 分钟
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 检查熔断器状态
    if (this.state === "open") {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        console.log("[CircuitBreaker] Transitioning to half-open state");
        this.state = "half-open";
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();

      // 成功处理
      if (this.state === "half-open") {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          console.log("[CircuitBreaker] Transitioning to closed state");
          this.state = "closed";
          this.failureCount = 0;
          this.successCount = 0;
        }
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      // 失败处理
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        console.log("[CircuitBreaker] Transitioning to open state");
        this.state = "open";
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * 错误分类
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  TIMEOUT = "TIMEOUT",
  RATE_LIMIT = "RATE_LIMIT",
  AUTH = "AUTH",
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * 错误分类器
 */
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes("timeout")) {
    return ErrorType.TIMEOUT;
  }
  if (message.includes("network") || message.includes("econnrefused")) {
    return ErrorType.NETWORK;
  }
  if (message.includes("rate limit") || message.includes("429")) {
    return ErrorType.RATE_LIMIT;
  }
  if (message.includes("unauthorized") || message.includes("401")) {
    return ErrorType.AUTH;
  }
  if (message.includes("not found") || message.includes("404")) {
    return ErrorType.NOT_FOUND;
  }
  if (message.includes("500") || message.includes("server error")) {
    return ErrorType.SERVER_ERROR;
  }

  return ErrorType.UNKNOWN;
}

/**
 * 是否应该重试
 */
export function shouldRetry(error: Error): boolean {
  const errorType = classifyError(error);
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT,
    ErrorType.SERVER_ERROR,
  ].includes(errorType);
}

/**
 * 获取建议的重试延迟
 */
export function getRetryDelay(
  attempt: number,
  errorType: ErrorType,
  baseDelay: number = 1000
): number {
  // 对于速率限制，使用更长的延迟
  if (errorType === ErrorType.RATE_LIMIT) {
    return baseDelay * Math.pow(2, attempt) * (1 + Math.random());
  }

  // 对于其他错误，使用指数退避
  return baseDelay * Math.pow(2, attempt);
}
