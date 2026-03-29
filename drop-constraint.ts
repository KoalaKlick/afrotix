import { PrismaClient } from "./lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log("Dropping unique constraint 'votes_event_id_option_id_voter_id_key' from votes table...");
    
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "votes_event_id_option_id_voter_id_key";`);
        console.log("Successfully dropped constraint!");
    } catch (e) {
        console.error("Failed to drop constraint. Error details:", e);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    });
