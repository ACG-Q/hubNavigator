const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');
const Shared = require('./lib/shared');

const DATA_DIR = path.join(__dirname, '../data/items');

async function main() {
    const issueNumber = process.env.ISSUE_NUMBER;
    const issueState = process.env.ISSUE_STATE?.toLowerCase() || 'open';

    if (!issueNumber) {
        Logger.error("ISSUE_NUMBER is required.");
        process.exit(1);
    }

    try {
        const issue = await GitHubAPI.getIssue(issueNumber);
        const labels = issue.labels.map(l => l.name);

        // Filter: kind:site, kind:correction, kind:domain-migration
        const isSite = labels.includes('kind:site');
        const isCorrection = labels.includes('kind:correction');
        const isMigration = labels.includes('kind:domain-migration');

        if (!isSite && !isCorrection && !isMigration) {
            Logger.info("Not a site-related issue. Skipping.");
            return;
        }

        const filePath = path.join(DATA_DIR, `${issueNumber}.json`);

        // Handle Closed
        if (issueState === 'closed') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.success(`Deleted data for closed issue #${issueNumber}`);
            }
            return;
        }

        // Parse Form
        const formData = Shared.parseForm(issue.body);
        const status = determineStatus(labels);

        // Triage Gate
        if (status === 'triage') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.info(`Removed triage data for #${issueNumber}`);
            }
            // We no longer write back to the issue body (no front-matter sync)
            return;
        }

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
        fs.writeFileSync(filePath, JSON.stringify(siteData, null, 2));
        Logger.success(`Saved site data for #${issueNumber}`);

    } catch (err) {
        Logger.error("Failed to process site issue", err);
    }
}

function determineStatus(labels) {
    if (labels.includes('triage')) return 'triage';
    if (labels.includes('status:active')) return 'active';
    if (labels.includes('status:warning')) return 'warning';
    if (labels.includes('status:broken')) return 'broken';
    if (labels.includes('status:duplicate')) return 'duplicate';
    return 'triage';
}

if (require.main === module) {
    main();
}
