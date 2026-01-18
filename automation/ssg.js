const fs = require('fs');
const path = require('path');
const Logger = require('./lib/logger');

const DIST_DIR = path.join(__dirname, '../dist');
const SITE_ALL_FILE = path.join(__dirname, '../data/site_all.json');

async function main() {
    Logger.info("Starting SSG generation...");

    if (!fs.existsSync(SITE_ALL_FILE)) {
        Logger.error("site_all.json not found. Run aggregate first.");
        return;
    }

    const sites = JSON.parse(fs.readFileSync(SITE_ALL_FILE, 'utf8'));
    const templatePath = path.join(DIST_DIR, 'index.html');

    if (!fs.existsSync(templatePath)) {
        Logger.error("dist/index.html not found. Run build first.");
        return;
    }

    const template = fs.readFileSync(templatePath, 'utf8');

    // Create site directory
    const siteDir = path.join(DIST_DIR, 'site');
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    sites.forEach(site => {
        const filePath = path.join(siteDir, `${site.id}.html`);
        // Simple SSR: In a real app, we might inject metadata here
        // For now, we just copy index.html so the route works on direct access (SPA fallback)
        // and potentially inject some meta tags for SEO.
        let html = template;

        const metaTags = `
    <title>${site.name} - HubNavigator</title>
    <meta name="description" content="${site.description}">
    <meta property="og:title" content="${site.name}">
    <meta property="og:description" content="${site.description}">
    <meta property="og:url" content="/site/${site.id}">
`;
        html = html.replace('</head>', `${metaTags}\n</head>`);

        fs.writeFileSync(filePath, html);
    });

    Logger.success(`Generated ${sites.length} static pages for SEO.`);
}

if (require.main === module) {
    main();
}
