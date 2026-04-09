import { PrismaClient } from '@prisma/client';
import { validateEnv } from './env.js';

// Fail fast at boot if required environment variables are missing or
// set to placeholder values. Every API route imports this module, so this
// validation runs once on first import.
validateEnv();

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
