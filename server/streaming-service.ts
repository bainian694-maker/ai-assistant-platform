import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { chatMessages, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface StreamingContext {
  userId: number;
  sessionId: string;
  messageHistory: Array<{ role: string; content: string }>;
}

interface StreamingResponse {
  stream: AsyncGenerator<string, void, unknown>;
  messageId: string;
}

/**
 * 获取用户的对话历史（最近 20 条消息）
 */
export async function getConversationHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    console.error("[Streaming] Failed to get conversation history:", error);
    return [];
  }
}

/**
 * 保存消息到数据库
 */
export async function saveMessage(
  userId: number,
  role: "user" | "ai",
  content: string,
  sessionId: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(chatMessages).values({
      role,
      content,
      sessionId,
      createdAt: new Date(),
    } as any);

    return result;
  } catch (error) {
    console.error("[Streaming] Failed to save message:", error);
    return null;
  }
}

/**
 * 流式生成 AI 响应
 * 返回一个异步生成器，逐字节流式返回 AI 响应
 */
export async function* streamAiResponse(
  prompt: string,
  context: StreamingContext
): AsyncGenerator<string, void, unknown> {
  try {
    // 构建消息历史
    const messages = [
      ...context.messageHistory,
      { role: "user", content: prompt },
    ];

    // 调用 LLM API
    const response = await invokeLLM({
      messages: messages as any,
    });

    // 获取响应内容
    let content = response.choices?.[0]?.message?.content || "";
    if (typeof content !== "string") {
      content = "";
    }

    // 流式返回响应，每 10 个字符返回一次
    const chunkSize = 10;
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      yield chunk;

      // 模拟流式延迟
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error("[Streaming] Error generating response:", error);
    yield "抱歉，生成响应时出错。请稍后重试。";
  }
}

/**
 * 处理完整的对话流程（包括保存和流式响应）
 */
export async function handleConversationStream(
  userId: number,
  prompt: string,
  sessionId: string
): Promise<StreamingResponse> {
  // 保存用户消息
  await saveMessage(userId, "user", prompt, sessionId);

  // 获取对话历史
  const history = await getConversationHistory(userId);

  // 创建上下文
  const context: StreamingContext = {
    userId,
    sessionId,
    messageHistory: history,
  };

  // 生成响应流
  const stream = streamAiResponse(prompt, context);

  // 收集完整响应用于保存
  let fullResponse = "";
  const collectingStream = (async function* () {
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    // 保存 AI 响应
    await saveMessage(userId, "ai", fullResponse, sessionId);
  })();

  return {
    stream: collectingStream,
    messageId: `msg_${Date.now()}`,
  };
}

/**
 * 清除过期的会话（30 分钟未活动）
 */
export async function cleanupExpiredSessions(
  expiryMinutes = 30
) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const expiryTime = new Date(Date.now() - expiryMinutes * 60 * 1000);

    // 这里可以添加清理逻辑
    // 例如删除过期的会话记录

    return 0;
  } catch (error) {
    console.error("[Streaming] Failed to cleanup sessions:", error);
    return 0;
  }
}
