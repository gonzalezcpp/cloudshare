import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@cloudshare.com' },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('password123', 12);
    
    await prisma.user.create({
      data: {
        username: 'demo',
        email: 'demo@cloudshare.com',
        passwordHash,
      },
    });

    console.log('Demo user created: demo@cloudshare.com / password123');
  } else {
    console.log('Demo user already exists');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
