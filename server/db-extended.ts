import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  fileRecords,
  InsertFileRecord,
  imageGenerations,
  InsertImageGeneration,
  codeExecutions,
  InsertCodeExecution,
  conversationFavorites,
  InsertConversationFavorite,
  apiKeyConfigs,
  InsertApiKeyConfig,
  userToolPreferences,
  InsertUserToolPreference,
} from "../drizzle/schema";

// 文件相关操作
export async function saveFileRecord(record: InsertFileRecord) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(fileRecords).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save file record:", error);
    return null;
  }
}

export async function getUserFileRecords(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(fileRecords)
      .where(eq(fileRecords.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get file records:", error);
    return [];
  }
}

// 图片生成相关操作
export async function saveImageGeneration(record: InsertImageGeneration) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(imageGenerations).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save image generation:", error);
    return null;
  }
}

export async function getUserImageGenerations(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(imageGenerations)
      .where(eq(imageGenerations.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get image generations:", error);
    return [];
  }
}

// 代码执行相关操作
export async function saveCodeExecution(record: InsertCodeExecution) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(codeExecutions).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save code execution:", error);
    return null;
  }
}

export async function getUserCodeExecutions(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(codeExecutions)
      .where(eq(codeExecutions.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get code executions:", error);
    return [];
  }
}

// 对话收藏相关操作
export async function addConversationFavorite(record: InsertConversationFavorite) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(conversationFavorites).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    return null;
  }
}

export async function getUserFavorites(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(conversationFavorites)
      .where(eq(conversationFavorites.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get favorites:", error);
    return [];
  }
}

// API 密钥相关操作
export async function saveApiKeyConfig(record: InsertApiKeyConfig) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(apiKeyConfigs).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save API key config:", error);
    return null;
  }
}

export async function getUserApiKeyConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(apiKeyConfigs)
      .where(eq(apiKeyConfigs.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get API key configs:", error);
    return [];
  }
}

export async function getActiveApiKey(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const allConfigs = await db.select().from(apiKeyConfigs);
    const config = allConfigs.find(
      (c) => c.userId === userId && c.provider === provider && c.isActive
    );
    return config || null;
  } catch (error) {
    console.error("[Database] Failed to get active API key:", error);
    return null;
  }
}

// 用户工具偏好相关操作
export async function saveUserToolPreference(record: InsertUserToolPreference) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(userToolPreferences).values(record);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save tool preference:", error);
    return null;
  }
}

export async function getUserToolPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(userToolPreferences)
      .where(eq(userToolPreferences.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get tool preferences:", error);
    return [];
  }
}
