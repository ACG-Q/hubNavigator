const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');
const Shared = require('./lib/shared');
const { processSiteIssue } = require('./add_site');
const { processCategoryIssue } = require('./add_category');
const { LABELS, COMMANDS } = require('./lib/constants');

const DATA_DIR = path.join(__dirname, '../data/items');
const CATEGORY_ITEMS_DIR = path.join(__dirname, '../data/category_items');

/**
 * ChatOps 主程序
 * 采用高度拆解的函数结构，确保逻辑清晰且易于扩展
 */
async function main() {
    const env = validateEnv();
    if (!env) return;

    if (!env.commentBody.startsWith('/')) return;

    try {
        // 1. 安全校验 | Permission Check
        if (env.author !== env.repoOwner) {
            Logger.warn(`Unauthorized command attempt by ${env.author}`);
            return;
        }

        // 2. 获取数据与分析指令 | Get Issue & Parse Command
        const issue = await GitHubAPI.getIssue(env.issueNumber);
        const { command, args } = parseCommand(env.commentBody);

        Logger.info(`Executing [${command}] on issue #${env.issueNumber}`);

        // 3. 指令路由 | Hub Dispatch
        switch (command) {
            case COMMANDS.APPROVE:
                await handleApprovalFlow(issue);
                break;
            case COMMANDS.REJECT:
                await handleRejectAction(issue, args);
                break;
            case COMMANDS.CLOSE:
                await handleCloseAction(issue, args);
                break;
            default:
                Logger.warn(`Unknown command: ${command}`);
        }
    } catch (err) {
        Logger.error("ChatOps execution failed", err);
    }
}

/**
 * 环境变量校验 | Validate Essential Env
 */
function validateEnv() {
    const keys = ['ISSUE_NUMBER', 'COMMENT_BODY', 'COMMENT_AUTHOR', 'GITHUB_TOKEN', 'GITHUB_REPOSITORY'];
    const missing = keys.filter(k => !process.env[k]);

    if (missing.length > 0) {
        Logger.error(`Missing variables: ${missing.join(', ')}`);
        return null;
    }

    return {
        issueNumber: process.env.ISSUE_NUMBER,
        commentBody: process.env.COMMENT_BODY.trim(),
        author: process.env.COMMENT_AUTHOR,
        repoOwner: process.env.GITHUB_REPOSITORY.split('/')[0]
    };
}

/**
 * 解析指令内容 | Parse Comment content
 */
function parseCommand(body) {
    const parts = body.split(/\s+/);
    return {
        command: parts[0].toLowerCase(),
        args: parts.slice(1)
    };
}

/**
 * --- 指令处理器 (Command Handlers) ---
 */

async function handleApprovalFlow(issue) {
    const labels = issue.labels.map(l => l.name);

    if (labels.includes(LABELS.KIND_CATEGORY)) {
        return approveCategory(issue);
    }

    if (labels.includes(LABELS.OP_SITE_UPDATE)) {
        return approveMerge(issue);
    }

    if (labels.includes(LABELS.OP_CATEGORY_DELETE)) {
        return approveCategoryDeletion(issue);
    }

    return approveSite(issue);
}

/**
 * 批准新站点 | Approve New Site
 */
async function approveSite(issue) {
    const labels = issue.labels.map(l => l.name);
    const newLabels = labels.filter(l => l !== LABELS.TRIAGE);
    if (!newLabels.includes(LABELS.STATUS_ACTIVE)) newLabels.push(LABELS.STATUS_ACTIVE);

    await GitHubAPI.updateIssue(issue.number, { labels: newLabels });

    // IMPORTANT: Update local issue labels to reflect the changes for downstream processing
    issue.labels = newLabels.map(name => ({ name }));

    await processSiteIssue(issue); // 直接注入对象，解决竞争条件

    await notifyUser(issue.number, "✅ **站点申请已批准** | Site submission approved.", "状态已变更为 `active` | Status changed to `active`.");
}

/**
 * 批准分类申请 | Approve Category
 */
async function approveCategory(issue) {
    const labels = issue.labels.map(l => l.name);
    const newLabels = labels.filter(l => l !== LABELS.TRIAGE);
    if (!newLabels.includes(LABELS.STATUS_ACTIVE)) newLabels.push(LABELS.STATUS_ACTIVE);

    await GitHubAPI.updateIssue(issue.number, { labels: newLabels, state: 'closed' });
    await processCategoryIssue(issue);

    await notifyUser(issue.number, "✅ **分类申请已批准并关闭** | Category proposal approved and closed.", "该分类现在已生效 | This category is now active.");
}

/**
 * 批准合并（修正/迁移） | Approve Merge
 */
async function approveMerge(issue) {
    const formData = Shared.parseForm(issue.body);
    const targetId = formData.site_id || formData.id || formData.target_id;

    if (!targetId) {
        return notifyUser(issue.number, "❌ **批准失败** | Approval failed.", "未找到目标站点 ID | Target Site ID not found.");
    }

    const targetPath = path.join(DATA_DIR, `${targetId}.json`);
    if (!fs.existsSync(targetPath)) {
        return notifyUser(issue.number, "❌ **批准失败** | Approval failed.", `目标文件不存在 | Target file not found: \`${targetId}.json\``);
    }

    try {
        const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        const { changed, data } = performDataSync(targetData, formData);

        if (changed) {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));

            // 重要：清理修正申请生成的临时 JSON 文件
            await processSiteIssue(issue, 'closed');

            await GitHubAPI.updateIssue(issue.number, { state: 'closed' });
            await notifyUser(issue.number, "✅ **更正/迁移已批准并合并** | Correction/Migration approved and merged.", `数据已同步至 \`${targetId}.json\``);
        } else {
            await notifyUser(issue.number, "⚠️ **未发现有效更改** | No valid changes found.");
        }
    } catch (e) {
        Logger.error("Merge execution failed", e);
        await notifyUser(issue.number, "❌ **操作失败** | Operation failed.", e.message);
    }
}

/**
 * 批准分类删除 | Approve Category Deletion
 */
async function approveCategoryDeletion(issue) {
    const formData = Shared.parseForm(issue.body);
    const targetId = formData.category_id || formData.id;

    if (!targetId) {
        return notifyUser(issue.number, "❌ **删除失败** | Deletion failed.", "未找到目标分类 ID | Target Category ID not found.");
    }

    try {
        if (!fs.existsSync(CATEGORY_ITEMS_DIR)) {
            return notifyUser(issue.number, "⚠️ **目录不存在** | Directory not found.");
        }

        const files = fs.readdirSync(CATEGORY_ITEMS_DIR);
        let deleted = false;

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const filePath = path.join(CATEGORY_ITEMS_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (content.id === targetId) {
                fs.unlinkSync(filePath);
                deleted = true;
                Logger.success(`Deleted category ${targetId} via issue #${issue.number}`);
                break;
            }
        }

        if (deleted) {
            // 清理该 issue 产生的临时 JSON (如果有)
            await processCategoryIssue(issue, 'closed');
            await GitHubAPI.updateIssue(issue.number, { state: 'closed' });
            await notifyUser(issue.number, "✅ **分类删除已批准** | Category deletion approved.", `分类 \`${targetId}\` 已被移除。`);
        } else {
            await notifyUser(issue.number, "⚠️ **未找到该分类** | Category not found.", `系统中未找到 ID 为 \`${targetId}\` 的分类。`);
        }

    } catch (e) {
        Logger.error("Category deletion failed", e);
        await notifyUser(issue.number, "❌ **删除失败** | Deletion failed.", e.message);
    }
}

/**
 * 拒绝指令 | Reject Command
 */
async function handleRejectAction(issue, args) {
    const reason = args.join(' ');
    const labels = issue.labels.map(l => l.name);
    const newLabels = labels.filter(l => l !== LABELS.TRIAGE);

    await GitHubAPI.updateIssue(issue.number, { labels: newLabels, state: 'closed' });

    // Cleanup linked files
    if (labels.includes(LABELS.KIND_CATEGORY)) {
        await processCategoryIssue(issue, 'closed');
    } else {
        await processSiteIssue(issue, 'closed');
    }

    await notifyUser(issue.number, "❌ **请求被拒绝** | Request rejected.", reason ? `**原因 | Reason:** ${reason}` : "抱歉，您的申请未通过审核。 | Sorry, your request was not approved.");
}

/**
 * 关闭 Issue 并清理 | Close & Cleanup
 */
async function handleCloseAction(issue, args) {
    const reason = args.join(' ');
    await GitHubAPI.updateIssue(issue.number, { state: 'closed' });

    // 清理逻辑
    if (issue.labels.some(l => l.name === LABELS.KIND_CATEGORY)) {
        await processCategoryIssue(issue, 'closed');
    } else {
        await processSiteIssue(issue, 'closed');
    }

    await notifyUser(issue.number, "🔒 **Issue 已关闭** | Issue closed.", reason ? `**原因 | Reason:** ${reason}` : "");
}

/**
 * --- 辅助工具 (Utilities) ---
 */

function performDataSync(target, source) {
    const mapping = { 'site_name': 'name', 'site_url': 'url', 'new_site_url': 'url' };
    let changed = false;

    // 同步普通字段
    ['site_name', 'site_url', 'new_site_url', 'description', 'cover'].forEach(key => {
        const val = source[key];
        if (val && val !== '_No response_') {
            const targetKey = mapping[key] || key;
            if (target[targetKey] !== val) {
                target[targetKey] = val;
                changed = true;
            }
        }
    });

    // 同步分类 (Checkboxes)
    if (source.categories && source.categories !== '_No response_') {
        const newCats = Shared.parseCheckboxes(source.categories);
        if (newCats.length > 0) {
            target.categories = newCats;
            changed = true;
        }
    }

    return { changed, data: target };
}

async function notifyUser(issueNumber, title, detail = "") {
    const msg = `${title}${detail ? `\n${detail}` : ""}`;
    await GitHubAPI.createComment(issueNumber, msg);
}

if (require.main === module) {
    main();
}
