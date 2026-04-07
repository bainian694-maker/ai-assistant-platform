import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  handleConversationStream,
  getConversationHistory,
} from "./streaming-service";
import { nanoid } from "nanoid";

export const streamingRouter = router({
  /**
   * 流式发送消息并获取 AI 响应
   */
  sendMessageStream: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const sessionId = input.sessionId || nanoid();

      try {
        // 处理对话流
        const { stream, messageId } = await handleConversationStream(
          ctx.user.id,
          input.prompt,
          sessionId
        );

        // 返回流和会话 ID
        return {
          messageId,
          sessionId,
          stream: stream, // 这会被转换为 SSE
        };
      } catch (error) {
        console.error("[Streaming Router] Error:", error);
        throw new Error("Failed to process streaming message");
      }
    }),

  /**
   * 获取对话历史
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      try {
        const history = await getConversationHistory(
          ctx.user.id,
          input.limit
        );
        return history;
      } catch (error) {
        console.error("[Streaming Router] Error getting history:", error);
        return [];
      }
    }),

  /**
   * 清除对话历史
   */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    try {
      // 这里可以添加清除历史的逻辑
      return { success: true };
    } catch (error) {
      console.error("[Streaming Router] Error clearing history:", error);
      throw new Error("Failed to clear history");
    }
  }),
});
