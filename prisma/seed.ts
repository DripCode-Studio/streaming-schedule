import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before seeding (see .env.example).'
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.adminUser.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { passwordHash },
    create: { email: adminEmail.toLowerCase(), passwordHash },
  });

  console.log(`Admin user ready: ${adminEmail}`);

  // Optional sample content so the homepage isn't empty on first run.
  // Safe to delete this block once you've added your own streams.
  if (process.env.SEED_SAMPLE_DATA === 'true') {
    const series = await db.series.upsert({
      where: { slug: 'backend-titan-arc' },
      update: {},
      create: {
        name: 'Backend Titan Arc',
        slug: 'backend-titan-arc',
        description: 'Building real-world backend engineering projects.',
        status: 'ACTIVE',
      },
    });

    const now = new Date();
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    await db.stream.upsert({
      where: { slug: 'sample-upcoming-stream' },
      update: {},
      create: {
        title: 'Building JWT Authentication',
        slug: 'sample-upcoming-stream',
        description: 'Adding JWT-based auth to the API with Spring Security.',
        status: 'SCHEDULED',
        type: 'CODING',
        startTime: inTwoDays,
        timezone: 'America/Toronto',
        category: 'Software and Game Development',
        seriesId: series.id,
      },
    });

    await db.stream.upsert({
      where: { slug: 'sample-past-stream' },
      update: {},
      create: {
        title: 'Setting Up the Database Layer',
        slug: 'sample-past-stream',
        description: 'Wired up Postgres, Prisma, and the first migrations.',
        status: 'COMPLETED',
        type: 'CODING',
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
        timezone: 'America/Toronto',
        category: 'Software and Game Development',
        seriesId: series.id,
      },
    });

    console.log('Sample streams seeded.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
