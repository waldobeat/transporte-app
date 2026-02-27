require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');

async function main() {
    const sqlite = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    const sql = fs.readFileSync('prisma/schema.sql', 'utf8');
    console.log('Applying SQL to Turso...');
    await sqlite.executeMultiple(sql);
    console.log('Schema successfully applied!');
}

main().catch(console.error);
