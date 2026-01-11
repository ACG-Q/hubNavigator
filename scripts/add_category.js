const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Octokit } = require('@octokit/rest');

const CATEGORIES_PATH = path.join(__dirname, '../config/categories.yaml');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

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

        if (rawKey.includes('分类 ID')) data.id = value;
        else if (rawKey.includes('中文名称')) data.name = value;
        else if (rawKey.includes('英文名称')) data.name_en = value;
        else if (rawKey.includes('图标')) data.icon = value;
        else if (rawKey.includes('中文描述')) data.description = value;
        else if (rawKey.includes('英文描述')) data.desc_en = value;
    });
    return data;
}

function updateTemplates(categories) {
    const templateFiles = [
        '.github/ISSUE_TEMPLATE/site_submission.yml',
        '.github/ISSUE_TEMPLATE/site_correction.yml'
    ];

    const options = categories.map(c => `${c.id} (${c.name})`);

    templateFiles.forEach(relPath => {
        const fullPath = path.join(__dirname, '..', relPath);
        if (!fs.existsSync(fullPath)) return;

        let content = fs.readFileSync(fullPath, 'utf8');
        try {
            // Find the category dropdown block and replace its options
            // This is a bit safer than full YAML reload to preserve comments/formatting
            const lines = content.split('\n');
            let inCategoryDropdown = false;
            let optionsStartIndex = -1;
            let optionsEndIndex = -1;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('id: category')) inCategoryDropdown = true;
                if (inCategoryDropdown && lines[i].includes('options:')) {
                    optionsStartIndex = i + 1;
                    // Find where options end (next field at same indentation or end of file)
                    for (let j = i + 1; j < lines.length; j++) {
                        if (lines[j].trim() === '' || (lines[j].match(/^\s{2,6}\w+:/) && !lines[j].includes('- '))) {
                            optionsEndIndex = j;
                            break;
                        }
                    }
                    if (optionsEndIndex === -1) optionsEndIndex = lines.length;
                    break;
                }
            }

            if (optionsStartIndex !== -1 && optionsEndIndex !== -1) {
                const newOptionsLines = options.map(opt => `        - ${opt}`);
                lines.splice(optionsStartIndex, optionsEndIndex - optionsStartIndex, ...newOptionsLines);
                fs.writeFileSync(fullPath, lines.join('\n'));
                console.log(`✅ Updated template: ${relPath}`);
            }
        } catch (err) {
            console.error(`Failed to update template ${relPath}:`, err);
        }
    });
}

async function main() {
    if (!ISSUE_NUMBER || !GITHUB_REPO) {
        console.error("Missing ISSUE_NUMBER or GITHUB_REPOSITORY");
        process.exit(1);
    }

    const [owner, repo] = GITHUB_REPO.split('/');

    try {
        const { data: issue } = await octokit.issues.get({
            owner,
            repo,
            issue_number: parseInt(ISSUE_NUMBER)
        });

        const newCat = parseFormBody(issue.body);

        if (!newCat.id || !newCat.name) {
            console.error("Could not parse category information from issue body.");
            process.exit(1);
        }

        // Load existing categories
        let categories = yaml.load(fs.readFileSync(CATEGORIES_PATH, 'utf8')) || [];

        // Check for duplicates
        if (categories.some(c => c.id === newCat.id)) {
            console.log(`Category with ID '${newCat.id}' already exists. Skipping.`);
        } else {
            // Add new category
            categories.push(newCat);
            // Save back to YAML
            fs.writeFileSync(CATEGORIES_PATH, yaml.dump(categories, { indent: 2, charset: 'utf-8' }));
            console.log(`✅ Successfully added category to YAML: ${newCat.name} (${newCat.id})`);
        }

        // Sync to Issue Templates
        updateTemplates(categories);

        // Close and comment on issue
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: parseInt(ISSUE_NUMBER),
            body: `✅ **Automated Action**: Category \`${newCat.name}\` has been added to the system and issue templates have been updated.`
        });

        await octokit.issues.update({
            owner,
            repo,
            issue_number: parseInt(ISSUE_NUMBER),
            state: 'closed',
            labels: ['status:active']
        });

    } catch (e) {
        console.error("Failed to add category:", e);
        process.exit(1);
    }
}

main();
