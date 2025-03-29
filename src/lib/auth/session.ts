import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getSession() {
  try {
    const supabase = createClientComponentClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error fetching session:', error.message)
      return null
    }

    return session
  } catch (error) {
    console.error('Error in getSession:', error)
    return null
  }
} 