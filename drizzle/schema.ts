import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isVip: boolean("isVip").default(false).notNull(),
  themeColor: varchar("themeColor", { length: 7 }).default("#2563eb").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 聊天记录表
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "ai"]).notNull(),
  content: text("content").notNull(),
  aiModel: varchar("aiModel", { length: 64 }).default("claude").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// VPN 节点表
export const vpnNodes = mysqlTable("vpn_nodes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  region: varchar("region", { length: 64 }).notNull(),
  configUrl: text("configUrl").notNull(),
  maxUsers: int("maxUsers").default(3).notNull(),
  currentUsers: int("currentUsers").default(0).notNull(),
  status: mysqlEnum("status", ["online", "offline", "full"]).default("online").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VpnNode = typeof vpnNodes.$inferSelect;
export type InsertVpnNode = typeof vpnNodes.$inferInsert;

// VPN 用户分配表
export const vpnAssignments = mysqlTable("vpn_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nodeId: int("nodeId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type VpnAssignment = typeof vpnAssignments.$inferSelect;
export type InsertVpnAssignment = typeof vpnAssignments.$inferInsert;

// VIP 订阅表
export const vipSubscriptions = mysqlTable("vip_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["monthly", "yearly"]).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VipSubscription = typeof vipSubscriptions.$inferSelect;
export type InsertVipSubscription = typeof vipSubscriptions.$inferInsert;

// 文件记录表
export const fileRecords = mysqlTable("file_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 64 }).notNull(),
  fileSize: int("fileSize").notNull(),
  fileUrl: text("fileUrl").notNull(),
  status: mysqlEnum("status", ["uploaded", "processing", "completed", "failed"]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileRecord = typeof fileRecords.$inferSelect;
export type InsertFileRecord = typeof fileRecords.$inferInsert;

// 图片生成记录表
export const imageGenerations = mysqlTable("image_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("imageUrl").notNull(),
  model: varchar("model", { length: 64 }).default("dall-e-3").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type InsertImageGeneration = typeof imageGenerations.$inferInsert;

// 代码执行记录表
export const codeExecutions = mysqlTable("code_executions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  code: text("code").notNull(),
  result: text("result"),
  error: text("error"),
  executionTime: int("executionTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodeExecution = typeof codeExecutions.$inferSelect;
export type InsertCodeExecution = typeof codeExecutions.$inferInsert;

// 对话收藏表
export const conversationFavorites = mysqlTable("conversation_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chatMessageId: int("chatMessageId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationFavorite = typeof conversationFavorites.$inferSelect;
export type InsertConversationFavorite = typeof conversationFavorites.$inferInsert;

// API 密钥配置表
export const apiKeyConfigs = mysqlTable("api_key_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  apiKey: text("apiKey").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKeyConfig = typeof apiKeyConfigs.$inferSelect;
export type InsertApiKeyConfig = typeof apiKeyConfigs.$inferInsert;

// 用户工具偏好表
export const userToolPreferences = mysqlTable("user_tool_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tool: varchar("tool", { length: 64 }).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  settings: json("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserToolPreference = typeof userToolPreferences.$inferSelect;
export type InsertUserToolPreference = typeof userToolPreferences.$inferInsert;

// 文档表（用于 RAG 知识库）
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  fileType: varchar("fileType", { length: 32 }).notNull(),
  fileSize: int("fileSize").notNull(),
  storageUrl: text("storageUrl"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// 文档分块表（用于向量检索）
export const documentChunks = mysqlTable("document_chunks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  documentId: varchar("documentId", { length: 64 }).notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // JSON 格式的向量
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;
