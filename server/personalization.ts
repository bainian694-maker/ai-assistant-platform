/**
 * 用户反馈和个性化学习系统
 */

export interface UserFeedback {
  messageId: number;
  rating: number; // 1-5 星
  feedback: string;
  timestamp: Date;
  tags?: string[];
}

export interface UserPreferences {
  userId: number;
  preferredAI: string;
  taskTypePreferences: Record<string, string>; // 任务类型 -> 首选 AI
  responseLength: "short" | "medium" | "long";
  tone: "formal" | "casual" | "technical";
  language: string;
  enableStreaming: boolean;
  maxResponseTokens: number;
}

export interface AIPerformanceMetrics {
  aiName: string;
  totalRequests: number;
  averageRating: number;
  successRate: number;
  averageResponseTime: number;
  userSatisfaction: number;
}

/**
 * 个性化引擎
 */
export class PersonalizationEngine {
  private userPreferences: Map<number, UserPreferences> = new Map();
  private userFeedback: Map<number, UserFeedback[]> = new Map();
  private aiMetrics: Map<string, AIPerformanceMetrics> = new Map();

  /**
   * 初始化用户偏好
   */
  initializeUserPreferences(userId: number): UserPreferences {
    const preferences: UserPreferences = {
      userId,
      preferredAI: "claude",
      taskTypePreferences: {
        general: "claude",
        code: "gpt-4",
        creative: "claude",
        analysis: "gemini",
        vision: "gpt-4",
      },
      responseLength: "medium",
      tone: "casual",
      language: "zh-CN",
      enableStreaming: true,
      maxResponseTokens: 2048,
    };

    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  /**
   * 获取用户偏好
   */
  getUserPreferences(userId: number): UserPreferences {
    if (!this.userPreferences.has(userId)) {
      return this.initializeUserPreferences(userId);
    }
    return this.userPreferences.get(userId)!;
  }

  /**
   * 更新用户偏好
   */
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): void {
    const preferences = this.getUserPreferences(userId);
    Object.assign(preferences, updates);
    this.userPreferences.set(userId, preferences);
  }

  /**
   * 记录用户反馈
   */
  recordFeedback(userId: number, feedback: UserFeedback): void {
    if (!this.userFeedback.has(userId)) {
      this.userFeedback.set(userId, []);
    }

    this.userFeedback.get(userId)!.push(feedback);

    // 更新 AI 性能指标
    this.updateAIMetrics(userId, feedback);
  }

  /**
   * 获取用户反馈历史
   */
  getUserFeedbackHistory(userId: number, limit: number = 50): UserFeedback[] {
    const feedback = this.userFeedback.get(userId) || [];
    return feedback.slice(-limit);
  }

  /**
   * 根据反馈学习用户偏好
   */
  private updateAIMetrics(userId: number, feedback: UserFeedback): void {
    const preferences = this.getUserPreferences(userId);

    // 如果评分高，增加该 AI 的权重
    if (feedback.rating >= 4) {
      // 这里可以实现更复杂的学习算法
      console.log(
        `[Personalization] User ${userId} gave positive feedback (${feedback.rating} stars)`
      );
    }

    // 如果评分低，减少该 AI 的权重
    if (feedback.rating <= 2) {
      console.log(
        `[Personalization] User ${userId} gave negative feedback (${feedback.rating} stars)`
      );
    }
  }

  /**
   * 获取推荐的 AI
   */
  getRecommendedAI(userId: number, taskType: string = "general"): string {
    const preferences = this.getUserPreferences(userId);
    return preferences.taskTypePreferences[taskType] || preferences.preferredAI;
  }

  /**
   * 获取 AI 性能指标
   */
  getAIMetrics(aiName: string): AIPerformanceMetrics | null {
    return this.aiMetrics.get(aiName) || null;
  }

  /**
   * 更新 AI 性能指标
   */
  updateAIPerformanceMetrics(
    aiName: string,
    metrics: Partial<AIPerformanceMetrics>
  ): void {
    const existing = this.aiMetrics.get(aiName) || {
      aiName,
      totalRequests: 0,
      averageRating: 0,
      successRate: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
    };

    Object.assign(existing, metrics);
    this.aiMetrics.set(aiName, existing);
  }

  /**
   * 获取所有 AI 的排名
   */
  getRankedAIs(): AIPerformanceMetrics[] {
    return Array.from(this.aiMetrics.values())
      .sort((a, b) => {
        // 根据用户满意度和成功率排序
        const scoreA = a.userSatisfaction * 0.6 + a.successRate * 0.4;
        const scoreB = b.userSatisfaction * 0.6 + b.successRate * 0.4;
        return scoreB - scoreA;
      });
  }

  /**
   * 获取个性化的系统提示词
   */
  getPersonalizedSystemPrompt(userId: number): string {
    const preferences = this.getUserPreferences(userId);

    let prompt = "You are a helpful AI assistant.";

    // 根据用户偏好调整语气
    if (preferences.tone === "formal") {
      prompt += " Please maintain a formal and professional tone.";
    } else if (preferences.tone === "technical") {
      prompt += " Please provide technical and detailed explanations.";
    }

    // 根据用户偏好调整响应长度
    if (preferences.responseLength === "short") {
      prompt += " Keep responses concise and to the point.";
    } else if (preferences.responseLength === "long") {
      prompt += " Provide comprehensive and detailed responses.";
    }

    // 根据语言调整
    if (preferences.language !== "en") {
      prompt += ` Please respond in ${preferences.language}.`;
    }

    return prompt;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalUsers: number;
    totalFeedback: number;
    averageRating: number;
  } {
    let totalFeedback = 0;
    let totalRating = 0;

    this.userFeedback.forEach((feedbacks) => {
      totalFeedback += feedbacks.length;
      feedbacks.forEach((f) => {
        totalRating += f.rating;
      });
    });

    return {
      totalUsers: this.userPreferences.size,
      totalFeedback,
      averageRating: totalFeedback > 0 ? totalRating / totalFeedback : 0,
    };
  }
}

/**
 * 全局个性化引擎实例
 */
export const personalizationEngine = new PersonalizationEngine();
