/**
 * Unified Logger Utility
 */
const Logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg, err) => {
        console.error(`[ERROR] ${msg}`);
        if (err) console.error(err);
    },
    success: (msg) => console.log(`[SUCCESS] ${msg}`)
};

module.exports = Logger;
