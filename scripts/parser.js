const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const { Octokit } = require('@octokit/rest');

// Config
const CATEGORIES_PATH = path.join(__dirname, '../config/categories.yaml');
const ITEMS_DIR = path.join(__dirname, '../data/items');

// GitHub Client
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const ISSUE_LABELS_STR = process.env.ISSUE_LABELS || '';
const ISSUE_STATE = process.env.ISSUE_STATE || 'open'; // Default to open if missing

const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

/**
 * Determine site status from labels
 */
function determineStatus(labels) {
    if (labels.includes('triage')) return 'triage';
    if (labels.includes('status:warning')) return 'warning';
    if (labels.includes('status:broken')) return 'broken';
    if (labels.includes('status:active')) return 'active';

    // 默认值：如果没有以上任何标签，设为 triage 以保安全
    return 'triage';
}

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
            data.description = value.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim()).join('\n\n');
        }
    });
    return data;
}

async function updateIssueBody(owner, repo, issue_number, newBody) {
    if (!octokit) return;
    try {
        await octokit.issues.update({
            owner, repo, issue_number, body: newBody
        });
        console.log(`[UPDATE] Issue #${issue_number} body updated.`);
    } catch (e) {
        console.error("Failed to update issue:", e);
    }
}

async function main() {
    const issueBody = process.env.ISSUE_BODY;
    let issueId = process.env.ISSUE_ID || 'test';
    const labels = ISSUE_LABELS_STR.split(',').map(l => l.trim()).filter(Boolean);

    // Handle Closed Issues (Delete Data)
    if (ISSUE_STATE.toLowerCase() === 'closed') {
        const filePath = path.join(ITEMS_DIR, `site_issue_${issueId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[DELETE] Issue #${issueId} is closed. Deleted ${filePath}`);
        } else {
            console.log(`[SKIP] Issue #${issueId} is closed, but ${filePath} does not exist.`);
        }
        return; // Exit script
    }

    if (!issueBody) {
        console.log("No ISSUE_BODY provided.");
        return;
    }

    // Determine Logic based on Labels/Type
    const isMigration = labels.includes('kind:domain-migration');
    const isCorrection = labels.includes('kind:correction');
    const isSite = labels.includes('kind:site');

    // Determine Status from Labels (Source of Truth)
    const currentStatus = determineStatus(labels);

    // Initial Parsing
    let itemData = {};
    let descriptionRaw = "";
    const isFrontMatter = issueBody.startsWith('---');

    if (isFrontMatter) {
        console.log("Format: Front Matter detected.");
        const parsed = matter(issueBody);
        itemData = parsed.data;
        descriptionRaw = parsed.content;
    } else {
        console.log("Format: Raw Form detected. Normalizing...");
        const formData = parseFormBody(issueBody);

        // Initial Defaults based on Type
        if (isMigration) {
            let targetId = formData.target_id || '';
            const idMatch = targetId.match(/(?:site_issue_)?(\d+)/);
            if (idMatch) targetId = idMatch[1];
            itemData = {
                id: issueId, target_id: targetId, url: formData.new_url,
                added_at: new Date().toISOString().split('T')[0], type: 'migration'
            };
        } else if (isCorrection) {
            let targetId = formData.name; // User might put ID in name field
            const idMatch = formData.name ? formData.name.match(/(?:site_issue_)?(\d+)/) : null;
            if (idMatch) targetId = idMatch[1];
            itemData = {
                id: issueId, target_id: targetId, name: formData.name, url: formData.url,
                categories: formData.categories || [], type: 'correction'
            };
        } else {
            // Default Site
            if (!formData.name || !formData.url) {
                console.error("Missing required fields.");
                process.exit(1);
            }
            itemData = {
                id: issueId, name: formData.name, url: formData.url,
                categories: formData.categories || [], cover: formData.cover || '',
                added_at: new Date().toISOString().split('T')[0],
                last_check: `${new Date().toISOString().split('T')[0]} 00:00`
            };
        }
        descriptionRaw = formData.description || '';
    }

    // Force Update Status from Labels (if it's a site)
    // For corrections/migrations, we usually keep them in triage until merged.
    if (!isMigration && !isCorrection) {
        // It's a site (or untyped).
        // Check if status changed
        if (itemData.status !== currentStatus) {
            console.log(`[STATUS CHANGE] ${itemData.status} -> ${currentStatus}`);
            itemData.status = currentStatus;
        }
    } else {
        // For Ops issues, usually fixed 'triage'.
        itemData.status = 'triage';
    }

    // Generate New Body
    const newBody = matter.stringify(descriptionRaw, itemData);

    // Check if body update is needed
    // Normalize newlines for comparison
    const normalizedCurrent = issueBody.replace(/\r\n/g, '\n').trim();
    const normalizedNew = newBody.replace(/\r\n/g, '\n').trim();

    if (normalizedCurrent !== normalizedNew) {
        if (GITHUB_REPO && ISSUE_NUMBER) {
            const [owner, repo] = GITHUB_REPO.split('/');
            await updateIssueBody(owner, repo, parseInt(ISSUE_NUMBER), newBody);
        }
    } else {
        console.log("[SKIP] Issue Body is already up to date.");
    }

    // Generate JSON (only for sites or logic that needs it)
    // We generate JSON for all types so they can be processed? 
    // Actually we only need JSON for 'kind:site' usually.
    // Ops workflows rely on JSON for metadata too.

    const jsonOutput = { ...itemData, description_md: descriptionRaw.trim() };

    if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });

    // Use ISSUE_ID for filename
    const filePath = path.join(ITEMS_DIR, `site_issue_${issueId}.json`);
    const newJsonContent = JSON.stringify(jsonOutput, null, 2);

    if (fs.existsSync(filePath)) {
        const currentJson = fs.readFileSync(filePath, 'utf8');
        if (currentJson.trim() === newJsonContent.trim()) {
            console.log(`[SKIP] No changes detected for ${filePath}. Skipping write.`);
            return;
        }
    }

    fs.writeFileSync(filePath, newJsonContent);
    console.log(`Generated: ${filePath}`);
}

main();
