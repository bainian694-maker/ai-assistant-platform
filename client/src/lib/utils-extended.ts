/**
 * 格式化时间
 */
export function formatTime(date: Date | number): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  // 少于 1 分钟
  if (diff < 60000) {
    return "just now";
  }

  // 少于 1 小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // 少于 1 天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // 少于 7 天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // 显示日期
  return d.toLocaleDateString();
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 验证 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 高亮代码（简单实现）
 */
export function highlightCode(code: string, language: string): string {
  // 这是一个简单的实现，实际应该使用 highlight.js 或类似库
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 解析 Markdown（简单实现）
 */
export function parseMarkdown(text: string): string {
  return text
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // 斜体
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // 代码块
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 换行
    .replace(/\n/g, "<br>");
}

/**
 * 获取浏览器信息
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let version = "Unknown";

  if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
    version = ua.split("Chrome/")[1]?.split(" ")[0] || "Unknown";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
    version = ua.split("Version/")[1]?.split(" ")[0] || "Unknown";
  } else if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
    version = ua.split("Firefox/")[1] || "Unknown";
  }

  return { browser, version };
}

/**
 * 检查是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 获取本地存储值
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  } catch (error) {
    console.error(`Failed to get localStorage item ${key}:`, error);
    return defaultValue ?? null;
  }
}

/**
 * 设置本地存储值
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set localStorage item ${key}:`, error);
    return false;
  }
}

/**
 * 删除本地存储值
 */
export function removeLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage item ${key}:`, error);
    return false;
  }
}
