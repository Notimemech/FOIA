const db = require('./db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        console.log("Starting DB migration...");
        
        // Drop existing tables
        await db.query(`
            DROP TABLE IF EXISTS assessments CASCADE;
            DROP TABLE IF EXISTS questions CASCADE;
            DROP TABLE IF EXISTS ai_context_caches CASCADE;
            DROP TABLE IF EXISTS ai_model_configs CASCADE;
        `);
        console.log("Dropped existing tables to ensure clean slate.");

        const sqlFilePath = path.join(__dirname, '../db/db.sql');
        const sqlString = fs.readFileSync(sqlFilePath, 'utf8');

        // Execute the entire SQL script
        await db.query(sqlString);
        console.log("Database initialized successfully with db.sql!");
        
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
