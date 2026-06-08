import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const result = await prisma.user.updateMany({ data: { onboarded: true } })
console.log('Marked as onboarded:', result.count)
await prisma.$disconnect()
