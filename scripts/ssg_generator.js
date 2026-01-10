const fs = require('fs');
const path = require('path');

// Paths
const DIST_DIR = path.join(__dirname, '../dist');
const SITE_ALL_PATH = path.join(__dirname, '../data/site_all.json');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

function main() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error("Error: dist/ directory not found. Run 'npm run build' first.");
        process.exit(1);
    }
    if (!fs.existsSync(SITE_ALL_PATH)) {
        console.error("Error: site_all.json not found.");
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const sites = JSON.parse(fs.readFileSync(SITE_ALL_PATH, 'utf8'));

    console.log(`Generating static pages for ${sites.length} sites...`);

    let count = 0;
    sites.forEach(site => {
        // 1. Prepare Directory
        const siteDir = path.join(DIST_DIR, 'site', site.id);
        if (!fs.existsSync(siteDir)) {
            fs.mkdirSync(siteDir, { recursive: true });
        }

        // 2. Inject Meta Tags
        // Simple string replacement only works if index.html has a placeholder, 
        // OR we inject into <head>.

        const metaTags = `
    <meta property="og:title" content="${site.name} - HubNavigator" />
    <meta property="og:description" content="${site.description_md.substring(0, 150).replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${site.cover || ''}" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>${site.name} - HubNavigator</title>
        `;

        // We replace </head> with metaTags + </head>
        const finalHtml = template.replace('</head>', `${metaTags}\n  </head>`);

        fs.writeFileSync(path.join(siteDir, 'index.html'), finalHtml);
        count++;
    });

    console.log(`✅ Generated ${count} pages in dist/site/`);
}

main();
