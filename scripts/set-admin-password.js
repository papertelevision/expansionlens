#!/usr/bin/env node
// Sets or resets an admin password using bcrypt.
//
// Usage (from host, inside the docker container):
//   bin/dock exec node scripts/set-admin-password.js admin@example.com 'newpassword'
//
// This creates the user if they don't exist, sets isAdmin=true, and
// stores a bcrypt hash of the password. Safe to re-run to rotate the
// password. Env vars (DATABASE_URL) are loaded by docker-compose env_file.

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const COST = 12;

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: node scripts/set-admin-password.js <email> <password>');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('Error: invalid email address');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: password must be at least 8 characters');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const hash = bcrypt.hashSync(password, COST);

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, isAdmin: true, adminPassword: hash },
      update: { isAdmin: true, adminPassword: hash },
    });

    console.log(`Admin password set for ${user.email} (user id: ${user.id})`);
  } catch (e) {
    console.error('Failed to set admin password:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
