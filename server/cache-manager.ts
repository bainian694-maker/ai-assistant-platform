/**
 * 缓存管理系统
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // 毫秒
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * 内存缓存管理器
 */
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private defaultTTL: number = 5 * 60 * 1000) {
    // 每分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      cleaned++;
    });

    if (cleaned > 0) {
      console.log(`[CacheManager] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * 请求去重缓存
 */
export class RequestDeduplicator<T> {
  private pending: Map<string, Promise<T>> = new Map();

  /**
   * 执行去重请求
   */
  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    // 如果已有相同的请求在进行中，返回现有的 Promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // 创建新的请求 Promise
    const promise = fn()
      .then((result) => {
        this.pending.delete(key);
        return result;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * 获取待处理请求数
   */
  getPendingCount(): number {
    return this.pending.size;
  }
}

/**
 * LRU 缓存（最近最少使用）
 */
export class LRUCache<T> {
  private cache: Map<string, T> = new Map();

  constructor(private maxSize: number = 100) {}

  /**
   * 获取值
   */
  get(key: string): T | null {
    if (!this.cache.has(key)) {
      return null;
    }

    // 移到最后（最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * 刐除最旧的项
   */
  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, value);

    // 如果超过最大大小，删除最旧的项
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 批处理队列
 */
export class BatchQueue<T, R> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private batchDelay: number = 100
  ) {}

  /**
   * 添加项到队列
   */
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      if (this.queue.length >= this.batchSize) {
        this.flush().catch(reject);
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush().catch(reject), this.batchDelay);
      }

      // 这里简化处理，实际应该使用更复杂的机制
      this.flush()
        .then((results) => {
          const index = this.queue.indexOf(item);
          if (index >= 0 && results[index]) {
            resolve(results[index]);
          }
        })
        .catch(reject);
    });
  }

  /**
   * 刷新队列
   */
  private async flush(): Promise<R[]> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return [];
    }

    const items = this.queue.splice(0, this.batchSize);
    return this.batchFn(items);
  }

  /**
   * 获取队列大小
   */
  size(): number {
    return this.queue.length;
  }
}

/**
 * 全局缓存实例
 */
export const responseCache = new CacheManager<any>(5 * 60 * 1000); // 5 分钟
export const requestDeduplicator = new RequestDeduplicator<any>();
export const aiResponseCache = new LRUCache<string>(1000); // 最多缓存 1000 个响应
