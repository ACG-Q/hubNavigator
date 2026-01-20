# 🛠️ 开发指南 (Development Guide)

欢迎参与 HubNavigator 的开发！HubNavigator 是一个高度自动化的导航站系统，本文档详细说明了系统的技术架构及其开发流程。

---

## 🏗️ 技术架构

HubNavigator 采用 **"Issue 即数据库"** 的理念。

```mermaid
graph LR
    User[用户] -->|提交 Issue| Issue[GitHub Issues]
    Actions[GitHub Actions] -->|读取| Issue
    Actions -->|automation/init.js| JSON[data/items/*.json]
    JSON -->|automation/aggregate.js| SiteData[site_all.json]
    SiteData -->|Vite Build| Dist[Static Site]
    Dist -->|Deploy| Pages[GitHub Pages]
```

1.  **数据源**：GitHub Issues。
2.  **解析层**：`automation/init.js` 将 Issue 表单解析为标准的 JSON。
3.  **处理层**：`automation/health.js` 巡检站点，`automation/chatops.js` 处理 ChatOps 命令。
4.  **构建层**：`automation/aggregate.js` 聚合数据，Vite 构建前端。
5.  **展示层**：Vue 3 + TailwindCSS 的响应式页面。

---

## 💻 环境准备

### 1. 软件要求
- **Node.js**: v20.0.0+ (LTS)
- **npm**: 10.x+

### 2. 克隆与安装
```bash
git clone https://github.com/ACG-Q/hubNavigator.git
cd hubNavigator

# 前端依赖
npm install

# 后端脚本依赖
# 无需 pip，全部使用 npm install
npm install
```

---

## 🔧 前端开发

### 1. 全局配置
修改 `src/config.js` 以调整站点名称、URL、Giscus 评价系统及其它元数据。

### 2. 多语言支持 (i18n)
语言文件位于 `src/i18n/index.js`。
如需添加词条，请确保 `en` 和 `zh` 分支下键名一致。

### 3. 运行开发服务器
```bash
npm run dev
```
前端默认从 `data/site_all.json` 读取数据。

---

## 🐍 后端脚本详解

| 脚本路径 (Path) | 功能描述 (Description) |
| :--- | :--- |
| `automation/init.js` | **核心路由**: 根据标签分发解析任务（入口） |
| `automation/parsers/site.js` | **站点解析**: 处理提交、修正、迁移，管理 JSON 生命周期 |
| `automation/parsers/category.js` | **分类解析**: 处理新增分类申请并同步配置 |
| `automation/chatops.js` | **指令处理**: 实现 ChatOps（如 `/approve`, `/update`） |
| `automation/health.js` | **健康检查**: 定时巡检站点链接有效性，自动同步标签 |
| `automation/aggregate.js` | **数据聚合**: 汇总 JSON，生成 `site_all.json` 与 Sitemap |
| `automation/labels.js` | **标签定义**: 统一维护 GitHub 仓库的标签体系 |

---

## 🚀 手动触发 GitHub Actions

在某些情况下，你可能需要手动触发 GitHub Actions 工作流，例如：
1.  强制重新聚合数据。
2.  重新运行健康检查。
3.  在本地调试后，希望在 CI/CD 环境中验证。

**操作步骤：**
1.  进入 GitHub 仓库的 `Actions` 页面。
2.  在左侧导航栏中，选择你想要触发的工作流（例如 `Build Site Data` 或 `Health Check`）。
3.  点击右侧的 **Run workflow** 按钮。
4.  等待运行成功（显示绿色勾号）。

---

## 🧪 本地调试工作流

### 1. 模拟自动化运行
如果你修改了自动化逻辑，可以使用以下方式本地测试：

```bash
# 设置环境变量 (可选)
export GITHUB_TOKEN="your_token"

# 运行初始化 (解析 Issue)
node automation/init.js

# 运行健康检查
node automation/health.js

# 运行数据聚合
node automation/aggregate.js
```

---

## 🚀 进阶任务

### 如何添加一个新分类？
1. 管理员通过 Issue 提交分类申请。
2. 在 Issue 下评论 `/approve`。
3. 系统会自动更新配置并同步 Issue 模板。

### 如何修改 Issue 模板？
1. 修改 `.github/ISSUE_TEMPLATE/` 下的 `.yml` 文件。
2. 注意不要破坏 `id: ...` 等 parser 强依赖的键名。

---

## 📜 提交规范
本仓库推荐使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范：
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档变更
- `style`: 代码格式调整
- `chore`: 构建过程或辅助工具变动

---

## TODO

- [ ] 完善多语言支持，目前支持中英文切换
- [ ] 完善自动化工作流
- [ ] 完善多主题支持
- [ ] 详情页面，添加网页预览图片
- [ ] 网站直达
  - [ ] 添加新的站点
  - [ ] 添加新的分类
  - [ ] 添加新的标签
    - [ ] 添加新标签的自动化
- [ ] 完善config.js
  - [ ] 完善Giscus 评论配置

---

## ❓ 常见问题排查
- **Node 脚本报错 "matter is not defined"**: 确保已运行 `npm install` 安装 `gray-matter`。
- **Python 脚本 403 错误**: 检查是否提供了有效的 `GITHUB_TOKEN`，且该 Token 具有对应的权限。
- **健康检查不跳状态**: 检查站点的 `fail_count`。只有连续失败 3 次以上才会变更为 `broken`。
