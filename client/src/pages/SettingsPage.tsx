import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, Crown, Palette, LogOut } from "lucide-react";

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export default function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<string>("account");
  const [email, setEmail] = useState("user@example.com");
  const [language, setLanguage] = useState("zh");
  const [theme, setTheme] = useState("light");
  const [isVip, setIsVip] = useState(false);
  const [vipExpiry, setVipExpiry] = useState("2025-12-31");

  const tabs = [
    { id: "account", name: "账户", icon: Mail },
    { id: "vip", name: "VIP", icon: Crown },
    { id: "appearance", name: "外观", icon: Palette },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center gap-4 p-4 border-b">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">设置</h1>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 p-4 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                isActive
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 账户设置 */}
        {activeTab === "account" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">邮箱绑定</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="输入邮箱地址"
                />
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  更新邮箱
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">语言设置</h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
            </Card>

            <Card className="p-4 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-900 mb-3">危险区域</h3>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </Card>
          </div>
        )}

        {/* VIP 设置 */}
        {activeTab === "vip" && (
          <div className="space-y-4">
            <Card className={`p-4 ${isVip ? "bg-yellow-50 border-yellow-300" : "bg-gray-50"}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    VIP 会员状态
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isVip ? `有效期至: ${vipExpiry}` : "您还不是 VIP 会员"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isVip
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {isVip ? "活跃" : "未激活"}
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">VIP 权益</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  无限制使用所有 AI 模型
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  优先级连接 VPN 节点
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  文件处理无大小限制
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  高级数据分析工具
                </li>
              </ul>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">升级 VIP</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  月度 ¥29
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  年度 ¥299
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 外观设置 */}
        {activeTab === "appearance" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">主题</h3>
              <div className="space-y-2">
                {["light", "dark", "auto"].map((themeOption) => (
                  <label key={themeOption} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={themeOption}
                      checked={theme === themeOption}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700 capitalize">
                      {themeOption === "light"
                        ? "浅色"
                        : themeOption === "dark"
                          ? "深色"
                          : "自动"}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">主题色</h3>
              <div className="grid grid-cols-5 gap-3">
                {["blue", "purple", "pink", "green", "orange"].map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-lg transition ${
                      color === "blue"
                        ? "ring-2 ring-offset-2 ring-gray-400"
                        : ""
                    }`}
                    style={{
                      backgroundColor: {
                        blue: "#3b82f6",
                        purple: "#a855f7",
                        pink: "#ec4899",
                        green: "#10b981",
                        orange: "#f97316",
                      }[color],
                    }}
                  />
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">通知设置</h3>
              <div className="space-y-3">
                {["消息通知", "AI 完成提醒", "系统更新"].map((item) => (
                  <label key={item} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <span className="text-gray-700">{item}</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
