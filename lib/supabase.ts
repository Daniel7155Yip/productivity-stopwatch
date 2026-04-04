import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Session = {
  id: string
  user_id: string
  started_at: string
  ended_at: string
  duration_seconds: number
  task_id: string | null
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  name: string
  archived: boolean
  created_at: string
}
