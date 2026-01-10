# 🏷️ 系统标签体系 (Issue Labels Taxonomy)

本文档定义了导航站系统中使用的所有 GitHub Issue 标签。这些标签不仅用于分类，更是**自动化工作流 (GitHub Actions)** 的核心触发信号。

## 1. 状态标签 (Status Labels)

用于标记站点的生命周期状态，Action 会根据此状态决定是否将其渲染到前端。

| 标签名 (`name`) | 颜色 (`color`) | 含义 | 自动化行为 |
| :--- | :--- | :--- | :--- |
| `status:active` | `238636` (Green) | **正常** | ✅ 收录进 `site_all.json`，前端可见。参与常规巡检。 |
| `status:warning` | `fbca04` (Yellow) | **异常/警告** | ⚠️ 前端可见，但会有“连接不稳定”提示。进入**高频复检队列**。 |
| `status:broken` | `b60205` (Red) | **已失效** | ❌ 从前端移除（或仅保留快照）。若连续 N 次巡检失败自动打标。 |
| `status:triage` | `1d76db` (Blue) | **待审核** | ⏳ 新提交的 Issue 默认状态。等待管理员 `/approve`。 |
| `status:duplicate` | `cfd3d7` (Grey) | **重复** | 🚫 机器人检测到 URL 已存在时自动打标并关闭。 |

---

## 2. 机器人/运维标签 (Bot & Ops Labels)

用于人与机器人之间的交互，或机器人汇报执行结果。

### 2.1 触发指令 (Trigger Labels)

管理员手工添加此标签后，Action 会识别并执行通过任务，执行完后会自动移除该标签。

| 标签名 | 含义 | 对应 Action Job |
| :--- | :--- | :--- |
| `ops:update-snapshot` | 强制更新该站点的截图 | `job_snapshot_update` |
| `ops:refresh-meta` | 强制重新抓取 Title/Desc | `job_crawler_update` |
| `ops:force-sync` | 强制触发一次 JSON 编译 | `job_build_data` |

### 2.2 巡检结果 (Result Labels)

由 `Health Check` 脚本自动维护，用于可视化当前的健康状况。

| 标签名 | 含义 | 备注 |
| :--- | :--- | :--- |
| `bot:check-pass` | ✅ 最近一次巡检通过 | 带有上次成功的时间戳 (在 Issue Body 或 Comment 中) |
| `bot:check-fail` | ❌ 最近一次巡检失败 | 失败次数累计判定是否转为 `broken` |
| `bot:ssl-error` | 🔒 SSL 证书过期/无效 | 属于 `warning` 的一种特殊情况 |

---

## 3. 分类标签 (Type Labels)

用于区分 Issue 的用途。

| 标签名 | 含义 |
| :--- | :--- |
| `kind:site` | 标准的站点收录 Issue |
| `kind:domain-migration` | 域名更换申请单 |
| `kind:bug` | 系统 Bug 反馈 |
| `kind:discussion` | 功能建议/讨论 |

---

## 4. 标签自动化配置 (`labels.yml`)

建议使用 [action-label-syncer](https://github.com/marketplace/actions/github-label-syncer) 自动同步上述配置。

```yaml
# .github/labels.yml
- name: "status:active"
  color: "238636"
  description: "Site is live and healthy"
- name: "status:broken"
  color: "b60205"
  description: "Site is inaccessible"
# ... 其他标签配置
```
