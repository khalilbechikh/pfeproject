import { PrismaClient } from '@prisma/client'; // (1) Import PrismaClient
console.log("prisma client called");
// (2) Declare a variable to hold the Prisma Client instance
// Make it nullable by adding | null to the type
let prisma: PrismaClient | null = null;

// (3) Export a function to get the Prisma Client instance
export const getPrismaClient = () => {
    if (!prisma) { // (4) Check if Prisma Client instance exists
        prisma = new PrismaClient(); // (5) Create a new Prisma Client instance if it doesn't exist
    }
    return prisma; // (6) Return the Prisma Client instance (existing or newly created)
};

// (7) Optional: Function to disconnect the Prisma Client on application shutdown
export const disconnectPrismaClient = async () => {
    if (prisma) { // (8) Check if Prisma Client instance exists
        await prisma.$disconnect(); // (9) Disconnect Prisma Client
        prisma = null; // (10) Reset prisma variable to null instead of undefined
    }
};