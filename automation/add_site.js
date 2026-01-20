const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');
const Shared = require('./lib/shared');
const { LABELS } = require('./lib/constants');

const DATA_DIR = path.join(__dirname, '../data/items');

async function processSiteIssue(issueOrNumber, issueState = 'open') {
    try {
        const issue = typeof issueOrNumber === 'object' ? issueOrNumber : await GitHubAPI.getIssue(issueOrNumber);
        const issueNumber = issue.number;
        const labels = issue.labels.map(l => l.name);
        Logger.info(`Processing #${issueNumber} with labels: ${labels.join(', ')}`);

        // Filter
        const isSite = labels.includes(LABELS.KIND_SITE);
        const isUpdate = labels.includes(LABELS.OP_SITE_UPDATE);

        if (!isSite && !isUpdate) {
            Logger.info("Not a site-related issue. Skipping.");
            return { skipped: true, reason: "NOT_SITE_ISSUE" };
        }

        const filePath = path.join(DATA_DIR, `${issueNumber}.json`);

        // Handle Closed
        if (issueState === 'closed') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.success(`Deleted data for closed issue #${issueNumber}`);
            }
            return { success: true, action: "DELETED" };
        }

        // Parse Form
        const formData = Shared.parseForm(issue.body);
        const status = determineStatus(labels);

        Logger.info(`Form Data: ${JSON.stringify(formData)}`)

        // Map Data
        const siteData = {
            id: String(issueNumber),
            name: formData.site_name || formData.name,
            url: formData.site_url || formData.url || formData.new_site_url,
            categories: Shared.parseCheckboxes(formData.categories),
            cover: formData.cover_image || formData.cover || '',
            description: formData.description || formData.detailed_description || '',
            status: status,
            added_at: new Date().toISOString().split('T')[0],
            last_check: new Date().toISOString().split('T')[0] + ' 12:00'
        };

        // Save
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        Logger.info(`Writing JSON to: ${filePath}`);
        fs.writeFileSync(filePath, JSON.stringify(siteData, null, 2));
        Logger.success(`Saved site data for #${issueNumber}`);
        return { success: true, action: "SAVED", status, data: siteData };

    } catch (err) {
        Logger.error("Failed to process site issue", err);
        throw err;
    }
}

function determineStatus(labels) {
    if (labels.includes(LABELS.TRIAGE)) return 'triage';
    if (labels.includes(LABELS.STATUS_ACTIVE)) return 'active';
    if (labels.includes(LABELS.STATUS_WARNING)) return 'warning';
    if (labels.includes(LABELS.STATUS_BROKEN)) return 'broken';
    if (labels.includes(LABELS.STATUS_DUPLICATE)) return 'duplicate';
    return 'triage';
}

async function main() {
    const issueNumber = process.env.ISSUE_NUMBER;
    const issueState = process.env.ISSUE_STATE?.toLowerCase() || 'open';

    if (!issueNumber) {
        Logger.error("ISSUE_NUMBER is required.");
        return;
    }
    await processSiteIssue(issueNumber, issueState);
}

if (require.main === module) {
    main();
}

module.exports = { processSiteIssue, determineStatus };
