import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
