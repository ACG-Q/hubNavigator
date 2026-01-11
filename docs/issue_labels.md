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
| `triage` | `ededed` (Grey) | **待审核** | ⏳ 新提交的 Issue 默认状态。等待管理员 `/approve` 或 `/merge`。 |

**状态转换规则**：
- `triage` → `active`：管理员执行 `/approve` 命令
- `active` → `warning`：健康检查失败 1-2 次
- `warning` → `broken`：连续失败 3 次
- `warning` → `active`：健康检查恢复正常
- `broken` → `active`：管理员手动修复后执行 `/approve`

---

## 2. 类型标签 (Kind Labels)

用于区分 Issue 的用途和处理流程。

| 标签名 | 颜色 | 含义 | 处理流程 |
|:---|:---|:---|:---|
| `kind:site` | `1d76db` (Blue) | **新站点提交** | Issue Parser → 生成 JSON → 健康检查 → 自动上线 |
| `kind:correction` | `5319e7` (Purple) | **站点修正** | Issue Parser → 标记 triage → 管理员 `/merge` → 更新目标站点 |
| `kind:domain-migration` | `e99695` (Pink) | **域名迁移** | Issue Parser → 标记 triage → 管理员 `/merge` → 更新 URL |
| `kind:new-category` | `c2e0c6` (Light Green) | **新增分类申请** | 管理员触发 OPS 工作流 → 更新配置 → 同步模板 |

**标签自动添加**：
- 所有标签由 Issue 模板的 `labels` 字段自动添加
- 不需要手动打标

---

## 3. 自动化工作流触发

### 3.1 Issue Parser 触发条件

```yaml
if: contains(github.event.issue.labels.*.name, 'kind:site') || 
    contains(github.event.issue.labels.*.name, 'kind:domain-migration') || 
    contains(github.event.issue.labels.*.name, 'kind:correction')
```

### 3.2 Health Check 处理范围

```python
issues = repo.get_issues(state='open', labels=['kind:site'])
```

仅检查 `kind:site` 类型的 Issue，修正和迁移不参与健康检查。

---

## 4. 标签管理

### 4.1 初始化标签

使用以下命令初始化仓库的标准标签：

```bash
# 手动触发 Init Labels 工作流
# 或在本地运行：
python scripts/manage_labels.py
```

### 4.2 标签配置文件

标签定义在 `scripts/manage_labels.py` 中：

```python
PROJECT_LABELS = {
    "status:active": {
        "color": "0e8a16", 
        "desc": "Verified and active site | 已验证且正常运行的站点"
    },
    # ... 其他标签
}
```

### 4.3 清理非标准标签

`manage_labels.py` 会自动删除所有不在 `PROJECT_LABELS` 中的标签，确保标签系统的一致性。

---

## 5. ChatOps 命令与标签

部分 ChatOps 命令会自动管理标签：

| 命令 | 标签变化 |
|:---|:---|
| `/approve` | 移除 `triage`，添加 `status:active` |
| `/merge` | 修正/迁移 Issue：添加 `status:active` 并关闭 |
| `/label <labels>` | 批量添加指定标签 |

详细说明见 [`chatops_commands.md`](./chatops_commands.md)

---

## 6. 标签使用最佳实践

### 6.1 新站点提交
- ✅ 自动添加：`kind:site`、`triage`
- ✅ 审核通过后：移除 `triage`，添加 `status:active`
- ✅ 健康检查：根据结果自动切换 `active`/`warning`/`broken`

### 6.2 站点修正
- ✅ 自动添加：`kind:correction`、`triage`
- ✅ 合并后：添加 `status:active` 并关闭 Issue
- ❌ 不要手动修改目标站点的标签

### 6.3 域名迁移
- ✅ 自动添加：`kind:domain-migration`、`triage`
- ✅ 合并后：添加 `status:active` 并关闭 Issue
- ✅ 目标站点会自动重新检查新域名

### 6.4 分类申请
- ✅ 自动添加：`kind:new-category`、`triage`
- ✅ 批准后：添加 `status:active` 并关闭 Issue
- ✅ 配置文件和模板会自动更新

---

## 7. 标签颜色规范

| 颜色系 | 用途 | 示例 |
|:---|:---|:---|
| **绿色系** (`0e8a16`, `c2e0c6`) | 正常/成功状态 | `status:active` |
| **黄色系** (`fbca04`) | 警告状态 | `status:warning` |
| **红色系** (`d93f0b`, `e99695`) | 错误/迁移 | `status:broken`, `kind:domain-migration` |
| **蓝色系** (`1d76db`) | 常规操作 | `kind:site` |
| **紫色系** (`5319e7`) | 修正操作 | `kind:correction` |
| **灰色系** (`ededed`, `cfd3d7`) | 待处理/重复 | `triage`, `status:duplicate` |

---

## 8. 故障排查

### 问题：Issue 未被自动处理
**检查清单**：
1. 确认 Issue 包含正确的 `kind:*` 标签
2. 查看 Actions 日志确认工作流是否触发
3. 检查 Issue 内容格式是否符合模板要求

### 问题：标签状态不一致
**解决方案**：
1. 手动触发 `Init Labels` 工作流
2. 或运行 `python scripts/manage_labels.py`
3. 检查 `PROJECT_LABELS` 配置是否完整

### 问题：健康检查后标签未更新
**检查清单**：
1. 确认 Issue 包含 `kind:site` 标签
2. 查看 `health_check.py` 日志
3. 检查 `sync_labels()` 函数是否正常执行

---

## 9. 相关文档

- [ChatOps 命令手册](./chatops_commands.md)
- [自动化工作流说明](./automation_workflows.md)
- [网站分类标准](./site_categories.md)
