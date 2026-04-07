import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Image, Code, BarChart3 } from "lucide-react";

interface ToolsPageProps {
  onBack: () => void;
}

export default function ToolsPage({ onBack }: ToolsPageProps) {
  const [activeTab, setActiveTab] = useState<string>("file");

  const tools = [
    {
      id: "file",
      name: "文件处理",
      icon: Upload,
      description: "上传和处理 PDF、Word、Excel 等文件",
      features: ["PDF 解析", "文档转换", "内容提取"],
    },
    {
      id: "image",
      name: "图片生成",
      icon: Image,
      description: "使用 AI 生成高质量图片",
      features: ["文本生成图片", "图片编辑", "批量生成"],
    },
    {
      id: "code",
      name: "代码执行",
      icon: Code,
      description: "执行 Python、JavaScript 等代码",
      features: ["代码编辑", "实时执行", "结果展示"],
    },
    {
      id: "data",
      name: "数据分析",
      icon: BarChart3,
      description: "分析数据并生成可视化报告",
      features: ["数据导入", "图表生成", "报告输出"],
    },
  ];

  const selectedTool = tools.find((t) => t.id === activeTab);

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
        <h1 className="text-xl font-bold">工具箱</h1>
      </div>

      {/* 工具列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = activeTab === tool.id;

          return (
            <Card
              key={tool.id}
              className={`p-4 cursor-pointer transition ${
                isActive
                  ? "bg-blue-50 border-blue-300"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setActiveTab(tool.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 ${
                      isActive ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 工具详情和操作 */}
      {selectedTool && (
        <div className="border-t p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">{selectedTool.name}</h2>

          {selectedTool.id === "file" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  点击或拖拽文件到此处上传
                </p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                选择文件
              </Button>
            </div>
          )}

          {selectedTool.id === "image" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="输入图片描述..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                生成图片
              </Button>
            </div>
          )}

          {selectedTool.id === "code" && (
            <div className="space-y-3">
              <select className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Python</option>
                <option>JavaScript</option>
                <option>Shell</option>
              </select>
              <textarea
                placeholder="输入代码..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm h-24"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                执行代码
              </Button>
            </div>
          )}

          {selectedTool.id === "data" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  上传 CSV 或 Excel 文件进行分析
                </p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                选择数据文件
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
