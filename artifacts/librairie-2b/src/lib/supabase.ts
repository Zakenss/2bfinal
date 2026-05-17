import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

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
