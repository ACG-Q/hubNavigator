const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');

const PROJECT_LABELS = {
    "status:active": { color: "0e8a16", desc: "Verified and active site | 已验证且活跃的站点" },
    "status:warning": { color: "fbca04", desc: "Site has accessibility issues | 站点存在访问问题" },
    "status:broken": { color: "d93f0b", desc: "Site is offline or link is broken | 站点已下线或链接失效" },
    "status:duplicate": { color: "cfd3d7", desc: "Duplicate submission | 重复提交" },
    "triage": { color: "ededed", desc: "Awaiting approval | 等待审核" },
    "kind:site": { color: "1d76db", desc: "New site submission | 新站点提交" },
    "site:correction": { color: "5319e7", desc: "Request to fix site info | 站点信息更正请求" },
    "kind:category": { color: "c2e0c6", desc: "New category proposal | 新分类提案" },
};

async function clearAllLabels() {
    Logger.info("Clearing all existing labels...");
    try {
        const { data: labels } = await GitHubAPI.octokit.issues.listLabelsForRepo({
            owner: GitHubAPI.owner,
            repo: GitHubAPI.repo
        });

        for (const label of labels) {
            Logger.info(`Deleting label: ${label.name}`);
            await GitHubAPI.octokit.issues.deleteLabel({
                owner: GitHubAPI.owner,
                repo: GitHubAPI.repo,
                name: label.name
            });
        }
        Logger.success("All labels cleared.");
    } catch (err) {
        Logger.error("Failed to clear labels", err);
        throw err;
    }
}

async function main() {
    Logger.info("Initializing project environment...");

    try {
        await clearAllLabels();

        const { data: existingLabels } = await GitHubAPI.octokit.issues.listLabelsForRepo({
            owner: GitHubAPI.owner,
            repo: GitHubAPI.repo
        });

        const existingNames = existingLabels.map(l => l.name);

        for (const [name, config] of Object.entries(PROJECT_LABELS)) {
            if (existingNames.includes(name)) {
                Logger.info(`Syncing label: ${name}`);
                await GitHubAPI.octokit.issues.updateLabel({
                    owner: GitHubAPI.owner,
                    repo: GitHubAPI.repo,
                    name: name,
                    color: config.color,
                    description: config.desc
                });
            } else {
                Logger.info(`Creating label: ${name}`);
                await GitHubAPI.octokit.issues.createLabel({
                    owner: GitHubAPI.owner,
                    repo: GitHubAPI.repo,
                    name: name,
                    color: config.color,
                    description: config.desc
                });
            }
        }
        Logger.success("Labels initialized.");
    } catch (err) {
        Logger.error("Init failed", err);
    }
}

if (require.main === module) {
    main();
}
