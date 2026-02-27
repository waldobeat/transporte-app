require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
    const sqlite = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('Altering Passenger table...');
    await sqlite.execute('ALTER TABLE "Passenger" ADD COLUMN "currentChallenge" TEXT;');
    console.log('Schema successfully altered!');
}

main().catch(console.error);
