# ☁️ 部署指南 (Deployment Guide)

本指南将帮助你将 HubNavigator 部署到你自己的 GitHub 仓库，创建一个属于你的导航站。

## 1. Fork 仓库

1. 点击本页面右上角的 **Fork** 按钮。
2. 选择你的个人账号或组织。
3. 等待 Fork 完成。

## 2. 修改项目配置 (关键步骤)

项目前端通过 `src/config.js` 读取配置。在部署前，你必须修改此文件以指向你的仓库。

1. 打开 `src/config.js` 文件。
2. 修改以下关键字段：

```javascript
const GlobalConfig = {
    // [必填] 修改为你的 "用户名/仓库名"
    repo: 'YourUsername/YourRepo',

    // [必填] 修改为你的 GitHub Pages 网址
    siteUrl: 'https://YourUsername.github.io/YourRepo',
    
    // [可选] 站点名称和描述
    siteName: 'My Navigator',
    
    // ...
```

### 配置 Giscus 评论系统 (可选)

本项目集成了 Giscus 评论系统，允许用户在站点详情页直接评论（数据存储在 GitHub Discussions 中）。

1. 访问 [giscus.app](https://giscus.app/zh-CN)。
2. 配置你的仓库（需在仓库设置中启用 Discussions 功能）。
3. 为仓库安装[Giscus App](https://github.com/apps/giscus), 并赋予所有仓库\指定仓库的访问discussions的权限
3. 获取生成的配置参数。
4. 回填到 `src/config.js` 中：

```javascript
    giscus: {
        repoId: '从 giscus 获取的 data-repo-id',
        categoryId: '从 giscus 获取的 data-category-id',
        category: 'Announcements' // 通常是 Announcements
    }
```

> **注意**：如果不配置 Giscus，或者留空，评论区将无法加载，但不影响其他功能。

## 3. 配置 GitHub Actions 权限

为了让自动化脚本能够修改 Issue 和提交代码，你需要授予 Actions 读写权限。

1. 进入你 Fork 后的仓库页面。
2. 点击 **Settings** > **Actions** > **General**。
3. 在 **Workflow permissions** 区域：
   - 选择 **Read and write permissions**。
   - 勾选 **Allow GitHub Actions to create and approve pull requests** (可选，推荐勾选)。
4. 点击 **Save** 保存。

## 4. 启用 GitHub Pages

1. 点击 **Settings** > **Pages**。
2. 在 **Build and deployment** > **Source** 下拉菜单中：
   - 选择 **GitHub Actions**。 
   - (注意：不要选择 "Deploy from a branch"，因为我们使用自定义 Workflow 进行构建)。

## 5. 初始化项目

首次部署建议手动运行一次初始化工作流，以创建必要的标签。

1. 点击 **Actions** 选项卡。
2. 在左侧选择 **🔧 Project Initialization (Labels)** 工作流。
3. 点击右侧的 **Run workflow** 按钮。
4. 等待运行成功（显示绿色勾号）。

此时，你的 Issues 标签系统已经准备就绪。

## 6. 首次部署网站

默认情况下，当你 Push 代码到 `main` 分支时（Fork 操作本身就是一次 Push），部署工作流会自动触发。

1. 点击 **Actions** 选项卡。
2. 查看 **🚀 Deploy to Pages** 工作流的状态。
3. 如果第一次没有自动触发，你可以手动触发一次：
   - 选择 **🚀 Deploy to Pages**。
   - 点击 **Run workflow**。

等待部署完成后，你可以在 **Settings** > **Pages** 页面找到你的网站访问地址。

## 7. 验证 ChatOps

1. 在 Issues 中创建一个新 Issue（选择 Site Submission 模板）。
2. 填写测试数据并提交。
3. 在该 Issue 下评论 `/approve`。
4. 观察 Actions 是否自动运行并回复了你的评论。

🎉 恭喜！你已经拥有了一个全自动化的导航站。
