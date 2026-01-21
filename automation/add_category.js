const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');
const Shared = require('./lib/shared');
const { LABELS } = require('./lib/constants');

const CATEGORY_ITEMS_DIR = path.join(__dirname, '../data/category_items');

async function processCategoryIssue(issueOrNumber, issueState = 'open') {
    try {
        const issue = typeof issueOrNumber === 'object' ? issueOrNumber : await GitHubAPI.getIssue(issueOrNumber);
        const issueNumber = issue.number;
        const labels = issue.labels.map(l => l.name);
        Logger.info(`Processing Category #${issueNumber} with labels: ${labels.join(', ')}`);

        if (!labels.includes(LABELS.KIND_CATEGORY) && !labels.includes(LABELS.OP_CATEGORY_DELETE)) {
            Logger.info("Not a category issue. Skipping.");
            return { skipped: true, reason: "NOT_CATEGORY_ISSUE" };
        }

        if (labels.includes(LABELS.OP_CATEGORY_DELETE) && issueState === 'open') {
            Logger.info("Category deletion issue. Skipping standard save.");
            return { skipped: true, reason: "DELETION_ISSUE" };
        }

        const filePath = path.join(CATEGORY_ITEMS_DIR, `${issueNumber}.json`);

        // Handle Closed
        if (issueState === 'closed') {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.success(`Deleted category data for closed issue #${issueNumber}`);
            }
            return { success: true, action: "DELETED" };
        }

        const status = labels.includes(LABELS.TRIAGE) ? 'triage' : 'active';

        const formData = Shared.parseForm(issue.body);
        Logger.info(`Category Form Data: ${JSON.stringify(formData)}`);
        const categoryId = formData.category_id || formData.id;

        if (!categoryId) {
            Logger.error("Category ID not found in issue form.");
            return { success: false, reason: "MISSING_CAT_ID" };
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
        Logger.info(`Writing Category JSON to: ${filePath}`);
        fs.writeFileSync(filePath, JSON.stringify(newCategory, null, 2));
        Logger.success(`Saved category data for #${issueNumber}`);
        return { success: true, action: "SAVED", status, data: newCategory };

    } catch (err) {
        Logger.error("Failed to process category issue", err);
        throw err;
    }
}

async function main() {
    const issueNumber = process.env.ISSUE_NUMBER;
    const issueState = process.env.ISSUE_STATE?.toLowerCase() || 'open';

    if (!issueNumber) {
        Logger.error("ISSUE_NUMBER is required.");
        return;
    }
    await processCategoryIssue(issueNumber, issueState);
}

if (require.main === module) {
    main();
}

module.exports = { processCategoryIssue };
