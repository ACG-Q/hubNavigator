const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../data');
const ITEMS_DIR = path.join(DATA_DIR, 'items');
const PUBLIC_DIR = path.join(__dirname, '../public');
const SITE_ALL_PATH = path.join(DATA_DIR, 'site_all.json');
const CATEGORIES_PATH = path.join(__dirname, '../config/categories.yaml');
const CATEGORIES_JSON_PATH = path.join(DATA_DIR, 'categories.json');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Base URL for sitemap
const BASE_URL = 'https://liuji.github.io/HubNavigator';

function main() {
    if (!fs.existsSync(ITEMS_DIR)) {
        console.log("No items directory found.");
        return;
    }

    const files = fs.readdirSync(ITEMS_DIR);
    const sites = [];

    // 1. Iterate all item JSONs
    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        try {
            const content = fs.readFileSync(path.join(ITEMS_DIR, file), 'utf8');
            const data = JSON.parse(content);

            // Filter: Only Active or Warning
            if (data.status === 'broken' || data.status === 'triage') {
                return;
            }

            // Push lightweight object
            sites.push({
                id: data.id,
                name: data.name,
                url: data.url, // Original URL
                categories: data.categories,
                cover: data.cover,
                description_md: data.description_md, // Frontend handles truncation or we truncate here
                status: data.status,
                // visit_count: data.visit_count || 0 // Future v2
            });

        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    });

    // 2. Sort by ID or Added Date (Desc)
    sites.sort((a, b) => b.id.localeCompare(a.id));

    // 3. Write site_all.json
    fs.writeFileSync(SITE_ALL_PATH, JSON.stringify(sites, null, 2));
    console.log(`Generated ${SITE_ALL_PATH} with ${sites.length} items.`);

    // 3.1 Synchronize categories.json
    try {
        const categoriesData = yaml.load(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
        fs.writeFileSync(CATEGORIES_JSON_PATH, JSON.stringify(categoriesData, null, 2));
        console.log(`Synchronized ${CATEGORIES_JSON_PATH}`);
    } catch (e) {
        console.error("Failed to sync categories.json:", e);
    }

    // 4. Generate Sitemap
    const urls = sites.map(site => `
  <url>
    <loc>${BASE_URL}/site/${site.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    // Add static pages
    const staticUrls = `
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>`;

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${urls}
</urlset>`;

    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`Generated ${SITEMAP_PATH}`);
}

main();
