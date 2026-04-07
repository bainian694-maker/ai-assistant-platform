import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Globe, Zap, Copy, Check } from "lucide-react";

interface VpnPageProps {
  onBack: () => void;
}

export default function VpnPage({ onBack }: VpnPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const vpnNodes = [
    {
      id: "us-1",
      name: "美国 - 纽约",
      region: "North America",
      speed: "1000 Mbps",
      ping: "45 ms",
      status: "online",
      users: 2543,
      load: 65,
    },
    {
      id: "sg-1",
      name: "新加坡",
      region: "Asia",
      speed: "950 Mbps",
      ping: "38 ms",
      status: "online",
      users: 1892,
      load: 52,
    },
    {
      id: "uk-1",
      name: "英国 - 伦敦",
      region: "Europe",
      speed: "980 Mbps",
      ping: "52 ms",
      status: "online",
      users: 3124,
      load: 78,
    },
    {
      id: "jp-1",
      name: "日本 - 东京",
      region: "Asia",
      speed: "920 Mbps",
      ping: "42 ms",
      status: "online",
      users: 1654,
      load: 48,
    },
    {
      id: "au-1",
      name: "澳大利亚 - 悉尼",
      region: "Oceania",
      speed: "850 Mbps",
      ping: "65 ms",
      status: "online",
      users: 987,
      load: 35,
    },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        <h1 className="text-xl font-bold">全域网 VPN</h1>
      </div>

      {/* VPN 节点列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {vpnNodes.map((node) => (
          <Card key={node.id} className="p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{node.name}</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    在线
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">速度</p>
                    <p className="font-medium text-gray-900">{node.speed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">延迟</p>
                    <p className="font-medium text-gray-900">{node.ping}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">用户</p>
                    <p className="font-medium text-gray-900">{node.users}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">负载</p>
                    <p className="font-medium text-gray-900">{node.load}%</p>
                  </div>
                </div>

                {/* 负载条 */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      node.load < 50
                        ? "bg-green-500"
                        : node.load < 75
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${node.load}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleCopy(node.id, node.id)}
                >
                  {copiedId === node.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Zap className="w-4 h-4" />
                  连接
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="border-t p-4 bg-blue-50">
        <p className="text-sm text-blue-900">
          💡 选择负载最低的节点可获得最佳速度。VIP 用户可享受优先连接。
        </p>
      </div>
    </div>
  );
}
