# 🗂️ 网站分类标准 (Site Categories) - Expanded v2.0

本文档作为系统分类的“唯一真理源” (Single Source of Truth)。
涵盖了 **AI、开发、设计、产品、媒体、效率、资源** 等 7 大领域，共 20+ 个细分分类。

## 1. AI 与 智能 (Artificial Intelligence)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `ai-chat` | **AI 对话** | `🤖` | LLM 聊天机器人 (ChatGPT, Claude, Gemini) |
| `ai-writing` | **AI 写作** | `✍️` | 辅助写作、文案生成、润色工具 |
| `ai-audio-video` | **AI 音视频** | `🎥` | AI 生成视频、语音合成 (TTS)、克隆 |
| `ai-drawing` | **AI 绘画** | `🎨` | MidJourney, Stable Diffusion, 生图工具 |
| `ai-dev` | **AI 编程** | `💻` | Copilot, 代码生成、SQL 辅助 |

## 2. 开发与技术 (Development)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `dev-frontend` | **前端开发** | `⚡` | Vue/React 库、CSS 框架、组件库 |
| `dev-backend` | **后端/架构** | `🔧` | 数据库、API 工具、云服务、运维 |
| `dev-tools` | **在线工具** | `🛠️` | 正则、JSON、Base64、转换器、Mock |
| `dev-resources` | **技术资源** | `📚` | 官方文档、开源社区、GitHub 趋势 |
| `web3-crypto` | **Web3/区块链** | `🪙` | 加密货币、DeFi、智能合约、NFT |

## 3. 设计与灵感 (Design & UI/UX)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `design-inspiration`| **灵感采集** | `💡` | Dribbble, Behance, 网页画廊 |
| `design-assets` | **设计素材** | `📦` | 免费商用图片、3D 模型、矢量插画 |
| `design-icons` | **图标字体** | `🎭` | Iconify, FontAwesome, SVG 图标库 |
| `design-color` | **配色排版** | `🌈` | 调色板、字体搭配、渐变色生成 |
| `design-tools` | **设计工具** | `✏️` | Figma 插件、在线 PS、原型设计 |

## 4. 媒体与处理 (Media Processing)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `image-tools` | **图片处理** | `🖼️` | 压缩、抠图、格式转换、水印处理 |
| `video-tools` | **视频工具** | `🎬` | 在线剪辑、格式转换、下载器 |
| `audio-tools` | **音频工具** | `🎵` | 剪辑、降噪、格式转换 |

## 5. 产品与运营 (Product & Ops)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `product-ops` | **产品运营** | `📈` | 数据分析、A/B 测试、竞品分析 |
| `marketing-seo` | **营销/SEO** | `🔍` | 关键词挖掘、ASO、流量统计 |
| `indie-maker` | **独立开发** | `🚀` | 变现、出海、产品发布平台 (ProductHunt) |

## 6. 效率与生活 (Efficiency & Life)

| ID (`slug`) | 名称 (`name`) | 图标 | 描述 |
| :--- | :--- | :--- | :--- |
| `efficiency` | **效率办公** | `⏳` | 笔记、PDF、思维导图、协作 |
| `resource-site` | **资源下载** | `💾` | 软件下载、网盘资源、磁力搜索 |
| `read-news` | **阅读资讯** | `📰` | 科技资讯、博客、Newsletter |
| `lifestyle` | **生活趣味** | `☕` | 摸鱼、游戏、购物、旅行 |

---

## 使用指南

> **提示**：目前系统仅支持 **一级分类**。
> `dev-tools` 和 `efficiency` 是最常用的两个“万金油”分类，请谨慎使用，尽量归类到更细分的领域。

建议在源码配置中 (如 `config/categories.json`) 保持此顺序。
