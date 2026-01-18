# HubNavigator 🧭

HubNavigator 是一个基于 GitHub Issues 和 Actions 的自动化导航站系统。它利用现代化的自动化工作流，将 GitHub Issues 转化为一个动态、易于维护的导航网站。

![License](https://img.shields.io/github/license/ACG-Q/hubNavigator)
![Status](https://img.shields.io/github/deployments/ACG-Q/hubNavigator/github-pages?label=deploy)

## ✨ 核心特性

- **基于 Issue 的管理**：通过提交 Issue 来添加站点、修正信息或申请分类。无需手动修改代码。
- **ChatOps 自动化**：管理员可以通过评论 `/approve`, `/close`, `/label` 等指令直接管理站点，体验行云流水。
- **自动健康检查**：定时任务会自动检查所有收录站点的连通性，自动标记 `warning` 或 `broken`。
- **双向数据同步**：Issue 的变动会自动更新网站数据，标签的变动也会反向同步到 Issue 状态。
- **SEO 友好**：基于 Vite 构建，配合 SSG (Static Site Generation) 为每个站点生成独立的静态页面。

## 🚀 快速开始

### 提交新站点

1. 进入 [Issues](https://github.com/ACG-Q/hubNavigator/issues) 页面。
2. 点击 "New Issue" 并选择 **"Site Submission"** 模板。
3. 填写站点信息（名称、链接、分类等）。
4. 提交 Issue。等待管理员审核通过后，站点将自动上线。

### 浏览导航站

访问我们的 GitHub Pages 部署地址：[HubNavigator Live](https://acg-q.github.io/hubNavigator/)

## 🛠️ 技术栈

- **前端**: Vue 3, Vite, TailwindCSS
- **自动化**: GitHub Actions
- **脚本**: Node.js (数据解析/生成), Python (健康检查/ChatOps)
- **数据存储**: JSON (Git Versioned)

## 📚 文档指南

- **[自动化工作流详解](docs/automation_workflows.md)**：了解背后的 Issue Parser, Cron Job 和 ChatOps 原理。
- **[ChatOps 命令手册](docs/chatops_commands.md)**：管理员操作指南，包含所有可用指令。
- **[开发指南](docs/development.md)**：如何本地运行和参与开发。
- **[部署指南](docs/deployment.md)**：如何将本项目部署到你自己的 GitHub 仓库。

## 🤝 贡献

欢迎提交 Pull Request 或 Issue 来改进这个项目。详见 [CONTRIBUTING](CONTRIBUTING.md) (如有)。

## 📄 开源协议

MIT License @ 2024-2026 ACG-Q
