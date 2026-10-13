/**
 * Create or reset an admin account.
 *
 *   npm run admin:create -- --email you@company.co.ke --name "Your Name" [--role admin|sales]
 *
 * You'll be prompted for the password (input is hidden). For CI, set
 * ADMIN_PASSWORD in the environment instead.
 */
import "dotenv/config";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, validatePasswordStrength } from "../src/lib/security/password";

function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "admin" } },
  });
  const email = values.email?.trim().toLowerCase();
  const name = values.name?.trim();
  const role = values.role === "sales" ? "sales" : "admin";
  if (!email || !name) {
    console.error('Usage: npm run admin:create -- --email you@company.co.ke --name "Your Name" [--role admin|sales]');
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD ?? (await promptHidden("Password (min 12 chars, letters + numbers): "));
  const weak = validatePasswordStrength(password);
  if (weak) {
    console.error(weak);
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, role, passwordHash },
    update: { name, role, passwordHash, active: true, failedLogins: 0, lockedUntil: null },
  });
  // A reset password must also end any sessions signed in with the old one.
  await prisma.adminSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await prisma.auditLog.create({ data: { action: "admin_account_upserted", entityType: "user", entityId: user.id, metadata: { via: "cli", role } } });
  await prisma.$disconnect();
  console.log(`✓ ${role} account ready for ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
