import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MessageSquare, Globe, Settings, Send, LogOut, Wrench } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import ToolsPageNew from "./ToolsPage";
import VpnPage from "./VpnPage";
import SettingsPage from "./SettingsPage";

// AI 对话界面组件
const ChatInterface = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const sendMessageMutation = trpc.chat.useMutation();
  const historyQuery = trpc.chatHistory.useQuery({ limit: 20 });
  const isLoading = sendMessageMutation.isPending || historyQuery.isLoading;
  const [messages, setMessages] = useState([
    { role: "ai", content: "我是 A，已集成全球 AI 算力。请输入指令。" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setMessages(historyQuery.data.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })));
    }
  }, [historyQuery.data]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await sendMessageMutation.mutateAsync({ prompt: input });
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: response.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "抱歉，请求失败。请稍后重试。",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex gap-2 mb-16 md:mb-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="输入指令..."
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* 侧边栏导航（PC 端） */}
      <nav className="hidden md:flex flex-col w-20 bg-gray-50 border-r items-center py-4 gap-4 fixed left-0 top-0 bottom-0">
        <button
          onClick={() => onNavigate("chat")}
          className="p-3 rounded-lg text-blue-600 bg-blue-100 transition"
          title="智能 A"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        <button
          onClick={() => onNavigate("tools")}
          className="p-3 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
          title="工具"
        >
          <Wrench className="w-6 h-6" />
        </button>
        <button
          onClick={() => onNavigate("vpn")}
          className="p-3 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
          title="全域网"
        >
          <Globe className="w-6 h-6" />
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="p-3 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition"
          title="设置"
        >
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      {/* 移动端底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t flex justify-around">
        <button
          onClick={() => onNavigate("chat")}
          className="flex-1 py-3 text-center text-blue-600 transition"
        >
          <MessageSquare className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={() => onNavigate("tools")}
          className="flex-1 py-3 text-center text-gray-600 hover:text-blue-600 transition"
        >
          <Wrench className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={() => onNavigate("vpn")}
          className="flex-1 py-3 text-center text-gray-600 hover:text-blue-600 transition"
        >
          <Globe className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="flex-1 py-3 text-center text-gray-600 hover:text-blue-600 transition"
        >
          <Settings className="w-5 h-5 mx-auto" />
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("chat");

  // 处理页面导航
  if (currentPage === "tools") {
    return <ToolsPageNew onBack={() => setCurrentPage("chat")} />;
  }

  if (currentPage === "vpn") {
    return <VpnPage onBack={() => setCurrentPage("chat")} />;
  }

  if (currentPage === "settings") {
    return (
      <SettingsPage
        onBack={() => setCurrentPage("chat")}
        onLogout={() => {
          // 处理登出逻辑
          setCurrentPage("chat");
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-white md:pl-20">
      <ChatInterface onNavigate={setCurrentPage} />
    </div>
  );
}
