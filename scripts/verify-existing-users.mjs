import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const result = await prisma.user.updateMany({ data: { emailVerified: true } })
console.log('Updated existing users:', result.count)
await prisma.$disconnect()
