import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          console.log('[Auth] user lookup:', user ? 'FOUND' : 'NOT FOUND', credentials.email)
          if (!user) return null

          const valid = await bcrypt.compare(credentials.password, user.password)
          console.log('[Auth] password valid:', valid)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            storeName: user.storeName,
            plan: user.plan,
          }
        } catch (err) {
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
