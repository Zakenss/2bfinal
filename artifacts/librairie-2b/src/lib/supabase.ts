import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Librairie 2B] Supabase is not configured. Copy artifacts/librairie-2b/.env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to artifacts/librairie-2b/.env.local',
    )
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = isSupabaseConfigured ? createSupabaseClient() : (null as unknown as SupabaseClient)

export type Student = {
  id: string
  code: string | null
  nom: string | null
  ecole: string | null
  niveau: string | null
  genre: string | null
  email: string | null
  telephone: string | null
  liste_prete: boolean | null
  rangee: string | null
  niveau_rangement: string | null
  avance: number | null
  note: string | null
  couverture_demandee: boolean | null
  created_at: string | null
  modified_by: string | null
  modified_at: string | null
  couverture_sent: boolean | null
  couverture_sent_at: string | null
  couverture_sent_by: string | null
}

export type Ecole = {
  id: string
  nom_ecole: string
  created_at?: string | null
  created_by?: string | null
}

// Backward compatibility alias
export type BookList = Student
