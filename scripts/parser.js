const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const { Octokit } = require('@octokit/rest');

// Config
const CATEGORIES_PATH = path.join(__dirname, '../config/categories.yaml');
const ITEMS_DIR = path.join(__dirname, '../data/items');

// Load Categories
const categories = yaml.load(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
const validCategoryIds = categories.map(c => c.id);

// GitHub Client
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;

const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

/**
 * Parsed Issue Form Body (Markdown) into a key-value object.
 */
function parseFormBody(body) {
    const data = {};
    const sections = body.split(/^###\s+/m);

    sections.forEach(section => {
        if (!section.trim()) return;

        const splitIdx = section.indexOf('\n');
        if (splitIdx === -1) return;

        const rawKey = section.substring(0, splitIdx).trim();
        const value = section.substring(splitIdx).trim();

        if (value === '_No response_') return;

        // Map Keys to Fields
        if (rawKey.includes('站点名称')) data.name = value;
        else if (rawKey.includes('链接地址')) data.url = value;
        else if (rawKey.includes('原站点链接')) data.original_url = value;
        else if (rawKey.includes('新站点链接')) data.new_url = value;
        else if (rawKey.includes('站点 ID')) data.target_id = value;
        else if (rawKey.includes('核心分类')) {
            // Checkboxes format:
            // - [ ] id (Name)
            // - [x] id (Name)
            const lines = value.split('\n');
            data.categories = lines
                .filter(l => l.trim().startsWith('- [x]'))
                .map(l => {
                    const match = l.match(/- \[x\]\s+([\w-]+)\s*/);
                    return match ? match[1] : null;
                })
                .filter(Boolean);
        }
        else if (rawKey.includes('封面图')) data.cover = value;
        else if (rawKey.includes('详细介绍') || rawKey.includes('变更说明') || rawKey.includes('修正说明')) {
            // Ensure double newlines so they don't "clump" in markdown
            data.description = value.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim()).join('\n\n');
        }
    });
    return data;
}

async function updateIssueBody(owner, repo, issue_number, newBody) {
    if (!octokit) {
        console.warn("No GITHUB_TOKEN, skipping Issue Update.");
        return;
    }
    try {
        await octokit.issues.update({
            owner,
            repo,
            issue_number,
            body: newBody
        });
        console.log(`[UPDATE] Issue #${issue_number} body normalized to Front Matter.`);
    } catch (e) {
        console.error("Failed to update issue:", e);
    }
}

async function main() {
    const issueBody = process.env.ISSUE_BODY;
    let issueId = process.env.ISSUE_ID || 'test';

    if (!issueBody) {
        console.log("No ISSUE_BODY provided.");
        return;
    }

    // Check Format
    const isFrontMatter = issueBody.startsWith('---');
    let itemData = {};
    let descriptionRaw = "";

    if (isFrontMatter) {
        console.log("Format: Front Matter detected.");
        const parsed = matter(issueBody);
        itemData = parsed.data;
        descriptionRaw = parsed.content;
    } else {
        console.log("Format: Raw Form detected. Normalizing...");
        const formData = parseFormBody(issueBody);

        // Determine if it's a migration or correction
        const labels = (process.env.ISSUE_LABELS || '').split(',');
        const isMigration = labels.includes('kind:domain-migration');
        const isCorrection = labels.includes('kind:correction');

        const now = new Date().toISOString().split('T')[0];

        if (isMigration) {
            let targetId = formData.target_id || '';
            const idMatch = targetId.match(/(?:site_issue_)?(\d+)/);
            if (idMatch) targetId = idMatch[1];

            itemData = {
                id: issueId,
                target_id: targetId,
                url: formData.new_url,
                added_at: now,
                status: 'triage',
                type: 'migration'
            };
        } else if (isCorrection) {
            // Try to extract ID from name input if it looks like a number or site_issue_XXX
            let targetId = formData.name;
            const idMatch = formData.name.match(/(?:site_issue_)?(\d+)/);
            if (idMatch) targetId = idMatch[1];

            itemData = {
                id: issueId,
                target_id: targetId,
                name: formData.name,
                url: formData.url,
                categories: formData.categories || [],
                status: 'triage',
                type: 'correction'
            };
        } else {
            // Default: New Site Submission
            if (!formData.name || !formData.url) {
                console.error("Missing required fields in form data.");
                process.exit(1);
            }
            itemData = {
                id: issueId,
                name: formData.name,
                url: formData.url,
                categories: formData.categories || [],
                cover: formData.cover || '',
                added_at: now,
                last_check: `${now} 00:00`,
                status: 'active' // Sites are active by default (triage label controls visibility if desired, but we use status)
            };
        }

        descriptionRaw = formData.description;

        // Construct New Body ALWAYS as front-matter
        const newBody = matter.stringify(descriptionRaw, itemData);

        // Update GitHub Issue to persist normalized data
        if (GITHUB_REPO && ISSUE_NUMBER) {
            const [owner, repo] = GITHUB_REPO.split('/');
            await updateIssueBody(owner, repo, parseInt(ISSUE_NUMBER), newBody);
        }
    }

    // Generate JSON Artifact
    const jsonOutput = {
        ...itemData,
        description_md: descriptionRaw.trim()
    };

    // Ensure data/items exists
    if (!fs.existsSync(ITEMS_DIR)) {
        fs.mkdirSync(ITEMS_DIR, { recursive: true });
    }

    // Use ISSUE_ID for filename
    const filePath = path.join(ITEMS_DIR, `site_issue_${issueId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`Generated: ${filePath}`);
}

main();
