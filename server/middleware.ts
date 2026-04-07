import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { TrpcContext } from "./_core/context";

/**
 * 全局错误处理中间件
 */
export function errorHandler(error: unknown): TRPCError {
  console.error("[Error Handler]", error);

  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: `Validation error: ${(error as z.ZodError).issues.map((e: any) => e.message).join(", ")}`,
    });
  }

  if (error instanceof Error) {
    // 数据库错误
    if (error.message.includes("FOREIGN KEY")) {
      return new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid reference: the related record does not exist",
      });
    }

    // 重复键错误
    if (error.message.includes("Duplicate entry")) {
      return new TRPCError({
        code: "CONFLICT",
        message: "This record already exists",
      });
    }

    // 超时错误
    if (error.message.includes("timeout")) {
      return new TRPCError({
        code: "TIMEOUT",
        message: "Request timeout, please try again",
      });
    }

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred",
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}

/**
 * 请求日志中间件
 */
export function createLoggingMiddleware() {
  return (opts: any) => {
    const start = Date.now();
    const path = opts.path;

    return opts.next().then(
      (result: any) => {
        const duration = Date.now() - start;
        console.log(`[${opts.type}] ${path} - ${duration}ms - success`);
        return result;
      },
      (error: any) => {
        const duration = Date.now() - start;
        console.error(`[${opts.type}] ${path} - ${duration}ms - error:`, error.message);
        throw error;
      }
    );
  };
}

/**
 * 速率限制中间件（简单实现）
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function createRateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  return (opts: any) => {
    const userId = String((opts.ctx as TrpcContext).user?.id || "anonymous");
    const now = Date.now();

    const record = requestCounts.get(userId);

    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS" as const,
          message: `Too many requests. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`,
        });
      }
      record.count++;
    } else {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
    }

    return opts.next();
  };
}

/**
 * 输入验证中间件
 */
export function validateInput(schema: z.ZodSchema) {
  return (opts: any) => {
    try {
      const validated = schema.parse(opts.input);
      opts.input = validated;
      return opts.next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = (error as z.ZodError).issues || [];
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation failed: ${issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
        });
      }
      throw error;
    }
  };
}

/**
 * 缓存中间件
 */
const cache = new Map<string, { data: any; expiry: number }>();

export function createCacheMiddleware(ttl: number = 300000) {
  return (opts: any) => {
    const key = `${opts.path}:${JSON.stringify(opts.input)}`;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      console.log(`[Cache] Hit for ${key}`);
      return Promise.resolve(cached.data);
    }

    return opts.next().then((data: any) => {
      cache.set(key, { data, expiry: Date.now() + ttl });
      console.log(`[Cache] Set for ${key}`);
      return data;
    });
  };
}

/**
 * 清理过期缓存
 */
export function cleanupCache() {
  const now = Date.now();
  let cleaned = 0;

  const keysToDelete: string[] = [];
  cache.forEach((value, key) => {
    if (now >= value.expiry) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => cache.delete(key));
  cleaned = keysToDelete.length;

  if (cleaned > 0) {
    console.log(`[Cache] Cleaned ${cleaned} expired entries`);
  }
}

// 定期清理缓存（每 5 分钟）
setInterval(cleanupCache, 5 * 60 * 1000);

/**
 * 验证 schema 集合
 */
export const schemas = {
  // 聊天相关
  chatMessage: z.object({
    prompt: z.string().min(1, "Prompt cannot be empty").max(10000, "Prompt is too long"),
  }),

  // VPN 相关
  vpnNode: z.object({
    nodeId: z.number().positive("Node ID must be positive"),
  }),

  // 用户相关
  userProfile: z.object({
    email: z.string().email("Invalid email").optional(),
    name: z.string().min(1).max(100).optional(),
    themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
  }),

  // 文件相关
  fileUpload: z.object({
    fileName: z.string().min(1).max(255),
    content: z.string().max(50 * 1024 * 1024, "File too large"), // 50MB limit
  }),

  // 图片生成
  imageGeneration: z.object({
    prompt: z.string().min(1).max(1000),
  }),

  // 代码执行
  codeExecution: z.object({
    code: z.string().min(1).max(100 * 1024), // 100KB limit
    language: z.enum(["python", "javascript", "java", "cpp", "go", "rust"]),
  }),
};
