import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit, resetRateLimit, getIp } from '@/lib/rate-limit'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const ip = getIp(req.headers as Record<string, string | undefined>)
        const rlKey = `login_fail:${ip}`

        const rl = rateLimit(rlKey, 10, 60 * 60 * 1000) // 10 failed per IP per hour
        if (!rl.allowed) {
          throw new Error('Çok fazla başarısız giriş denemesi. Lütfen 1 saat bekleyin.')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          if (!user) return null

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) return null

          // Successful login — clear the failure counter for this IP
          resetRateLimit(rlKey)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            storeName: user.storeName,
            plan: user.plan,
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('bekleyin')) throw err
          console.error('[Auth] DB ERROR:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.storeName = (user as any).storeName
        token.plan = (user as any).plan
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).storeName = token.storeName
        ;(session.user as any).plan = token.plan
      }
      return session
    },
  },
}
