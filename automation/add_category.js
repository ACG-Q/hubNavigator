const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');
const Shared = require('./lib/shared');

const CATEGORY_ITEMS_DIR = path.join(__dirname, '../data/category_items');

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

        if (!labels.includes('kind:new-category')) {
            Logger.info("Not a category issue. Skipping.");
            return;
        }

        const filePath = path.join(CATEGORY_ITEMS_DIR, `${issueNumber}.json`);

        // Handle Closed
        if (issueState === 'closed') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.success(`Deleted category data for closed issue #${issueNumber}`);
            }
            return;
        }

        const status = labels.includes('triage') ? 'triage' : 'active';
        if (status === 'triage') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.info(`Removed triage category data for #${issueNumber}`);
            }
            return;
        }

        const formData = Shared.parseForm(issue.body);
        const categoryId = formData.category_id || formData.id;

        if (!categoryId) {
            Logger.error("Category ID not found in issue form.");
            return;
        }

        const newCategory = {
            id: categoryId,
            name: formData.chinese_name || formData.name,
            name_en: formData.english_name || formData.name_en,
            icon: formData.icon,
            description: formData.chinese_description || formData.description,
            desc_en: formData.english_description || formData.desc_en,
            status: status
        };

        if (!fs.existsSync(CATEGORY_ITEMS_DIR)) fs.mkdirSync(CATEGORY_ITEMS_DIR, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(newCategory, null, 2));
        Logger.success(`Saved category data for #${issueNumber}`);

    } catch (err) {
        Logger.error("Failed to process category issue", err);
    }
}

if (require.main === module) {
    main();
}
