import { PrismaClient } from "./lib/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching recent successful payments related to votes...");
    
    // Find the most recent payments related to votes that were 'completed'
    const payments = await prisma.payment.findMany({
        where: {
            relatedType: "vote",
            status: "completed"
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 3,
        include: {
            votes: true
        }
    });

    console.log("Recent Payments:\n", JSON.stringify(payments, null, 2));

    // Also try to find recent votes
    const votes = await prisma.vote.findMany({
        orderBy: {
            createdAt: "desc"
        },
        take: 3
    });

    console.log("Recent Votes:\n", JSON.stringify(votes, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    });
