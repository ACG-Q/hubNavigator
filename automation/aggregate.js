const fs = require('fs');
const path = require('path');
const Logger = require('./lib/logger');

const ITEMS_DIR = path.join(__dirname, '../data/items');
const CATEGORY_ITEMS_DIR = path.join(__dirname, '../data/category_items');
const CATEGORY_ALL_FILE = path.join(__dirname, '../data/category_all.json');
const DEFAULT_CATEGORY_FILE = path.join(__dirname, '../data/category_all_defualt.json');
const SITE_ALL_FILE = path.join(__dirname, '../data/site_all.json');
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');

// Load Site Config
let SITE_URL = 'https://acg-q.github.io/HubNavigator';
try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'));
    SITE_URL = config.siteUrl;
} catch (e) { }

async function main() {
    Logger.info("Starting data aggregation...");

    // 1. Aggregate Sites
    const siteItems = [];
    if (fs.existsSync(ITEMS_DIR)) {
        const siteFiles = fs.readdirSync(ITEMS_DIR).filter(f => f.endsWith('.json'));
        siteFiles.forEach(file => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(ITEMS_DIR, file), 'utf8'));
                if (data.status === 'active' || data.status === 'warning') {
                    siteItems.push(data);
                }
            } catch (e) {
                Logger.error(`Failed to parse site item ${file}`, e);
            }
        });
    }
    fs.writeFileSync(SITE_ALL_FILE, JSON.stringify(siteItems, null, 2));
    Logger.success(`Aggregated ${siteItems.length} sites.`);

    // 2. Aggregate Categories
    let categoryItems = [];

    // Load default categories first
    if (fs.existsSync(DEFAULT_CATEGORY_FILE)) {
        try {
            categoryItems = JSON.parse(fs.readFileSync(DEFAULT_CATEGORY_FILE, 'utf8'));
            Logger.info(`Loaded ${categoryItems.length} default categories.`);
        } catch (e) {
            Logger.error("Failed to load default categories", e);
        }
    }

    if (fs.existsSync(CATEGORY_ITEMS_DIR)) {
        const catFiles = fs.readdirSync(CATEGORY_ITEMS_DIR).filter(f => f.endsWith('.json'));
        catFiles.forEach(file => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(CATEGORY_ITEMS_DIR, file), 'utf8'));
                if (data.status === 'active') {
                    // Check if already exists by id to avoid duplicates
                    const existingIndex = categoryItems.findIndex(c => c.id === data.id);
                    if (existingIndex > -1) {
                        categoryItems[existingIndex] = data;
                    } else {
                        categoryItems.push(data);
                    }
                }
            } catch (e) {
                Logger.error(`Failed to parse category item ${file}`, e);
            }
        });
    }
    fs.writeFileSync(CATEGORY_ALL_FILE, JSON.stringify(categoryItems, null, 2));
    Logger.success(`Aggregated ${categoryItems.length} categories.`);

    // 3. Sync Templates
    await syncCategoryTemplates(categoryItems);

    // 4. Generate Sitemap
    generateSitemap(siteItems);
}

async function syncCategoryTemplates(categories) {
    const templateFiles = [
        '.github/ISSUE_TEMPLATE/site_submission.yml',
        '.github/ISSUE_TEMPLATE/site_correction.yml'
    ];
    const options = categories.map(c => `${c.id} (${c.name})`);

    for (const relPath of templateFiles) {
        const fullPath = path.join(__dirname, '..', relPath);
        if (!fs.existsSync(fullPath)) continue;

        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            let optionsStartIndex = -1;
            let optionsEndIndex = -1;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('options:') && i > 0 && lines[i - 1].includes('categories')) {
                    optionsStartIndex = i + 1;
                    for (let j = i + 1; j < lines.length; j++) {
                        if (lines[j].trim() === '' || (lines[j].match(/^\s{2,6}\w+:/) && !lines[j].includes('- '))) {
                            optionsEndIndex = j;
                            break;
                        }
                    }
                    break;
                }
            }

            if (optionsStartIndex !== -1) {
                if (optionsEndIndex === -1) optionsEndIndex = lines.length;
                const newOptions = options.map(opt => `        - label: ${opt}`);
                lines.splice(optionsStartIndex, optionsEndIndex - optionsStartIndex, ...newOptions);
                fs.writeFileSync(fullPath, lines.join('\n'));
                Logger.info(`Updated template: ${relPath}`);
            }
        } catch (e) {
            Logger.error(`Failed to update template ${relPath}`, e);
        }
    }
}

function generateSitemap(items) {
    Logger.info("Generating sitemap...");
    const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    items.forEach(item => {
        xml += `  <url>
    <loc>${baseUrl}/site/${item.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    xml += `</urlset>`;
    fs.writeFileSync(SITEMAP_PATH, xml);
    Logger.success("Sitemap updated.");
}

if (require.main === module) {
    main();
}
