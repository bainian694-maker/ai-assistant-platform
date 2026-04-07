import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatMessages, InsertChatMessage, vpnNodes, vpnAssignments, vipSubscriptions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 聊天记录相关函数
export async function saveChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save chat message: database not available");
    return;
  }

  try {
    await db.insert(chatMessages).values(message);
  } catch (error) {
    console.error("[Database] Failed to save chat message:", error);
    throw error;
  }
}

export async function getChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get chat history: database not available");
    return [];
  }

  try {
    const result = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get chat history:", error);
    return [];
  }
}

// VPN 节点相关函数
export async function getAvailableVpnNodes() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get VPN nodes: database not available");
    return [];
  }

  try {
    const result = await db.select()
      .from(vpnNodes);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get VPN nodes:", error);
    return [];
  }
}

export async function claimVpnNode(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot claim VPN node: database not available");
    return null;
  }

  try {
    // 获取可用节点
    const allNodes = await db.select().from(vpnNodes);
    const availableNode = allNodes.find(n => n.currentUsers < n.maxUsers && n.status === 'online');

    if (!availableNode) {
      return null;
    }

    // 分配节点给用户
    await db.insert(vpnAssignments).values({
      userId,
      nodeId: availableNode.id,
    });

    // 更新节点用户数
    await db.update(vpnNodes)
      .set({ currentUsers: availableNode.currentUsers + 1 })
      .where(eq(vpnNodes.id, availableNode.id));

    return availableNode;
  } catch (error) {
    console.error("[Database] Failed to claim VPN node:", error);
    return null;
  }
}

// VIP 订阅相关函数
export async function getUserVipStatus(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get VIP status: database not available");
    return null;
  }

  try {
    const result = await db.select()
      .from(vipSubscriptions)
      .where(eq(vipSubscriptions.userId, userId))
      .limit(1);

    return result.length > 0 && result[0].status === 'active' ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get VIP status:", error);
    return null;
  }
}

export async function updateUserTheme(userId: number, themeColor: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user theme: database not available");
    return;
  }

  try {
    await db.update(users)
      .set({ themeColor })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user theme:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
