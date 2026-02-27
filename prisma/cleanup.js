require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
    const sqlite = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('Dropping AuthChallenge table...');
    await sqlite.execute(`DROP TABLE IF EXISTS "AuthChallenge"`);

    // Also drop columns from Passenger (SQLite doesn't support DROP COLUMN well natively in old versions, but Turso LibSQL might. If this fails, we just leave the columns)
    try {
        await sqlite.execute(`ALTER TABLE "Passenger" DROP COLUMN "currentChallenge"`);
    } catch (e) {
        console.log('Could not drop currentChallenge, it will be ignored by Prisma');
    }

    console.log('Cleanup successful!');
}

main().catch(console.error);
