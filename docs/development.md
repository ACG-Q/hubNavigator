# 🛠️ 开发指南 (Development Guide)

欢迎参与 HubNavigator 的开发！HubNavigator 是一个高度自动化的导航站系统，本文档详细说明了系统的技术架构及其开发流程。

---

## 🏗️ 技术架构

HubNavigator 采用 **"Issue 即数据库"** 的理念。

```mermaid
graph LR
    User[用户] -->|提交 Issue| Issue[GitHub Issues]
    Actions[GitHub Actions] -->|读取| Issue
    Actions -->|Parser.js| JSON[data/items/*.json]
    JSON -->|Build.js| SiteData[site_all.json]
    SiteData -->|Vite Build| Dist[Static Site]
    Dist -->|Deploy| Pages[GitHub Pages]
```

1.  **数据源**：GitHub Issues。
2.  **解析层**：`parser.js` 将 Issue 表单解析为标准的 JSON。
3.  **处理层**：`health_check.py` 巡检站点，`comment_ops.py` 处理 ChatOps 命令。
4.  **构建层**：`build_site_all.js` 聚合数据，Vite 构建前端。
5.  **展示层**：Vue 3 + TailwindCSS 的响应式页面。

---

## 💻 环境准备

### 1. 软件要求
- **Node.js**: v20.0.0+ (LTS)
- **Python**: v3.10+
- **npm**: 10.x+

### 2. 克隆与安装
```bash
git clone https://github.com/ACG-Q/hubNavigator.git
cd hubNavigator

# 前端依赖
npm install

# 后端脚本依赖
pip install -r requirements.txt
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

| 脚本名 | 语言 | 功能说明 |
| :--- | :--- | :--- |
| `parser.js` | Node | **核心**：解析 Issue body 提取元数据。支持双向同步（Issue 与 JSON）。 |
| `health_check.py` | Python | **巡检**：多线程检查 URL 可达性，自动管理 Issue 标签（active/warning/broken）。 |
| `build_site_all.js` | Node | **聚合**：将所有分散的 JSON 汇总，并生成 `sitemap.xml`。 |
| `comment_ops.py` | Python | **ChatOps**：解析 `/approve`, `/merge` 等评论指令并执行。 |
| `manage_labels.py`| Python | **初始化**：管理 GitHub 仓库的标签体系（颜色、描述）。 |
| `add_category.js` | Node | **分类**：自动化添加新分类并同步更新所有 Issue 模板。 |
| `ssg_generator.js`| Node | **SEO**：在部署阶段为每个站点生成独立的 HTML 详情页。 |

---

## 🧪 本地调试工作流

### 1. 模拟 Parser 解析
如果你修改了 `parser.js`，可以使用以下指令本地模拟 Actions 环境：

```bash
# 设置模拟负载
export ISSUE_NUMBER="10"
export ISSUE_BODY="...粘贴 Issue 的 Markdown 内容..."
export ISSUE_LABELS="kind:site,triage"
export ISSUE_STATE="open"
export GITHUB_TOKEN="your_personal_access_token" # 选填

node scripts/parser.js
```

### 2. 模拟巡检逻辑
```bash
# 巡检脚本会自动读取 data/items/ 下的所有 JSON 文件
python scripts/health_check.py
```

### 3. 本地构建完整数据
```bash
# 在 data/items/ 修改完数据后，运行此脚本更新 index
node scripts/build_site_all.js
```

---

## 🚀 进阶任务

### 如何添加一个新分类？
1. 修改 `config/categories.yaml`，添加新的分类条目。
2. 运行 `node scripts/build_site_all.js` 以更新 `data/categories.json`。
3. (可选) 手动运行 `node scripts/add_category.js` 来同步更新 Issue 模板的 checkboxes。

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

---

## ❓ 常见问题排查
- **Node 脚本报错 "matter is not defined"**: 确保已运行 `npm install` 安装 `gray-matter`。
- **Python 脚本 403 错误**: 检查是否提供了有效的 `GITHUB_TOKEN`，且该 Token 具有对应的权限。
- **健康检查不跳状态**: 检查站点的 `fail_count`。只有连续失败 3 次以上才会变更为 `broken`。
