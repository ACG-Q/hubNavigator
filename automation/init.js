const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');

const PROJECT_LABELS = {
    "status:active": { color: "0e8a16", desc: "Verified and active site" },
    "status:warning": { color: "fbca04", desc: "Site has accessibility issues" },
    "status:broken": { color: "d93f0b", desc: "Site is offline or link is broken" },
    "status:duplicate": { color: "cfd3d7", desc: "Duplicate submission" },
    "triage": { color: "ededed", desc: "Awaiting approval" },
    "kind:site": { color: "1d76db", desc: "New site submission" },
    "kind:correction": { color: "5319e7", desc: "Request to fix site info" },
    "kind:domain-migration": { color: "e99695", desc: "Site domain change" },
    "kind:new-category": { color: "c2e0c6", desc: "New category proposal" }
};

async function main() {
    Logger.info("Initializing project environment...");

    try {
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
