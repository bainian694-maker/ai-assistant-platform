import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { sessionManager } from "./session-manager";
import { personalizationEngine } from "./personalization";
import { callAI, selectOptimalProvider, getAvailableProviders } from "./ai-providers";
import { withRetry, withFallback, CircuitBreaker } from "./error-recovery";
import { responseCache, requestDeduplicator } from "./cache-manager";

/**
 * 企业级 AI 路由
 */
export const enterpriseRouter = router({
  /**
   * 创建新的 AI 会话
   */
  chat: router({
    createSession: protectedProcedure.mutation(async ({ ctx }) => {
      const sessionId = await sessionManager.createSession(ctx.user.id);
      return { sessionId, success: true };
    }),

    /**
     * 发送消息到 AI（带完整功能）
     */
    sendMessage: protectedProcedure
      .input(
        z.object({
          sessionId: z.string(),
          message: z.string(),
          taskType: z
            .enum(["general", "code", "creative", "analysis", "vision"])
            .optional(),
          provider: z.string().optional(),
          stream: z.boolean().optional().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = sessionManager.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        // 获取用户偏好
        const preferences = personalizationEngine.getUserPreferences(ctx.user.id);

        // 添加用户消息到会话
        await sessionManager.addMessage(input.sessionId, {
          role: "user",
          content: input.message,
        });

        // 获取上下文消息
        const contextMessages = sessionManager.getContextMessages(input.sessionId, 10);

        // 构建消息列表
        const messages = [
          {
            role: "system",
            content: personalizationEngine.getPersonalizedSystemPrompt(ctx.user.id),
          },
          ...contextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];

        // 选择最优 AI
        const selectedProvider = input.provider
          ? input.provider
          : personalizationEngine.getRecommendedAI(ctx.user.id, input.taskType);

        try {
          // 使用缓存和去重
          const cacheKey = `ai_response_${ctx.user.id}_${input.message.substring(0, 50)}`;
          let cachedResponse = responseCache.get(cacheKey);

          if (!cachedResponse) {
            // 调用 AI（带重试和故障转移）
            const response = await withRetry(
              async () => {
                return await callAI(messages, {
                  provider: selectedProvider,
                  taskType: input.taskType,
                });
              },
              { maxRetries: 2 }
            );

            cachedResponse = response;
            responseCache.set(cacheKey, response);
          }

          // 添加 AI 响应到会话
          await sessionManager.addMessage(input.sessionId, {
            role: "assistant",
            content: cachedResponse.content,
            metadata: {
              provider: cachedResponse.provider,
              model: cachedResponse.model,
              tokensUsed: cachedResponse.tokensUsed,
            },
          });

          return {
            success: true,
            content: cachedResponse.content,
            provider: cachedResponse.provider,
            model: cachedResponse.model,
            streamable: cachedResponse.streamable,
          };
        } catch (error) {
          console.error("[Enterprise Chat] Error:", error);
          throw error;
        }
      }),

    /**
     * 获取会话历史
     */
    getHistory: protectedProcedure
      .input(z.object({ sessionId: z.string(), limit: z.number().optional() }))
      .query(({ input, ctx }) => {
        const session = sessionManager.getSession(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        return sessionManager.getContextMessages(input.sessionId, input.limit || 50);
      }),

    /**
     * 获取完整历史
     */
    getFullHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return await sessionManager.getFullHistory(ctx.user.id, input.limit || 50);
      }),

    /**
     * 清空会话
     */
    clearSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        sessionManager.clearSession(input.sessionId);
        return { success: true };
      }),
  }),

  /**
   * 用户反馈和个性化
   */
  personalization: router({
    /**
     * 记录反馈
     */
    recordFeedback: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          rating: z.number().min(1).max(5),
          feedback: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        personalizationEngine.recordFeedback(ctx.user.id, {
          messageId: input.messageId,
          rating: input.rating,
          feedback: input.feedback || "",
          timestamp: new Date(),
          tags: input.tags,
        });

        return { success: true };
      }),

    /**
     * 获取用户偏好
     */
    getPreferences: protectedProcedure.query(({ ctx }) => {
      return personalizationEngine.getUserPreferences(ctx.user.id);
    }),

    /**
     * 更新用户偏好
     */
    updatePreferences: protectedProcedure
      .input(
        z.object({
          preferredAI: z.string().optional(),
          responseLength: z.enum(["short", "medium", "long"]).optional(),
          tone: z.enum(["formal", "casual", "technical"]).optional(),
          language: z.string().optional(),
          enableStreaming: z.boolean().optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        personalizationEngine.updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),

    /**
     * 获取推荐的 AI
     */
    getRecommendedAI: protectedProcedure
      .input(z.object({ taskType: z.string().optional() }))
      .query(({ input, ctx }) => {
        return {
          ai: personalizationEngine.getRecommendedAI(ctx.user.id, input.taskType),
        };
      }),
  }),

  /**
   * AI 提供商管理
   */
  aiProviders: router({
    /**
     * 获取可用的 AI 提供商
     */
    getAvailable: protectedProcedure.query(() => {
      return getAvailableProviders();
    }),

    /**
     * 获取 AI 排名
     */
    getRanked: protectedProcedure.query(() => {
      return personalizationEngine.getRankedAIs();
    }),
  }),

  /**
   * 系统统计
   */
  stats: router({
    /**
     * 获取会话统计
     */
    getSessionStats: protectedProcedure.query(() => {
      return sessionManager.getStats();
    }),

    /**
     * 获取个性化统计
     */
    getPersonalizationStats: protectedProcedure.query(() => {
      return personalizationEngine.getStats();
    }),
  }),
});

export type EnterpriseRouter = typeof enterpriseRouter;
