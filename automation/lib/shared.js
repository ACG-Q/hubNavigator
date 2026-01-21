/**
 * Form Label to JSON Key mapping
 * Ensures English keys even if issue templates use Chinese labels
 */
const { LABELS } = require('./constants');

const FIELD_MAP = {
    "站点名称 (Name)": "site_name",
    "站点 ID (Site ID)": "site_id",
    "站点链接": "site_url",
    "站点链接 (URL)": "site_url",
    "新站点链接": "new_site_url",
    "旧站点链接": "old_site_url",
    "分类 (Categories)": "categories",
    "分类": "categories",
    "站点封面 (Cover)": "cover",
    "站点描述 (Description)": "description",
    "详细描述 (Detailed Description)": "description",
    "分类 ID (Category ID)": "id",
    "分类名称 (中文)": "name",
    "分类名称 (英文 - English Name)": "name_en",
    "分类图标 (Icon)": "icon",
    "分类描述 (中文)": "description",
    "分类描述 (英文 - English Description)": "desc_en"
};

const BaseParser = {
    /**
     * Parse GitHub Issue Form Body
     * Matches "### Label\n\nValue"
     */
    parseForm(body) {
        const data = {};
        const sections = body.split(/^###\s+/m);

        sections.forEach(section => {
            if (!section.trim()) return;

            const lines = section.trim().split('\n');
            const rawKey = lines[0].trim();
            const value = lines.slice(1).join('\n').trim();

            if (value === '_No response_') return;

            const slug = this.slugifyKey(rawKey);
            data[slug] = value;
        });
        return data;
    },

    slugifyKey(key) {
        // Priority 1: Map from Chinese label to English ID
        if (FIELD_MAP[key]) return FIELD_MAP[key];

        // Priority 2: Standard slugify
        return key.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '_');
    },

    parseCheckboxes(value) {
        if (!value) return [];
        return value.split('\n')
            .filter(line => line.includes('[x]'))
            .map(line => {
                const match = line.match(/\[x\]\s*(.*?)\s*(?:\(|$)/);
                return match ? match[1].trim() : null;
            })
            .filter(Boolean);
    }
};

module.exports = BaseParser;
