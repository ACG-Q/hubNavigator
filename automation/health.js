const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const GitHubAPI = require('./lib/github');
const Logger = require('./lib/logger');

const ITEMS_DIR = path.join(__dirname, '../data/items');

async function checkUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const options = {
            timeout: 10000,
            headers: { 'User-Agent': 'HubNavigatorBot/1.0' }
        };

        try {
            const req = client.get(url, options, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        } catch (e) {
            resolve(false);
        }
    });
}

async function main() {
    Logger.info("Starting health check...");

    if (!fs.existsSync(ITEMS_DIR)) return;

    const files = fs.readdirSync(ITEMS_DIR).filter(f => f.endsWith('.json'));
    // Sort by last_check (oldest first) and limit to 50
    const items = files.map(f => ({
        file: f,
        data: JSON.parse(fs.readFileSync(path.join(ITEMS_DIR, f), 'utf8'))
    })).sort((a, b) => (a.data.last_check || '').localeCompare(b.data.last_check || '')).slice(0, 50);

    for (const item of items) {
        const { data, file } = item;
        Logger.info(`Checking: ${data.name} (${data.url})`);

        const isAlive = await checkUrl(data.url);
        data.last_check = new Date().toISOString().replace('T', ' ').slice(0, 16);

        if (isAlive) {
            data.fail_count = 0;
            if (data.status === 'warning' || data.status === 'broken') {
                data.status = 'active';
                await GitHubAPI.removeLabel(data.id, 'status:broken');
                await GitHubAPI.removeLabel(data.id, 'status:warning');
                await GitHubAPI.addLabels(data.id, ['status:active']);
            }
        } else {
            data.fail_count = (data.fail_count || 0) + 1;
            if (data.fail_count >= 3) {
                data.status = 'broken';
                await GitHubAPI.removeLabel(data.id, 'status:active');
                await GitHubAPI.removeLabel(data.id, 'status:warning');
                await GitHubAPI.addLabels(data.id, ['status:broken']);

                // 通知管理员 | Notify Admins
                const admins = getAdmins();
                const mention = admins.map(a => `@${a}`).join(' ');
                const message = `${mention}\n\n⚠️ **站点检测异常** | Site health check failed.\n\n该站点已连续 3 次探测失败，状态已变更为 \`broken\`。请检查站点是否可用并决定是否保留。\nThis site has failed 3 consecutive checks and status has been set to \`broken\`. Please check the site availability.`;
                await GitHubAPI.createComment(data.id, message);
            } else {
                data.status = 'warning';
                await GitHubAPI.removeLabel(data.id, 'status:active');
                await GitHubAPI.addLabels(data.id, ['status:warning']);
            }
        }

        fs.writeFileSync(path.join(ITEMS_DIR, file), JSON.stringify(data, null, 2));
    }

    Logger.success("Health check complete.");
}

function getAdmins() {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
    try {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'));
        const extraAdmins = Array.isArray(config.admins) ? config.admins : [];
        const admins = new Set([owner, ...extraAdmins]);
        return Array.from(admins);
    } catch (e) {
        return [owner];
    }
}

if (require.main === module) {
    main();
}
