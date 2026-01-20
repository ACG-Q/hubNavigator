# 🏷️ 系统标签体系 (Issue Labels Taxonomy)

本文档定义了导航站系统中使用的所有 GitHub Issue 标签。这些标签不仅用于分类，更是**自动化工作流 (GitHub Actions)** 的核心触发信号。

---

## 1. 状态标签 (Status Labels)

用于标记站点的生命周期状态，自动化脚本会根据此状态决定是否将其渲染到前端。

| 标签名 | 颜色 | 含义 | 自动化行为 |
|:---|:---|:---|:---|
| `status:active` | `0e8a16` (Green) | **正常运行** | ✅ 收录进 `site_all.json`，前端可见。参与常规巡检。 |
| `status:warning` | `fbca04` (Yellow) | **访问异常** | ⚠️ 前端可见，但会有"连接不稳定"提示。进入**高频复检队列**。 |
| `status:broken` | `d93f0b` (Red) | **已失效** | ❌ 从前端移除。连续 3 次巡检失败自动打标。 |
| `status:duplicate` | `cfd3d7` (Grey) | **重复提交** | 🚫 检测到 URL 已存在时自动打标并关闭。 |
| `triage` | `ededed` (Grey) | **待审核** | ⏳ 新提交或申请的 Issue 默认状态。等待管理员 `/approve`。 |

**状态转换规则**：
- `triage` → `active`：管理员执行 `/approve` 命令。
- `active` → `warning`：健康检查失败 1-2 次。
- `warning` → `broken`：连续失败 3 次。
- `warning` → `active`：健康检查恢复正常。
- `broken` → `active`：管理员手动修复后执行 `/approve`。

---

## 2. 类型标签 (Kind Labels)

用于区分 Issue 的用途和处理流程。

| 标签名 | 颜色 | 含义 | 处理流程 |
|:---|:---|:---|:---|
| `kind:site` | `1d76db` (Blue) | **新站点提交** | Issue Parser → 生成 JSON → 管理员 `/approve` → 自动上线。 |
| `site:correction` | `5319e7` (Purple) | **站点修正/迁移** | Issue Parser → 标记 `triage` → 管理员 `/approve` → 更新目标站点。 |
| `kind:category` | `c2e0c6` (Light Green) | **新增分类申请** | Issue Parser → 标记 `triage` → 管理员 `/approve` → 更新配置。 |
| `category:delete` | `d93f0b` (Red) | **删除分类申请** | Issue Parser → 标记 `triage` → 管理员 `/approve` → 移除分类。 |

---

## 3. 自动化工作流触发

### 3.1 核心自动化 (Automation Core)

```bash
# 触发条件
on:
  issues:
    types: [opened, edited]

# 核心处理脚本
node automation/init.js
```

### 3.2 ChatOps 命令

```bash
# 触发条件
on:
  issue_comment:
    types: [created]

# 处理指令
node automation/chatops.js
```

---

## 4. 标签管理 (Constants)

标签定义在 `automation/lib/constants.js` 中，确保代码与文档一致：

```javascript
module.exports = {
    LABELS: {
        KIND_SITE: 'kind:site',
        KIND_CATEGORY: 'kind:category',
        OP_SITE_UPDATE: 'site:correction',
        OP_CATEGORY_DELETE: 'category:delete',
        STATUS_ACTIVE: 'status:active',
        TRIAGE: 'triage'
        // ...
    }
};
```

---

## 5. ChatOps 命令与标签转换

| 命令 | 适用标签 | 动作 |
|:---|:---|:---|
| `/approve` | `kind:site` | 移除 `triage`，添加 `status:active` |
| `/approve` | `site:correction` | 合并数据并关闭 Issue |
| `/approve` | `kind:category` | 添加分类并关闭 Issue |
| `/reject` | 所有类型 | 移除 `triage` 并关闭 Issue |

详细说明见 [`chatops_commands.md`](./chatops_commands.md)

---

## 6. 标签使用最佳实践

### 6.1 新站点提交
- ✅ 自动添加：`kind:site`、`triage`。
- ✅ 审核通过后：移除 `triage`，添加 `status:active`。

### 6.2 站点修正
- ✅ 自动添加：`site:correction`、`triage`。
- ✅ 合并后：直接关闭 Issue。

---

## 7. 相关文档

- [ChatOps 命令手册](./chatops_commands.md)
- [自动化工作流说明](./automation_workflows.md)
- [网站分类标准](./site_categories.md)
