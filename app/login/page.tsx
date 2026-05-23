'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  Mail, Zap, Users, BarChart3, MessageSquare,
  Sparkles, TrendingUp, ShoppingCart,
} from 'lucide-react'
import { AnimatedForm, Ripple, TechOrbitDisplay } from '@/components/ui/modern-animated-sign-in'

const iconsArray = [
  {
    component: () => <Mail className='h-5 w-5 text-violet-600' />,
    className: 'size-[42px] border border-violet-200 bg-violet-50',
    duration: 20, delay: 0, radius: 90, path: false,
  },
  {
    component: () => <Zap className='h-5 w-5 text-blue-600' />,
    className: 'size-[42px] border border-blue-200 bg-blue-50',
    duration: 20, delay: 10, radius: 90, path: false, reverse: true,
  },
  {
    component: () => <Users className='h-5 w-5 text-green-600' />,
    className: 'size-[42px] border border-green-200 bg-green-50',
    duration: 25, delay: 5, radius: 155, path: false,
  },
  {
    component: () => <BarChart3 className='h-5 w-5 text-orange-600' />,
    className: 'size-[42px] border border-orange-200 bg-orange-50',
    duration: 25, delay: 15, radius: 155, path: false, reverse: true,
  },
  {
    component: () => <MessageSquare className='h-5 w-5 text-emerald-600' />,
    className: 'size-[42px] border border-emerald-200 bg-emerald-50',
    duration: 30, delay: 0, radius: 220, path: false,
  },
  {
    component: () => <ShoppingCart className='h-5 w-5 text-red-500' />,
    className: 'size-[42px] border border-red-200 bg-red-50',
    duration: 30, delay: 15, radius: 220, path: false, reverse: true,
  },
  {
    component: () => <TrendingUp className='h-5 w-5 text-yellow-600' />,
    className: 'size-[42px] border border-yellow-200 bg-yellow-50',
    duration: 35, delay: 20, radius: 285, path: false,
  },
  {
    component: () => <Sparkles className='h-5 w-5 text-purple-600' />,
    className: 'size-[42px] border border-purple-200 bg-purple-50',
    duration: 35, delay: 5, radius: 285, path: false, reverse: true,
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (_event: FormEvent<HTMLFormElement>) => {
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Email veya şifre hatalı.')
    } else {
      router.push('/dashboard')
    }
  }

  const fields = [
    {
      label: 'Email',
      required: true,
      type: 'email' as const,
      placeholder: 'siz@magaza.com',
      onChange: (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    },
    {
      label: 'Şifre',
      required: true,
      type: 'password' as const,
      placeholder: '••••••••',
      onChange: (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
    },
  ]

  return (
    <section className='flex min-h-screen'>
      {/* Sol dekoratif panel */}
      <span className='relative flex flex-col justify-center w-1/2 max-lg:hidden overflow-hidden bg-gradient-to-br from-violet-50 to-purple-100'>
        <Ripple mainCircleSize={100} numCircles={8} />
        <TechOrbitDisplay iconsArray={iconsArray} text='Marksio' />
      </span>

      {/* Sağ form paneli */}
      <span className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full px-6'>
        <AnimatedForm
          header='Tekrar hoş geldiniz'
          subHeader='Hesabınıza giriş yapın'
          fields={fields}
          submitButton={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          textVariantButton='Hesabınız yok mu? Ücretsiz kayıt olun'
          errorField={error}
          onSubmit={handleSubmit}
          goTo={() => router.push('/register')}
        />
      </span>
    </section>
  )
}
