import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  saveFileRecord,
  getUserFileRecords,
  saveImageGeneration,
  getUserImageGenerations,
  saveCodeExecution,
  getUserCodeExecutions,
  addConversationFavorite,
  getUserFavorites,
  saveApiKeyConfig,
  getUserApiKeyConfigs,
  getActiveApiKey,
  saveUserToolPreference,
  getUserToolPreferences,
} from "./db-extended";

export const extendedRouter = router({
  // 文件处理相关
  files: router({
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          fileUrl: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const result = await saveFileRecord({
          userId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileUrl: input.fileUrl,
          status: "uploaded",
        });

        return { success: !!result };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const files = await getUserFileRecords(userId);
      return files;
    }),
  }),

  // 图片生成相关
  images: router({
    generate: protectedProcedure
      .input(
        z.object({
          prompt: z.string(),
          model: z.string().default("dall-e-3"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        // 这里应调用真实的图片生成 API（DALL-E、Stable Diffusion 等）
        const mockImageUrl = `https://via.placeholder.com/512?text=${encodeURIComponent(input.prompt)}`;

        const result = await saveImageGeneration({
          userId,
          prompt: input.prompt,
          imageUrl: mockImageUrl,
          model: input.model,
        });

        return {
          success: !!result,
          imageUrl: mockImageUrl,
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const images = await getUserImageGenerations(userId);
      return images;
    }),
  }),

  // 代码执行相关
  code: router({
    execute: protectedProcedure
      .input(
        z.object({
          language: z.string(),
          code: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        // 这里应调用真实的代码执行服务（Judge0、Piston 等）
        const mockResult = `执行结果：代码已执行\n语言: ${input.language}\n代码行数: ${input.code.split("\n").length}`;

        const result = await saveCodeExecution({
          userId,
          language: input.language,
          code: input.code,
          result: mockResult,
          executionTime: 100,
        });

        return {
          success: !!result,
          result: mockResult,
        };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const executions = await getUserCodeExecutions(userId);
      return executions;
    }),
  }),

  // 对话收藏相关
  favorites: router({
    add: protectedProcedure
      .input(
        z.object({
          chatMessageId: z.number(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const result = await addConversationFavorite({
          userId,
          chatMessageId: input.chatMessageId,
          title: input.title,
        });

        return { success: !!result };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const favorites = await getUserFavorites(userId);
      return favorites;
    }),
  }),

  // API 密钥管理
  apiKeys: router({
    save: protectedProcedure
      .input(
        z.object({
          provider: z.string(),
          apiKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const result = await saveApiKeyConfig({
          userId,
          provider: input.provider,
          apiKey: input.apiKey,
          isActive: true,
        });

        return { success: !!result };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const configs = await getUserApiKeyConfigs(userId);
      // 不返回实际的 API 密钥，只返回提供商信息
      return configs.map((c) => ({
        id: c.id,
        provider: c.provider,
        isActive: c.isActive,
      }));
    }),
  }),

  // 工具偏好管理
  toolPreferences: router({
    save: protectedProcedure
      .input(
        z.object({
          tool: z.string(),
          isEnabled: z.boolean(),
          settings: z.any().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const result = await saveUserToolPreference({
          userId,
          tool: input.tool,
          isEnabled: input.isEnabled,
          settings: input.settings,
        });

        return { success: !!result };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const preferences = await getUserToolPreferences(userId);
      return preferences;
    }),
  }),
});

export type ExtendedRouter = typeof extendedRouter;

// 合并扩展路由到主路由
export function mergeExtendedRouter(mainRouter: any) {
  return {
    ...mainRouter,
    files: extendedRouter.files,
    images: extendedRouter.images,
    code: extendedRouter.code,
    favorites: extendedRouter.favorites,
    apiKeys: extendedRouter.apiKeys,
    toolPreferences: extendedRouter.toolPreferences,
  };
}
