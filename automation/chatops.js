const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');

async function main() {
    const issueNumber = process.env.ISSUE_NUMBER;
    const commentBody = process.env.COMMENT_BODY?.trim();
    const author = process.env.COMMENT_AUTHOR;

    if (!issueNumber || !commentBody) {
        Logger.error("Missing inputs.");
        return;
    }

    if (!commentBody.startsWith('/')) return;

    try {
        const repoFullName = process.env.GITHUB_REPOSITORY;
        const owner = repoFullName.split('/')[0];

        // Security: Only repo owner can run commands
        if (author !== owner) {
            Logger.warn(`Unauthorized user: ${author}`);
            return;
        }

        const issue = await GitHubAPI.getIssue(issueNumber);
        const cmd = commentBody.split(/\s+/)[0].toLowerCase();
        const args = commentBody.split(/\s+/).slice(1);

        Logger.info(`Handling command: ${cmd} for issue #${issueNumber}`);

        switch (cmd) {
            case '/approve':
                await handleApprove(issue);
                break;
            case '/label':
                await handleLabel(issue, args);
                break;
            case '/close':
                await handleClose(issue, args);
                break;
            case '/update':
                // Forcing re-run of parser or health check is handled by downstream triggers
                await GitHubAPI.createComment(issueNumber, "🔄 **任务已加入队列** | Task queued.\n项目将在下次自动运行时更新。");
                break;
            default:
                Logger.warn(`Unknown command: ${cmd}`);
        }

    } catch (err) {
        Logger.error("ChatOps failed", err);
    }
}

async function handleApprove(issue) {
    const labels = issue.labels.map(l => l.name);
    const isCategory = labels.includes('kind:new-category');

    const newLabels = labels.filter(l => l.name !== 'triage').concat(['status:active']);
    const updates = { labels: newLabels };

    if (isCategory) updates.state = 'closed';

    await GitHubAPI.updateIssue(issue.number, updates);
    await GitHubAPI.createComment(issue.number, `✅ **批准成功！**\n状态已变更为 \`active\`。${isCategory ? '该申请已关闭并生效。' : ''}`);
}

async function handleLabel(issue, args) {
    if (args.length < 2) return;
    const action = args[0].toLowerCase();
    const labelNames = args.slice(1);

    if (action === 'add') {
        await GitHubAPI.addLabels(issue.number, labelNames);
    } else if (action === 'remove' || action === 'del') {
        for (const l of labelNames) await GitHubAPI.removeLabel(issue.number, l);
    }
    await GitHubAPI.createComment(issue.number, `✅ **标签已更新** | Labels updated.`);
}

async function handleClose(issue, args) {
    const reason = args.join(' ');
    await GitHubAPI.updateIssue(issue.number, { state: 'closed' });
    await GitHubAPI.createComment(issue.number, `🔒 **Issue 已关闭**${reason ? `\n\n**原因:** ${reason}` : ''}`);
}

if (require.main === module) {
    main();
}
