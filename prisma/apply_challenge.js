require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
    const sqlite = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('Creating AuthChallenge table...');
    await sqlite.execute(`
    CREATE TABLE "AuthChallenge" (
        "id" TEXT NOT NULL,
        "challenge" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
    );
  `);
    console.log('Table successfully created!');
}

main().catch(console.error);
