# AI Assistant Platform - 一键部署指南

## 快速部署到 Railway

点击下方按钮即可一键部署到 Railway：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?templateUrl=https%3A%2F%2Fgithub.com%2Fbainian694-maker%2Fai-assistant-platform)

## 部署步骤

1. **点击上方按钮** - 跳转到 Railway 部署页面
2. **授权 GitHub** - 允许 Railway 访问你的 GitHub 账号
3. **配置环境变量** - 填入必要的配置信息
4. **点击 Deploy** - 自动构建并部署应用
5. **获取访问地址** - 部署完成后获得公开网址

## 环境变量配置

部署时需要配置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_OAUTH_PORTAL_URL` | OAuth 门户 URL | `https://auth.manus.im` |
| `VITE_APP_ID` | 应用 ID | `ai-assistant-platform` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` |
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@host/db` |
| `OAUTH_SERVER_URL` | OAuth 服务器 URL | `https://auth.manus.im` |
| `OWNER_OPEN_ID` | 所有者 OpenID | `admin` |
| `BUILT_IN_FORGE_API_URL` | Forge API 地址 | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Forge API 密钥 | `your-api-key` |

## 项目特性

- **全栈应用** - React 前端 + Express 后端
- **实时通讯** - 基于 tRPC 的高效 API
- **数据库支持** - Drizzle ORM + MySQL
- **OAuth 认证** - 安全的用户认证
- **响应式设计** - 支持所有设备

## 部署后的安全性

- 所有环境变量都通过 Railway 的安全系统管理
- 支持自动 HTTPS 加密
- 支持环境隔离和访问控制
- 支持自动备份和恢复

## 获取帮助

如有问题，请查看 Railway 文档：https://docs.railway.app
