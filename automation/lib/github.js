const { Octokit } = require('@octokit/rest');
const Logger = require('./logger');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;

if (!GITHUB_TOKEN || !GITHUB_REPO) {
    Logger.error("Missing GITHUB_TOKEN or GITHUB_REPOSITORY environment variables.");
    process.exit(1);
}

const [owner, repo] = GITHUB_REPO.split('/');
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const GitHubAPI = {
    owner,
    repo,
    octokit,

    async getIssue(issueNumber) {
        try {
            const { data } = await octokit.issues.get({
                owner,
                repo,
                issue_number: parseInt(issueNumber)
            });
            return data;
        } catch (err) {
            Logger.error(`Failed to fetch issue #${issueNumber}`, err);
            throw err;
        }
    },

    async updateIssue(issueNumber, updates) {
        try {
            await octokit.issues.update({
                owner,
                repo,
                issue_number: parseInt(issueNumber),
                ...updates
            });
            Logger.success(`Updated issue #${issueNumber}`);
        } catch (err) {
            Logger.error(`Failed to update issue #${issueNumber}`, err);
            throw err;
        }
    },

    async createComment(issueNumber, body) {
        try {
            await octokit.issues.createComment({
                owner,
                repo,
                issue_number: parseInt(issueNumber),
                body
            });
            Logger.success(`Commented on issue #${issueNumber}`);
        } catch (err) {
            Logger.error(`Failed to comment on issue #${issueNumber}`, err);
            throw err;
        }
    },

    async addLabels(issueNumber, labels) {
        try {
            await octokit.issues.addLabels({
                owner,
                repo,
                issue_number: parseInt(issueNumber),
                labels
            });
        } catch (err) {
            Logger.error(`Failed to add labels to #${issueNumber}`, err);
        }
    },

    async removeLabel(issueNumber, name) {
        try {
            await octokit.issues.removeLabel({
                owner,
                repo,
                issue_number: parseInt(issueNumber),
                name
            });
        } catch (err) {
            // Ignore failure if label doesn't exist
        }
    }
};

module.exports = GitHubAPI;
