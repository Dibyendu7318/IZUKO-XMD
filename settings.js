const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'settings.json');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function getSetting(section, key, defaultValue = false) {
    const db = loadDB();
    if (db[section] && db[section][key] !== undefined) {
        return db[section][key];
    }
    return defaultValue;
}

function setSetting(section, key, value) {
    const db = loadDB();
    if (!db[section]) db[section] = {};
    db[section][key] = value;
    saveDB(db);
}

module.exports = { getSetting, setSetting };
