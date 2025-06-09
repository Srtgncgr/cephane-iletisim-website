const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.upsert({
      where: { 
        email: 'gencgorserhat@gmail.com'
      },
      update: {
        password: hashedPassword,
        username: 'admin',
        role: 'ADMIN'
      },
      create: {
        id: '3f2fc276-1738-4bdd-bb84-49a9217d89d5',
        email: 'gencgorserhat@gmail.com',
        password: hashedPassword,
        username: 'admin',
        role: 'ADMIN'
      }
    });
    
    console.log('Admin kullanıcısı oluşturuldu:', user);
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();