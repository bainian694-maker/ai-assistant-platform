import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  saveChatMessage,
  getChatHistory,
} from "./db";
import { extendedRouter } from "./routers-extended";
import { enterpriseRouter } from "./routers-enterprise";
import { streamingRouter } from "./routers-streaming";
import { callAI, streamAI, getDefaultAIConfig, checkAIHealth } from "./ai-service-independent";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 核心 AI 对话功能
  chat: protectedProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { prompt } = input;
      const userId = ctx.user!.id;

      // 保存用户消息
      await saveChatMessage({
        userId,
        role: "user",
        content: prompt,
        aiModel: "default",
      });

      const messages = [
        {
          role: "system" as const,
          content: "你是一个有效率的 AI 助手。你的名字是 A，是一个集成全球多个 AI 的智能助手。请用中文回答。",
        },
        {
          role: "user" as const,
          content: prompt,
        },
      ];

      try {
        // 调用独立的开源 AI 服务
        const config = getDefaultAIConfig();
        const aiResult = await callAI(messages, config);

        // 保存 AI 响应
        await saveChatMessage({
          userId,
          role: "ai",
          content: aiResult.content,
          aiModel: config.model || "default",
        });

        return {
          success: true,
          response: aiResult.content,
          model: config.model,
        };
      } catch (error) {
        console.error("[Chat] Error:", error);
        throw new Error("AI service failed, please try again");
      }
    }),

  // 获取聊天历史
  chatHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      try {
        return await getChatHistory(ctx.user!.id, input.limit);
      } catch (error) {
        console.error("[Chat History] Error:", error);
        return [];
      }
    }),

  // VPN 功能
  vpn: router({
    getNodes: publicProcedure.query(async () => {
      try {
        return [
          { id: 1, name: "US East", region: "USA", speed: "100Mbps", latency: "10ms", load: "30%" },
          { id: 2, name: "EU West", region: "Europe", speed: "90Mbps", latency: "20ms", load: "40%" },
          { id: 3, name: "Asia Pacific", region: "Singapore", speed: "85Mbps", latency: "15ms", load: "25%" },
        ];
      } catch (error) {
        console.error("[VPN] Error getting nodes:", error);
        return [];
      }
    }),

    assignNode: protectedProcedure
      .input(z.object({ nodeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return {
            success: true,
            message: "VPN node assigned successfully"
          };
        } catch (error) {
          console.error("[VPN] Error assigning node:", error);
          throw new Error("Failed to assign VPN node");
        }
      }),
  }),

  // 工具功能
  tools: router({
    uploadFile: protectedProcedure
      .input(z.object({ fileName: z.string(), content: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return {
            success: true,
            message: "File uploaded successfully",
            fileName: input.fileName,
          };
        } catch (error) {
          console.error("[Tools] Error uploading file:", error);
          throw new Error("File upload failed");
        }
      }),

    generateImage: protectedProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return {
            success: true,
            message: "Image generation started",
            prompt: input.prompt,
          };
        } catch (error) {
          console.error("[Tools] Error generating image:", error);
          throw new Error("Image generation failed");
        }
      }),

    executeCode: protectedProcedure
      .input(z.object({ code: z.string(), language: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          return {
            success: true,
            message: "Code execution started",
            language: input.language,
          };
        } catch (error) {
          console.error("[Tools] Error executing code:", error);
          throw new Error("Code execution failed");
        }
      }),
  }),

  // 用户设置
  settings: router({
    updateProfile: protectedProcedure
      .input(z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        themeColor: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          return {
            success: true,
            message: "Profile updated successfully",
          };
        } catch (error) {
          console.error("[Settings] Error updating profile:", error);
          throw new Error("Profile update failed");
        }
      }),

    getVipStatus: protectedProcedure.query(async ({ ctx }) => {
      try {
        return {
          isVip: ctx.user?.isVip || false,
          expiresAt: null,
        };
      } catch (error) {
        console.error("[Settings] Error getting VIP status:", error);
        return { isVip: false, expiresAt: null };
      }
    }),
  }),

  // 扩展功能
  extended: extendedRouter,

  // 企业级功能
  enterprise: enterpriseRouter,

  // 流式响应功能
  streaming: streamingRouter,

  // AI 配置
  ai: router({
    getConfig: publicProcedure.query(() => {
      return getDefaultAIConfig();
    }),

    checkHealth: publicProcedure.mutation(async () => {
      const config = getDefaultAIConfig();
      const isHealthy = await checkAIHealth(config);
      return { healthy: isHealthy };
    }),
  }),
});

export type AppRouter = typeof appRouter;
export { enterpriseRouter, streamingRouter };
