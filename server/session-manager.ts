import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { chatMessages } from "../drizzle/schema";

/**
 * 会话消息接口
 */
export interface SessionMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * 会话上下文
 */
export interface SessionContext {
  userId: number;
  sessionId: string;
  messages: SessionMessage[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    totalTokens: number;
  };
}

/**
 * 会话管理器
 */
export class SessionManager {
  private sessions: Map<string, SessionContext> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟
  private readonly MAX_CONTEXT_MESSAGES = 20; // 最多保留 20 条消息

  /**
   * 创建新会话
   */
  async createSession(userId: number): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const context: SessionContext = {
      userId,
      sessionId,
      messages: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };

    this.sessions.set(sessionId, context);
    this.resetSessionTimeout(sessionId);

    return sessionId;
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): SessionContext | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.resetSessionTimeout(sessionId);
      return session;
    }
    return null;
  }

  /**
   * 添加消息到会话
   */
  async addMessage(
    sessionId: string,
    message: SessionMessage
  ): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 添加时间戳
    message.timestamp = new Date();

    // 保存到数据库
    await this.saveMessageToDb(session.userId, message);

    // 添加到内存
    session.messages.push(message);

    // 保持消息数量在限制内
    if (session.messages.length > this.MAX_CONTEXT_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    // 更新元数据
    session.metadata.updatedAt = new Date();
    session.metadata.messageCount++;
  }

  /**
   * 获取会话的上下文消息
   */
  getContextMessages(sessionId: string, limit: number = 10): SessionMessage[] {
    const session = this.getSession(sessionId);
    if (!session) {
      return [];
    }

    return session.messages.slice(-limit);
  }

  /**
   * 获取会话的完整消息历史
   */
  async getFullHistory(userId: number, limit: number = 50): Promise<SessionMessage[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy((t) => t.createdAt)
        .limit(limit);

      return messages.map((m) => ({
        id: m.id,
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
        timestamp: m.createdAt,
        metadata: { provider: m.aiModel },
      }));
    } catch (error) {
      console.error("[SessionManager] Error getting full history:", error);
      return [];
    }
  }

  /**
   * 清空会话
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * 清空所有会话
   */
  clearAllSessions(): void {
    this.sessionTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.sessions.clear();
    this.sessionTimeouts.clear();
  }

  /**
   * 重置会话超时
   */
  private resetSessionTimeout(sessionId: string): void {
    const existingTimeout = this.sessionTimeouts.get(sessionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      console.log(`[SessionManager] Session ${sessionId} expired`);
      this.clearSession(sessionId);
    }, this.SESSION_TIMEOUT);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * 保存消息到数据库
   */
  private async saveMessageToDb(userId: number, message: SessionMessage): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const role = message.role === "assistant" ? "ai" : "user";
      const aiModel = message.metadata?.provider || "claude";
      
      await db.insert(chatMessages).values({
        userId,
        role: role as "user" | "ai",
        content: message.content,
        aiModel,
      });
    } catch (error) {
      console.error("[SessionManager] Error saving message to DB:", error);
    }
  }

  /**
   * 获取会话统计
   */
  getStats(): {
    activeSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  } {
    let totalMessages = 0;
    this.sessions.forEach((session) => {
      totalMessages += session.messages.length;
    });

    return {
      activeSessions: this.sessions.size,
      totalMessages,
      averageMessagesPerSession:
        this.sessions.size > 0 ? totalMessages / this.sessions.size : 0,
    };
  }
}

// 全局会话管理器实例
export const sessionManager = new SessionManager();
